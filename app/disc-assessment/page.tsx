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

interface Response {
    id: string;
    name: string;
    D: number;
    I: number;
    S: number;
    C: number;
    submittedAt: string;
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

    const [shareLink, setShareLink] = useState('');
    const [responses, setResponses] = useState<Response[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Add manual staff (for leader to pre-populate)
    const addStaff = () => {
        if (!newName.trim()) return;
        const member: StaffMember = {
            id: Date.now().toString(),
            name: newName.trim(),
            D: newD,
            I: newI,
            S: newS,
            C: newC
        };
        setStaff([...staff, member]);
        setNewName('');
    };

    const removeStaff = (id: string) => {
        setStaff(staff.filter(s => s.id !== id));
    };

    // Generate shareable link
    const generateShareLink = async () => {
        if (!user?.id) return showToast('Please sign in', 'error');
        if (staff.length === 0) return showToast('Add at least one team member first', 'error');

        const shareId = `disc-${Date.now()}`;

        const { error } = await supabase.from('assessments').insert({
            user_id: user.id,
            tool: 'disc-assessment',
            review_date: new Date().toISOString().split('T')[0],
            data: {
                teamName,
                staff,
                shareId,
                isPublic: true
            }
        });

        if (error) {
            showToast('Failed to create link', 'error');
        } else {
            const link = `${window.location.origin}/disc-fill/${shareId}`;
            setShareLink(link);
            showToast('Shareable link created!', 'success');
        }
    };

    // Load responses for this leader
    const loadResponses = async () => {
        if (!user?.id) return;
        const { data } = await supabase
            .from('assessments')
            .select('data')
            .eq('tool', 'disc-assessment-response')
            .eq('user_id', user.id);   // Only show responses for this leader

        if (data) {
            const allResponses = data.flatMap(item => item.data || []);
            setResponses(allResponses);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Team average from manual staff + responses
    const allScores = [...staff, ...responses];
    const teamAverage = {
        D: allScores.length ? Math.round(allScores.reduce((sum, s) => sum + (s.D || 0), 0) / allScores.length) : 50,
        I: allScores.length ? Math.round(allScores.reduce((sum, s) => sum + (s.I || 0), 0) / allScores.length) : 50,
        S: allScores.length ? Math.round(allScores.reduce((sum, s) => sum + (s.S || 0), 0) / allScores.length) : 50,
        C: allScores.length ? Math.round(allScores.reduce((sum, s) => sum + (s.C || 0), 0) / allScores.length) : 50,
    };

    const getTeamStyle = () => {
        const max = Math.max(teamAverage.D, teamAverage.I, teamAverage.S, teamAverage.C);
        if (max === teamAverage.D) return "Dominance (D)";
        if (max === teamAverage.I) return "Influence (I)";
        if (max === teamAverage.S) return "Steadiness (S)";
        return "Conscientiousness (C)";
    };

    const getCommunicationStrategies = () => {
        const style = getTeamStyle();
        if (style.includes("Dominance")) return "Be direct, concise, and results-focused. Give clear expectations.";
        if (style.includes("Influence")) return "Be enthusiastic and relational. Use stories and praise.";
        if (style.includes("Steadiness")) return "Be patient and supportive. Focus on harmony and consistency.";
        return "Be detailed and accurate. Provide data and written follow-up.";
    };

    // Radar Chart
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cx = 300, cy = 220, radius = 180;

        // Grid
        ctx.strokeStyle = '#e2e8f0';
        for (let i = 1; i <= 5; i++) {
            ctx.beginPath();
            ctx.arc(cx, cy, (radius / 5) * i, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Axes
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

        // Radar line
        ctx.beginPath();
        ctx.strokeStyle = '#166534';
        ctx.lineWidth = 5;
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
            const x = cx + Math.cos(angle) * (radius + 45);
            const y = cy + Math.sin(angle) * (radius + 45);
            ctx.fillText(label, x, y + 6);
        });
    }, [teamAverage]);

    useEffect(() => {
        if (user) {
            loadResponses();
        }
    }, [user]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navigation */}
            <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-700 rounded-2xl flex items-center justify-center text-white font-bold">S</div>
                            <span className="font-semibold text-xl">School Health Score</span>
                        </div>
                        <div className="relative group">
                            <button className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium px-5 py-3 rounded-2xl hover:bg-slate-100 transition">
                                My Tools <span className="text-xs">▼</span>
                            </button>
                            <div className="absolute left-0 mt-2 w-72 bg-white rounded-3xl shadow-xl border border-slate-100 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <a href="/calculator" className="block px-6 py-3 hover:bg-emerald-50">School Health Calculator</a>
                                <a href="/deferred-maintenance" className="block px-6 py-3 hover:bg-emerald-50">Deferred Maintenance</a>
                                <a href="/revenue-forecast" className="block px-6 py-3 hover:bg-emerald-50">Revenue Forecast</a>
                                <a href="/disc-assessment" className="block px-6 py-3 hover:bg-emerald-50 font-medium text-emerald-700">DISC Assessment</a>
                            </div>
                        </div>
                    </div>
                    <UserButton />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-10">
                <h1 className="text-4xl font-bold mb-2">Staff DISC Assessment</h1>
                <p className="text-slate-600 mb-8">Add team members and generate a shareable link for them to complete their DISC profile.</p>

                <div className="grid grid-cols-12 gap-8">
                    {/* Add Staff Sidebar */}
                    <div className="col-span-12 lg:col-span-4">
                        <div className="bg-white rounded-3xl shadow-sm border p-6 sticky top-8">
                            <h2 className="font-semibold mb-4">Add Team Member</h2>
                            <input
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="Staff name"
                                className="w-full border rounded-2xl px-4 py-3 mb-4"
                            />
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {['D', 'I', 'S', 'C'].map((letter, idx) => {
                                    const setters = [setNewD, setNewI, setNewS, setNewC];
                                    const values = [newD, newI, newS, newC];
                                    return (
                                        <div key={letter}>
                                            <label className="block mb-1">{letter} Score</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={values[idx]}
                                                onChange={e => setters[idx](Number(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="text-center font-medium">{values[idx]}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            <button onClick={addStaff} className="mt-6 w-full bg-emerald-700 text-white py-3 rounded-2xl font-medium">Add to Team</button>

                            <button
                                onClick={generateShareLink}
                                className="mt-4 w-full bg-white border border-emerald-700 text-emerald-700 py-3 rounded-2xl font-medium"
                            >
                                Generate Shareable Link
                            </button>

                            {shareLink && (
                                <div className="mt-4 p-4 bg-emerald-50 rounded-2xl text-sm break-all">
                                    {shareLink}
                                    <button
                                        onClick={() => navigator.clipboard.writeText(shareLink)}
                                        className="ml-3 text-emerald-700 underline"
                                    >
                                        Copy
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Dashboard */}
                    <div className="col-span-12 lg:col-span-8">
                        <div className="bg-white rounded-3xl shadow-sm border p-8">
                            <input
                                value={teamName}
                                onChange={e => setTeamName(e.target.value)}
                                className="text-3xl font-bold bg-transparent border-b w-full mb-8 focus:outline-none"
                            />

                            <div className="flex justify-center mb-10">
                                <canvas ref={canvasRef} width="620" height="460" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-50 rounded-3xl p-6">
                                    <h3 className="font-semibold mb-2">Team Style</h3>
                                    <p className="text-xl font-medium text-emerald-700">{getTeamStyle()}</p>
                                </div>
                                <div className="bg-slate-50 rounded-3xl p-6">
                                    <h3 className="font-semibold mb-2">Communication Strategy</h3>
                                    <p className="text-sm leading-relaxed text-slate-600">{getCommunicationStrategies()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Live Responses */}
                        <div className="mt-8 bg-white rounded-3xl shadow-sm border p-6">
                            <h3 className="font-semibold mb-4">Submitted Responses ({responses.length})</h3>
                            <div className="space-y-3">
                                {responses.length === 0 ? (
                                    <p className="text-slate-500">No responses yet. Share the link with your team.</p>
                                ) : (
                                    responses.map((resp, index) => (
                                        <div key={index} className="flex justify-between items-center p-4 border rounded-2xl">
                                            <div className="font-medium">{resp.name}</div>
                                            <div className="flex gap-6 text-sm">
                                                <span>D: <strong>{resp.D}</strong></span>
                                                <span>I: <strong>{resp.I}</strong></span>
                                                <span>S: <strong>{resp.S}</strong></span>
                                                <span>C: <strong>{resp.C}</strong></span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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