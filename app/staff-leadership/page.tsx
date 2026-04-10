'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function StaffLeadership() {
    const { user } = useUser();

    const [domains, setDomains] = useState([ /* ← keep your exact 4 domains here */]);
    const [schoolName, setSchoolName] = useState('Trinity Lutheran School');
    const [reviewDate, setReviewDate] = useState('2026-04-09');
    const [history, setHistory] = useState<any[]>([]);
    const [averages, setAverages] = useState<any>(null);

    // Modal for survey link
    const [showModal, setShowModal] = useState(false);
    const [surveyLink, setSurveyLink] = useState('');
    const [copied, setCopied] = useState(false);

    const calculateResults = () => { /* keep your existing function */ };

    const saveAssessment = async () => { /* keep your existing function */ };

    const loadHistory = async () => {
        const { data } = await supabase
            .from('assessments')
            .select('*')
            .eq('tool', 'staff-leadership')
            .order('review_date', { ascending: false });

        setHistory(data || []);

        // Calculate averages from ALL survey responses
        if (data && data.length > 0) {
            let totalScore = 0;
            let count = 0;

            data.forEach(record => {
                if (record.data?.domains) {
                    const surveyAvg = record.data.domains.reduce((sum: number, domain: any) => {
                        const domainAvg = domain.metrics.reduce((s: number, m: any) => s + (m.score || 0), 0) / domain.metrics.length;
                        return sum + domainAvg;
                    }, 0) / record.data.domains.length;

                    totalScore += surveyAvg;
                    count++;
                }
            });

            const overallAverage = count > 0 ? Math.round((totalScore / count) * 10) / 10 : 0;
            setAverages({ overall: overallAverage, totalSurveys: count });
        }
    };

    const launchAnonymousSurvey = () => {
        const surveyId = 'survey-' + Math.random().toString(36).substring(2, 12);
        const link = `${window.location.origin}/staff-survey/${surveyId}`;
        setSurveyLink(link);
        setShowModal(true);
        setCopied(false);
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(surveyLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        if (user) loadHistory();
    }, [user]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Nav - unchanged */}
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

                {/* Launch Survey Button */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 mb-8 flex items-center justify-between">
                    <div>
                        <span className="inline-block bg-emerald-600 text-white text-sm font-semibold px-4 py-1 rounded-2xl mb-2">NEW</span>
                        <h2 className="text-2xl font-semibold">Launch Anonymous Staff Survey</h2>
                        <p className="text-emerald-700">Staff fill out anonymously → results appear here instantly</p>
                    </div>
                    <button onClick={launchAnonymousSurvey} className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-4 rounded-3xl font-semibold text-lg">
                        Create & Share Survey Link →
                    </button>
                </div>

                {/* Your scoring area stays here */}

                <div className="mt-12 flex justify-end gap-4">
                    <button className="px-8 py-4 bg-gray-200 rounded-3xl font-medium">Reset</button>
                    <button onClick={saveAssessment} className="px-8 py-4 bg-emerald-700 text-white rounded-3xl font-medium">Save Assessment</button>
                </div>

                {/* Summary Averages */}
                {averages && (
                    <div className="mt-8 bg-white rounded-3xl shadow-sm border p-6">
                        <h2 className="text-xl font-semibold mb-4">Overall Average from {averages.totalSurveys} Surveys</h2>
                        <div className="text-6xl font-bold text-emerald-700">{averages.overall}</div>
                    </div>
                )}

                {/* History Panel */}
                <div className="mt-16 bg-white rounded-3xl shadow-sm border p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold">All Feedback Received</h2>
                        <button onClick={loadHistory} className="text-sm bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-2xl">Refresh</button>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-auto">
                        {history.length === 0 ? (
                            <p className="text-slate-500 text-center py-12">No feedback yet.</p>
                        ) : (
                            history.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-5 border rounded-2xl hover:bg-slate-50">
                                    <div>
                                        <strong>{item.review_date}</strong>
                                        {item.data?.survey_id && <span className="ml-3 text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-3xl">Anonymous Survey</span>}
                                    </div>
                                    <div className="text-emerald-700 font-semibold">
                                        Overall: {item.overall_score || '—'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Copy Link Modal - unchanged */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 p-8">
                        <h3 className="text-2xl font-semibold mb-2">Your Anonymous Survey Link</h3>
                        <p className="text-slate-600 mb-6">Share this link with your staff.</p>
                        <div className="flex gap-3 mb-6">
                            <input type="text" value={surveyLink} readOnly className="flex-1 border border-slate-300 rounded-2xl px-4 py-3 text-sm font-mono bg-slate-50" />
                            <button onClick={copyToClipboard} className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 rounded-2xl font-medium">
                                {copied ? '✅ Copied!' : 'Copy'}
                            </button>
                        </div>
                        <button onClick={() => setShowModal(false)} className="w-full py-3 text-slate-700 hover:bg-slate-100 rounded-2xl">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}