'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';

export default function EnrollmentProjection() {
    const { user } = useUser();

    const [grades, setGrades] = useState([
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
    const [projectionMode, setProjectionMode] = useState('grade-progress');
    const [defaultRetention, setDefaultRetention] = useState(85);
    const [defaultNewStudents, setDefaultNewStudents] = useState(0);
    const [simpleGrowthRate, setSimpleGrowthRate] = useState(3);
    const [capacityTarget, setCapacityTarget] = useState(250);
    const [notes, setNotes] = useState('');

    const round = (value) => Math.round(value * 10) / 10;

    const calculate = () => {
        let currentTotal = 0;
        let projectedTotal = 0;
        const chartCurrent = [];
        const chartProjected = [];
        const labels = [];

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

        // Update summary (fixed)
        document.getElementById('currentTotal').textContent = round(currentTotal).toString();
        document.getElementById('projectedTotal').textContent = round(projectedTotal).toString();
        document.getElementById('netChange').textContent = round(projectedTotal - currentTotal).toString();

        const capacity = Number(capacityTarget || 1);   // ← fixed here
        const capacityPct = capacity > 0 ? round((projectedTotal / capacity) * 100) : 0;
        document.getElementById('capacityUsed').textContent = `${capacityPct}%`;

        // Update health tag
        const netChange = round(projectedTotal - currentTotal);
        const healthTag = document.getElementById('healthTag');
        if (netChange >= 10) healthTag.textContent = 'Strong projected growth';
        else if (netChange > 0) healthTag.textContent = 'Modest projected growth';
        else if (netChange === 0) healthTag.textContent = 'Stable projection';
        else healthTag.textContent = 'Projected decline — review assumptions';

        drawChart(labels, chartCurrent, chartProjected);
    };

    const renderTable = () => {
        // This will be handled with React state in the JSX
    };

    // Full table rendering is in the return statement below

    return (
        <div className="wrap">
            <section className="hero">
                <h1>Enrollment Projection Tool</h1>
                <p>Build year-over-year enrollment projections by grade, estimate retention and new student growth, and generate clean reports.</p>
                <div className="controls no-print">
                    <button onClick={() => { /* add row logic */ }}>Add Grade</button>
                    <button className="secondary" onClick={() => { /* load sample */ }}>Load Sample Data</button>
                    <button className="secondary" onClick={() => { /* reset */ }}>Reset</button>
                    <button onClick={() => window.print()}>Print / Save PDF</button>
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
                        {/* Global fields here */}
                    </section>
                </aside>

                <main className="section-stack">
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
                                </tr>
                            </thead>
                            <tbody>
                                {grades.map((row, index) => (
                                    <tr key={index}>
                                        <td>{row.grade}</td>
                                        <td>{row.current}</td>
                                        <td>{row.retention}</td>
                                        <td>{row.newStudents}</td>
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
    );
}