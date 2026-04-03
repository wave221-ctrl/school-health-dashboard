// @ts-nocheck

'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '../lib/supabase';
import { UserButton } from '@clerk/nextjs';

export default function HealthCalculator() {
    const { user } = useUser();
    const [history, setHistory] = useState([]);

    useEffect(() => {
        setTimeout(() => {
            const domains = [
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
            ];

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

            function average(arr) {
                return arr.reduce((a, b) => a + b, 0) / arr.length;
            }

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

                domains.forEach((domain, dIndex) => {
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

                bindInputs();
            }

            function bindInputs() {
                document.querySelectorAll('.metric-score').forEach(el => {
                    el.addEventListener('change', e => {
                        const d = Number(e.target.dataset.domain);
                        const m = Number(e.target.dataset.metric);
                        domains[d].metrics[m].score = Number(e.target.value);
                        calculate();
                    });
                });

                document.querySelectorAll('.domain-weight').forEach(el => {
                    el.addEventListener('input', e => {
                        const d = Number(e.target.dataset.weightDomain);
                        domains[d].weight = Number(e.target.value || 1);
                        calculate();
                    });
                });
            }

            function calculateResults() {
                return domains.map(domain => {
                    const avg = average(domain.metrics.map(m => Number(m.score || 0)));
                    const weighted = avg * Number(domain.weight || 1);
                    return {
                        name: domain.name,
                        avg: Math.round(avg * 100) / 100,
                        weighted: Math.round(weighted * 100) / 100,
                        risk: scoreLabel(avg),
                        weight: domain.weight,
                        metrics: domain.metrics
                    };
                });
            }

            function calculate() {
                const results = calculateResults();
                const weightTotal = results.reduce((sum, r) => sum + Number(r.weight || 1), 0) || 1;
                const overall = results.reduce((sum, r) => sum + r.weighted, 0) / weightTotal;
                const roundedOverall = Math.round(overall * 100) / 100;
                const strongest = [...results].sort((a, b) => b.avg - a.avg)[0];
                const weakest = [...results].sort((a, b) => a.avg - b.avg)[0];

                els.overallScore.textContent = roundedOverall.toFixed(2);
                els.overallRating.textContent = scoreLabel(roundedOverall);
                els.strongestDomain.textContent = strongest ? strongest.name : '—';
                els.weakestDomain.textContent = weakest ? weakest.name : '—';

                if (roundedOverall >= 4) {
                    els.healthTag.textContent = 'Healthy school profile';
                } else if (roundedOverall >= 3) {
                    els.healthTag.textContent = 'Stable, but room to strengthen';
                } else {
                    els.healthTag.textContent = 'Needs focused intervention';
                }

                els.summaryBody.innerHTML = '';
                results.forEach((r, i) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
          <td>${r.name}</td>
          <td class="${riskClass(r.avg)}">${r.avg.toFixed(2)}</td>
          <td>${r.weighted.toFixed(2)}</td>
          <td><span class="band ${bandClass(r.avg)}">${r.risk}</span></td>
        `;
                    els.summaryBody.appendChild(tr);

                    const pill = document.getElementById(`domain-pill-${i}`);
                    if (pill) {
                        pill.className = `band ${bandClass(r.avg)}`;
                        pill.textContent = `Average: ${r.avg.toFixed(2)} | ${r.risk}`;
                    }
                });

                els.printMeta.textContent = `${els.schoolName.value || 'School'} | ${els.schoolType.value} | ${els.reviewDate.value || ''} | Reviewed by ${els.reviewer.value || 'N/A'}`;
                els.printNotes.textContent = els.notes.value || 'No additional notes provided.';

                renderPriorityActions(results);
                renderImprovementPlan(results);
                drawBarChart(results);
                drawRadarChart(results);
            }

            function renderPriorityActions(results) {
                const weakestThree = [...results].sort((a, b) => a.avg - b.avg).slice(0, 3);
                let html = `<p><strong>Recommended focus:</strong></p><ul>`;
                weakestThree.forEach(item => {
                    html += `<li><strong>${item.name}</strong>: ${recommendationForDomain(item.name)}</li>`;
                });
                html += `</ul>`;
                els.priorityActions.innerHTML = html;
            }

            function renderImprovementPlan(results) {
                const weakestThree = [...results].sort((a, b) => a.avg - b.avg).slice(0, 3);
                const windows = ['30 Days', '60 Days', '90 Days'];

                els.improvementPlan.innerHTML = weakestThree.map((item, index) => {
                    const actions = [
                        `Clarify the immediate issue in ${item.name.toLowerCase()} and assign one owner.`,
                        `Implement a focused improvement step: ${recommendationForDomain(item.name)}`,
                        `Measure results and decide whether to scale, refine, or intervene further.`
                    ];

                    return `
          <div class="plan-card">
            <h3>${windows[index]}</h3>
            <p><strong>Focus Area:</strong> ${item.name}</p>
            <p><span class="band ${bandClass(item.avg)}">${scoreLabel(item.avg)} (${item.avg.toFixed(2)})</span></p>
            <ol class="plan-list">
              ${actions.map(action => `<li>${action}</li>`).join('')}
            </ol>
          </div>
        `;
                }).join('');
            }

            function drawBarChart(results) {
                const canvas = document.getElementById('barChart');
                const ctx = canvas.getContext('2d');
                const w = canvas.width;
                const h = canvas.height;
                ctx.clearRect(0, 0, w, h);

                const padding = { top: 30, right: 20, bottom: 90, left: 55 };
                const chartW = w - padding.left - padding.right;
                const chartH = h - padding.top - padding.bottom;
                const maxValue = 5;
                const barArea = chartW / Math.max(results.length, 1);
                const barW = Math.min(70, barArea * 0.55);

                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 1;
                ctx.fillStyle = '#111827';
                ctx.font = '12px Arial';

                for (let i = 0; i <= 5; i++) {
                    const y = padding.top + (chartH / 5) * i;
                    ctx.beginPath();
                    ctx.moveTo(padding.left, y);
                    ctx.lineTo(w - padding.right, y);
                    ctx.stroke();
                    const label = (maxValue - i).toString();
                    ctx.fillText(label, 18, y + 4);
                }

                results.forEach((result, i) => {
                    const x = padding.left + i * barArea + (barArea - barW) / 2;
                    const barH = (result.avg / maxValue) * chartH;
                    const y = padding.top + chartH - barH;

                    if (result.avg >= 4.5) ctx.fillStyle = '#86efac';
                    else if (result.avg >= 3.75) ctx.fillStyle = '#93c5fd';
                    else if (result.avg >= 3) ctx.fillStyle = '#fcd34d';
                    else if (result.avg >= 2) ctx.fillStyle = '#fca5a5';
                    else ctx.fillStyle = '#d1d5db';

                    ctx.fillRect(x, y, barW, barH);
                    ctx.fillStyle = '#111827';
                    ctx.fillText(result.avg.toFixed(2), x + 10, y - 8);

                    ctx.save();
                    ctx.translate(x + 10, h - 18);
                    ctx.rotate(-0.42);
                    ctx.fillText(result.name, 0, 0);
                    ctx.restore();
                });
            }

            function drawRadarChart(results) {
                const canvas = document.getElementById('radarChart');
                const ctx = canvas.getContext('2d');
                const w = canvas.width;
                const h = canvas.height;
                ctx.clearRect(0, 0, w, h);

                const cx = w / 2;
                const cy = h / 2 + 10;
                const radius = Math.min(w, h) * 0.32;
                const levels = 5;
                const count = results.length;

                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1;
                ctx.fillStyle = '#111827';
                ctx.font = '12px Arial';

                for (let level = 1; level <= levels; level++) {
                    const r = radius * (level / levels);
                    ctx.beginPath();
                    for (let i = 0; i < count; i++) {
                        const angle = (-Math.PI / 2) + (Math.PI * 2 * i / count);
                        const x = cx + Math.cos(angle) * r;
                        const y = cy + Math.sin(angle) * r;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }

                results.forEach((result, i) => {
                    const angle = (-Math.PI / 2) + (Math.PI * 2 * i / count);
                    const x = cx + Math.cos(angle) * radius;
                    const y = cy + Math.sin(angle) * radius;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(x, y);
                    ctx.stroke();

                    const labelX = cx + Math.cos(angle) * (radius + 26);
                    const labelY = cy + Math.sin(angle) * (radius + 26);
                    ctx.fillStyle = '#111827';
                    ctx.fillText(result.name, labelX - 40, labelY);
                });

                ctx.beginPath();
                results.forEach((result, i) => {
                    const angle = (-Math.PI / 2) + (Math.PI * 2 * i / count);
                    const r = radius * (result.avg / 5);
                    const x = cx + Math.cos(angle) * r;
                    const y = cy + Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.closePath();
                ctx.fillStyle = 'rgba(37, 99, 235, 0.18)';
                ctx.strokeStyle = '#2563eb';
                ctx.lineWidth = 2;
                ctx.fill();
                ctx.stroke();
            }

            function setToday() {
                const today = new Date();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const year = today.getFullYear();
                els.reviewDate.value = `${year}-${month}-${day}`;
            }

            function loadSample() {
                els.schoolName.value = 'Trinity Lutheran School';
                els.reviewer.value = 'School Leadership Team';
                els.schoolType.value = 'PK-8';
                els.notes.value = 'Sample profile shows good mission strength and academic stability, with the biggest growth needs in enrollment systems and marketing clarity.';
                const sampleScores = [
                    [3, 3, 2],
                    [4, 4, 3],
                    [5, 4, 4],
                    [3, 2, 3],
                    [3, 3, 2],
                    [2, 2, 3]
                ];
                const sampleWeights = [1.2, 1.2, 1.1, 1.25, 1.15, 1.0];

                domains.forEach((domain, d) => {
                    domain.weight = sampleWeights[d];
                    domain.metrics.forEach((metric, m) => {
                        metric.score = sampleScores[d][m];
                    });
                });

                renderDomains();
                calculate();
            }

            function resetTool() {
                els.schoolName.value = '';
                els.reviewer.value = '';
                els.schoolType.value = 'PK-8';
                els.notes.value = '';
                setToday();
                domains.forEach(domain => {
                    domain.weight = 1;
                    domain.metrics.forEach(metric => metric.score = 3);
                });
                domains[0].weight = 1.2;
                domains[1].weight = 1.2;
                domains[2].weight = 1.1;
                domains[3].weight = 1.25;
                domains[4].weight = 1.15;
                domains[5].weight = 1.0;
                renderDomains();
                calculate();
            }

            function downloadReport() {
                const rows = calculateResults();
                const weightTotal = rows.reduce((sum, r) => sum + Number(r.weight || 1), 0) || 1;
                const overall = rows.reduce((sum, r) => sum + r.weighted, 0) / weightTotal;
                const roundedOverall = Math.round(overall * 100) / 100;
                const strongest = [...rows].sort((a, b) => b.avg - a.avg)[0];
                const weakest = [...rows].sort((a, b) => a.avg - b.avg)[0];
                const weakestThree = [...rows].sort((a, b) => a.avg - b.avg).slice(0, 3);

                let actionItems = '';
                weakestThree.forEach(item => {
                    actionItems += `<li><strong>${item.name}</strong>: ${recommendationForDomain(item.name)}</li>`;
                });

                const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>School Health Report</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; margin: 0; padding: 32px; background: #ffffff; line-height: 1.45; }
    .wrap { max-width: 1000px; margin: 0 auto; }
    h1, h2, h3 { margin: 0 0 10px; }
    h1 { font-size: 28px; }
    h2 { font-size: 20px; margin-top: 28px; }
    p { margin: 0 0 10px; }
    .meta, .box { border: 1px solid #d1d5db; border-radius: 14px; padding: 16px; margin-bottom: 18px; background: #f8fafc; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 18px 0; }
    .stat { border: 1px solid #d1d5db; border-radius: 12px; padding: 14px; background: #fff; }
    .label { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
    .value { font-size: 24px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #d1d5db; padding: 10px 8px; text-align: left; vertical-align: top; font-size: 14px; }
    th { background: #f3f4f6; }
    ul, ol { margin: 8px 0 0 20px; }
    .domain-block, .plan-card { border: 1px solid #d1d5db; border-radius: 12px; padding: 14px; margin-top: 12px; background: #fff; }
    .band { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; border: 1px solid transparent; }
    .band-excellent { background: #dcfce7; color: #166534; border-color: #86efac; }
    .band-strong { background: #dbeafe; color: #1d4ed8; border-color: #93c5fd; }
    .band-stable { background: #fef3c7; color: #92400e; border-color: #fcd34d; }
    .band-risk { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
    .band-critical { background: #e5e7eb; color: #374151; border-color: #d1d5db; }
    .improvement-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .footer { margin-top: 28px; font-size: 12px; color: #6b7280; }
    @media print { body { padding: 0; } .wrap { max-width: 100%; } }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>School Health Report</h1>
    <div class="meta">
      <p><strong>School:</strong> ${els.schoolName.value || 'School'}</p>
      <p><strong>School Type:</strong> ${els.schoolType.value || 'N/A'}</p>
      <p><strong>Review Date:</strong> ${els.reviewDate.value || 'N/A'}</p>
      <p><strong>Reviewer:</strong> ${els.reviewer.value || 'N/A'}</p>
    </div>

    <div class="summary-grid">
      <div class="stat"><div class="label">Overall Health Score</div><div class="value">${roundedOverall.toFixed(2)}</div></div>
      <div class="stat"><div class="label">Health Rating</div><div class="value">${scoreLabel(roundedOverall)}</div></div>
      <div class="stat"><div class="label">Strongest Domain</div><div class="value" style="font-size:18px;">${strongest ? strongest.name : '—'}</div></div>
      <div class="stat"><div class="label">Biggest Risk Area</div><div class="value" style="font-size:18px;">${weakest ? weakest.name : '—'}</div></div>
    </div>

    <p>
      <span class="band band-excellent">Excellent</span>
      <span class="band band-strong">Strong</span>
      <span class="band band-stable">Stable</span>
      <span class="band band-risk">At Risk</span>
      <span class="band band-critical">Critical</span>
    </p>

    <h2>Domain Summary</h2>
    <table>
      <thead><tr><th>Domain</th><th>Average</th><th>Weight</th><th>Weighted Score</th><th>Risk Level</th></tr></thead>
      <tbody>
        ${rows.map(r => `<tr><td>${r.name}</td><td>${r.avg.toFixed(2)}</td><td>${r.weight}</td><td>${r.weighted.toFixed(2)}</td><td><span class="band ${bandClass(r.avg)}">${r.risk}</span></td></tr>`).join('')}
      </tbody>
    </table>

    <h2>Detailed Domain Breakdown</h2>
    ${rows.map(r => `
      <div class="domain-block">
        <h3>${r.name}</h3>
        <p><span class="band ${bandClass(r.avg)}">${r.risk} (${r.avg.toFixed(2)})</span></p>
        <table>
          <thead><tr><th>Metric</th><th>Description</th><th>Score</th></tr></thead>
          <tbody>${r.metrics.map(m => `<tr><td>${m.name}</td><td>${m.help}</td><td>${m.score}</td></tr>`).join('')}</tbody>
        </table>
      </div>
    `).join('')}

    <h2>Priority Actions</h2>
    <div class="box"><ul>${actionItems}</ul></div>

    <h2>Optional 30 / 60 / 90 Day Improvement Plan</h2>
    <div class="improvement-grid">
      ${weakestThree.map((item, index) => {
                    const windows = ['30 Days', '60 Days', '90 Days'];
                    const actions = [
                        `Clarify the immediate issue in ${item.name.toLowerCase()} and assign one owner.`,
                        `Implement a focused improvement step: ${recommendationForDomain(item.name)}`,
                        `Measure results and decide whether to scale, refine, or intervene further.`
                    ];
                    return `<div class="plan-card"><h3>${windows[index]}</h3><p><strong>Focus Area:</strong> ${item.name}</p><p><span class="band ${bandClass(item.avg)}">${scoreLabel(item.avg)} (${item.avg.toFixed(2)})</span></p><ol>${actions.map(action => `<li>${action}</li>`).join('')}</ol></div>`;
                }).join('')}
    </div>

    <h2>Leadership Notes</h2>
    <div class="box"><p>${(els.notes.value || 'No additional notes provided.').replace(/\n/g, '<br>')}</p></div>

    <div class="footer">Generated by the School Health Calculator.</div>
  </div>
</body>
</html>`;

                const blob = new Blob([reportHtml], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const fileName = (els.schoolName.value || 'school-health-report').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                a.href = url;
                a.download = `${fileName}-report.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            document.getElementById('loadSampleBtn').addEventListener('click', loadSample);
            document.getElementById('resetBtn').addEventListener('click', resetTool);
            document.getElementById('printBtn').addEventListener('click', () => window.print());
            document.getElementById('downloadBtn').addEventListener('click', downloadReport);

            [els.schoolName, els.reviewDate, els.reviewer, els.schoolType, els.notes].forEach(el => {
                el.addEventListener('input', calculate);
                el.addEventListener('change', calculate);
            });

            setToday();
            renderDomains();
            calculate();

            window.calculateResults = calculateResults;
            window.els = els;
            window.domains = domains;
            window.setDomains = setDomains;
            window.renderDomains = renderDomains;
            window.calculate = calculate;
            window.loadPastAssessment = loadPastAssessment;   // ← added
        }, 1000);   // ← changed to 1000ms for safety
    }, []);

    
    // =============== SAVE ASSESSMENT ===============
    const saveAssessment = async () => {
        if (!user) {
            alert('Please sign in to save');
            return;
        }

        const results = window.calculateResults();
        const weightTotal = results.reduce((sum, r) => sum + Number(r.weight || 1), 0) || 1;
        const overall = results.reduce((sum, r) => sum + r.weighted, 0) / weightTotal;

        const payload = {
            user_id: user.id,
            school_id: null,
            review_date: document.getElementById('reviewDate')?.value || new Date().toISOString().split('T')[0],
            reviewer: document.getElementById('reviewer')?.value || user.fullName || 'Leadership Team',
            notes: document.getElementById('notes')?.value || '',
            overall_score: Math.round(overall * 100) / 100,
            data: { domains, results, overallScore: Math.round(overall * 100) / 100 }
        };

        const { error: supabaseError } = await supabase.from('assessments').insert(payload);

        if (supabaseError) {
            alert('Save failed: ' + supabaseError.message);
        } else {
            alert('✅ Assessment saved successfully!');
            loadHistory();        // refresh the history list automatically
        }
    };
    // =============== LOAD HISTORY ===============
const loadHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
        .from('assessments')
        .select('id, review_date, overall_score, data')
        .eq('user_id', user.id)           // ← ONLY SHOW THIS USER'S DATA
        .order('review_date', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }
    setHistory(data || []);
};


    // =============== HISTORY FUNCTIONS ===============


    const loadPastAssessment = (item) => {
        if (item.data && item.data.domains) {
            // Update both React state and the legacy script
            setDomains(item.data.domains);
            window.domains = item.data.domains;

            // Force full re-render of the calculator
            setTimeout(() => {
                if (typeof window.renderDomains === 'function') window.renderDomains();
                if (typeof window.calculate === 'function') window.calculate();
            }, 100);

            alert(`✅ Loaded assessment from ${item.review_date}`);
        } else {
            alert('No data found in this assessment');
        }
    };

    // =============== DELETE ASSESSMENT ===============
const deleteAssessment = async (id) => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to permanently delete this saved assessment?')) {
        return;
    }

    const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);   // ← only delete own records

    if (error) {
        alert('Delete failed: ' + error.message);
    } else {
        alert('✅ Assessment deleted');
        loadHistory();
    }
};

    return (
        <div className="wrap">

            {/* ←←← ORIGINAL HTML GOES HERE (unchanged) */}
            <section className="hero">
                <div className="print-only">
                    <h1>School Health Calculator</h1>
                </div>
                <div className="no-print">
                    <h1>School Health Calculator</h1>
                    <p>
                        A practical website-based tool to help school leaders score overall school health, identify strengths and weak spots,
                        visualize results, and print or save a clean report for leadership teams, boards, and planning sessions.
                    </p>
                </div>
                <div className="controls no-print">
                    <button id="loadSampleBtn">Load Sample Data</button>
                    <button className="secondary" id="resetBtn">Reset</button>
                    <button id="downloadBtn">Download Report</button>
                    <button id="printBtn">Print / Save PDF</button>
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
                        <p className="small">Each metric is scored 1 to 5. Weights help you decide what matters most instead of pretending every issue carries the same impact.</p>
                    </section>

                    <section class="card">
                        <h2>Scoring Guide – What Each Score Really Means</h2>

                        {/* Quick Reference Table */}
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

                        {/* Detailed Rubric */}
                        <div className="domain" style={{ marginBottom: '12px' }}>
                            <details open>
                                <summary><strong>Enrollment & Retention</strong></summary>
                                <ul className="small" style={{ margin: '8px 0 0 20px', padding: '0' }}>
                                    <li><strong>5</strong> – Strong growth, 95%+ retention, families invite others <em>(Psalm 92:12)</em></li>
                                    <li><strong>4</strong> – Stable growth, 90–94% retention <em>(Psalm 1:3)</em></li>
                                    <li><strong>3</strong> – Flat enrollment, 85–89% retention <em>(Jeremiah 17:8)</em></li>
                                    <li><strong>2</strong> – Declining enrollment, visible anxiety <em>(Psalm 1:4)</em></li>
                                    <li><strong>1</strong> – Sharp decline, high attrition <em>(Hosea 14:4–7)</em></li>
                                </ul>
                            </details>
                        </div>

                        <div className="domain" style={{ marginBottom: '12px' }}>
                            <details>
                                <summary><strong>Academic Program</strong></summary>
                                <ul className="small" style={{ margin: '8px 0 0 20px', padding: '0' }}>
                                    <li><strong>5</strong> – Christ-centered, rigorous, students thriving <em>(Proverbs 22:6)</em></li>
                                    <li><strong>4</strong> – Strong academics with consistent integration <em>(Colossians 2:6–7)</em></li>
                                    <li><strong>3</strong> – Adequate academics, uneven integration <em>(Matthew 7:24–25)</em></li>
                                    <li><strong>2</strong> – Noticeable gaps, worldview feels added-on <em>(Matthew 7:26–27)</em></li>
                                    <li><strong>1</strong> – Significant struggles <em>(Nehemiah 2:17)</em></li>
                                </ul>
                            </details>
                        </div>

                        <div className="domain" style={{ marginBottom: '12px' }}>
                            <details>
                                <summary><strong>Culture & Mission</strong></summary>
                                <ul className="small" style={{ margin: '8px 0 0 20px', padding: '0' }}>
                                    <li><strong>5</strong> – Mission alive, deep belonging <em>(Ephesians 4:4–6)</em></li>
                                    <li><strong>4</strong> – Mission understood and mostly lived out <em>(Ephesians 4:3)</em></li>
                                    <li><strong>3</strong> – Mission known but not deeply felt <em>(2 Timothy 3:5)</em></li>
                                    <li><strong>2</strong> – Mission drift or tension <em>(Mark 3:25)</em></li>
                                    <li><strong>1</strong> – Toxic or divided culture <em>(Revelation 2:4–5)</em></li>
                                </ul>
                            </details>
                        </div>

                        <div className="domain" style={{ marginBottom: '12px' }}>
                            <details>
                                <summary><strong>Finance & Operations</strong></summary>
                                <ul className="small" style={{ margin: '8px 0 0 20px', padding: '0' }}>
                                    <li><strong>5</strong> – Healthy budget, strong reserves <em>(Luke 16:10)</em></li>
                                    <li><strong>4</strong> – Balanced budget, reliable operations <em>(1 Corinthians 4:2)</em></li>
                                    <li><strong>3</strong> – Tight but manageable <em>(Philippians 4:11–13)</em></li>
                                    <li><strong>2</strong> – Frequent stress, deferred maintenance <em>(Matthew 11:28)</em></li>
                                    <li><strong>1</strong> – Financial instability <em>(James 1:5)</em></li>
                                </ul>
                            </details>
                        </div>

                        <div className="domain" style={{ marginBottom: '12px' }}>
                            <details>
                                <summary><strong>Leadership & Staffing</strong></summary>
                                <ul className="small" style={{ margin: '8px 0 0 20px', padding: '0' }}>
                                    <li><strong>5</strong> – Trusted, unified, staff feel valued <em>(1 Peter 5:2–4)</em></li>
                                    <li><strong>4</strong> – Strong leadership and good morale <em>(Proverbs 27:17)</em></li>
                                    <li><strong>3</strong> – Adequate but some fatigue <em>(Matthew 9:37–38)</em></li>
                                    <li><strong>2</strong> – Trust issues or high turnover <em>(Ezekiel 34:1–10)</em></li>
                                    <li><strong>1</strong> – Leadership vacuum or conflict <em>(Galatians 6:1)</em></li>
                                </ul>
                            </details>
                        </div>

                        <div className="domain">
                            <details>
                                <summary><strong>Marketing & Community Presence</strong></summary>
                                <ul className="small" style={{ margin: '8px 0 0 20px', padding: '0' }}>
                                    <li><strong>5</strong> – Compelling story, strong visibility <em>(Matthew 5:16)</em></li>
                                    <li><strong>4</strong> – Clear brand and good awareness <em>(Matthew 5:14)</em></li>
                                    <li><strong>3</strong> – Basic presence <em>(Matthew 5:15)</em></li>
                                    <li><strong>2</strong> – Outdated or unclear messaging <em>(Mark 4:21)</em></li>
                                    <li><strong>1</strong> – Almost no presence or negative perception <em>(2 Corinthians 8:21)</em></li>
                                </ul>
                            </details>
                        </div>
                    </section>

                    <section className="card">
                        <h2>Notes</h2>
                        <div className="field">
                            <label htmlFor="notes">Leadership Notes</label>
                            <textarea id="notes" rows={8} placeholder="Add key findings, assumptions, concerns, and next steps."></textarea>
                        </div>
                    </section>
                </aside>

                <main className="section-stack">
                    <section className="card">
                        <h2>Overall Summary</h2>
                        <div className="summary-grid">
                            <div className="stat">
                                <div className="label">Overall Health Score</div>
                                <div className="value" id="overallScore">0</div>
                            </div>
                            <div className="stat">
                                <div className="label">Health Rating</div>
                                <div className="value" id="overallRating">—</div>
                            </div>
                            <div className="stat">
                                <div className="label">Strongest Domain</div>
                                <div className="value" id="strongestDomain">—</div>
                            </div>
                            <div className="stat">
                                <div className="label">Biggest Risk Area</div>
                                <div className="value" id="weakestDomain">—</div>
                            </div>
                        </div>
                        <span className="pill" id="healthTag">Waiting for scores</span>
                        <div className="band-row">
                            <span className="band band-excellent">Excellent: 4.50–5.00</span>
                            <span className="band band-strong">Strong: 3.75–4.49</span>
                            <span className="band band-stable">Stable: 3.00–3.74</span>
                            <span className="band band-risk">At Risk: 2.00–2.99</span>
                            <span className="band band-critical">Critical: 1.00–1.99</span>
                        </div>
                    </section>

                    <section className="card">
                        <h2>Domain Scoring</h2>
                        <div id="domainsContainer"></div>
                    </section>

                    <section className="card">
                        <h2>Domain Summary Table</h2>
                        <table id="summaryTable">
                            <thead>
                                <tr>
                                    <th>Domain</th>
                                    <th>Average</th>
                                    <th>Weighted Score</th>
                                    <th>Risk Level</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </section>

                    <section className="card">
                        <h2>Health Visualization</h2>
                        <canvas id="barChart" width="960" height="340"></canvas>
                        <div className="footer-note">Quick visual comparisons make board conversations slightly less painful.</div>
                    </section>

                    <section className="card">
                        <h2>Radar View</h2>
                        <canvas id="radarChart" width="960" height="420"></canvas>
                        <div className="footer-note">A quick way to see whether the school is balanced or lopsided across domains.</div>
                    </section>

                    <section className="card">
                        <h2>Priority Actions</h2>
                        <div className="report-box">
                            <div id="priorityActions"></div>
                        </div>
                    </section>

                    <section className="card">
                        <h2>Optional Improvement Plan</h2>
                        <div className="improvement-grid" id="improvementPlan"></div>
                        <div className="footer-note">These suggested 30/60/90-day actions are auto-generated from the weakest domains and can be edited later for your context.</div>
                    </section>

                    <section className="card print-only">
                        <h2>Printed Notes</h2>
                        <p id="printMeta"></p>
                        <p id="printNotes"></p>
                    </section>
                </main>
            </div>

            {/* Controls with real Save button */}
            <div className="controls no-print" style={{ marginTop: '20px' }}>
                <button id="loadSampleBtn">Load Sample Data</button>
                <button className="secondary" id="resetBtn">Reset</button>
                <button id="downloadBtn">Download Report</button>
                <button id="printBtn">Print / Save PDF</button>
                <button
                    onClick={saveAssessment}
                    style={{ background: '#166534', color: 'white', fontWeight: '700' }}
                >
                    💾 Save Assessment
                </button>
            </div>

            
            {/* History Panel */}
            <div className="card" style={{ marginTop: '30px' }}>
                <h2>📅 Year-over-Year History</h2>
                <button onClick={loadHistory} className="secondary" style={{ marginBottom: '12px' }}>
                    Refresh History
                </button>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {history.length === 0 ? (
                        <p className="small">No assessments saved yet. Click "Save Assessment" above to start tracking year-over-year.</p>
                    ) : (
                        history.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    padding: '14px',
                                    borderBottom: '1px solid #ddd',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <strong>{item.review_date}</strong>
                                </div>
                                <div style={{ marginRight: '20px', fontWeight: 700, color: '#166534' }}>
                                    {item.overall_score}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => loadPastAssessment(item)}
                                        style={{
                                            background: '#2563eb',
                                            color: 'white',
                                            border: 'none',
                                            padding: '6px 14px',
                                            borderRadius: '8px',
                                            fontSize: '0.9rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Load
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteAssessment(item.id);
                                        }}
                                        style={{
                                            background: '#991b1b',
                                            color: 'white',
                                            border: 'none',
                                            padding: '6px 14px',
                                            borderRadius: '8px',
                                            fontSize: '0.9rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Logout / User Button */}
            <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}>
                <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                        elements: { avatarBox: { width: '36px', height: '36px' } }
                    }}
                />
            </div>
        </div>
    );
}