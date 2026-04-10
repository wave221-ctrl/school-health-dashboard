'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Metric {
    name: string;
    help: string;
    score: number | null;
}

interface Domain {
    name: string;
    metrics: Metric[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const domainAvg = (domain: Domain) => {
    const scores = domain.metrics.map(m => m.score || 0);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
};

const itemOverallAvg = (item: any): number | null => {
    if (!item.data?.domains) return null;
    const avgs = item.data.domains.map((d: any) => {
        const scores = d.metrics.map((m: any) => m.score || 0);
        return scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
    });
    return avgs.reduce((a: number, b: number) => a + b, 0) / avgs.length;
};

/** Draw a bar chart onto an offscreen canvas and return a PNG data URL */
function buildBarChartDataUrl(history: any[]): string {
    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 320;
    const ctx = canvas.getContext('2d')!;

    const domainNames = ['Leadership Effectiveness', 'Staff Morale & Retention', 'Professional Development', 'Spiritual Culture'];
    const shortNames  = ['Leadership', 'Morale', 'Development', 'Spiritual'];

    const averages = domainNames.map(name => {
        let total = 0, count = 0;
        history.forEach(record => {
            if (record.data?.domains) {
                const d = record.data.domains.find((d: any) => d.name === name);
                if (d) {
                    total += d.metrics.reduce((s: number, m: any) => s + (m.score || 0), 0) / d.metrics.length;
                    count++;
                }
            }
        });
        return count > 0 ? total / count : 0;
    });

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 700, 320);

    const pad = { top: 30, right: 20, bottom: 60, left: 50 };
    const chartH = 320 - pad.top - pad.bottom;
    const chartW = 700 - pad.left - pad.right;
    const groupW = chartW / averages.length;
    const barW   = groupW * 0.45;

    // Grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.fillStyle   = '#64748b';
    ctx.font        = '12px Arial';
    for (let i = 0; i <= 5; i++) {
        const y = pad.top + chartH - (chartH / 5) * i;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(700 - pad.right, y);
        ctx.stroke();
        ctx.fillText(i.toString(), 8, y + 4);
    }

    // Bars
    averages.forEach((value, i) => {
        const barH = (value / 5) * chartH;
        const x    = pad.left + i * groupW + (groupW - barW) / 2;
        const y    = pad.top + chartH - barH;
        ctx.fillStyle = '#10b981';
        ctx.fillRect(x, y, barW, barH);
        ctx.fillStyle   = '#1e2937';
        ctx.font        = 'bold 13px Arial';
        ctx.textAlign   = 'center';
        ctx.fillText(value.toFixed(1), x + barW / 2, y - 6);
        ctx.font = '12px Arial';
        ctx.fillText(shortNames[i], x + barW / 2, pad.top + chartH + 20);
        ctx.textAlign = 'left';
    });

    return canvas.toDataURL('image/png');
}

/** Draw a radar chart onto an offscreen canvas and return a PNG data URL */
function buildRadarChartDataUrl(history: any[]): string {
    const canvas = document.createElement('canvas');
    canvas.width  = 500;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 500, 400);

    const cx = 250, cy = 200, radius = 140;
    const domainNames = ['Leadership Effectiveness', 'Staff Morale & Retention', 'Professional Development', 'Spiritual Culture'];
    const shortLabels = ['Leadership', 'Morale', 'Development', 'Spiritual'];
    const numAxes     = domainNames.length;
    const angleStep   = (Math.PI * 2) / numAxes;

    const averages = domainNames.map(name => {
        let total = 0, count = 0;
        history.forEach(record => {
            if (record.data?.domains) {
                const d = record.data.domains.find((d: any) => d.name === name);
                if (d) {
                    total += d.metrics.reduce((s: number, m: any) => s + (m.score || 0), 0) / d.metrics.length;
                    count++;
                }
            }
        });
        return count > 0 ? total / count : 0;
    });

