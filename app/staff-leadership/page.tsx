'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function StaffLeadership() {
    const { user } = useUser();

    const [domains, setDomains] = useState([
        {
            name: 'Leadership Effectiveness',
            weight: 1.3,
            metrics: [
                { name: 'Clarity of vision and communication', help: 'Leaders clearly articulate direction and expectations', score: 3 },
                { name: 'Trust and approachability', help: 'Staff feel safe bringing concerns to leadership', score: 3 },
                { name: 'Decision-making transparency', help: 'Decisions are explained and staff feel heard', score: 3 }
            ]
        },
        {
            name: 'Staff Morale & Retention',
            weight: 1.4,
            metrics: [
                { name: 'Overall staff satisfaction', help: 'Staff enjoy coming to work and feel valued', score: 3 },
                { name: 'Intention to stay next year', help: 'Staff plan to return next school year', score: 3 },
                { name: 'Work-life balance', help: 'Staff feel supported and not burned out', score: 3 }
            ]
        },
        {
            name: 'Professional Development',
            weight: 1.1,
            metrics: [
                { name: 'Growth opportunities', help: 'Staff have access to meaningful training', score: 3 },
                { name: 'Mentorship and coaching', help: 'New and veteran teachers receive support', score: 3 },
                { name: 'Feedback culture', help: 'Constructive feedback is given regularly', score: 3 }
            ]
        },
        {
            name: 'Spiritual Culture',
            weight: 1.2,
            metrics: [
                { name: 'Faith integration in daily life', help: 'Staff experience spiritual formation at work', score: 3 },
                { name: 'Prayer and worship culture', help: 'Prayer is regular and meaningful', score: 3 },
                { name: 'Biblical worldview among staff', help: 'Staff model Christ-like character', score: 3 }
            ]
        }
    ]);

    const [schoolName, setSchoolName] = useState('Trinity Lutheran School');
    const [reviewDate, setReviewDate] = useState('2026-04-09');

    const calculateResults = () => {
        return domains.map(domain => {
            const avg = domain.metrics.reduce((sum, m) => sum + (m.score || 3), 0) / domain.metrics.length;
            const weighted = avg * domain.weight;
            return {
                name: domain.name,
                avg: Math.round(avg * 100) / 100,
                weighted: Math.round(weighted * 100) / 100,
                risk: avg >= 4 ? 'Strong' : avg >= 3 ? 'Stable' : 'Needs Attention'
            };
        });
    };

    const drawChart = () => {
        // Placeholder - can expand later
        console.log('Staff Leadership chart would draw here');
    };

    useEffect(() => {
        drawChart();
    }, [domains]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Navigation */}
            <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-700 rounded-2xl flex items-center justify-center text-white font-bold">S</div>
                            <span className="font-semibold text-xl">School Health Score</span>
                        </div>

                        <div className="relative group">
                            <button className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium px-5 py-3 rounded-2xl hover:bg-slate-100 transition">
                                My Tools
                                <span className="text-xs">▼</span>
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
                <p className="text-slate-600 mb-8">Evaluate staff morale, leadership effectiveness, professional development, and spiritual culture.</p>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border p-8">
                            <h2 className="font-semibold text-lg mb-4">School Information</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">School Name</label>
                                    <input
                                        type="text"
                                        value={schoolName}
                                        onChange={(e) => setSchoolName(e.target.value)}
                                        className="w-full border border-gray-300 rounded-2xl px-4 py-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Assessment Date</label>
                                    <input
                                        type="date"
                                        value={reviewDate}
                                        onChange={(e) => setReviewDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-2xl px-4 py-3"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-6">
                        {domains.map((domain, dIndex) => (
                            <div key={dIndex} className="bg-white rounded-3xl shadow-sm border p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="font-semibold text-xl">{domain.name}</h3>
                                    <span className="text-sm bg-emerald-100 text-emerald-700 px-4 py-1 rounded-3xl">Weight: {domain.weight}</span>
                                </div>
                                {domain.metrics.map((metric, mIndex) => (
                                    <div key={mIndex} className="flex justify-between items-center py-4 border-t border-gray-100">
                                        <div>
                                            <div className="font-medium">{metric.name}</div>
                                            <div className="text-sm text-gray-500">{metric.help}</div>
                                        </div>
                                        <select
                                            value={metric.score}
                                            onChange={(e) => {
                                                const newDomains = [...domains];
                                                newDomains[dIndex].metrics[mIndex].score = parseInt(e.target.value);
                                                setDomains(newDomains);
                                            }}
                                            className="border border-gray-300 rounded-2xl px-4 py-2 w-24"
                                        >
                                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-12 flex justify-end gap-4">
                    <button className="px-8 py-4 bg-gray-200 rounded-3xl font-medium">Reset</button>
                    <button className="px-8 py-4 bg-emerald-700 text-white rounded-3xl font-medium">Save Assessment</button>
                </div>
            </div>
        </div>
    );
}