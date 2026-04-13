'use client';
// @ts-nocheck

import { useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '../lib/supabase';
import { UserButton } from '@clerk/nextjs';

export default function HealthCalculator() {
    const { user } = useUser();

    // ==================== STATE ====================
    const [domains, setDomains] = useState([
        {
            name: 'Enrollment & Retention',
            weight: 1.2,
            metrics: [
                { name: 'Enrollment trend', help: 'Are admissions stable or growing?', score: 3 },
                { name: 'Student retention', help: 'Do families stay year to year?', score: 3 },
                { name: 'Inquiry-to-enrollment pipeline', help: 'Is recruitment converting?', score: 3 }
            ]
        },
        {
            name: 'Academic Program',
            weight: 1.2,
            metrics: [
                { name: 'Curriculum alignment', help: 'Clear, consistent academic expectations', score: 3 },
                { name: 'Instructional quality', help: 'Classroom teaching strength', score: 3 },
                { name: 'Student support systems', help: 'Interventions and support are functioning', score: 3 }
            ]
        },
        {
            name: 'Culture & Mission',
            weight: 1.1,
            metrics: [
                { name: 'Mission clarity', help: 'Mission is visible and understood', score: 3 },
                { name: 'Student / family culture', help: 'The community is healthy and engaged', score: 3 },
                { name: 'Spiritual identity / values', help: 'Faith and identity are integrated well', score: 3 }
            ]
        },
        {
            name: 'Finance & Operations',
            weight: 1.25,
            metrics: [
                { name: 'Budget stability', help: 'Budget is sustainable and monitored', score: 3 },
                { name: 'Facilities / deferred maintenance', help: 'Buildings are cared for', score: 3 },
                { name: 'Operational systems', help: 'Processes are documented and dependable', score: 3 }
            ]
        },
        {
            name: 'Leadership & Staffing',
            weight: 1.15,
            metrics: [
                { name: 'Leadership effectiveness', help: 'Leadership is clear and trusted', score: 3 },
                { name: 'Staff morale / retention', help: 'People want to stay and contribute', score: 3 },
                { name: 'Professional development', help: 'Staff growth is intentional', score: 3 }
            ]
        },
        {
            name: 'Marketing & Community Presence',
            weight: 1.0,
            metrics: [
                { name: 'Brand clarity', help: 'The school story is clear', score: 3 },
                { name: 'Website / digital presence', help: 'The website and digital communication are useful', score: 3 },
                { name: 'Community engagement', help: 'The school is visible and connected', score: 3 }
            ]
        }
    ]);

    const [schoolName, setSchoolName] = useState('Trinity Lutheran School');
    const [reviewDate, setReviewDate] = useState('');
    const [reviewer, setReviewer] = useState('School Leadership Team');
    const [schoolType, setSchoolType] = useState('PK-8');
    const [notes, setNotes] = useState('');

    const [history, setHistory] = useState([]);
    const [comparisonData, setComparisonData] = useState([]);
    const [toast, setToast] = useState(null);

    const barChartRef = useRef(null);
    const radarChartRef = useRef(null);

    // ==================== HELPERS ====================
    const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length || 0;

    const scoreLabel = (score) => {
        if (score >= 4.5) return 'Excellent';
        if (score >= 3.75) return 'Strong';
        if (score >= 3) return 'Stable';
        if (score >= 2) return 'At Risk';
        return 'Critical';
    };

    const bandClass = (score) => {
        if (score >= 4.5) return 'band-excellent';
        if (score >= 3.75) return 'band-strong';
        if (score >= 3) return 'band-stable';
        if (score >= 2) return 'band-risk';
        return 'band-critical';
    };

    const recommendationForDomain = (name) => {
        if (name.includes('Enrollment')) return 'Tighten admissions follow-up, retention conversations, family re-enrollment strategy, and visit-to-application conversion.';
        if (name.includes('Academic')) return 'Review curriculum alignment, classroom support, assessment use, and intervention consistency.';
        if (name.includes('Culture')) return 'Clarify mission, strengthen culture habits, and improve family and student connection points.';
        if (name.includes('Finance')) return 'Audit budget pressure points, maintenance backlog, operational bottlenecks, and cash-flow visibility.';
        if (name.includes('Leadership')) return 'Address staff morale, role clarity, accountability, coaching rhythms, and development pathways.';
        if (name.includes('Marketing')) return 'Improve website clarity, school storytelling, inquiry response, and community-facing communication.';
        return 'Review leadership assumptions and build a concrete 90-day improvement plan.';
    };

    // ==================== CALCULATIONS ====================
    const calculateResults = () => {
        return domains.map(domain => {
            const avg = average(domain.metrics.map(m => m.score || 0));
            const weighted = avg * (domain.weight || 1);
            return {
                name: domain.name,
                avg: Math.round(avg * 100) / 100,
                weighted: Math.round(weighted * 100) / 100,
                risk: scoreLabel(avg),
                weight: domain.weight
            };
        });
    };

    const results = calculateResults();
    const overallScore = (() => {
        const weightTotal = results.reduce((sum, r) => sum + (r.weight || 1), 0) || 1;
        const overall = results.reduce((sum, r) => sum + r.weighted, 0) / weightTotal;
        return Math.round(overall * 100) / 100;
    })();

    const strongest = [...results].sort((a, b) => b.avg - a.avg)[0];
    const weakest = [...results].sort((a, b) => a.avg - b.avg)[0];

    // ==================== SUPABASE ====================
    const loadHistory = async () => {
        if (!user?.id) return;
        const { data } = await supabase
            .from('assessments')
            .select('*')
            .eq('tool', 'school-health')
            .order('review_date', { ascending: false });
        setHistory(data || []);
        setComparisonData(data || []);
        window.comparisonData = data || [];
    };

    const saveAssessment = async () => {
        if (!user?.id) return showToast('Please sign in to save', 'error');

        const assessmentData = {
            schoolName,
            schoolType,
            reviewDate,
            reviewer,
            notes,
            domains: domains.map(d => ({
                name: d.name,
                weight: d.weight,
                metrics: d.metrics.map(m => ({ name: m.name, help: m.help, score: m.score }))
            })),
            results,
            overallScore
        };

        const { error } = await supabase.from('assessments').insert({
            user_id: user.id,
            tool: 'school-health',
            review_date: reviewDate || new Date().toISOString().split('T')[0],
            overall_score: overallScore,
            data: assessmentData
        });

        if (error) {
            showToast('Save failed: ' + error.message, 'error');
        } else {
            showToast('✅ Assessment saved successfully!');
            loadHistory();
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ==================== DOMAIN UPDATES ====================
    const updateMetric = (dIndex, mIndex, score) => {
        setDomains(prev => prev.map((domain, di) =>
            di === dIndex ? {
                ...domain,
                metrics: domain.metrics.map((metric, mi) => mi === mIndex ? { ...metric, score } : metric)
            } : domain
        ));
    };

    const updateWeight = (dIndex, weight) => {
        setDomains(prev => prev.map((domain, i) =>
            i === dIndex ? { ...domain, weight: parseFloat(weight) || 1 } : domain
        ));
    };

    // ==================== PRIORITY ACTIONS ====================
    const renderPriorityActions = () => {
        const weakestThree = [...results].sort((a, b) => a.avg - b.avg).slice(0, 3);
        return weakestThree.map(item => (
            <li key={item.name}>
                <strong>{item.name}</strong>: {recommendationForDomain(item.name)}
            </li>
        ));
    };

    // ==================== IMPROVEMENT PLAN ====================
    const renderImprovementPlan = () => {
        const weakestThree = [...results].sort((a, b) => a.avg - b.avg).slice(0, 3);
        const windows = ['30 Days', '60 Days', '90 Days'];

        return weakestThree.map((item, index) => {
            const actions = [
                `Identify the root cause in ${item.name.toLowerCase()} and assign a clear owner.`,
                `Take immediate action: ${recommendationForDomain(item.name)}`,
                `Review progress at the end of the period and adjust the plan as needed.`
            ];

            return (
                <div key={index} className="plan-card">
                    <h3>{windows[index]}</h3>
                    <p><strong>Focus Area:</strong> ${item.name}</p>
                    <p><span className={`band ${bandClass(item.avg)}`}>{item.risk} (${item.avg.toFixed(2)})</span></p>
                    <ol>
                        {actions.map((action, i) => <li key={i}>{action}</li>)}
                    </ol>
                </div>
            );
        });
    };

    // ==================== FIXED PDF DOWNLOAD ====================
    const downloadReport = async () => {
        const html2pdf = (await import('html2pdf.js')).default;

        const weakestThree = [...results].sort((a, b) => a.avg - b.avg).slice(0, 3);

        const priorityHtml = weakestThree.map(item =>
            `<li><strong>${item.name}</strong>: ${recommendationForDomain(item.name)}</li>`
        ).join('');

        const windows = ['30 Days', '60 Days', '90 Days'];
        const planHtml = weakestThree.map((item, index) => {
            const actions = [
                `Identify the root cause in ${item.name.toLowerCase()} and assign a clear owner.`,
                `Take immediate action: ${recommendationForDomain(item.name)}`,
                `Review progress at the end of the period and adjust the plan as needed.`
            ];

            return `
                <div style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h3 style="color: #166534;">${windows[index]}</h3>
                    <p><strong>Focus Area:</strong> ${item.name}</p>
                    <p><span style="padding: 6px 14px; border-radius: 999px; background: #dcfce7; color: #166534; font-weight: 700;">
                        ${item.risk} (${item.avg.toFixed(2)})
                    </span></p>
                    <ol>
                        ${actions.map(action => `<li>${action}</li>`).join('')}
                    </ol>
                </div>
            `;
        }).join('');

        const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>School Health Report</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 40px; line-height: 1.6; color: #1f2937; }
        h1, h2 { color: #166534; }
        .band { padding: 6px 14px; border-radius: 999px; font-weight: 700; background: #dcfce7; color: #166534; }
        ul, ol { margin: 10px 0 20px 25px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <h1>School Health Report</h1>
    <p><strong>School:</strong> ${schoolName}</p>
    <p><strong>Review Date:</strong> ${reviewDate || 'Not specified'}</p>
    <p><strong>Overall Score:</strong> ${overallScore.toFixed(2)} — ${scoreLabel(overallScore)}</p>

    <h2>Priority Actions</h2>
    <ul>${priorityHtml}</ul>

    <h2>30 / 60 / 90 Day Improvement Plan</h2>
    ${planHtml}

    <p style="margin-top: 50px; font-size: 12px; color: #666; text-align: center;">
        Generated by School Health Calculator • ${new Date().toLocaleDateString()}
    </p>
</body>
</html>`;

        const opt = {
            margin: 15,
            filename: `school-health-report-${reviewDate || 'current'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(reportHtml).save();
    };

    // ==================== CHARTS (your original) ====================
    const drawBarChart = () => {
        const canvas = barChartRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const datasets = (window.comparisonData && window.comparisonData.length > 0)
            ? window.comparisonData
            : [{ review_date: 'Current', data: { results } }];

        const padding = { top: 40, right: 40, bottom: 140, left: 60 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;
        const colors = ['#166534', '#2563eb', '#9333ea', '#ca8a04'];

        ctx.strokeStyle = '#e2e8f0';
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (chartH / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(w - padding.right, y);
            ctx.stroke();
            ctx.fillStyle = '#64748b';
            ctx.font = '12px Arial';
            ctx.fillText((5 - i).toString(), 25, y + 4);
        }

        const barGroupWidth = chartW / datasets[0].data.results.length;
        const barWidth = Math.max(22, barGroupWidth / (datasets.length + 1));

        datasets.forEach((yearData, yearIndex) => {
            const res = yearData.data?.results || yearData.results || [];
            res.forEach((result, domainIndex) => {
                const x = padding.left + domainIndex * barGroupWidth + (yearIndex * barWidth);
                const barHeight = (result.avg / 5) * chartH;
                const y = padding.top + chartH - barHeight;

                ctx.fillStyle = colors[yearIndex % colors.length];
                ctx.fillRect(x, y, barWidth, barHeight);

                ctx.fillStyle = '#1e2937';
                ctx.font = '11px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(result.avg.toFixed(1), x + barWidth / 2, y - 6);
            });
        });

        ctx.fillStyle = '#1e2937';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        datasets[0].data.results.forEach((result, i) => {
            const x = padding.left + i * barGroupWidth + (barGroupWidth / 2);
            ctx.save();
            ctx.translate(x, h - 35);
            ctx.rotate(-0.65);
            ctx.fillText(result.name, 0, 0);
            ctx.restore();
        });
    };

    const drawRadarChart = () => {
        const canvas = radarChartRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2 + 20;
        const radius = Math.min(w, h) * 0.34;

        const datasets = (window.comparisonData && window.comparisonData.length > 0)
            ? window.comparisonData
            : [{ review_date: 'Current', data: { results } }];

        const colors = ['#166534', '#2563eb', '#9333ea', '#ca8a04'];

        ctx.strokeStyle = '#e2e8f0';
        for (let level = 1; level <= 5; level++) {
            const r = radius * (level / 5);
            ctx.beginPath();
            datasets[0].data.results.forEach((_, i) => {
                const angle = (-Math.PI / 2) + (Math.PI * 2 * i / datasets[0].data.results.length);
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.stroke();
        }

        datasets.forEach((yearData, i) => {
            const res = yearData.data?.results || yearData.results || [];
            ctx.beginPath();
            res.forEach((result, j) => {
                const angle = (-Math.PI / 2) + (Math.PI * 2 * j / res.length);
                const r = radius * (result.avg / 5);
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.strokeStyle = colors[i % colors.length];
            ctx.lineWidth = 3.5;
            ctx.stroke();
            ctx.fillStyle = colors[i % colors.length] + '25';
            ctx.fill();
        });

        ctx.fillStyle = '#1e2937';
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        datasets[0].data.results.forEach((result, i) => {
            const angle = (-Math.PI / 2) + (Math.PI * 2 * i / datasets[0].data.results.length);
            const x = cx + Math.cos(angle) * (radius + 45);
            const y = cy + Math.sin(angle) * (radius + 45);
            ctx.fillText(result.name, x, y);
        });
    };

    // ==================== EFFECTS ====================
    useEffect(() => {
        if (user) loadHistory();
        setReviewDate(new Date().toISOString().split('T')[0]);
    }, [user]);

    useEffect(() => {
        drawBarChart();
        drawRadarChart();
    }, [domains, comparisonData]);

    // ==================== RENDER ====================
    return (
        <div className="wrap">
            <section className="hero">
                <div className="no-print">
                    <h1>School Health Calculator</h1>
                    <p>A strategic platform for Christian school leaders to assess overall school health, track year-over-year progress, and generate board-ready reports.</p>
                </div>
                <div className="controls no-print">
                    <button onClick={downloadReport}>Download Report</button>
                    <button onClick={saveAssessment} style={{ background: '#166534', color: 'white', fontWeight: '700', padding: '12px 24px' }}>
                        💾 Save Assessment
                    </button>
                </div>
            </section>

            <div className="grid">
                <aside className="section-stack">
                    <section className="card">
                        <h2>School Information</h2>
                        <div className="field">
                            <label>School Name</label>
                            <input value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="Example Lutheran School" />
                        </div>
                        <div className="inline-2">
                            <div className="field">
                                <label>Review Date</label>
                                <input type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)} />
                            </div>
                            <div className="field">
                                <label>Reviewer</label>
                                <input value={reviewer} onChange={e => setReviewer(e.target.value)} placeholder="Principal or leadership team" />
                            </div>
                        </div>
                        <div className="field">
                            <label>School Type</label>
                            <select value={schoolType} onChange={e => setSchoolType(e.target.value)}>
                                <option>PK-8</option>
                                <option>High School</option>
                                <option>Early Childhood</option>
                                <option>K-12</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </section>

                    {/* Scoring Guide */}
                    <section className="card">
                        <h2>Scoring Guide – What Each Score Really Means</h2>
                        <table>
                            <thead>
                                <tr><th>Score</th><th>Label</th><th>Meaning</th></tr>
                            </thead>
                            <tbody>
                                <tr><td><strong>5</strong></td><td>Excellent / Healthy</td><td>Fully thriving, mission-aligned, sustainable excellence</td></tr>
                                <tr><td><strong>4</strong></td><td>Strong</td><td>Solid and reliable with only minor gaps</td></tr>
                                <tr><td><strong>3</strong></td><td>Adequate / Functional</td><td>Meets basic expectations but not thriving</td></tr>
                                <tr><td><strong>2</strong></td><td>Weak / Inconsistent</td><td>Noticeable problems causing concern</td></tr>
                                <tr><td><strong>1</strong></td><td>Critical Concern</td><td>Major breakdown requiring immediate intervention</td></tr>
                            </tbody>
                        </table>

                        <p className="small" style={{ marginTop: '16px', marginBottom: '12px' }}>
                            Detailed rubric with biblical anchors for each domain:
                        </p>

                        <div className="domain" style={{ marginBottom: '12px' }}>
                            <details open>
                                <summary><strong>Enrollment & Retention</strong></summary>
                                <ul className="small" style={{ margin: '8px 0 0 20px', padding: '0' }}>
                                    <li><strong>5</strong> – Strong growth, 95%+ retention, families invite others </li>
                                    <li><strong>4</strong> – Stable growth, 90–94% retention </li>
                                    <li><strong>3</strong> – Flat enrollment, 85–89% retention </li>
                                    <li><strong>2</strong> – Declining enrollment, visible anxiety </li>
                                    <li><strong>1</strong> – Sharp decline, high attrition </li>
                                </ul>
                            </details>
                        </div>

                        <div className="domain" style={{ marginBottom: '12px' }}>
                            <details>
                                <summary><strong>Academic Program</strong></summary>
                                <ul className="small" style={{ margin: '8px 0 0 20px', padding: '0' }}>
                                    <li><strong>5</strong> – Christ-centered, rigorous, students thriving </li>
                                    <li><strong>4</strong> – Strong academics with consistent integration </li>
                                    <li><strong>3</strong> – Adequate academics, uneven integration </li>
                                    <li><strong>2</strong> – Noticeable gaps, worldview feels added-on </li>
                                    <li><strong>1</strong> – Significant struggles </li>
                                </ul>
                            </details>
                        </div>

                        <div className="domain" style={{ marginBottom: '12px' }}>
                            <details>
                                <summary><strong>Culture & Mission</strong></summary>
                                <ul className="small" style={{ margin: '8px 0 0 20px', padding: '0' }}>
                                    <li><strong>5</strong> – Mission alive, deep belonging </li>
                                    <li><strong>4</strong> – Mission understood and mostly lived out </li>
                                    <li><strong>3</strong> – Mission known but not deeply felt </li>
                                    <li><strong>2</strong> – Mission drift or tension </li>
                                    <li><strong>1</strong> – Toxic or divided culture </li>
                                </ul>
                            </details>
                        </div>

                        <div className="domain" style={{ marginBottom: '12px' }}>
                            <details>
                                <summary><strong>Finance & Operations</strong></summary>
                                <ul className="small" style={{ margin: '8px 0 0 20px', padding: '0' }}>
                                    <li><strong>5</strong> – Healthy budget, strong reserves </li>
                                    <li><strong>4</strong> – Balanced budget, reliable operations </li>
                                    <li><strong>3</strong> – Tight but manageable </li>
                                    <li><strong>2</strong> – Frequent stress, deferred maintenance </li>
                                    <li><strong>1</strong> – Financial instability </li>
                                </ul>
                            </details>
                        </div>

                        <div className="domain" style={{ marginBottom: '12px' }}>
                            <details>
                                <summary><strong>Leadership & Staffing</strong></summary>
                                <ul className="small" style={{ margin: '8px 0 0 20px', padding: '0' }}>
                                    <li><strong>5</strong> – Trusted, unified, staff feel valued </li>
                                    <li><strong>4</strong> – Strong leadership and good morale </li>
                                    <li><strong>3</strong> – Adequate but some fatigue </li>
                                    <li><strong>2</strong> – Trust issues or high turnover </li>
                                    <li><strong>1</strong> – Leadership vacuum or conflict </li>
                                </ul>
                            </details>
                        </div>

                        <div className="domain">
                            <details>
                                <summary><strong>Marketing & Community Presence</strong></summary>
                                <ul className="small" style={{ margin: '8px 0 0 20px', padding: '0' }}>
                                    <li><strong>5</strong> – Compelling story, strong visibility </li>
                                    <li><strong>4</strong> – Clear brand and good awareness </li>
                                    <li><strong>3</strong> – Basic presence <em>(Matthew 5:15)</em></li>
                                    <li><strong>2</strong> – Outdated or unclear messaging </li>
                                    <li><strong>1</strong> – Almost no presence or negative perception </li>
                                </ul>
                            </details>
                        </div>
                    </section>

                    <section className="card">
                        <h2>Notes</h2>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={8} placeholder="Add key findings, assumptions, concerns, and next steps." />
                    </section>
                </aside>

                <main className="section-stack">
                    <section className="card">
                        <h2>Overall Summary</h2>
                        <div className="summary-grid">
                            <div className="stat"><div className="label">Overall Health Score</div><div className="value">{overallScore.toFixed(2)}</div></div>
                            <div className="stat"><div className="label">Health Rating</div><div className="value">{scoreLabel(overallScore)}</div></div>
                            <div className="stat"><div className="label">Strongest Domain</div><div className="value">{strongest?.name || '—'}</div></div>
                            <div className="stat"><div className="label">Biggest Risk Area</div><div className="value">{weakest?.name || '—'}</div></div>
                        </div>
                    </section>

                    <section className="card">
                        <h2>Domain Scoring</h2>
                        {domains.map((domain, dIndex) => (
                            <div key={dIndex} className="domain">
                                <div className="domain-header">
                                    <div>
                                        <h3>{domain.name}</h3>
                                        <div className="small">Score the current health of this area.</div>
                                    </div>
                                    <span className={`band ${bandClass(average(domain.metrics.map(m => m.score)))}`}>
                                        Average: {average(domain.metrics.map(m => m.score)).toFixed(2)}
                                    </span>
                                </div>
                                <div className="domain-weight-row">
                                    <label>Domain Weight</label>
                                    <input
                                        type="number"
                                        min="0.5"
                                        max="2"
                                        step="0.05"
                                        value={domain.weight}
                                        onChange={e => updateWeight(dIndex, e.target.value)}
                                    />
                                </div>
                                {domain.metrics.map((metric, mIndex) => (
                                    <div key={mIndex} className="score-row">
                                        <div>
                                            <div className="metric-name">{metric.name}</div>
                                            <div className="metric-help">{metric.help}</div>
                                        </div>
                                        <select
                                            value={metric.score}
                                            onChange={e => updateMetric(dIndex, mIndex, Number(e.target.value))}
                                            className="metric-score"
                                        >
                                            {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </section>

                    {/* Chart Legend */}
                    {comparisonData.length > 0 && (
                        <div style={{
                            marginBottom: '20px',
                            padding: '12px 20px',
                            background: '#f8fafc',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '20px',
                            alignItems: 'center',
                            fontSize: '0.95rem'
                        }}>
                            <span style={{ fontWeight: 600, marginRight: '8px' }}>Legend:</span>
                            {comparisonData.map((item, index) => {
                                const colors = ['#166534', '#2563eb', '#9333ea', '#ca8a04'];
                                return (
                                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '16px', height: '16px', backgroundColor: colors[index % colors.length], borderRadius: '4px' }}></div>
                                        <span>{item.review_date || `Report ${index + 1}`}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <section className="card">
                        <h2>Health Visualization</h2>
                        <canvas ref={barChartRef} width="960" height="340" />
                    </section>

                    <section className="card">
                        <h2>Radar View</h2>
                        <canvas ref={radarChartRef} width="960" height="420" />
                    </section>

                    {/* Priority Actions */}
                    <section className="card">
                        <h2>Priority Actions</h2>
                        <div className="report-box">
                            <ul>{renderPriorityActions()}</ul>
                        </div>
                    </section>

                    {/* Improvement Plan */}
                    <section className="card">
                        <h2>30 / 60 / 90 Day Improvement Plan</h2>
                        <div className="improvement-grid">
                            {renderImprovementPlan()}
                        </div>
                        <div className="footer-note">These suggested 30/60/90-day actions are auto-generated from the weakest domains.</div>
                    </section>

                    {/* History */}
                    <div className="card" style={{ marginTop: '30px' }}>
                        <h2>📅 Year-over-Year History</h2>
                        <button onClick={loadHistory} className="secondary" style={{ marginBottom: '12px' }}>Refresh History</button>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {history.length === 0 ? (
                                <p className="small">No assessments saved yet. Click "Save Assessment" above to start tracking year-over-year.</p>
                            ) : (
                                history.map((item) => (
                                    <div key={item.id} style={{ padding: '14px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ flex: 1 }}>
                                            <strong>{item.review_date}</strong>
                                        </div>
                                        <div style={{ marginRight: '20px', fontWeight: 700, color: '#166534' }}>
                                            {item.overall_score}
                                        </div>
                                        <button onClick={downloadReport} style={{ background: '#166534', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '0.9rem' }}>
                                            📄 Download PDF
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: toast.type === 'success' ? '#166534' : '#991b1b',
                    color: 'white',
                    padding: '20px 28px',
                    borderRadius: '16px',
                    zIndex: 10000
                }}>
                    {toast.message}
                </div>
            )}

            <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}>
                <UserButton afterSignOutUrl="/" />
            </div>
        </div>
    );
}