'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { supabase } from '../lib/supabase';   // ← Make sure this path is correct

export default function StaffLeadership() {
    const { user } = useUser();
    const [domains, setDomains] = useState([ /* ... your existing 4 domains ... */]);
    const [schoolName, setSchoolName] = useState('Trinity Lutheran School');
    const [reviewDate, setReviewDate] = useState('2026-04-09');
    const [history, setHistory] = useState<any[]>([]);

    // ← Paste your full domains array here (the same 4 domains you already have)
    // For brevity I omitted it — just copy it from your current file

    const calculateResults = () => {
        return domains.map(domain => {
            const avg = domain.metrics.reduce((sum, m) => sum + (m.score || 3), 0) / domain.metrics.length;
            return {
                name: domain.name,
                avg: Math.round(avg * 100) / 100,
                risk: avg >= 4 ? 'Strong' : avg >= 3 ? 'Stable' : 'Needs Attention'
            };
        });
    };

    const saveAssessment = async () => {
        if (!user) return alert('Please sign in to save');

        const results = calculateResults();
        const overall = results.reduce((sum, r) => sum + r.avg, 0) / results.length;

        const payload = {
            user_id: user.id,
            school_name: schoolName,
            review_date: reviewDate,
            tool: 'staff-leadership',
            overall_score: Math.round(overall * 10) / 10,
            data: { domains, results }
        };

        const { error } = await supabase.from('assessments').insert(payload);
        if (error) alert('Save failed: ' + error.message);
        else {
            alert('✅ Assessment saved successfully!');
            loadHistory();
        }
    };

    const loadHistory = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('assessments')
            .select('*')
            .eq('user_id', user.id)
            .eq('tool', 'staff-leadership')
            .order('review_date', { ascending: false });
        setHistory(data || []);
    };

    const launchAnonymousSurvey = () => {
        const surveyId = 'survey-' + Math.random().toString(36).substring(2, 10);
        const link = `${window.location.origin}/staff-survey/${surveyId}`;

        alert(`✅ Anonymous survey link created!\n\nShare this link with your staff:\n${link}\n\n(We will build the actual public survey page next)`);

        // In the real version this would insert a new survey record into Supabase
    };

    useEffect(() => {
        if (user) loadHistory();
    }, [user]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Nav - identical to other tools */}
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
                                <Link href="/calculator" className="block px-6 py-3 hover:bg-emerald-50 text-slate-700 font-medium">School Health Calculator</Link>
                                <Link href="/enrollment-projection" className="block px-6 py-3 hover:bg-emerald-50 text-slate-700 font-medium">Enrollment Projection Calculator</Link>
                                <Link href="/staff-leadership" className="block px-6 py-3 hover:bg-emerald-50 text-slate-700 font-medium">Staff & Leadership Health Assessment</Link>
                            </div>
                        </div>
                    </div>
                    <UserButton />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">
                <h1 className="text-4xl font-bold mb-2">Staff & Leadership Health Assessment</h1>
                <p className="text-slate-600 mb-8">Self-assessment + Anonymous Staff Survey System</p>

                {/* Launch Anonymous Survey Button */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 mb-8 flex items-center justify-between">
                    <div>
                        <span className="inline-block bg-emerald-600 text-white text-sm font-semibold px-4 py-1 rounded-2xl mb-2">NEW</span>
                        <h2 className="text-2xl font-semibold">Launch Anonymous Staff Survey</h2>
                        <p className="text-emerald-700">Staff fill out anonymously → results auto-aggregate here</p>
                    </div>
                    <button
                        onClick={launchAnonymousSurvey}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-4 rounded-3xl font-semibold text-lg"
                    >
                        Create & Share Survey Link →
                    </button>
                </div>

                {/* Existing scoring area (your current domains) - keep your full domains here */}
                {/* ... your domains grid stays exactly as before ... */}

                <div className="mt-12 flex justify-end gap-4">
                    <button onClick={() => { /* reset logic */ }} className="px-8 py-4 bg-gray-200 rounded-3xl font-medium">Reset</button>
                    <button onClick={saveAssessment} className="px-8 py-4 bg-emerald-700 text-white rounded-3xl font-medium">Save Assessment</button>
                </div>

                {/* History Panel */}
                <div className="mt-16 bg-white rounded-3xl shadow-sm border p-8">
                    <h2 className="text-2xl font-semibold mb-6">Year-over-Year History</h2>
                    <div className="space-y-4 max-h-96 overflow-auto">
                        {history.map(item => (
                            <div key={item.id} className="flex justify-between items-center p-4 border rounded-2xl hover:bg-slate-50">
                                <div>
                                    <strong>{item.review_date}</strong>
                                </div>
                                <div className="text-emerald-700 font-semibold">
                                    Overall: {item.overall_score}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}