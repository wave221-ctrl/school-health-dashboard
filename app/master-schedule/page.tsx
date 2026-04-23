'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

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
    gradeLevel: string;
}

interface ScheduleSlot {
    day: string;
    period: number;
    sectionId: string;
    teacherId: string;
    roomId: string;
}

interface FixedSlot {
    id: string;
    name: string;
    days: string[];
    period: number;
    type: 'chapel' | 'lunch' | 'recess' | 'assembly' | 'other';
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const FIXED_SLOT_COLORS: Record<FixedSlot['type'], string> = {
    chapel: 'bg-purple-100 text-purple-800 border-purple-300',
    lunch: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    recess: 'bg-sky-100 text-sky-800 border-sky-300',
    assembly: 'bg-orange-100 text-orange-800 border-orange-300',
    other: 'bg-gray-100 text-gray-700 border-gray-300',
};

const FIXED_SLOT_ICONS: Record<FixedSlot['type'], string> = {
    chapel: '⛪',
    lunch: '🍽️',
    recess: '⚽',
    assembly: '📢',
    other: '📌',
};

export default function MasterScheduleBuilder() {
    const { user } = useUser();

    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
    const [conflicts, setConflicts] = useState<string[]>([]);
    const [fixedSlots, setFixedSlots] = useState<FixedSlot[]>([]);

    const [saveName, setSaveName] = useState('');
    const [savedScenarios, setSavedScenarios] = useState<any[]>([]);

    const [aiResponse, setAiResponse] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [showAiPanel, setShowAiPanel] = useState(false);

    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [numPeriods, setNumPeriods] = useState(7);
    const [showToolsDropdown, setShowToolsDropdown] = useState(false);

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
            data: { teachers, rooms, sections, schedule, numPeriods, fixedSlots },
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
        setFixedSlots(d.fixedSlots || []);
        setConflicts([]);
        showNotification(`Loaded: ${scenario.name}`);
    };

    const addTeacher = () => setTeachers([...teachers, { id: Date.now().toString(), name: '', maxPeriods: 5, notes: '' }]);
    const addRoom = () => setRooms([...rooms, { id: Date.now().toString(), name: '', capacity: 25, type: 'Classroom' }]);
    const addSection = () => setSections([...sections, { id: Date.now().toString(), courseName: '', teacherId: '', roomId: '', periodsPerWeek: 5, gradeLevel: '9' }]);
    const addFixedSlot = () => setFixedSlots([...fixedSlots, { id: Date.now().toString(), name: 'Lunch', days: [], period: 4, type: 'lunch' }]);

