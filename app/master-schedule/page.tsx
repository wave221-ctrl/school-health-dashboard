'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import html2pdf from 'html2pdf.js';
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

    // Notification state (simple inline)
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
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
        if (!saveName.trim()) {
            showNotification('Please enter a scenario name', 'error');
            return;
        }
        const payload = {
            tool: 'master-schedule',
            name: saveName,
            data: { teachers, rooms, sections, schedule },
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
        setConflicts([]);
        showNotification(`Loaded: ${scenario.name}`);
    };

    const addTeacher = () => setTeachers([...teachers, { id: Date.now().toString(), name: '', maxPeriods: 5, notes: '' }]);
    const addRoom = () => setRooms([...rooms, { id: Date.now().toString(), name: '', capacity: 25, type: 'Classroom' }]);
    const addSection = () => setSections([...sections, { id: Date.now().toString(), courseName: '', teacherId: '', roomId: '', periodsPerWeek: 5 }]);

    const generateDraft = () => {
        if (sections.length === 0 || teachers.length === 0 || rooms.length === 0) {
            showNotification('Please add teachers, rooms, and sections first', 'error');
            return;
        }

        // ... (same greedy algorithm as before - unchanged)
        const newSchedule: ScheduleSlot[] = [];
        const teacherLoad: Record<string, number> = {};
        const roomUsage: Record<string, Record<string, number>> = {};

        teachers.forEach(t => teacherLoad[t.id] = 0);
        rooms.forEach(r => { roomUsage[r.id] = {}; days.forEach(d => roomUsage[r.id][d] = 0); });

        const sortedSections = [...sections].sort((a, b) => b.periodsPerWeek - a.periodsPerWeek);

        sortedSections.forEach(section => {
            let assigned = false;
            const possibleTeachers = section.teacherId ? teachers.filter(t => t.id === section.teacherId) : teachers;

            for (const day of days) {
                for (let p = 1; p <= defaultPeriods; p++) {
                    const availableTeacher = possibleTeachers.find(t => (teacherLoad[t.id] || 0) < t.maxPeriods);
                    if (!availableTeacher) continue;

                    const possibleRooms = section.roomId ? rooms.filter(r => r.id === section.roomId) : rooms;
                    const availableRoom = possibleRooms.find(r => (roomUsage[r.id][day] || 0) < 1);

                    if (availableRoom) {
                        newSchedule.push({ day, period: p, sectionId: section.id, teacherId: availableTeacher.id, roomId: availableRoom.id });
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
        showNotification('Draft schedule generated! Review any conflicts.');
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
        if (sections.length === 0) {
            showNotification('Add sections before asking the AI', 'error');
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

        const fullPrompt = `You are an expert Christian school master scheduler. Analyze the following draft schedule data and provide 4–6 specific, actionable suggestions...\n\n${dataSummary}`;

        try {
            const res = await fetch('/api/master-schedule-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: fullPrompt }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');

            setAiResponse(data.response);
        } catch (err: any) {
            showNotification(err.message || 'AI assist failed', 'error');
            setAiResponse('Sorry, the AI assistant encountered an error.');
        } finally {
            setIsAiLoading(false);
        }
    };

    const exportPDF = () => {
        const element = document.getElementById('schedule-report');
        if (!element) {
            showNotification('Schedule report not found', 'error');
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
        showNotification('PDF report downloaded');
    };

    // Rest of the UI (inputs, table, saved scenarios, 30/60/90, AI panel) is the same as previous version.
    // For brevity here, copy the full JSX from the earlier complete code (the grid with teachers/rooms/sections, action buttons, table, saved scenarios, and the AI modal).

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header with buttons - same as before */}

                {/* Notification Banner */}
                {notification && (
                    <div className={`mb-6 p-4 rounded-xl text-center font-medium ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {notification.message}
                    </div>
                )}

                {/* All the input sections, generate button, schedule table, etc. go here — use the structure from the previous full version I sent */}

                {/* AI Panel - same modal as before */}
            </div>
        </div>
    );
}