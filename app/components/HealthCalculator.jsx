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
            console.error(error);
            showToast('Save failed: ' + error.message, 'error');
        } else {
            showToast('✅ Assessment saved successfully!');
            loadHistory();
        }
    };

    const deleteAssessment = async (id) => {
        if (!user?.id || !confirm('Delete this assessment permanently?')) return;

        console.log('🗑️ Deleting ID:', id);

        const { data, error, count } = await supabase
            .from('assessments')
            .delete({ count: 'exact' })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Delete error:', error);
            showToast('Delete failed: ' + error.message, 'error');
        } else if ((count ?? 0) > 0) {
            console.log(`✅ Deleted ${count} row(s)`);
            setHistory(prev => prev.filter(item => item.id !== id));
            showToast('Assessment deleted successfully');
        } else {
            showToast('Could not delete assessment', 'error');
            console.log('Response data:', data);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ==================== UPDATERS ====================
    const updateMetric = (dIndex, mIndex, score) => {
        setDomains(prev => prev.map((domain, di) =>
            di === dIndex ? {
                ...domain,
                metrics: domain.metrics.map((m, mi) => mi === mIndex ? { ...m, score } : m)
            } : domain
        ));
    };

    const updateWeight = (dIndex, weight) => {
        setDomains(prev => prev.map((domain, i) =>
            i === dIndex ? { ...domain, weight: parseFloat(weight) || 1 } : domain
        ));
    };

    // ==================== CHARTS ====================
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
                <h1>School Health Calculator</h1>
                <p>A strategic platform for Christian school leaders.</p>
                <div className="controls no-print">
                    <button onClick={saveAssessment} style={{ background: '#166534', color: 'white', fontWeight: '700' }}>
                        💾 Save Assessment
                    </button>
                </div>
            </section>

            <div className="grid">
                <aside className="section-stack">
                    <section className="card">
                        <h2>School Information</h2>
                        <input value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="School Name" />
                        <input type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)} />
                        <input value={reviewer} onChange={e => setReviewer(e.target.value)} placeholder="Reviewer" />
                        <select value={schoolType} onChange={e => setSchoolType(e.target.value)}>
                            <option>PK-8</option>
                            <option>High School</option>
                            <option>K-12</option>
                        </select>
                    </section>

                    {/* Scoring Guide */}
                    <section className="card">
                        <h2>Scoring Guide</h2>
                        <table>
                            <thead><tr><th>Score</th><th>Label</th><th>Meaning</th></tr></thead>
                            <tbody>
                                <tr><td>5</td><td>Excellent</td><td>Fully thriving</td></tr>
                                <tr><td>4</td><td>Strong</td><td>Solid with minor gaps</td></tr>
                                <tr><td>3</td><td>Stable</td><td>Meets basic expectations</td></tr>
                                <tr><td>2</td><td>At Risk</td><td>Noticeable problems</td></tr>
                                <tr><td>1</td><td>Critical</td><td>Major breakdown</td></tr>
                            </tbody>
                        </table>
                    </section>
                </aside>

                <main className="section-stack">
                    <section className="card">
                        <h2>Overall Score: {overallScore.toFixed(2)} — {scoreLabel(overallScore)}</h2>
                    </section>

                    <section className="card">
                        <h2>Domain Scoring</h2>
                        {domains.map((domain, dIndex) => (
                            <div key={dIndex} className="domain">
                                <h3>{domain.name}</h3>
                                <input type="number" step="0.05" value={domain.weight} onChange={e => updateWeight(dIndex, e.target.value)} />
                                {domain.metrics.map((metric, mIndex) => (
                                    <div key={mIndex}>
                                        <div>{metric.name}</div>
                                        <select value={metric.score} onChange={e => updateMetric(dIndex, mIndex, Number(e.target.value))}>
                                            {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </section>

                    {/* Legend */}
                    {comparisonData.length > 0 && (
                        <div style={{ padding: '12px 20px', background: '#f8fafc', borderRadius: '12px', marginBottom: '20px' }}>
                            <strong>Legend:</strong>
                            {comparisonData.map((item, i) => {
                                const colors = ['#166534', '#2563eb', '#9333ea', '#ca8a04'];
                                return (
                                    <div key={i} style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '15px' }}>
                                        <div style={{ width: '16px', height: '16px', background: colors[i % colors.length], marginRight: '6px' }}></div>
                                        {item.review_date}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <section className="card">
                        <h2>Charts</h2>
                        <canvas ref={barChartRef} width="960" height="340" />
                        <canvas ref={radarChartRef} width="960" height="420" />
                    </section>

                    <div className="card">
                        <h2>History</h2>
                        <button onClick={loadHistory}>Refresh</button>
                        {history.map(item => (
                            <div key={item.id}>
                                {item.review_date} — Score: {item.overall_score}
                                <button onClick={() => deleteAssessment(item.id)}>Delete</button>
                            </div>
                        ))}
                    </div>
                </main>
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

            <UserButton afterSignOutUrl="/" />
        </div>
    );
}