    const generateDraft = () => {
        if (sections.length === 0 || teachers.length === 0 || rooms.length === 0) {
            return showNotification('Please add teachers, rooms, and sections first', 'error');
        }

        const newSchedule: ScheduleSlot[] = [];
        const teacherBusy = new Set<string>();
        const roomBusy = new Set<string>();

        const teacherDayLoad: Record<string, Record<string, number>> = {};
        teachers.forEach(t => {
            teacherDayLoad[t.id] = {};
            days.forEach(d => (teacherDayLoad[t.id][d] = 0));
        });

        fixedSlots.forEach(fs => {
            const applicableDays = fs.days.length > 0 ? fs.days : days;
            applicableDays.forEach(day => {
                teacherBusy.add(`FIXED-${day}-${fs.period}`);
                roomBusy.add(`FIXED-${day}-${fs.period}`);
            });
        });

        const isFixedPeriod = (day: string, period: number): boolean =>
            fixedSlots.some(fs => {
                const applicableDays = fs.days.length > 0 ? fs.days : days;
                return applicableDays.includes(day) && fs.period === period;
            });

        const sortedSections = [...sections].sort((a, b) => b.periodsPerWeek - a.periodsPerWeek);

        sortedSections.forEach(section => {
            let assignedCount = 0;
            const target = Math.min(section.periodsPerWeek, days.length * numPeriods);

            const possibleTeachers = section.teacherId ? teachers.filter(t => t.id === section.teacherId) : teachers;
            const possibleRooms = section.roomId ? rooms.filter(r => r.id === section.roomId) : rooms;

            outer:
            for (const day of days) {
                for (let p = 1; p <= numPeriods; p++) {
                    if (assignedCount >= target) break outer;
                    if (isFixedPeriod(day, p)) continue;

                    const availableTeacher = possibleTeachers
                        .filter(t => !teacherBusy.has(`${t.id}-${day}-${p}`) && (teacherDayLoad[t.id]?.[day] ?? 0) < t.maxPeriods)
                        .sort((a, b) => (teacherDayLoad[a.id]?.[day] ?? 0) - (teacherDayLoad[b.id]?.[day] ?? 0))[0];

                    if (!availableTeacher) continue;

                    const availableRoom = possibleRooms.find(r => !roomBusy.has(`${r.id}-${day}-${p}`));
                    if (!availableRoom) continue;

                    newSchedule.push({ day, period: p, sectionId: section.id, teacherId: availableTeacher.id, roomId: availableRoom.id });
                    teacherBusy.add(`${availableTeacher.id}-${day}-${p}`);
                    roomBusy.add(`${availableRoom.id}-${day}-${p}`);
                    teacherDayLoad[availableTeacher.id][day] = (teacherDayLoad[availableTeacher.id][day] ?? 0) + 1;
                    assignedCount++;
                }
            }
        });

        setSchedule(newSchedule);
        detectConflicts(newSchedule);

        if (newSchedule.length > 0) {
            showNotification(`Generated ${newSchedule.length} assignments!`);
        } else {
            showNotification('Could not assign all sections. Try adding more rooms or increasing max periods.', 'error');
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

    const getAISuggestions = async () => {
        if (sections.length === 0) return showNotification('Add at least one section first', 'error');

        setIsAiLoading(true);
        setAiResponse('');
        setShowAiPanel(true);

        const dataSummary = `
Teachers: ${teachers.map(t => t.name).join(', ')}
Rooms: ${rooms.map(r => r.name).join(', ')}
Sections: ${sections.map(s => `${s.courseName} (Grade ${s.gradeLevel})`).join(', ')}
Fixed Slots: ${fixedSlots.map(f => `${f.name} (Period ${f.period})`).join(', ')}
Assignments: ${schedule.length}
Conflicts: ${conflicts.length}
    `.trim();

        try {
            const res = await fetch('/api/master-schedule-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: `You are an expert Christian school master scheduler. Provide 4-6 specific suggestions to improve this schedule:\n${dataSummary}` }),
            });
            const data = await res.json();
            setAiResponse(data.response || 'No response received.');
        } catch {
            showNotification('AI failed. Make sure OPENAI_API_KEY is set in Vercel dashboard.', 'error');
            setAiResponse('OpenAI key not configured on the server.');
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* NAVBAR - Matches your other tools */}
            <nav className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="h-16 flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <Link href="/" className="text-2xl font-bold text-emerald-700">School Health</Link>

                            <div className="relative">
                                <button
                                    onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                                    className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium px-4 py-2 rounded-xl hover:bg-emerald-50"
                                >
                                    My Tools
                                    <span className="text-xl">▼</span>
                                </button>

                                {showToolsDropdown && (
                                    <div className="absolute left-0 mt-2 w-64 bg-white rounded-3xl shadow-xl border border-gray-100 py-2 z-50">
                                        <Link href="/calculator" className="block px-6 py-3 hover:bg-emerald-50 text-gray-700">School Health Calculator</Link>
                                        <Link href="/deferred-maintenance" className="block px-6 py-3 hover:bg-emerald-50 text-gray-700">Deferred Maintenance</Link>
                                        <Link href="/enrollment-projection" className="block px-6 py-3 hover:bg-emerald-50 text-gray-700">Enrollment Projection Calculator</Link>
                                        <Link href="/staff-leadership" className="block px-6 py-3 hover:bg-emerald-50 text-gray-700">Staff & Leadership health Assessment</Link>
                                        <Link href="/master-schedule" className="block px-6 py-3 hover:bg-emerald-50 text-emerald-700 font-medium">Master Schedule Builder</Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">Christian School Health Platform</span>
                            {user && <span className="text-emerald-600 text-sm font-medium">{user.firstName || user.emailAddresses?.[0]?.emailAddress}</span>}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-emerald-700">Master Schedule Builder</h1>
                        <p className="text-gray-600 mt-1">Lite AI-Assisted Scheduling for Christian Schools</p>
                    </div>
                    <button
                        onClick={getAISuggestions}
                        disabled={isAiLoading || sections.length === 0}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-3 rounded-xl font-medium"
                    >
                        ✨ {isAiLoading ? 'AI is Thinking...' : 'Get AI Suggestions'}
                    </button>
                </div>

                {notification && (
                    <div className={`mb-6 p-4 rounded-2xl text-center font-medium shadow-sm ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {notification.message}
                    </div>
                )}

                {/* Schedule Settings */}
                <div className="bg-white rounded-2xl shadow p-6 mb-8">
                    <h2 className="text-xl font-semibold text-emerald-700 mb-4">Schedule Settings</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Periods per Day</label>
                        <input
                            type="number"
                            value={numPeriods}
                            onChange={(e) => setNumPeriods(Math.max(1, parseInt(e.target.value) || 7))}
                            min="1"
                            max="10"
                            className="w-full border rounded-lg p-3 text-lg"
                        />
                    </div>
                </div>

                {/* Non-Negotiable Periods - FIXED UI (period input is now clearly inside the card) */}
                <div className="bg-white rounded-2xl shadow p-6 mb-8">
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h2 className="text-xl font-semibold text-emerald-700">Non-Negotiable Periods</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Chapel, Lunch, Recess, etc. — these periods are locked</p>
                        </div>
                        <button onClick={addFixedSlot} className="text-3xl text-emerald-700 hover:text-emerald-800">+</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {fixedSlots.map((fs, idx) => (
                            <div key={fs.id} className={`border-2 rounded-2xl p-5 ${FIXED_SLOT_COLORS[fs.type]}`}>
                                <div className="flex gap-3 mb-4">
                                    <span className="text-2xl flex-shrink-0">{FIXED_SLOT_ICONS[fs.type]}</span>
                                    <input
                                        type="text"
                                        value={fs.name}
                                        onChange={(e) => { const u = [...fixedSlots]; u[idx].name = e.target.value; setFixedSlots(u); }}
                                        placeholder="Event name"
                                        className="flex-1 bg-white border border-current/30 rounded-xl px-4 py-2.5 text-sm font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium mb-1.5 opacity-75">Type</label>
                                        <select
                                            value={fs.type}
                                            onChange={(e) => { const u = [...fixedSlots]; u[idx].type = e.target.value as FixedSlot['type']; setFixedSlots(u); }}
                                            className="w-full bg-white border border-current/30 rounded-xl px-4 py-2.5 text-sm"
                                        >
                                            <option value="chapel">Chapel</option>
                                            <option value="lunch">Lunch</option>
                                            <option value="recess">Recess</option>
                                            <option value="assembly">Assembly</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1.5 opacity-75">Period #</label>
                                        <input
                                            type="number"
                                            value={fs.period}
                                            min={1}
                                            max={numPeriods}
                                            onChange={(e) => { const u = [...fixedSlots]; u[idx].period = Math.max(1, Math.min(numPeriods, parseInt(e.target.value) || 1)); setFixedSlots(u); }}
                                            className="w-full bg-white border border-current/30 rounded-xl px-4 py-3 text-center text-lg font-medium"
                                        />
                                    </div>
                                </div>

                                <button onClick={() => setFixedSlots(fixedSlots.filter((_, i) => i !== idx))} className="mt-4 text-xs text-red-600 hover:underline">Remove</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Input Grid */}
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
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                                    <input type="text" value={section.gradeLevel} onChange={(e) => { const u = [...sections]; u[idx].gradeLevel = e.target.value; setSections(u); }} placeholder="9" className="w-full border rounded-lg p-3" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Teacher</label>
                                    <select value={section.teacherId} onChange={(e) => { const u = [...sections]; u[idx].teacherId = e.target.value; setSections(u); }} className="w-full border rounded-lg p-3">
                                        <option value="">Any Teacher</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Room</label>
                                    <select value={section.roomId} onChange={(e) => { const u = [...sections]; u[idx].roomId = e.target.value; setSections(u); }} className="w-full border rounded-lg p-3">
                                        <option value="">Any Room</option>
                                        {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Periods Per Week</label>
                                    <input type="number" value={section.periodsPerWeek} onChange={(e) => { const u = [...sections]; u[idx].periodsPerWeek = parseInt(e.target.value) || 5; setSections(u); }} className="w-full border rounded-lg p-3" />
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
                                    {days.map((day) => (
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
            </div>

            {/* AI Panel */}
            {showAiPanel && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h2 className="text-2xl font-semibold text-emerald-700">AI Schedule Assistant</h2>
                            <button onClick={() => setShowAiPanel(false)} className="text-4xl leading-none text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <div className="flex-1 p-8 overflow-auto text-gray-700 leading-relaxed">
                            {isAiLoading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="animate-spin h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full mb-6"></div>
                                    <p>Consulting AI scheduler using your OpenAI credits...</p>
                                </div>
                            ) : (
                                <div className="whitespace-pre-wrap">{aiResponse || 'No response yet.'}</div>
                            )}
                        </div>
                        <div className="border-t p-6 text-right">
                            <button onClick={() => setShowAiPanel(false)} className="px-8 py-3 text-emerald-700 hover:bg-emerald-50 rounded-2xl font-medium">Close Assistant</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}