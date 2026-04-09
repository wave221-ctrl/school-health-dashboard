'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function StaffLeadership() {
    const { user } = useUser();
    const [domains, setDomains] = useState([ /* ← Paste your full 4 domains array here exactly as before */]);
    const [schoolName, setSchoolName] = useState('Trinity Lutheran School');
    const [reviewDate, setReviewDate] = useState('2026-04-09');
    const [history, setHistory] = useState<any[]>([]);

    // Modal state for survey link
    const [showModal, setShowModal] = useState(false);
    const [surveyLink, setSurveyLink] = useState('');
    const [copied, setCopied] = useState(false);

    const calculateResults = () => { /* ← your existing calculateResults function */ };
    const saveAssessment = async () => { /* ← your existing saveAssessment */ };
    const loadHistory = async () => { /* ← your existing loadHistory */ };

    const launchAnonymousSurvey = () => {
        const surveyId = 'survey-' + Math.random().toString(36).substring(2, 12);
        const link = `${window.location.origin}/staff-survey/${surveyId}`;
        setSurveyLink(link);
        setShowModal(true);
        setCopied(false);
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(surveyLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            alert('Failed to copy');
        }
    };

    useEffect(() => {
        if (user) loadHistory();
    }, [user]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Nav */}
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

                {/* Your existing scoring area stays here exactly as before */}
                {/* ... paste your domains grid ... */}

                <div className="mt-12 flex justify-end gap-4">
                    <button className="px-8 py-4 bg-gray-200 rounded-3xl font-medium">Reset</button>
                    <button onClick={saveAssessment} className="px-8 py-4 bg-emerald-700 text-white rounded-3xl font-medium">Save Assessment</button>
                </div>

                {/* History Panel (unchanged) */}
                <div className="mt-16 bg-white rounded-3xl shadow-sm border p-8">
                    <h2 className="text-2xl font-semibold mb-6">Year-over-Year History</h2>
                    <div className="space-y-4 max-h-96 overflow-auto">
                        {history.map(item => (
                            <div key={item.id} className="flex justify-between items-center p-4 border rounded-2xl hover:bg-slate-50">
                                <div><strong>{item.review_date}</strong></div>
                                <div className="text-emerald-700 font-semibold">Overall: {item.overall_score}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* COPY-TO-CLIPBOARD MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 p-8">
                        <h3 className="text-2xl font-semibold mb-2">Your Anonymous Survey Link</h3>
                        <p className="text-slate-600 mb-6">Share this link with your staff. Responses are 100% anonymous.</p>

                        <div className="flex gap-3 mb-6">
                            <input
                                type="text"
                                value={surveyLink}
                                readOnly
                                className="flex-1 border border-slate-300 rounded-2xl px-4 py-3 text-sm font-mono bg-slate-50"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 rounded-2xl font-medium"
                            >
                                {copied ? '✅ Copied!' : 'Copy'}
                            </button>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-3 text-slate-700 hover:bg-slate-100 rounded-2xl"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}