    // Grid rings
    ctx.strokeStyle = '#e2e8f0';
    for (let i = 1; i <= 5; i++) {
        const r = (radius * i) / 5;
        ctx.beginPath();
        for (let j = 0; j < numAxes; j++) {
            const angle = j * angleStep - Math.PI / 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    // Axis lines
    ctx.strokeStyle = '#cbd5e1';
    for (let j = 0; j < numAxes; j++) {
        const angle = j * angleStep - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
        ctx.stroke();
    }

    // Data polygon
    ctx.beginPath();
    averages.forEach((value, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r     = (value / 5) * radius;
        if (i === 0) ctx.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        else         ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    });
    ctx.closePath();
    ctx.fillStyle   = 'rgba(16,185,129,0.25)';
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth   = 3;
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#1e2937';
    ctx.font      = 'bold 12px Arial';
    ctx.textAlign = 'center';
    domainNames.forEach((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        ctx.fillText(shortLabels[i], cx + Math.cos(angle) * (radius + 38), cy + Math.sin(angle) * (radius + 38) + 5);
    });

    return canvas.toDataURL('image/png');
}

// ── Default domains ───────────────────────────────────────────────────────────

const DEFAULT_DOMAINS: Domain[] = [
    {
        name: 'Leadership Effectiveness',
        metrics: [
            { name: 'Clarity of vision and communication', help: 'Leaders clearly articulate direction and expectations', score: null },
            { name: 'Trust and approachability', help: 'Staff feel safe bringing concerns to leadership', score: null },
            { name: 'Decision-making transparency', help: 'Decisions are explained and staff feel heard', score: null }
        ]
    },
    {
        name: 'Staff Morale & Retention',
        metrics: [
            { name: 'Overall staff satisfaction', help: 'Staff enjoy coming to work and feel valued', score: null },
            { name: 'Intention to stay next year', help: 'Staff plan to return next school year', score: null },
            { name: 'Work-life balance', help: 'Staff feel supported and not burned out', score: null }
        ]
    },
    {
        name: 'Professional Development',
        metrics: [
            { name: 'Growth opportunities', help: 'Staff have access to meaningful training', score: null },
            { name: 'Mentorship and coaching', help: 'New and veteran teachers receive support', score: null },
            { name: 'Feedback culture', help: 'Constructive feedback is given regularly', score: null }
        ]
    },
    {
        name: 'Spiritual Culture',
        metrics: [
            { name: 'Faith integration in daily life', help: 'Staff experience spiritual formation at work', score: null },
            { name: 'Prayer and worship culture', help: 'Prayer is regular and meaningful', score: null },
            { name: 'Biblical worldview among staff', help: 'Staff model Christ-like character', score: null }
        ]
    }
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function StaffLeadership() {
    const { user } = useUser();
    const radarRef = useRef<HTMLCanvasElement>(null);
    const barRef   = useRef<HTMLCanvasElement>(null);

    const [domains, setDomains]       = useState<Domain[]>(DEFAULT_DOMAINS);
    const [schoolName, setSchoolName] = useState('Trinity Lutheran School');
    const [reviewDate, setReviewDate] = useState(new Date().toISOString().slice(0, 10));
    const [history, setHistory]       = useState<any[]>([]);
    const [showModal, setShowModal]   = useState(false);
    const [surveyLink, setSurveyLink] = useState('');
    const [copied, setCopied]         = useState(false);

    // ── Derived ───────────────────────────────────────────────────────────────

    const overallAverage = history.length > 0
        ? history.reduce((sum, item) => sum + (itemOverallAvg(item) ?? 0), 0) / history.length
        : 0;

    // ── Data ──────────────────────────────────────────────────────────────────

    const loadHistory = async () => {
        const { data } = await supabase
            .from('assessments')
            .select('*')
            .eq('tool', 'staff-leadership')
            .order('review_date', { ascending: false });
        setHistory(data || []);
    };

    const saveAssessment = async () => {
        if (!user) return alert('Please sign in to save');
        const overall = domains.reduce((sum, d) => sum + domainAvg(d), 0) / domains.length;
        const { error } = await supabase.from('assessments').insert({
            user_id: user.id,
            tool: 'staff-leadership',
            review_date: reviewDate,
            overall_score: Math.round(overall * 100) / 100,
            data: { domains, schoolName }
        });
        if (error) alert('Save failed: ' + error.message);
        else { alert('✅ Assessment saved!'); loadHistory(); }
    };

    // ── Survey ────────────────────────────────────────────────────────────────

    const launchAnonymousSurvey = () => {
        const surveyId = 'survey-' + Math.random().toString(36).substring(2, 12);
        setSurveyLink(`${window.location.origin}/staff-survey/${surveyId}`);
        setShowModal(true);
        setCopied(false);
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(surveyLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Charts (live on page) ─────────────────────────────────────────────────

    const drawRadarChart = () => {
        const canvas = radarRef.current;
        if (!canvas || history.length === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width  = 800 * dpr;
        canvas.height = 400 * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, 800, 400);

        const cx = 400, cy = 200, radius = 140;
        const domainNames = DEFAULT_DOMAINS.map(d => d.name);
        const shortLabels = ['Leadership', 'Morale', 'Development', 'Spiritual'];
        const numAxes     = domainNames.length;
        const angleStep   = (Math.PI * 2) / numAxes;

        const averages = domainNames.map(name => {
            let total = 0, count = 0;
            history.forEach(record => {
                if (record.data?.domains) {
                    const d = record.data.domains.find((d: any) => d.name === name);
                    if (d) { total += d.metrics.reduce((s: number, m: any) => s + (m.score || 0), 0) / d.metrics.length; count++; }
                }
            });
            return count > 0 ? total / count : 0;
        });

        ctx.strokeStyle = '#e2e8f0';
        for (let i = 1; i <= 5; i++) {
            const r = (radius * i) / 5;
            ctx.beginPath();
            for (let j = 0; j < numAxes; j++) {
                const angle = j * angleStep - Math.PI / 2;
                if (j === 0) ctx.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
                else         ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
            }
            ctx.closePath();
            ctx.stroke();
        }

        ctx.strokeStyle = '#cbd5e1';
        for (let j = 0; j < numAxes; j++) {
            const angle = j * angleStep - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
            ctx.stroke();
        }

        ctx.beginPath();
        averages.forEach((value, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const r     = (value / 5) * radius;
            if (i === 0) ctx.moveTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
            else         ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        });
        ctx.closePath();
        ctx.fillStyle   = 'rgba(16,185,129,0.25)';
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth   = 4;
        ctx.stroke();

        ctx.fillStyle = '#1e2937';
        ctx.font      = 'bold 13px Arial';
        ctx.textAlign = 'center';
        domainNames.forEach((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            ctx.fillText(shortLabels[i], cx + Math.cos(angle) * (radius + 45), cy + Math.sin(angle) * (radius + 45) + 5);
        });
    };

    const drawBarChart = () => {
        const canvas = barRef.current;
        if (!canvas || history.length === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width  = 800 * dpr;
        canvas.height = 400 * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, 800, 400);

        const domainNames = DEFAULT_DOMAINS.map(d => d.name);
        const shortNames  = ['Leadership', 'Morale', 'Development', 'Spiritual'];

        const averages = domainNames.map(name => {
            let total = 0, count = 0;
            history.forEach(record => {
                if (record.data?.domains) {
                    const d = record.data.domains.find((d: any) => d.name === name);
                    if (d) { total += d.metrics.reduce((s: number, m: any) => s + (m.score || 0), 0) / d.metrics.length; count++; }
                }
            });
            return count > 0 ? total / count : 0;
        });

        const barWidth = 120, spacing = 40, startX = 80;
        averages.forEach((value, i) => {
            const height = (value / 5) * 280;
            const x      = startX + i * (barWidth + spacing);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(x, 320 - height, barWidth, height);
            ctx.fillStyle   = '#1e2937';
            ctx.font        = 'bold 14px Arial';
            ctx.textAlign   = 'center';
            ctx.fillText(value.toFixed(1), x + barWidth / 2, 310 - height);
            ctx.font = '13px Arial';
            ctx.fillText(shortNames[i], x + barWidth / 2, 350);
            ctx.textAlign = 'left';
        });
    };

    // ── PDF ───────────────────────────────────────────────────────────────────

    const downloadFullPDF = async () => {
        const html2pdf = (await import('html2pdf.js')).default;

        const barImg   = buildBarChartDataUrl(history);
        const radarImg = buildRadarChartDataUrl(history);

        const element = document.createElement('div');
        element.style.cssText = 'padding:40px; font-family:Arial,sans-serif; max-width:800px; margin:0 auto;';
        element.innerHTML = `
            <h1 style="text-align:center; color:#166534; margin-bottom:6px;">Staff & Leadership Health Report</h1>
            <p style="text-align:center; color:#64748b; margin-bottom:4px;">Generated on ${new Date().toLocaleDateString()}</p>
            <p style="text-align:center; color:#64748b; margin-bottom:30px;">${schoolName}</p>

            <div style="text-align:center; background:#f0fdf4; border-radius:12px; padding:24px; margin-bottom:36px;">
                <p style="color:#166534; font-size:14px; margin:0 0 6px;">Overall Average Score from ${history.length} survey${history.length !== 1 ? 's' : ''}</p>
                <p style="color:#10b981; font-size:48px; font-weight:700; margin:0;">${overallAverage.toFixed(1)} <span style="font-size:24px; color:#64748b;">/ 5</span></p>
            </div>

            <h3 style="margin:0 0 12px; color:#1e2937;">Domain Averages (Bar Chart)</h3>
            <img src="${barImg}" style="width:100%; border-radius:8px; margin-bottom:36px;" />

            <h3 style="margin:0 0 12px; color:#1e2937;">Domain Balance (Radar Chart)</h3>
            <img src="${radarImg}" style="width:80%; display:block; margin:0 auto 36px;" />

            <h3 style="margin:0 0 12px; color:#1e2937;">All Survey Responses</h3>
            <table style="width:100%; border-collapse:collapse; margin-bottom:36px; font-size:14px;">
                <tr style="background:#f1f5f9;">
                    <th style="padding:10px 12px; border:1px solid #cbd5e1; text-align:left;">Date</th>
                    <th style="padding:10px 12px; border:1px solid #cbd5e1; text-align:right;">Overall Score</th>
                    <th style="padding:10px 12px; border:1px solid #cbd5e1; text-align:left;">Type</th>
                </tr>
                ${history.map(item => {
                    const avg  = itemOverallAvg(item);
                    const type = item.data?.survey_id ? 'Anonymous Survey' : 'Self Assessment';
                    return `
                        <tr>
                            <td style="padding:10px 12px; border:1px solid #e2e8f0;">${item.review_date}</td>
                            <td style="padding:10px 12px; border:1px solid #e2e8f0; text-align:right; font-weight:600; color:#166534;">${avg ? avg.toFixed(1) : '—'}</td>
                            <td style="padding:10px 12px; border:1px solid #e2e8f0; color:#64748b;">${type}</td>
                        </tr>
                    `;
                }).join('')}
            </table>

            <h3 style="margin:0 0 12px; color:#1e2937;">Recommended Strategies</h3>
            <ul style="line-height:1.9; font-size:14px; color:#374151;">
                <li>Conduct 1:1 check-ins with staff showing low morale scores</li>
                <li>Improve leadership communication transparency and decision-making visibility</li>
                <li>Review workload expectations and support work-life balance</li>
                <li>Hold regular all-staff town halls and feedback sessions</li>
                <li>Invest in professional development and mentorship pathways</li>
                <li>Strengthen spiritual culture through intentional prayer and mission clarity</li>
            </ul>

            <p style="margin-top:40px; font-size:12px; color:#94a3b8; text-align:center;">
                Generated by School Health Score • ${new Date().toLocaleDateString()}
            </p>
        `;

        html2pdf().set({
            margin: 15,
            filename: `staff-leadership-report-${new Date().toISOString().slice(0, 10)}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        }).from(element).save();
    };

    // ── Effects ───────────────────────────────────────────────────────────────

    useEffect(() => {
        if (user) {
            loadHistory();
            const interval = setInterval(loadHistory, 15000);
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        drawRadarChart();
        drawBarChart();
    }, [history]);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-slate-50">

            {/* Nav */}
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

                {/* Survey launch banner */}
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

                {/* Action buttons */}
                <div className="flex justify-end gap-4 mb-12">
                    <button onClick={() => setDomains(DEFAULT_DOMAINS)} className="px-8 py-4 bg-gray-200 hover:bg-gray-300 rounded-3xl font-medium">Reset</button>
                    <button onClick={downloadFullPDF} className="px-8 py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-3xl font-medium">Download Full PDF Report</button>
                </div>

                {/* Feedback panel */}
                <div className="bg-white rounded-3xl shadow-sm border p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold">All Feedback Received</h2>
                        <button onClick={loadHistory} className="text-sm bg-slate-100 hover:bg-slate-200 px-5 py-2 rounded-2xl font-medium">Refresh</button>
                    </div>

                    {history.length > 0 && (
                        <div className="mb-8 p-6 bg-emerald-50 rounded-3xl text-center">
                            <p className="text-sm text-emerald-700 font-medium">Overall Average from {history.length} Survey{history.length !== 1 ? 's' : ''}</p>
                            <div className="text-6xl font-bold text-emerald-700 mt-2">{overallAverage.toFixed(1)}</div>
                            <p className="text-sm text-emerald-600 mt-1">out of 5.0</p>
                        </div>
                    )}

                    <div className="space-y-3 max-h-96 overflow-auto mb-12">
                        {history.length === 0 ? (
                            <p className="text-slate-500 text-center py-12">No feedback yet. Share your survey link to get started.</p>
                        ) : (
                            history.map(item => {
                                const avg = itemOverallAvg(item);
                                return (
                                    <div key={item.id} className="flex justify-between items-center p-5 border rounded-2xl hover:bg-slate-50">
                                        <div>
                                            <strong>{item.review_date}</strong>
                                            {item.data?.survey_id
                                                ? <span className="ml-3 text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-3xl">Anonymous Survey</span>
                                                : <span className="ml-3 text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-3xl">Self Assessment</span>
                                            }
                                        </div>
                                        <div className="text-emerald-700 font-semibold">
                                            {avg ? avg.toFixed(1) : '—'} / 5
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="mb-12">
                        <h3 className="font-medium mb-4">Average Scores Across All Surveys (Radar)</h3>
                        <canvas ref={radarRef} width={800} height={400} className="w-full border border-slate-200 rounded-3xl" />
                    </div>

                    <div>
                        <h3 className="font-medium mb-4">Domain Averages (Bar Chart)</h3>
                        <canvas ref={barRef} width={800} height={400} className="w-full border border-slate-200 rounded-3xl" />
                    </div>
                </div>
            </div>

            {/* Survey modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 p-8">
                        <h3 className="text-2xl font-semibold mb-2">Your Anonymous Survey Link</h3>
                        <p className="text-slate-600 mb-6">Share this link with your staff. Responses are completely anonymous.</p>
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
