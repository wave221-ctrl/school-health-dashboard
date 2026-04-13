'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '../lib/supabase';
import { UserButton } from '@clerk/nextjs';

interface StaffMember {
    id: string;
    name: string;
    D: number;
    I: number;
    S: number;
    C: number;
}

export default function DiscAssessment() {
    const { user } = useUser();

    const [teamName, setTeamName] = useState('2026 Staff Team');
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [newName, setNewName] = useState('');
    const [newD, setNewD] = useState(50);
    const [newI, setNewI] = useState(50);
    const [newS, setNewS] = useState(50);
    const [newC, setNewC] = useState(50);

    const [history, setHistory] = useState<any[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Add new staff member
    const addStaff = () => {
        if (!newName) return;
        const member: StaffMember = {
            id: Date.now().toString(),
            name: newName,
            D: newD,
            I: newI,
            S: newS,
            C: newC
        };
        setStaff([...staff, member]);
        setNewName('');
    };

    // Remove staff
    const removeStaff = (id: string) => {
        setStaff(staff.filter(s => s.id !== id));
    };

    // Calculate team average
    const teamAverage = {
        D: staff.length ? Math.round(staff.reduce((sum, s) => sum + s.D, 0) / staff.length) : 50,
        I: staff.length ? Math.round(staff.reduce((sum, s) => sum + s.I, 0) / staff.length) : 50,
        S: staff.length ? Math.round(staff.reduce((sum, s) => sum + s.S, 0) / staff.length) : 50,
        C: staff.length ? Math.round(staff.reduce((sum, s) => sum + s.C, 0) / staff.length) : 50,
    };

    // Determine dominant team style
    const getTeamStyle = () => {
        const max = Math.max(teamAverage.D, teamAverage.I, teamAverage.S, teamAverage.C);
        if (max === teamAverage.D) return "Dominance (D)";
        if (max === teamAverage.I) return "Influence (I)";
        if (max === teamAverage.S) return "Steadiness (S)";
        return "Conscientiousness (C)";
    };

    // Communication strategies based on team style
    const getCommunicationStrategies = () => {
        const style = getTeamStyle();
        if (style.includes("Dominance")) {
            return "Be direct and results-focused. Give clear expectations and deadlines. Avoid too much small talk.";
        }
        if (style.includes("Influence")) {
            return "Be enthusiastic and relational. Use stories and praise. Keep meetings energetic and positive.";
        }
        if (style.includes("Steadiness")) {
            return "Be patient and supportive. Give time for processing. Focus on team harmony and consistency.";
        }
        return "Be detailed and accurate. Provide data and written follow-up. Respect their need for structure.";
    };

    // Save to Supabase
    const saveAssessment = async () => {
        if (!user?.id) return showToast('Please sign in to save', 'error');

        const payload = {
            user_id: user.id,
            tool: 'disc-assessment',
            review_date: new Date().toISOString().split('T')[0],
            overall_score: 0,
            data: {
                teamName,
                staff,
                teamAverage,
                teamStyle: getTeamStyle()
            }
        };

        const { error } = await supabase.from('assessments').insert(payload);

        if (error) {
            showToast('Save failed: ' + error.message, 'error');
        } else {
            showToast('✅ DISC Assessment saved!', 'success');
            loadHistory();
        }
    };

    const loadHistory = async () => {
        if (!user?.id) return;
        const { data } = await supabase
            .from('assessments')
            .select('*')
            .eq('tool', 'disc-assessment')
            .eq('user_id', user.id)
            .order('review_date', { ascending: false });
        setHistory(data || []);
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Team Radar Chart
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cx = 300;
        const cy = 220;
        const radius = 180;

        // Draw radar grid
        ctx.strokeStyle = '#e2e8f0';
        for (let i = 1; i <= 5; i++) {
            const r = (radius / 5) * i;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw axes
        const labels = ['D', 'I', 'S', 'C'];
        ctx.strokeStyle = '#64748b';
        ctx.beginPath();
        labels.forEach((_, i) => {
            const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw team profile
        ctx.beginPath();
        ctx.strokeStyle = '#166534';
        ctx.lineWidth = 4;
        ctx.fillStyle = 'rgba(22, 101, 52, 0.15)';

        const values = [teamAverage.D, teamAverage.I, teamAverage.S, teamAverage.C];
        values.forEach((value, i) => {
            const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
            const r = (value / 100) * radius;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        // Labels
        ctx.fillStyle = '#1e2937';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        labels.forEach((label, i) => {
            const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
            const x = cx + Math.cos(angle) * (radius + 40);
            const y = cy + Math.sin(angle) * (radius + 40);
            ctx.fillText(label, x, y + 6);
        });
    }, [teamAverage]);

    useEffect(() => {
        if (user) loadHistory();
    }, [user]);

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-700 rounded-2xl flex items-center justify-center text-white font-bold">S</div>
                        <span className="font-semibold text-xl">School Health Score</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <a href="/calculator" className="hover:text-emerald-700">Tools</a>
                        <UserButton />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">
                <h1 className="text-4xl font-bold mb-2">Staff DISC Assessment</h1>
                <p className="text-slate-600 mb-8">Build your team profile and get communication strategies.</p>

                <div className="grid grid-cols-12 gap-8">
                    {/* Add Staff */}
                    <div className="col-span-12 lg:col-span-4">
                        <div className="bg-white rounded-3xl shadow-sm border p-6">
                            <h2 className="font-semibold mb-4">Add Staff Member</h2>
                            <input
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="Staff name"
                                className="w-full border rounded-2xl px-4 py-3 mb-4"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs block mb-1">D (Dominance)</label>
                                    <input type="range" min="0" max="100" value={newD} onChange={e => setNewD(Number(e.target.value))} className="w-full" />
                                    <div className="text-center text-sm">{newD}</div>
                                </div>
                                <div>
                                    <label className="text-xs block mb-1">I (Influence)</label>
                                    <input type="range" min="0" max="100" value={newI} onChange={e => setNewI(Number(e.target.value))} className="w-full" />
                                    <div className="text-center text-sm">{newI}</div>
                                </div>
                                <div>
                                    <label className="text-xs block mb-1">S (Steadiness)</label>
                                    <input type="range" min="0" max="100" value={newS} onChange={e => setNewS(Number(e.target.value))} className="w-full" />
                                    <div className="text-center text-sm">{newS}</div>
                                </div>
                                <div>
                                    <label className="text-xs block mb-1">C (Conscientiousness)</label>
                                    <input type="range" min="0" max="100" value={newC} onChange={e => setNewC(Number(e.target.value))} className="w-full" />
                                    <div className="text-center text-sm">{newC}</div>
                                </div>
                            </div>
                            <button onClick={addStaff} className="mt-6 w-full bg-emerald-700 text-white py-3 rounded-2xl font-medium">Add to Team</button>
                        </div>
                    </div>

                    {/* Team Dashboard */}
                    <div className="col-span-12 lg:col-span-8">
                        <div className="bg-white rounded-3xl shadow-sm border p-6">
                            <div className="flex justify-between items-center mb-6">
                                <input
                                    value={teamName}
                                    onChange={e => setTeamName(e.target.value)}
                                    className="text-2xl font-semibold bg-transparent border-b focus:outline-none"
                                />
                                <button onClick={saveAssessment} className="bg-emerald-700 text-white px-6 py-2 rounded-2xl">Save Assessment</button>
                            </div>

                            {/* Team Radar Chart */}
                            <div className="flex justify-center">
                                <canvas ref={canvasRef} width="600" height="440" />
                            </div>

                            {/* Team Average */}
                            <div className="mt-8 grid grid-cols-4 gap-4 text-center">
                                <div className="bg-slate-50 rounded-2xl p-4">
                                    <div className="text-4xl font-bold text-red-600">{teamAverage.D}</div>
                                    <div className="text-sm font-medium">D - Dominance</div>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4">
                                    <div className="text-4xl font-bold text-yellow-600">{teamAverage.I}</div>
                                    <div className="text-sm font-medium">I - Influence</div>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4">
                                    <div className="text-4xl font-bold text-blue-600">{teamAverage.S}</div>
                                    <div className="text-sm font-medium">S - Steadiness</div>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4">
                                    <div className="text-4xl font-bold text-emerald-600">{teamAverage.C}</div>
                                    <div className="text-sm font-medium">C - Conscientiousness</div>
                                </div>
                            </div>
                        </div>

                        {/* Strengths & Weaknesses + Strategies */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-3xl shadow-sm border p-6">
                                <h3 className="font-semibold mb-3">Team Strengths &amp; Weaknesses</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Dominant style: <strong>{getTeamStyle()}</strong><br />
                                    This team is strong in {getTeamStyle() === "Dominance (D)" ? "getting results and making decisions" : getTeamStyle() === "Influence (I)" ? "building relationships and motivating others" : getTeamStyle() === "Steadiness (S)" ? "creating stability and supporting the team" : "attention to detail and quality"}.
                                </p>
                            </div>

                            <div className="bg-white rounded-3xl shadow-sm border p-6">
                                <h3 className="font-semibold mb-3">Best Communication Strategies for Leaders</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {getCommunicationStrategies()}
                                </p>
                            </div>
                        </div>

                        {/* Staff List */}
                        <div className="mt-8 bg-white rounded-3xl shadow-sm border p-6">
                            <h3 className="font-semibold mb-4">Team Members ({staff.length})</h3>
                            <div className="space-y-3">
                                {staff.map(member => (
                                    <div key={member.id} className="flex justify-between items-center p-4 border rounded-2xl">
                                        <div className="font-medium">{member.name}</div>
                                        <div className="flex gap-6 text-sm">
                                            <div>D: <span className="font-bold">{member.D}</span></div>
                                            <div>I: <span className="font-bold">{member.I}</span></div>
                                            <div>S: <span className="font-bold">{member.S}</span></div>
                                            <div>C: <span className="font-bold">{member.C}</span></div>
                                        </div>
                                        <button onClick={() => removeStaff(member.id)} className="text-red-500 text-xl">✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    background: toast.type === 'success' ? '#166534' : '#991b1b',
                    color: 'white', padding: '20px 28px', borderRadius: '16px', zIndex: 10000
                }}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}