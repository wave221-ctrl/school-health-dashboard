'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

interface GradeRow {
    grade: string;
    current: number;
    retention: number;
    newStudents: number;
    projected?: number;
}

export default function EnrollmentProjection() {
    const { user } = useUser();

    const [grades, setGrades] = useState<GradeRow[]>([
        { grade: 'PK', current: 18, retention: 0, newStudents: 20 },
        { grade: 'K', current: 22, retention: 85, newStudents: 8 },
        { grade: '1', current: 24, retention: 88, newStudents: 2 },
        { grade: '2', current: 25, retention: 90, newStudents: 1 },
        { grade: '3', current: 23, retention: 92, newStudents: 1 },
        { grade: '4', current: 22, retention: 92, newStudents: 1 },
        { grade: '5', current: 21, retention: 94, newStudents: 1 },
        { grade: '6', current: 20, retention: 90, newStudents: 3 },
        { grade: '7', current: 18, retention: 91, newStudents: 2 },
        { grade: '8', current: 17, retention: 0, newStudents: 0 }
    ]);

    const [schoolName, setSchoolName] = useState('Trinity Lutheran School');
    const [baseYear, setBaseYear] = useState('2026-2027');
    const [projectionYear, setProjectionYear] = useState('2027-2028');
    const [projectionMode, setProjectionMode] = useState<'grade-progress' | 'simple-growth'>('grade-progress');

    const [defaultRetention, setDefaultRetention] = useState(85);
    const [defaultNewStudents, setDefaultNewStudents] = useState(0);
    const [simpleGrowthRate, setSimpleGrowthRate] = useState(3);
    const [capacityTarget, setCapacityTarget] = useState(250);
    const [notes, setNotes] = useState('');

    const round = (num: number) => Math.round(num * 10) / 10;

    const calculate = () => {
        let currentTotal = 0;
        let projectedTotal = 0;
        const chartCurrent: number[] = [];
        const chartProjected: number[] = [];
        const labels: string[] = [];

        const updatedGrades = grades.map((row, index) => {
            currentTotal += Number(row.current || 0);
            let projected = 0;

            if (projectionMode === 'simple-growth') {
                projected = Number(row.current || 0) * (1 + Number(simpleGrowthRate || 0) / 100) + Number(row.newStudents || 0);
            } else {
                if (index === 0) {
                    projected = Number(row.newStudents || 0);
                } else {
                    const previous = grades[index - 1];
                    projected = (Number(previous.current || 0) * (Number(row.retention || 0) / 100)) + Number(row.newStudents || 0);
                }
            }

            projected = round(projected);
            projectedTotal += projected;
            labels.push(row.grade);
            chartCurrent.push(Number(row.current || 0));
            chartProjected.push(projected);

            return { ...row, projected };
        });

        setGrades(updatedGrades);

        // Update summary
        document.getElementById('currentTotal')!.textContent = round(currentTotal).toString();
        document.getElementById('projectedTotal')!.textContent = round(projectedTotal).toString();
        document.getElementById('netChange')!.textContent = round(projectedTotal - currentTotal).toString();

        const capacity = Number(capacityTarget || 1);
        const capacityPct = capacity > 0 ? round((projectedTotal / capacity) * 100) : 0;
        document.getElementById('capacityUsed')!.textContent = `${capacityPct}%`;

        const netChange = round(projectedTotal - currentTotal);
        const healthTag = document.getElementById('healthTag');
        if (healthTag) {
            if (netChange >= 10) healthTag.textContent = 'Strong projected growth';
            else if (netChange > 0) healthTag.textContent = 'Modest projected growth';
            else if (netChange === 0) healthTag.textContent = 'Stable projection';
            else healthTag.textContent = 'Projected decline — review assumptions';
        }

        drawChart(labels, chartCurrent, chartProjected);
    };

    const drawChart = (labels: string[], currentData: number[], projectedData: number[]) => {
        const canvas = document.getElementById('chart') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const padding = { top: 30, right: 20, bottom: 60, left: 50 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;
        const maxValue = Math.max(10, ...currentData, ...projectedData);
        const groupW = chartW / Math.max(labels.length, 1);
        const barW = Math.min(26, groupW * 0.28);

        // Grid
        ctx.strokeStyle = '#cbd5e1';
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (chartH / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(w - padding.right, y);
            ctx.stroke();
            ctx.fillStyle = '#64748b';
            ctx.font = '12px Arial';
            ctx.fillText((5 - i).toString(), 8, y + 4);
        }

        // Current bars
        ctx.fillStyle = '#3b82f6';
        currentData.forEach((value, i) => {
            const x = padding.left + i * groupW + groupW * 0.18;
            const barH = (value / maxValue) * chartH;
            const y = padding.top + chartH - barH;
            ctx.fillRect(x, y, barW, barH);
        });

        // Projected bars
        ctx.fillStyle = '#93c5fd';
        projectedData.forEach((value, i) => {
            const x = padding.left + i * groupW + groupW * 0.18 + barW + 6;
            const barH = (value / maxValue) * chartH;
            const y = padding.top + chartH - barH;
            ctx.fillRect(x, y, barW, barH);
        });

        // Labels
        ctx.fillStyle = '#111827';
        ctx.font = '12px Arial';
        labels.forEach((label, i) => {
            const x = padding.left + i * groupW + groupW * 0.18;
            ctx.save();
            ctx.translate(x + 8, h - 20);
            ctx.rotate(-0.4);
            ctx.fillText(label, 0, 0);
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
    };

    // Run calculation when data changes
    useEffect(() => {
        calculate();
    }, [grades, projectionMode, defaultRetention, defaultNewStudents, simpleGrowthRate, capacityTarget]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-700 rounded-2xl flex items-center justify-center text-white font-bold">S</div>
                            <span className="font-semibold text-xl">School Health Score</span>
                        </div>

                        {/* My Tools Dropdown */}
                        <div className="relative group">
                            <button className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium px-5 py-3 rounded-2xl hover:bg-slate-100 transition">
                                My Tools
                                <span className="text-xs">▼</span>
                            </button>

                            <div className="absolute left-0 mt-2 w-64 bg-white rounded-3xl shadow-xl border border-slate-100 py-2 z-50 
                            opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                            transition-all duration-200">
                                <Link href="/calculator" className="block px-6 py-3 hover:bg-emerald-50 text-slate-700 font-medium">
                                    School Health Calculator
                                </Link>
                                <Link href="/enrollment-projection" className="block px-6 py-3 hover:bg-emerald-50 text-slate-700 font-medium">
                                    Enrollment Projection Calculator
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* User Button */}
                    <UserButton />
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                <div className="wrap">
                    <section className="hero">
                        <div className="print-only"><h1>Enrollment Projection Tool</h1></div>
                        <div className="no-print">
                            <h1>Enrollment Projection Tool</h1>
                            <p>Build year-over-year enrollment projections by grade, estimate retention and new student growth, and generate clean reports.</p>
                        </div>
                        <div className="controls no-print">
                            <button
                                onClick={() => setGrades(prev => [...prev, { grade: 'New Grade', current: 0, retention: 85, newStudents: 0 }])}
                            >
                                Add Grade
                            </button>
                            <button className="secondary" onClick={() => {/* load sample later */ }}>Load Sample Data</button>
                            <button className="secondary" onClick={() => window.print()}>Print / Save PDF</button>
                        </div>
                    </section>

                    <div className="grid">
                        <aside className="section-stack">
                            <section className="card">
                                <h2>School Information</h2>
                                <div className="field">
                                    <label>School Name</label>
                                    <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                                </div>
                                <div className="inline-2">
                                    <div className="field">
                                        <label>Current Year</label>
                                        <input value={baseYear} onChange={(e) => setBaseYear(e.target.value)} />
                                    </div>
                                    <div className="field">
                                        <label>Projection Year</label>
                                        <input value={projectionYear} onChange={(e) => setProjectionYear(e.target.value)} />
                                    </div>
                                </div>
                            </section>

                            <section className="card">
                                <h2>Global Assumptions</h2>
                                <div className="inline-2">
                                    <div className="field">
                                        <label>Default Retention %</label>
                                        <input type="number" value={defaultRetention} onChange={(e) => setDefaultRetention(Number(e.target.value))} />
                                    </div>
                                    <div className="field">
                                        <label>Default New Students</label>
                                        <input type="number" value={defaultNewStudents} onChange={(e) => setDefaultNewStudents(Number(e.target.value))} />
                                    </div>
                                </div>
                                <div className="inline-2">
                                    <div className="field">
                                        <label>Simple Growth %</label>
                                        <input type="number" value={simpleGrowthRate} onChange={(e) => setSimpleGrowthRate(Number(e.target.value))} />
                                    </div>
                                    <div className="field">
                                        <label>Building Capacity</label>
                                        <input type="number" value={capacityTarget} onChange={(e) => setCapacityTarget(Number(e.target.value))} />
                                    </div>
                                </div>
                            </section>
                        </aside>

                        <main className="section-stack">
                            <section className="card">
                                <h2>Projection Summary</h2>
                                <div className="summary-grid">
                                    <div className="stat"><div className="label">Current Enrollment</div><div className="value" id="currentTotal">0</div></div>
                                    <div className="stat"><div className="label">Projected Enrollment</div><div className="value" id="projectedTotal">0</div></div>
                                    <div className="stat"><div className="label">Net Change</div><div className="value" id="netChange">0</div></div>
                                    <div className="stat"><div className="label">Capacity Used</div><div className="value" id="capacityUsed">0%</div></div>
                                </div>
                                <span className="pill" id="healthTag">Waiting for data</span>
                            </section>

                            <section className="card">
                                <h2>Enrollment by Grade</h2>
                                <table id="projectionTable">
                                    <thead>
                                        <tr>
                                            <th>Grade</th>
                                            <th>Current</th>
                                            <th>Retention %</th>
                                            <th>New Students</th>
                                            <th>Projected</th>
                                            <th>Change</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grades.map((row, index) => (
                                            <tr key={index}>
                                                <td><input value={row.grade} onChange={(e) => {
                                                    const newGrades = [...grades];
                                                    newGrades[index].grade = e.target.value;
                                                    setGrades(newGrades);
                                                }} /></td>
                                                <td><input type="number" value={row.current} onChange={(e) => {
                                                    const newGrades = [...grades];
                                                    newGrades[index].current = Number(e.target.value);
                                                    setGrades(newGrades);
                                                }} /></td>
                                                <td><input type="number" value={row.retention} onChange={(e) => {
                                                    const newGrades = [...grades];
                                                    newGrades[index].retention = Number(e.target.value);
                                                    setGrades(newGrades);
                                                }} /></td>
                                                <td><input type="number" value={row.newStudents} onChange={(e) => {
                                                    const newGrades = [...grades];
                                                    newGrades[index].newStudents = Number(e.target.value);
                                                    setGrades(newGrades);
                                                }} /></td>
                                                <td>{row.projected || 0}</td>
                                                <td>{(row.projected || 0) - row.current}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </section>

                            <section className="card">
                                <h2>Visual Trend</h2>
                                <canvas id="chart" width="900" height="320"></canvas>
                            </section>
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}
