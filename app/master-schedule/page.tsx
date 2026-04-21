'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import html2pdf from 'html2pdf.js';
import { toast } from 'sonner';   // ← this line was failing
import { Plus, Trash2, Download, Save, RefreshCw, Sparkles, X } from 'lucide-react';

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

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const defaultPeriods = 7;

export default function MasterScheduleBuilder() {
    const { user } = useUser();

    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
    const [conflicts, setConflicts] = useState<string[]>([]);

    const [saveName, setSaveName] = useState('');
    const [savedScenarios, setSavedScenarios] = useState<any[]>([]);

    // AI Assist
    const [aiResponse, setAiResponse] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [showAiPanel, setShowAiPanel] = useState(false);

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

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        try {
            if (type === 'success') toast.success(message);
            else toast.error(message);
        } catch {
            // Fallback if sonner is not ready
            alert(message);
        }
    };

    const saveScenario = async () => {
        if (!saveName.trim()) {
            showToast('Please enter a scenario name', 'error');
            return;
        }
        const payload = {
            tool: 'master-schedule',
            name: saveName,
            data: { teachers, rooms, sections, schedule },
            user_id: user?.id,
        };
        const { error } = await supabase.from('assessments').insert([payload]);
        if (error) showToast('Failed to save scenario', 'error');
        else {
            showToast('Scenario saved successfully!');
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
        setConflicts([]);
        showToast(`Loaded: ${scenario.name}`);
    };

    const addTeacher = () => {
        setTeachers([...teachers, { id: Date.now().toString(), name: '', maxPeriods: 5, notes: '' }]);
    };

    const addRoom = () => {
        setRooms([...rooms, { id: Date.now().toString(), name: '', capacity: 25, type: 'Classroom' }]);
    };

    const addSection = () => {
        setSections([...sections, { id: Date.now().toString(), courseName: '', teacherId: '', roomId: '', periodsPerWeek: 5 }]);
    };

    const generateDraft = () => {
        if (sections.length === 0 || teachers.length === 0 || rooms.length === 0) {
            showToast('Please add teachers, rooms, and sections first', 'error');
            return;
        }

        const newSchedule: ScheduleSlot[] = [];
        const teacherLoad: Record<string, number> = {};
        const roomUsage: Record<string, Record<string, number>> = {};

        teachers.forEach(t => teacherLoad[t.id] = 0);
        rooms.forEach(r => {
            roomUsage[r.id] = {};
            days.forEach(d => roomUsage[r.id][d] = 0);
        });

        const sortedSections = [...sections].sort((a, b) => b.periodsPerWeek - a.periodsPerWeek);

        sortedSections.forEach(section => {
            let assigned = false;
            const possibleTeachers = section.teacherId
                ? teachers.filter(t => t.id === section.teacherId)
                : teachers;

            for (const day of days) {
                for (let p = 1; p <= defaultPeriods; p++) {
                    const availableTeacher = possibleTeachers.find(t => (teacherLoad[t.id] || 0) < t.maxPeriods);
                    if (!availableTeacher) continue;

                    const possibleRooms = section.roomId
                        ? rooms.filter(r => r.id === section.roomId)
                        : rooms;

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
        });

        setSchedule(newSchedule);
        detectConflicts(newSchedule);
        showToast('Draft schedule generated! Review any conflicts.');
    };

    const detectConflicts = (currentSchedule: ScheduleSlot[]) => {
        const newConflicts: string[] = [];
        const teacherDayPeriod = new Map();
        const roomDayPeriod = new Map();

        currentSchedule.forEach(slot => {
            const tKey = `${slot.teacherId}-${slot.day}-${slot.period}`;
            if (teacherDayPeriod.has(tKey)) {
                newConflicts.push(`Teacher conflict: ${getTeacherName(slot.teacherId)} on ${slot.day} period ${slot.period}`);
            }
            teacherDayPeriod.set(tKey, true);

            const rKey = `${slot.roomId}-${slot.day}-${slot.period}`;
            if (roomDayPeriod.has(rKey)) {
                newConflicts.push(`Room conflict: ${getRoomName(slot.roomId)} on ${slot.day} period ${slot.period}`);
            }
            roomDayPeriod.set(rKey, true);
        });

        setConflicts(newConflicts);
    };

    const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'Unknown';
    const getRoomName = (id: string) => rooms.find(r => r.id === id)?.name || 'Unknown';

    const getAISuggestions = async () => {
        if (sections.length === 0) {
            showToast('Add sections before asking the AI', 'error');
            return;
        }

        setIsAiLoading(true);
        setAiResponse('');
        setShowAiPanel(true);

        const dataSummary = `
Teachers (${teachers.length}):
${teachers.map(t => `- ${t.name} | Max ${t.maxPeriods} periods/day | Notes: ${t.notes || 'None'}`).join('\n')}

Rooms (${rooms.length}):
${rooms.map(r => `- ${r.name} (${r.type}, capacity ${r.capacity})`).join('\n')}

Sections (${sections.length}):
${sections.map(s => `- ${s.courseName} | Teacher: ${getTeacherName(s.teacherId) || 'Any'} | Room: ${getRoomName(s.roomId) || 'Any'} | ${s.periodsPerWeek} periods/week`).join('\n')}

Current assignments: ${schedule.length}
Detected conflicts: ${conflicts.length}
    `.trim();

        const fullPrompt = `You are an expert Christian school master scheduler. Analyze the following draft schedule data and provide 4–6 specific, actionable suggestions to reduce conflicts, balance teacher loads, protect time for chapel/Bible/spiritual formation, and improve overall flow. Be concrete with possible re-assignments when helpful.\n\n${dataSummary}`;

        try {
            const res = await fetch('/api/master-schedule-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: fullPrompt }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to get AI response');

            setAiResponse(data.response);
        } catch (err: any) {
            showToast(err.message || 'AI assist failed. Please try again.', 'error');
            setAiResponse('Sorry, the AI assistant encountered an error. Please try again later.');
        } finally {
            setIsAiLoading(false);
        }
    };

    const exportPDF = () => {
        const element = document.getElementById('schedule-report');
        if (!element) {
            showToast('Schedule report not found', 'error');
            return;
        }
        const opt = {
            margin: 10,
            filename: `Master-Schedule-${new Date().toISOString().slice(0, 10)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        };
        html2pdf().set(opt).from(element).save();
        showToast('PDF report downloaded');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-emerald-700">Master Schedule Builder</h1>
                        <p className="text-gray-600">Lite version with Integrated AI Assistant • Christian School Focus</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={exportPDF}
                            className="flex items-center gap-2 bg-emerald-700 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-800 transition"
                        >
                            <Download size={18} /> PDF Report
                        </button>
                        <button
                            onClick={getAISuggestions}
                            disabled={isAiLoading || sections.length === 0}
                            className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-70 transition"
                        >
                            <Sparkles size={18} /> {isAiLoading ? 'AI Thinking...' : 'Get AI Suggestions'}
                        </button>
                    </div>
                </div>

                {/* The rest of the UI (inputs, buttons, table, saved scenarios, 30/60/90) is identical to the previous version I sent. */}

                {/* ... [Paste the full inputs grid, action buttons, schedule table, saved scenarios, and 30/60/90 section from the last complete code I gave you] ... */}

                {/* AI Panel (unchanged) */}
                {showAiPanel && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between p-6 border-b">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="text-purple-600" size={28} />
                                    <h2 className="text-2xl font-semibold text-emerald-700">AI Schedule Assistant</h2>
                                </div>
                                <button onClick={() => setShowAiPanel(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={28} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto p-8 prose prose-emerald max-w-none">
                                {isAiLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20">
                                        <div className="animate-spin h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full mb-6"></div>
                                        <p className="text-gray-600">Consulting the AI scheduler...</p>
                                    </div>
                                ) : (
                                    <div className="whitespace-pre-wrap leading-relaxed text-gray-700">
                                        {aiResponse || 'No suggestions received yet.'}
                                    </div>
                                )}
                            </div>

                            <div className="border-t p-6 flex justify-end">
                                <button
                                    onClick={() => setShowAiPanel(false)}
                                    className="px-8 py-3 text-emerald-700 hover:bg-emerald-50 rounded-xl font-medium"
                                >
                                    Close Assistant
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}