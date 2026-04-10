'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function StaffLeadership() {
    const { user } = useUser();
    const radarRef = useRef<HTMLCanvasElement>(null);
    const barRef = useRef<HTMLCanvasElement>(null);

    const [domains, setDomains] = useState([
        {
            name: 'Leadership Effectiveness',
            metrics: [
                { name: 'Clarity of vision and communication', help: 'Leaders clearly articulate direction and expectations', score: 4 },
                { name: 'Trust and approachability', help: 'Staff feel safe bringing concerns to leadership', score: 3 },
                { name: 'Decision-making transparency', help: 'Decisions are explained and staff feel heard', score: 4 }
            ]
        },
        {
            name: 'Staff Morale & Retention',
            metrics: [
                { name: 'Overall staff satisfaction', help: 'Staff enjoy coming to work and feel valued', score: 3 },
                { name: 'Intention to stay next year', help: 'Staff plan to return next school year', score: 4 },
                { name: 'Work-life balance', help: 'Staff feel supported and not burned out', score: 3 }
            ]
        },
        {
            name: 'Professional Development',
            metrics: [
                { name: 'Growth opportunities', help: 'Staff have access to meaningful training', score: 4 },
                { name: 'Mentorship and coaching', help: 'New and veteran teachers receive support', score: 3 },
                { name: 'Feedback culture', help: 'Constructive feedback is given regularly', score: 4 }
            ]
        },
        {
            name: 'Spiritual Culture',
            metrics: [
                { name: 'Faith integration in daily life', help: 'Staff experience spiritual formation at work', score: 4 },
                { name: 'Prayer and worship culture', help: 'Prayer is regular and meaningful', score: 5 },
                { name: 'Biblical worldview among staff', help: 'Staff model Christ-like character', score: 4 }
            ]
        }
    ]);

    const [schoolName, setSchoolName] = useState('Trinity Lutheran School');
    const [reviewDate, setReviewDate] = useState('2026-04-09');
    const [history, setHistory] = useState<any[]>([]);

    const [showModal, setShowModal] = useState(false);
    const [surveyLink, setSurveyLink] = useState('');
    const [copied, setCopied] = useState(false);

    const calculateResults = (doms: any[]) => {
        return doms.map(domain => {
            const avg = domain.metrics.reduce((sum: number, m: any) => sum + (m.score || 0), 0) / domain.metrics.length;
            return { name: domain.name, avg: Math.round(avg * 100) / 100 };
        });
    };

    const saveAssessment = async () => {
        if (!user) return alert('Please sign in to save');
        const results = calculateResults(domains);
        const overall = results.reduce((sum: number, r: any) => sum + r.avg, 0) / results.length;

        const payload = {
            school_name: schoolName,
            review_date: reviewDate,
            tool: 'staff-leadership',
            overall_score: Math.round(overall * 10) / 10,
            data: { domains, results, type: 'self-assessment' }
        };

        const { error } = await supabase.from('assessments').insert(payload);
        if (error) alert('Save failed: ' + error.message);
        else {
            alert('✅ Assessment saved!');
            loadHistory();
        }
    };

    const loadHistory = async () => {
        const { data } = await supabase
            .from('assessments')
            .select('*')
            .eq('tool', 'staff-leadership')
            .order('review_date', { ascending: false });
        setHistory(data || []);
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

    const overallAverage = history.length > 0
        ? history.reduce((sum, item) => {
            if (item.data?.domains) {
                const avg = item.data.domains.reduce((s: number, d: any) => {
                    const domainAvg = d.metrics.reduce((ss: number, m: any) => ss + (m.score || 0), 0) / d.metrics.length;
                    return s + domainAvg;
                }, 0) / item.data.domains.length;
                return sum + avg;
            }
            return sum;
        }, 0) / history.length
        : 0;

    // Auto-refresh every 15 seconds
    useEffect(() => {
        if (user) {
            loadHistory();
            const interval = setInterval(loadHistory, 15000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const drawRadarChart = () => {
        const canvas = radarRef.current;
        if (!canvas || history.length === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = 800 * dpr;
        canvas.height = 400 * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, 800, 400);

        const centerX = 400, centerY = 200, radius = 140;
        const numAxes = 4;
        const angleStep = (Math.PI * 2) / numAxes;

        const domainNames = ['Leadership Effectiveness', 'Staff Morale & Retention', 'Professional Development', 'Spiritual Culture'];

        const averages = domainNames.map(name => {
            let total = 0, count = 0;
            history.forEach(record => {
                if (record.data?.domains) {
                    const domain = record.data.domains.find((d: any) => d.name === name);
                    if (domain) {
                        const avg = domain.metrics.reduce((s: number, m: any) => s + (m.score || 0), 0) / domain.metrics.length;
                        total += avg;
                        count++;
                    }
                }
            });
            return count > 0 ? total / count : 3;
        });

        ctx.strokeStyle = '#e2e8f0';
        for (let i = 1; i <= 5; i++) {
            const r = (radius * i) / 5;
            ctx.beginPath();
            for (let j = 0; j < numAxes; j++) {
                const angle = j * angleStep - Math.PI / 2;
                const x = centerX + Math.cos(angle) * r;
                const y = centerY + Math.sin(angle) * r;
                if (j === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }

        ctx.beginPath();
        averages.forEach((value, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const r = (value / 5) * radius;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#1e2937';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        domainNames.forEach((name, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = centerX + Math.cos(angle) * (radius + 45);
            const y = centerY + Math.sin(angle) * (radius + 45) + 5;
            ctx.fillText(name, x, y);
        });
    };

    const drawBarChart = () => {
        const canvas = barRef.current;
        if (!canvas || history.length === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = 800 * dpr;
        canvas.height = 400 * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, 800, 400);

        const domainNames = ['Leadership', 'Morale', 'Professional', 'Spiritual'];
        const averages = domainNames.map(name => {
            let total = 0, count = 0;
            history.forEach(record => {
                if (record.data?.domains) {
                    const domain = record.data.domains.find((d: any) => d.name.includes(name));
                    if (domain) {
                        const avg = domain.metrics.reduce((s: number, m: any) => s + (m.score || 0), 0) / domain.metrics.length;
                        total += avg;
                        count++;
                    }
                }
            });
            return count > 0 ? total / count : 3;
        });

        const barWidth = 120;
        const spacing = 40;
        const startX = 80;

        ctx.fillStyle = '#10b981';
        averages.forEach((value, i) => {
            const height = (value / 5) * 280;
            const x = startX + i * (barWidth + spacing);
            ctx.fillRect(x, 320 - height, barWidth, height);
            ctx.fillStyle = '#1e2937';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(value.toFixed(1), x + barWidth / 2, 340);
            ctx.fillText(domainNames[i], x + barWidth / 2, 370);
            ctx.fillStyle = '#10b981';
        });
    };

    useEffect(() => {
        if (user) loadHistory();
    }, [user]);

    useEffect(() => {
        drawRadarChart();
        drawBarChart();
    }, [history]);

    const downloadFullPDF = async () => {
        const html2pdf = (await import('html2pdf.js')).default;

        const element = document.createElement('div');
        element.style.padding = '40px';
        element.style.fontFamily = 'Arial, sans-serif';
        element.innerHTML = `
            <h1 style="text-align:center; color:#166534;">Staff & Leadership Health Report</h1>
            <p style="text-align:center; color:#64748b;">Generated on ${new Date().toLocaleDateString()}</p>
            <h2 style="text-align:center; margin:30px 0;">Overall Average Score: <strong style="color:#10b981;">${overallAverage.toFixed(1)} / 5</strong></h2>
            <h3 style="margin-top:40px;">Average Scores by Domain</h3>
            <div style="height:400px; background:#f8fafc; border-radius:12px; margin:20px 0;"></div>
            <h3 style="margin-top:40px;">All Survey Responses</h3>
            <table style="width:100%; border-collapse:collapse; margin-top:20px;">
                <tr style="background:#f1f5f9;">
                    <th style="padding:12px; border:1px solid #cbd5e1; text-align:left;">Date</th>
                    <th style="padding:12px; border:1px solid #cbd5e1; text-align:right;">Overall Score</th>
                </tr>
                ${history.map(item => `
                    <tr>
                        <td style="padding:12px; border:1px solid #cbd5e1;">${item.review_date}</td>
                        <td style="padding:12px; border:1px solid #cbd5e1; text-align:right;">${item.overall_score || '—'}</td>
                    </tr>
                `).join('')}
            </table>
            <h3 style="margin-top:40px;">Potential Strategies</h3>
            <ul style="line-height:1.8;">
                <li>• Conduct 1:1 check-ins with staff showing low morale</li>
                <li>• Improve leadership communication transparency</li>
                <li>• Review workload and work-life balance</li>
                <li>• Hold regular all-staff town halls</li>
            </ul>
        `;

        const opt = {
            margin: 15,
            filename: `staff-leadership-full-report-${new Date().toISOString().slice(0, 10)}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        } as any;

        html2pdf().set(opt).from(element).save();
    };

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

                <div className="mt-12 flex justify-end gap-4">
                    <button className="px-8 py-4 bg-gray-200 rounded-3xl font-medium">Reset</button>
                    <button onClick={saveAssessment} className="px-8 py-4 bg-emerald-700 text-white rounded-3xl font-medium">Save Assessment</button>
                    <button onClick={downloadFullPDF} className="px-8 py-4 bg-blue-700 text-white rounded-3xl font-medium">Download Full PDF Report</button>
                </div>

                <div className="mt-16 bg-white rounded-3xl shadow-sm border p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold">All Feedback Received</h2>
                        <button onClick={loadHistory} className="text-sm bg-slate-100 hover:bg-slate-200 px-5 py-2 rounded-2xl font-medium">Refresh</button>
                    </div>

                    {history.length > 0 && (
                        <div className="mb-8 p-6 bg-emerald-50 rounded-3xl text-center">
                            <p className="text-sm text-emerald-700 font-medium">Overall Average from {history.length} Surveys</p>
                            <div className="text-6xl font-bold text-emerald-700 mt-2">
                                {overallAverage.toFixed(1)}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 max-h-96 overflow-auto">
                        {history.length === 0 ? (
                            <p className="text-slate-500 text-center py-12">No feedback yet.</p>
                        ) : (
                            history.map(item => {
                                const avg = item.data?.domains
                                    ? item.data.domains.reduce((sum: number, d: any) => {
                                        const domainAvg = d.metrics.reduce((s: number, m: any) => s + (m.score || 0), 0) / d.metrics.length;
                                        return sum + domainAvg;
                                    }, 0) / item.data.domains.length
                                    : null;

                                return (
                                    <div key={item.id} className="flex justify-between items-center p-5 border rounded-2xl hover:bg-slate-50">
                                        <div>
                                            <strong>{item.review_date}</strong>
                                            {item.data?.survey_id && <span className="ml-3 text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-3xl">Anonymous Survey</span>}
                                        </div>
                                        <div className="text-emerald-700 font-semibold">
                                            Overall: {avg ? avg.toFixed(1) : '—'}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="mt-12">
                        <h3 className="font-medium mb-4">Average Scores Across All Surveys (Radar)</h3>
                        <canvas ref={radarRef} width="800" height="400" className="w-full border border-slate-200 rounded-3xl"></canvas>
                    </div>

                    <div className="mt-12">
                        <h3 className="font-medium mb-4">Domain Averages (Bar Chart)</h3>
                        <canvas ref={barRef} width="800" height="400" className="w-full border border-slate-200 rounded-3xl"></canvas>
                    </div>
                </div>
            </div>

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