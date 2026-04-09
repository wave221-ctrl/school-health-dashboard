'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

// ── Types ────────────────────────────────────────────────────────────────────

interface GradeRow {
    grade: string;
    current: number;
    retention: number;
    newStudents: number;
}

type ProjectionMode = 'grade-progress' | 'simple-growth';

// ── Helpers ──────────────────────────────────────────────────────────────────

const round = (n: number) => Math.round(n * 10) / 10;

function getProjected(grades: GradeRow[], index: number, mode: ProjectionMode, simpleGrowthRate: number): number {
    const row = grades[index];
    if (mode === 'simple-growth') {
        return round(row.current * (1 + simpleGrowthRate / 100) + row.newStudents);
    }
    if (index === 0) return round(row.newStudents);
    const prev = grades[index - 1];
    return round(prev.current * (row.retention / 100) + row.newStudents);
}

function healthLabel(netChange: number): string {
    if (netChange >= 10) return 'Strong projected growth';
    if (netChange > 0) return 'Modest projected growth';
    if (netChange === 0) return 'Stable projection';
    return 'Projected decline — review assumptions';
}

// ── Default data ─────────────────────────────────────────────────────────────

const DEFAULT_GRADES: GradeRow[] = [
    { grade: 'PK', current: 18, retention: 0,  newStudents: 20 },
    { grade: 'K',  current: 22, retention: 85, newStudents: 8  },
    { grade: '1',  current: 24, retention: 88, newStudents: 2  },
    { grade: '2',  current: 25, retention: 90, newStudents: 1  },
    { grade: '3',  current: 23, retention: 92, newStudents: 1  },
    { grade: '4',  current: 22, retention: 92, newStudents: 1  },
    { grade: '5',  current: 21, retention: 94, newStudents: 1  },
    { grade: '6',  current: 20, retention: 90, newStudents: 3  },
    { grade: '7',  current: 18, retention: 91, newStudents: 2  },
    { grade: '8',  current: 17, retention: 0,  newStudents: 0  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function EnrollmentProjection() {
    useUser();

    const [grades, setGrades] = useState<GradeRow[]>(DEFAULT_GRADES);
    const [schoolName, setSchoolName] = useState('Trinity Lutheran School');
    const [baseYear, setBaseYear] = useState('2026-2027');
    const [projectionYear, setProjectionYear] = useState('2027-2028');
    const [projectionMode, setProjectionMode] = useState<ProjectionMode>('grade-progress');
    const [simpleGrowthRate, setSimpleGrowthRate] = useState(3);
    const [capacityTarget, setCapacityTarget] = useState(250);
    const [notes, setNotes] = useState('');

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // ── Derived values (no state, no infinite loop) ──────────────────────────

    const projectedValues = grades.map((_, i) => getProjected(grades, i, projectionMode, simpleGrowthRate));
    const currentTotal = round(grades.reduce((sum, r) => sum + r.current, 0));
    const projectedTotal = round(projectedValues.reduce((sum, v) => sum + v, 0));
    const netChange = round(projectedTotal - currentTotal);
    const capacityPct = capacityTarget > 0 ? round((projectedTotal / capacityTarget) * 100) : 0;

    // ── Chart ────────────────────────────────────────────────────────────────

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const pad = { top: 30, right: 20, bottom: 60, left: 50 };
        const chartW = w - pad.left - pad.right;
        const chartH = h - pad.top - pad.bottom;
        const maxValue = Math.max(10, ...grades.map(r => r.current), ...projectedValues);
        const groupW = chartW / Math.max(grades.length, 1);
        const barW = Math.min(26, groupW * 0.28);

        // Grid lines + y-axis labels
        ctx.strokeStyle = '#cbd5e1';
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Arial';
        for (let i = 0; i <= 5; i++) {
            const y = pad.top + (chartH / 5) * i;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(w - pad.right, y);
            ctx.stroke();
            ctx.fillText(Math.round(maxValue * (1 - i / 5)).toString(), 8, y + 4);
        }

        // Current bars (blue)
        grades.forEach((row, i) => {
            const x = pad.left + i * groupW + groupW * 0.18;
            const barH = (row.current / maxValue) * chartH;
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(x, pad.top + chartH - barH, barW, barH);
        });

        // Projected bars (light blue)
        projectedValues.forEach((value, i) => {
            const x = pad.left + i * groupW + groupW * 0.18 + barW + 6;
            const barH = (value / maxValue) * chartH;
            ctx.fillStyle = '#93c5fd';
            ctx.fillRect(x, pad.top + chartH - barH, barW, barH);
        });

        // Grade labels (rotated)
        ctx.fillStyle = '#111827';
        ctx.font = '12px Arial';
        grades.forEach((row, i) => {
            const x = pad.left + i * groupW + groupW * 0.18;
            ctx.save();
            ctx.translate(x + 8, h - 20);
            ctx.rotate(-0.4);
            ctx.fillText(row.grade, 0, 0);
            ctx.restore();
        });

        // Legend
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(w - 200, 12, 14, 14);
        ctx.fillStyle = '#111827';
        ctx.fillText('Current', w - 180, 24);
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(w - 110, 12, 14, 14);
        ctx.fillStyle = '#111827';
        ctx.fillText('Projected', w - 90, 24);

    }, [grades, projectedValues]);

    // ── Grade row helpers ────────────────────────────────────────────────────

    const updateGrade = (index: number, field: keyof GradeRow, value: string | number) => {
        setGrades(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
    };

    const addGrade = () => {
        setGrades(prev => [...prev, { grade: 'New', current: 0, retention: 85, newStudents: 0 }]);
    };

    const removeGrade = (index: number) => {
        setGrades(prev => prev.filter((_, i) => i !== index));
    };

    const loadSample = () => {
        setGrades(DEFAULT_GRADES);
        setSchoolName('Trinity Lutheran School');
        setBaseYear('2026-2027');
        setProjectionYear('2027-2028');
        setCapacityTarget(250);
        setSimpleGrowthRate(3);
        setNotes('');
    };

    // ── Render ───────────────────────────────────────────────────────────────

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
                            <div className="absolute left-0 mt-2 w-64 bg-white rounded-3xl shadow-xl border border-slate-100 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <Link href="/calculator" className="block px-6 py-3 hover:bg-emerald-50 text-slate-700 font-medium">
                                    School Health Calculator
                                </Link>
                                <Link href="/enrollment-projection" className="block px-6 py-3 hover:bg-emerald-50 text-slate-700 font-medium">
                                    Enrollment Projection Calculator
                                </Link>
                                <Link href="/staff-leadership" className="block px-6 py-3 hover:bg-emerald-50 text-slate-700 font-medium">
                                    Staff & Leadership Health Assessment
                                </Link>
                            </div>
                        </div>
                    </div>
                    <UserButton />
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                <div className="wrap">

                    {/* Hero */}
                    <section className="hero">
                        <div className="print-only"><h1>Enrollment Projection Tool</h1></div>
                        <div className="no-print">
                            <h1>Enrollment Projection Tool</h1>
                            <p>Build year-over-year enrollment projections by grade, estimate retention and new student growth, and generate clean reports.</p>
                        </div>
                        <div className="controls no-print">
                            <button onClick={addGrade}>Add Grade</button>
                            <button className="secondary" onClick={loadSample}>Load Sample Data</button>
                            <button className="secondary" onClick={() => window.print()}>Print / Save PDF</button>
                        </div>
                    </section>

                    <div className="grid">

                        {/* Sidebar */}
                        <aside className="section-stack">
                            <section className="card">
                                <h2>School Information</h2>
                                <div className="field">
                                    <label>School Name</label>
                                    <input value={schoolName} onChange={e => setSchoolName(e.target.value)} />
                                </div>
                                <div className="inline-2">
                                    <div className="field">
                                        <label>Current Year</label>
                                        <input value={baseYear} onChange={e => setBaseYear(e.target.value)} />
                                    </div>
                                    <div className="field">
                                        <label>Projection Year</label>
                                        <input value={projectionYear} onChange={e => setProjectionYear(e.target.value)} />
                                    </div>
                                </div>
                            </section>

                            <section className="card">
                                <h2>Projection Mode</h2>
                                <div className="field">
                                    <label>Method</label>
                                    <select value={projectionMode} onChange={e => setProjectionMode(e.target.value as ProjectionMode)}>
                                        <option value="grade-progress">Grade progression (students move up)</option>
                                        <option value="simple-growth">Simple growth rate</option>
                                    </select>
                                </div>
                                {projectionMode === 'simple-growth' && (
                                    <div className="field">
                                        <label>Growth Rate %</label>
                                        <input type="number" value={simpleGrowthRate} onChange={e => setSimpleGrowthRate(Number(e.target.value))} />
                                    </div>
                                )}
                            </section>

                            <section className="card">
                                <h2>Capacity</h2>
                                <div className="field">
                                    <label>Building Capacity</label>
                                    <input type="number" value={capacityTarget} onChange={e => setCapacityTarget(Number(e.target.value))} />
                                </div>
                            </section>

                            <section className="card">
                                <h2>Notes</h2>
                                <div className="field">
                                    <label>Leadership Notes</label>
                                    <textarea rows={6} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add assumptions, context, or next steps." />
                                </div>
                            </section>
                        </aside>

                        {/* Main */}
                        <main className="section-stack">

                            {/* Summary */}
                            <section className="card">
                                <h2>Projection Summary</h2>
                                <div className="summary-grid">
                                    <div className="stat">
                                        <div className="label">Current Enrollment</div>
                                        <div className="value">{currentTotal}</div>
                                    </div>
                                    <div className="stat">
                                        <div className="label">Projected Enrollment</div>
                                        <div className="value">{projectedTotal}</div>
                                    </div>
                                    <div className="stat">
                                        <div className="label">Net Change</div>
                                        <div className="value" style={{ color: netChange >= 0 ? '#166534' : '#991b1b' }}>
                                            {netChange >= 0 ? '+' : ''}{netChange}
                                        </div>
                                    </div>
                                    <div className="stat">
                                        <div className="label">Capacity Used</div>
                                        <div className="value">{capacityPct}%</div>
                                    </div>
                                </div>
                                <span className="pill">{healthLabel(netChange)}</span>
                            </section>

                            {/* Grade table */}
                            <section className="card">
                                <h2>Enrollment by Grade</h2>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Grade</th>
                                            <th>Current</th>
                                            <th>Retention %</th>
                                            <th>New Students</th>
                                            <th>Projected</th>
                                            <th>Change</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grades.map((row, index) => {
                                            const projected = projectedValues[index];
                                            const change = round(projected - row.current);
                                            return (
                                                <tr key={index}>
                                                    <td>
                                                        <input
                                                            value={row.grade}
                                                            onChange={e => updateGrade(index, 'grade', e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            value={row.current}
                                                            onChange={e => updateGrade(index, 'current', Number(e.target.value))}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            value={row.retention}
                                                            onChange={e => updateGrade(index, 'retention', Number(e.target.value))}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            value={row.newStudents}
                                                            onChange={e => updateGrade(index, 'newStudents', Number(e.target.value))}
                                                        />
                                                    </td>
                                                    <td style={{ fontWeight: 600 }}>{projected}</td>
                                                    <td style={{ color: change >= 0 ? '#166534' : '#991b1b', fontWeight: 600 }}>
                                                        {change >= 0 ? '+' : ''}{change}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="secondary"
                                                            onClick={() => removeGrade(index)}
                                                            style={{ padding: '2px 10px', fontSize: '0.8rem' }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </section>

                            {/* Chart */}
                            <section className="card">
                                <h2>Visual Trend</h2>
                                <canvas ref={canvasRef} width={900} height={320} />
                            </section>

                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}
