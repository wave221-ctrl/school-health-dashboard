// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '../lib/supabase';
import { UserButton } from '@clerk/nextjs';

export default function HealthCalculator() {
    const { user } = useUser();
    const [history, setHistory] = useState([]);
    const [domains, setDomains] = useState([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            // ==================== FULL ORIGINAL SCRIPT ====================
            const domainsData = [
                {
                    name: 'Enrollment & Retention', weight: 1.2, metrics: [
                        { name: 'Enrollment trend', help: 'Are admissions stable or growing?', score: 3 },
                        { name: 'Student retention', help: 'Do families stay year to year?', score: 3 },
                        { name: 'Inquiry-to-enrollment pipeline', help: 'Is recruitment converting?', score: 3 }
                    ]
                },
                {
                    name: 'Academic Program', weight: 1.2, metrics: [
                        { name: 'Curriculum alignment', help: 'Clear, consistent academic expectations', score: 3 },
                        { name: 'Instructional quality', help: 'Classroom teaching strength', score: 3 },
                        { name: 'Student support systems', help: 'Interventions and support are functioning', score: 3 }
                    ]
                },
                {
                    name: 'Culture & Mission', weight: 1.1, metrics: [
                        { name: 'Mission clarity', help: 'Mission is visible and understood', score: 3 },
                        { name: 'Student / family culture', help: 'The community is healthy and engaged', score: 3 },
                        { name: 'Spiritual identity / values', help: 'Faith and identity are integrated well', score: 3 }
                    ]
                },
                {
                    name: 'Finance & Operations', weight: 1.25, metrics: [
                        { name: 'Budget stability', help: 'Budget is sustainable and monitored', score: 3 },
                        { name: 'Facilities / deferred maintenance', help: 'Buildings are cared for', score: 3 },
                        { name: 'Operational systems', help: 'Processes are documented and dependable', score: 3 }
                    ]
                },
                {
                    name: 'Leadership & Staffing', weight: 1.15, metrics: [
                        { name: 'Leadership effectiveness', help: 'Leadership is clear and trusted', score: 3 },
                        { name: 'Staff morale / retention', help: 'People want to stay and contribute', score: 3 },
                        { name: 'Professional development', help: 'Staff growth is intentional', score: 3 }
                    ]
                },
                {
                    name: 'Marketing & Community Presence', weight: 1.0, metrics: [
                        { name: 'Brand clarity', help: 'The school story is clear', score: 3 },
                        { name: 'Website / digital presence', help: 'The website and digital communication are useful', score: 3 },
                        { name: 'Community engagement', help: 'The school is visible and connected', score: 3 }
                    ]
                }
            ];

            setDomains(domainsData);

            const els = {
                schoolName: document.getElementById('schoolName'),
                reviewDate: document.getElementById('reviewDate'),
                reviewer: document.getElementById('reviewer'),
                schoolType: document.getElementById('schoolType'),
                notes: document.getElementById('notes'),
                domainsContainer: document.getElementById('domainsContainer'),
                summaryBody: document.querySelector('#summaryTable tbody'),
                overallScore: document.getElementById('overallScore'),
                overallRating: document.getElementById('overallRating'),
                strongestDomain: document.getElementById('strongestDomain'),
                weakestDomain: document.getElementById('weakestDomain'),
                healthTag: document.getElementById('healthTag'),
                priorityActions: document.getElementById('priorityActions'),
                improvementPlan: document.getElementById('improvementPlan'),
                printMeta: document.getElementById('printMeta'),
                printNotes: document.getElementById('printNotes')
            };

            function average(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }

            function scoreLabel(score) {
                if (score >= 4.5) return 'Excellent';
                if (score >= 3.75) return 'Strong';
                if (score >= 3) return 'Stable';
                if (score >= 2) return 'At Risk';
                return 'Critical';
            }

            function riskClass(score) {
                if (score >= 3.75) return 'good';
                if (score >= 3) return 'warn';
                return 'bad';
            }

            function bandClass(score) {
                if (score >= 4.5) return 'band-excellent';
                if (score >= 3.75) return 'band-strong';
                if (score >= 3) return 'band-stable';
                if (score >= 2) return 'band-risk';
                return 'band-critical';
            }

            function recommendationForDomain(name) {
                if (name.includes('Enrollment')) return 'Tighten admissions follow-up, retention conversations, family re-enrollment strategy, and visit-to-application conversion.';
                if (name.includes('Academic')) return 'Review curriculum alignment, classroom support, assessment use, and intervention consistency.';
                if (name.includes('Culture')) return 'Clarify mission, strengthen culture habits, and improve family and student connection points.';
                if (name.includes('Finance')) return 'Audit budget pressure points, maintenance backlog, operational bottlenecks, and cash-flow visibility.';
                if (name.includes('Leadership')) return 'Address staff morale, role clarity, accountability, coaching rhythms, and development pathways.';
                if (name.includes('Marketing')) return 'Improve website clarity, school storytelling, inquiry response, and community-facing communication.';
                return 'Review leadership assumptions and build a concrete 90-day improvement plan.';
            }

            function renderDomains() {
                els.domainsContainer.innerHTML = '';
                domainsData.forEach((domain, dIndex) => {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'domain';
                    const metricsHtml = domain.metrics.map((metric, mIndex) => `
            <div class="score-row">
              <div>
                <div class="metric-name">${metric.name}</div>
                <div class="metric-help">${metric.help}</div>
              </div>
              <div>
                <label class="small" for="score-${dIndex}-${mIndex}">Score</label>
                <select id="score-${dIndex}-${mIndex}" data-domain="${dIndex}" data-metric="${mIndex}" class="metric-score">
                  <option value="1" ${metric.score === 1 ? 'selected' : ''}>1</option>
                  <option value="2" ${metric.score === 2 ? 'selected' : ''}>2</option>
                  <option value="3" ${metric.score === 3 ? 'selected' : ''}>3</option>
                  <option value="4" ${metric.score === 4 ? 'selected' : ''}>4</option>
                  <option value="5" ${metric.score === 5 ? 'selected' : ''}>5</option>
                </select>
              </div>
            </div>
          `).join('');

                    wrapper.innerHTML = `
            <div class="domain-header">
              <div>
                <h3>${domain.name}</h3>
                <div class="small">Score the current health of this area.</div>
              </div>
              <span class="band ${bandClass(3)}" id="domain-pill-${dIndex}">Average: 0.00</span>
            </div>
            <div class="domain-weight-row">
              <div>
                <label class="small" for="weight-${dIndex}">Domain Weight</label>
              </div>
              <div>
                <input id="weight-${dIndex}" type="number" min="0.5" max="2" step="0.05" value="${domain.weight}" data-weight-domain="${dIndex}" class="domain-weight" />
              </div>
            </div>
            ${metricsHtml}
          `;
                    els.domainsContainer.appendChild(wrapper);
                });
            }

            function calculateResults() {
                return domainsData.map(domain => {
                    const avg = average(domain.metrics.map(m => Number(m.score || 0)));
                    const weighted = avg * Number(domain.weight || 1);
                    return { name: domain.name, avg: Math.round(avg * 100) / 100, weighted: Math.round(weighted * 100) / 100, risk: scoreLabel(avg), weight: domain.weight, metrics: domain.metrics };
                });
            }

            function calculate() {
                const results = calculateResults();
                const weightTotal = results.reduce((sum, r) => sum + Number(r.weight || 1), 0) || 1;
                const overall = results.reduce((sum, r) => sum + r.weighted, 0) / weightTotal;
                const roundedOverall = Math.round(overall * 100) / 100;
                const strongest = [...results].sort((a, b) => b.avg - a.avg)[0];
                const weakest = [...results].sort((a, b) => a.avg - b.avg)[0];

                if (els.overallScore) els.overallScore.textContent = roundedOverall.toFixed(2);
                if (els.overallRating) els.overallRating.textContent = scoreLabel(roundedOverall);
                if (els.strongestDomain) els.strongestDomain.textContent = strongest ? strongest.name : '—';
                if (els.weakestDomain) els.weakestDomain.textContent = weakest ? weakest.name : '—';

                if (els.healthTag) {
                    if (roundedOverall >= 4) els.healthTag.textContent = 'Healthy school profile';
                    else if (roundedOverall >= 3) els.healthTag.textContent = 'Stable, but room to strengthen';
                    else els.healthTag.textContent = 'Needs focused intervention';
                }
            }

            function setToday() {
                const today = new Date();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const year = today.getFullYear();
                if (els.reviewDate) els.reviewDate.value = `${year}-${month}-${day}`;
            }

            // Load the app
            setToday();
            renderDomains();
            calculate();

            // Expose to React
            window.calculateResults = calculateResults;
            window.els = els;
            window.domains = domainsData;
            window.setDomains = setDomains;

        }, 800);

        return () => clearTimeout(timer);
    }, []);

    const saveAssessment = async () => {
        if (!user) {
            alert('Please sign in to save');
            return;
        }
        const results = window.calculateResults();
        const weightTotal = results.reduce((sum, r) => sum + Number(r.weight || 1), 0) || 1;
        const overall = results.reduce((sum, r) => sum + r.weighted, 0) / weightTotal;

        const payload = {
            school_id: null,
            review_date: document.getElementById('reviewDate')?.value || new Date().toISOString().split('T')[0],
            reviewer: document.getElementById('reviewer')?.value || user.fullName || 'Leadership Team',
            notes: document.getElementById('notes')?.value || '',
            overall_score: Math.round(overall * 100) / 100,
            data: { domains, results, overallScore: Math.round(overall * 100) / 100 }
        };

        const { error } = await supabase.from('assessments').insert(payload);
        if (error) alert('Save failed: ' + error.message);
        else alert('✅ Assessment saved successfully!');
    };

    const loadHistory = async () => {
        const { data } = await supabase
            .from('assessments')
            .select('id, review_date, overall_score, data')
            .order('review_date', { ascending: false });
        setHistory(data || []);
    };

    const loadPastAssessment = (item) => {
        if (item.data && item.data.domains) {
            setDomains(item.data.domains);
            alert(`✅ Loaded assessment from ${item.review_date}`);
        }
    };

    return (
        <div className="wrap">
            <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 50 }}>
                <UserButton afterSignOutUrl="/" />
            </div>

            <section className="hero">
                <div className="print-only"><h1>School Health Calculator</h1></div>
                <div className="no-print">
                    <h1>School Health Calculator</h1>
                    <p>A practical tool to help Christian school leaders score overall school health, identify strengths and weak spots, visualize results, and plan year-over-year improvement.</p>
                </div>
                <div className="controls no-print">
                    <button id="loadSampleBtn">Load Sample Data</button>
                    <button className="secondary" id="resetBtn">Reset</button>
                    <button id="downloadBtn">Download Report</button>
                    <button id="printBtn">Print / Save PDF</button>
                    <button onClick={saveAssessment} style={{ background: '#166534', color: 'white', fontWeight: '700' }}>💾 Save Assessment</button>
                </div>
            </section>

            <div className="grid">
                <aside className="section-stack">
                    <section className="card">
                        <h2>School Information</h2>
                        <div className="field">
                            <label htmlFor="schoolName">School Name</label>
                            <input id="schoolName" type="text" placeholder="Example Lutheran School" />
                        </div>
                        <div className="inline-2">
                            <div className="field">
                                <label htmlFor="reviewDate">Review Date</label>
                                <input id="reviewDate" type="date" />
                            </div>
                            <div className="field">
                                <label htmlFor="reviewer">Reviewer</label>
                                <input id="reviewer" type="text" placeholder="Principal or leadership team" />
                            </div>
                        </div>
                        <div className="field">
                            <label htmlFor="schoolType">School Type</label>
                            <select id="schoolType">
                                <option>PK-8</option>
                                <option>High School</option>
                                <option>Early Childhood</option>
                                <option>K-12</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <p className="small">Each metric is scored 1 to 5. Weights help you decide what matters most.</p>
                    </section>

                    <section className="card">
                        <h2>Scoring Guide – What Each Score Really Means</h2>
                        <table>
                            <thead><tr><th>Score</th><th>Label</th><th>Meaning</th></tr></thead>
                            <tbody>
                                <tr><td><strong>5</strong></td><td>Excellent / Healthy</td><td>Fully thriving, mission-aligned, sustainable excellence</td></tr>
                                <tr><td><strong>4</strong></td><td>Strong</td><td>Solid and reliable with only minor gaps</td></tr>
                                <tr><td><strong>3</strong></td><td>Adequate / Functional</td><td>Meets basic expectations but not thriving</td></tr>
                                <tr><td><strong>2</strong></td><td>Weak / Inconsistent</td><td>Noticeable problems causing concern</td></tr>
                                <tr><td><strong>1</strong></td><td>Critical Concern</td><td>Major breakdown requiring immediate intervention</td></tr>
                            </tbody>
                        </table>
                        <p className="small" style={{ marginTop: '16px', marginBottom: '12px' }}>Detailed rubric with biblical anchors for each domain:</p>
                    </section>
                </aside>

                <main className="section-stack">
                    <section className="card">
                        <h2>Domain Scoring</h2>
                        <div id="domainsContainer"></div>
                    </section>

                    <section className="card">
                        <h2>Overall Summary</h2>
                        <div className="summary-grid">
                            <div className="stat"><div className="label">Overall Health Score</div><div className="value" id="overallScore">0</div></div>
                            <div className="stat"><div className="label">Health Rating</div><div className="value" id="overallRating">—</div></div>
                            <div className="stat"><div className="label">Strongest Domain</div><div className="value" id="strongestDomain">—</div></div>
                            <div className="stat"><div className="label">Biggest Risk Area</div><div className="value" id="weakestDomain">—</div></div>
                        </div>
                        <span className="pill" id="healthTag">Waiting for scores</span>
                    </section>

                    <section className="card">
                        <h2>Domain Summary Table</h2>
                        <table id="summaryTable">
                            <thead>
                                <tr><th>Domain</th><th>Average</th><th>Weighted Score</th><th>Risk Level</th></tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </section>

                    <section className="card">
                        <h2>Health Visualization</h2>
                        <canvas id="barChart" width="960" height="340"></canvas>
                    </section>

                    <section className="card">
                        <h2>Radar View</h2>
                        <canvas id="radarChart" width="960" height="420"></canvas>
                    </section>

                    <section className="card">
                        <h2>Priority Actions</h2>
                        <div className="report-box" id="priorityActions"></div>
                    </section>

                    <section className="card">
                        <h2>Optional Improvement Plan</h2>
                        <div className="improvement-grid" id="improvementPlan"></div>
                    </section>
                </main>
            </div>

            <div className="controls no-print" style={{ marginTop: '20px' }}>
                <button id="loadSampleBtn">Load Sample Data</button>
                <button className="secondary" id="resetBtn">Reset</button>
                <button id="downloadBtn">Download Report</button>
                <button id="printBtn">Print / Save PDF</button>
                <button onClick={saveAssessment} style={{ background: '#166534', color: 'white', fontWeight: '700' }}>💾 Save Assessment</button>
            </div>

            <div className="card" style={{ marginTop: '30px' }}>
                <h2>📅 Year-over-Year History</h2>
                <button onClick={loadHistory} className="secondary" style={{ marginBottom: '12px' }}>Refresh History</button>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {history.length === 0 ? (
                        <p className="small">No assessments saved yet. Click "Save Assessment" above to start tracking year-over-year.</p>
                    ) : (
                        history.map((item) => (
                            <div key={item.id} onClick={() => loadPastAssessment(item)} style={{ padding: '14px', borderBottom: '1px solid #ddd', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div><strong>{item.review_date}</strong></div>
                                <div>Overall Score: <span className="good" style={{ fontWeight: 700 }}>{item.overall_score}</span></div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}