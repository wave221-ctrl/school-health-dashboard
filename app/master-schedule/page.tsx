'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

interface Teacher {
    id: string;
    name: string;
    maxPeriods: number;
    notes: string;
}

interface Room {
    id: string;
    name: string;
    capacity: number;
    type: string;
}

interface Section {
    id: string;
    courseName: string;
    teacherId: string;
    roomId: string;
    periodsPerWeek: number;
}

interface ScheduleSlot {
    day: string;
    period: number;
    sectionId: string;
    teacherId: string;
    roomId: string;
}

const defaultDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function MasterScheduleBuilder() {
    const { user } = useUser();

    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
    const [conflicts, setConflicts] = useState<string[]>([]);

    const [saveName, setSaveName] = useState('');
    const [savedScenarios, setSavedScenarios] = useState<any[]>([]);

    const [aiResponse, setAiResponse] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [showAiPanel, setShowAiPanel] = useState(false);

    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Schedule settings
    const [numPeriods, setNumPeriods] = useState(7);
    const [dayLength, setDayLength] = useState(420); // minutes (7 hours)

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4500);
    };

    useEffect(() => {
        if (user) loadSavedScenarios();
    }, [user]);

    const loadSavedScenarios = async () => {
        const { data } = await supabase
            .from('assessments')
            .select('*')
            .eq('tool', 'master-schedule')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false });
        setSavedScenarios(data || []);
    };

    const saveScenario = async () => {
        if (!saveName.trim()) return showNotification('Please enter a scenario name', 'error');
        const payload = {
            tool: 'master-schedule',
            name: saveName,
            data: { teachers, rooms, sections, schedule, numPeriods, dayLength },
            user_id: user?.id,
        };
        const { error } = await supabase.from('assessments').insert([payload]);
        if (error) showNotification('Failed to save scenario', 'error');
        else {
            showNotification('Scenario saved successfully!');
            setSaveName('');
            loadSavedScenarios();
        }
    };

    const loadScenario = (scenario: any) => {
        const d = scenario.data;
        setTeachers(d.teachers || []);
        setRooms(d.rooms || []);
        setSections(d.sections || []);
        setSchedule(d.schedule || []);
        setNumPeriods(d.numPeriods || 7);
        setDayLength(d.dayLength || 420);
        setConflicts([]);
        showNotification(`Loaded: ${scenario.name}`);
    };

    const addTeacher = () => setTeachers([...teachers, { id: Date.now().toString(), name: '', maxPeriods: 5, notes: '' }]);
    const addRoom = () => setRooms([...rooms, { id: Date.now().toString(), name: '', capacity: 25, type: 'Classroom' }]);
    const addSection = () => setSections([...sections, { id: Date.now().toString(), courseName: '', teacherId: '', roomId: '', periodsPerWeek: 5 }]);

    const generateDraft = () => {
        if (sections.length === 0 || teachers.length === 0 || rooms.length === 0) {
            return showNotification('Please add teachers, rooms, and sections first', 'error');
        }

        const newSchedule: ScheduleSlot[] = [];
        const teacherLoad: Record<string, number> = {};
        const roomUsage: Record<string, Record<string, number>> = {};

        teachers.forEach(t => teacherLoad[t.id] = 0);
        rooms.forEach(r => {
            roomUsage[r.id] = {};
            defaultDays.forEach(d => roomUsage[r.id][d] = 0);
        });

        const sortedSections = [...sections].sort((a, b) => b.periodsPerWeek - a.periodsPerWeek);

        sortedSections.forEach(section => {
            let assigned = false;
            const possibleTeachers = section.teacherId ? teachers.filter(t => t.id === section.teacherId) : teachers;
            const possibleRooms = section.roomId ? rooms.filter(r => r.id === section.roomId) : rooms;

            for (let pass = 0; pass < 8 && !assigned; pass++) {
                for (const day of defaultDays) {
                    for (let p = 1; p <= numPeriods; p++) {
                        const availableTeacher = possibleTeachers
                            .filter(t => (teacherLoad[t.id] || 0) < t.maxPeriods)
                            .sort((a, b) => (teacherLoad[a.id] || 0) - (teacherLoad[b.id] || 0))[0];

                        if (!availableTeacher) continue;

                        const availableRoom = possibleRooms.find(r => (roomUsage[r.id][day] || 0) < 1);

                        if (availableRoom) {
                            newSchedule.push({
                                day,
                                period: p,
                                sectionId: section.id,
                                teacherId: availableTeacher.id,
                                roomId: availableRoom.id,
                            });
                            teacherLoad[availableTeacher.id] = (teacherLoad[availableTeacher.id] || 0) + 1;
                            roomUsage[availableRoom.id][day] = (roomUsage[availableRoom.id][day] || 0) + 1;
                            assigned = true;
                            break;
                        }
                    }
                    if (assigned) break;
                }
            }
        });

        setSchedule(newSchedule);
        detectConflicts(newSchedule);

        if (newSchedule.length > 0) {
            showNotification(`Generated ${newSchedule.length} assignments!`);
        } else {
            showNotification('Could not assign sections. Try adding more rooms or increasing max periods.', 'error');
        }
    };

    const detectConflicts = (currentSchedule: ScheduleSlot[]) => {
        const newConflicts: string[] = [];
        const teacherDayPeriod = new Map();
        const roomDayPeriod = new Map();

        currentSchedule.forEach(slot => {
            const tKey = `${slot.teacherId}-${slot.day}-${slot.period}`;
            if (teacherDayPeriod.has(tKey)) newConflicts.push(`Teacher conflict: ${getTeacherName(slot.teacherId)} on ${slot.day} period ${slot.period}`);
            teacherDayPeriod.set(tKey, true);

            const rKey = `${slot.roomId}-${slot.day}-${slot.period}`;
            if (roomDayPeriod.has(rKey)) newConflicts.push(`Room conflict: ${getRoomName(slot.roomId)} on ${slot.day} period ${slot.period}`);
            roomDayPeriod.set(rKey, true);
        });

        setConflicts(newConflicts);
    };

    const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'Unknown';
    const getRoomName = (id: string) => rooms.find(r => r.id === id)?.name || 'Unknown';

    const exportPDF = async () => {
        const element = document.getElementById('schedule-report');
        if (!element) return showNotification('Generate a schedule first', 'error');

        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const opt = {
                margin: 10,
                filename: `Master-Schedule-${new Date().toISOString().slice(0, 10)}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const },
            };
            html2pdf().set(opt).from(element).save();
            showNotification('PDF report downloaded successfully');
        } catch (err) {
            showNotification('Failed to generate PDF. Please try again.', 'error');
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-emerald-700">Master Schedule Builder</h1>
                        <p className="text-gray-600 mt-1">Lite AI-Assisted Scheduling for Christian Schools</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={exportPDF} className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-xl font-medium">📄 Download PDF Report</button>
                        <button
                            onClick={() => { }}
                            disabled
                            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium"
                        >
                            ✨ AI Suggestions (coming soon)
                        </button>
                    </div>
                </div>

                {notification && (
                    <div className={`mb-6 p-4 rounded-2xl text-center font-medium shadow-sm ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {notification.message}
                    </div>
                )}

                {/* Schedule Settings */}
                <div className="bg-white rounded-2xl shadow p-6 mb-8">
                    <h2 className="text-xl font-semibold text-emerald-700 mb-4">Schedule Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Periods per Day</label>
                            <input
                                type="number"
                                value={numPeriods}
                                onChange={(e) => setNumPeriods(Math.max(1, parseInt(e.target.value) || 7))}
                                min="1"
                                max="10"
                                className="w-full border rounded-lg p-3"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">School Day Length (minutes)</label>
                            <input
                                type="number"
                                value={dayLength}
                                onChange={(e) => setDayLength(Math.max(60, parseInt(e.target.value) || 420))}
                                className="w-full border rounded-lg p-3"
                            />
                            <p className="text-xs text-gray-500 mt-1">Typical: 420 minutes (7 hours)</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                    {/* Teachers */}
                    <div className="bg-white rounded-2xl shadow p-6 max-h-[620px] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5 sticky top-0 bg-white pb-3 border-b">
                            <h2 className="text-xl font-semibold text-emerald-700">Teachers</h2>
                            <button onClick={addTeacher} className="text-3xl text-emerald-700 hover:text-emerald-800">+</button>
                        </div>
                        {teachers.map((teacher, idx) => (
                            <div key={teacher.id} className="border border-gray-200 p-5 rounded-xl mb-5 bg-gray-50">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Name</label>
                                    <input type="text" value={teacher.name} onChange={(e) => { const u = [...teachers]; u[idx].name = e.target.value; setTeachers(u); }} placeholder="e.g. Mrs. Johnson" className="w-full border rounded-lg p-3" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Periods Per Day</label>
                                    <input type="number" value={teacher.maxPeriods} min="1" max="8" onChange={(e) => { const u = [...teachers]; u[idx].maxPeriods = parseInt(e.target.value) || 5; setTeachers(u); }} className="w-full border rounded-lg p-3" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                    <input type="text" value={teacher.notes} onChange={(e) => { const u = [...teachers]; u[idx].notes = e.target.value; setTeachers(u); }} placeholder="Chapel duty, etc." className="w-full border rounded-lg p-3" />
                                </div>
                                <button onClick={() => setTeachers(teachers.filter((_, i) => i !== idx))} className="text-red-600 text-sm mt-4 hover:underline">Remove Teacher</button>
                            </div>
                        ))}
                    </div>

                    {/* Rooms */}
                    <div className="bg-white rounded-2xl shadow p-6 max-h-[620px] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5 sticky top-0 bg-white pb-3 border-b">
                            <h2 className="text-xl font-semibold text-emerald-700">Rooms</h2>
                            <button onClick={addRoom} className="text-3xl text-emerald-700 hover:text-emerald-800">+</button>
                        </div>
                        {rooms.map((room, idx) => (
                            <div key={room.id} className="border border-gray-200 p-5 rounded-xl mb-5 bg-gray-50">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                                    <input type="text" value={room.name} onChange={(e) => { const u = [...rooms]; u[idx].name = e.target.value; setRooms(u); }} placeholder="e.g. Room 101" className="w-full border rounded-lg p-3" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                                        <input type="number" value={room.capacity} onChange={(e) => { const u = [...rooms]; u[idx].capacity = parseInt(e.target.value) || 25; setRooms(u); }} className="w-full border rounded-lg p-3" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <input type="text" value={room.type} onChange={(e) => { const u = [...rooms]; u[idx].type = e.target.value; setRooms(u); }} placeholder="Classroom" className="w-full border rounded-lg p-3" />
                                    </div>
                                </div>
                                <button onClick={() => setRooms(rooms.filter((_, i) => i !== idx))} className="text-red-600 text-sm mt-4 hover:underline">Remove Room</button>
                            </div>
                        ))}
                    </div>

                    {/* Sections */}
                    <div className="bg-white rounded-2xl shadow p-6 max-h-[620px] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5 sticky top-0 bg-white pb-3 border-b">
                            <h2 className="text-xl font-semibold text-emerald-700">Sections / Courses</h2>
                            <button onClick={addSection} className="text-3xl text-emerald-700 hover:text-emerald-800">+</button>
                        </div>
                        {sections.map((section, idx) => (
                            <div key={section.id} className="border border-gray-200 p-5 rounded-xl mb-5 bg-gray-50">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                                    <input type="text" value={section.courseName} onChange={(e) => { const u = [...sections]; u[idx].courseName = e.target.value; setSections(u); }} placeholder="e.g. Algebra I" className="w-full border rounded-lg p-3" />
                                </div>
                                <button onClick={() => setSections(sections.filter((_, i) => i !== idx))} className="text-red-600 text-sm mt-4 hover:underline">Remove Section</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4 mb-10">
                    <button onClick={generateDraft} className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-4 rounded-2xl font-semibold text-lg">Generate Draft Schedule</button>
                    <button onClick={saveScenario} className="border-2 border-emerald-700 text-emerald-700 hover:bg-emerald-50 py-4 px-10 rounded-2xl font-semibold">Save Scenario</button>
                </div>

                <input type="text" value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Scenario name (e.g. Fall 2026 - Draft 1)" className="w-full border border-gray-300 p-4 rounded-2xl mb-12 text-lg" />

                {schedule.length > 0 && (
                    <div id="schedule-report" className="bg-white rounded-3xl shadow p-8 mb-12">
                        <h2 className="text-2xl font-bold text-emerald-700 mb-6">Draft Master Schedule</h2>
                        {conflicts.length > 0 && (
                            <div className="bg-red-50 border border-red-200 p-6 rounded-2xl mb-8">
                                <h3 className="font-semibold text-red-700 mb-3">Conflicts Detected ({conflicts.length})</h3>
                                <ul className="space-y-2 text-red-700 text-sm">
                                    {conflicts.map((c, i) => <li key={i}>• {c}</li>)}
                                </ul>
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-emerald-700 text-white">
                                        <th className="p-4 text-left border">Day</th>
                                        {Array.from({ length: numPeriods }).map((_, i) => (
                                            <th key={i} className="p-4 border text-center">Period {i + 1}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {defaultDays.map((day) => (
                                        <tr key={day} className="hover:bg-gray-50">
                                            <td className="p-4 border font-medium bg-gray-100">{day}</td>
                                            {Array.from({ length: numPeriods }).map((_, pIdx) => {
                                                const periodNum = pIdx + 1;
                                                const slot = schedule.find(s => s.day === day && s.period === periodNum);
                                                return (
                                                    <td key={pIdx} className="p-4 border text-center text-sm min-h-[110px] align-top">
                                                        {slot ? (
                                                            <div className="space-y-1">
                                                                <div className="font-medium text-emerald-700">{sections.find(s => s.id === slot.sectionId)?.courseName}</div>
                                                                <div className="text-xs text-gray-600">{getTeacherName(slot.teacherId)}</div>
                                                                <div className="text-xs text-emerald-600">{getRoomName(slot.roomId)}</div>
                                                            </div>
                                                        ) : <span className="text-gray-300">—</span>}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {savedScenarios.length > 0 && (
                    <div className="bg-white rounded-3xl shadow p-8 mb-12">
                        <h2 className="text-xl font-semibold text-emerald-700 mb-6">Saved Scenarios</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {savedScenarios.map((scen) => (
                                <div key={scen.id} className="border border-gray-200 p-6 rounded-2xl flex justify-between items-center hover:border-emerald-300 transition">
                                    <div>
                                        <div className="font-medium">{scen.name}</div>
                                        <div className="text-sm text-gray-500 mt-1">{new Date(scen.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <button onClick={() => loadScenario(scen)} className="text-emerald-700 font-medium hover:underline">Load</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-3xl shadow p-8">
                    <h2 className="text-2xl font-bold text-emerald-700 mb-6">Implementation Plan (30/60/90 Days)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="font-semibold text-emerald-600 mb-4">Days 1–30</h3>
                            <ul className="space-y-3 text-gray-600">
                                <li>• Finalize teacher availability and room data</li>
                                <li>• Collect student course requests</li>
                                <li>• Generate initial draft and fix major conflicts</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-emerald-600 mb-4">Days 31–60</h3>
                            <ul className="space-y-3 text-gray-600">
                                <li>• Use AI Assistant for optimization ideas</li>
                                <li>• Protect chapel, Bible, and spiritual formation blocks</li>
                                <li>• Share draft with department heads</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-emerald-600 mb-4">Days 61–90</h3>
                            <ul className="space-y-3 text-gray-600">
                                <li>• Import final schedule into SIS</li>
                                <li>• Communicate to staff and families</li>
                                <li>• Monitor first weeks and adjust as needed</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}