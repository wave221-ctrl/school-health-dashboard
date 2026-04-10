'use client';
// @ts-nocheck

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '../lib/supabase';
import { UserButton } from '@clerk/nextjs';


// ==================== HELPER FUNCTIONS (moved outside) ====================
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

// ==================== END HELPER FUNCTIONS ====================
export default function HealthCalculator() {
    const { user } = useUser();
    const [history, setHistory] = useState([]);
    const [toast, setToast] = useState(null);
    const [comparisonData, setComparisonData] = useState([]);

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
                if (!els.domainsContainer) return;
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

                // Update summary table
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

                // NEW: Call the multi-year charts (no arguments needed)
                drawBarChart();
                drawRadarChart();
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

            function drawBarChart() {
                const canvas = document.getElementById('barChart');
                if (!canvas) return;                    // ← safety check
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const w = canvas.width;
                const h = canvas.height;
                ctx.clearRect(0, 0, w, h);

                const datasets = (window.comparisonData && window.comparisonData.length > 0)
                    ? window.comparisonData
                    : [{ review_date: 'Current', data: { results: calculateResults() } }];

                const padding = { top: 40, right: 40, bottom: 140, left: 60 };
                const chartW = w - padding.left - padding.right;
                const chartH = h - padding.top - padding.bottom;

                const colors = ['#166534', '#2563eb', '#9333ea', '#ca8a04'];

                // Grid
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
                    const results = yearData.data?.results || yearData.results || [];
                    results.forEach((result, domainIndex) => {
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

                // Labels
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
            }

            function drawRadarChart() {
                const canvas = document.getElementById('radarChart');
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
                    : [{ review_date: 'Current', data: { results: calculateResults() } }];

                const colors = ['#166534', '#2563eb', '#9333ea', '#ca8a04'];

                // Grid
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

                // Each year's radar
                datasets.forEach((yearData, i) => {
                    const results = yearData.data?.results || yearData.results || [];
                    ctx.beginPath();
                    results.forEach((result, j) => {
                        const angle = (-Math.PI / 2) + (Math.PI * 2 * j / results.length);
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

                // Labels
                ctx.fillStyle = '#1e2937';
                ctx.font = '13px Arial';
                ctx.textAlign = 'center';
                datasets[0].data.results.forEach((result, i) => {
                    const angle = (-Math.PI / 2) + (Math.PI * 2 * i / datasets[0].data.results.length);
                    const x = cx + Math.cos(angle) * (radius + 45);
                    const y = cy + Math.sin(angle) * (radius + 45);
                    ctx.fillText(result.name, x, y);
                });
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
            window.drawBarChart = drawBarChart;
            window.drawRadarChart = drawRadarChart;
        }, 1000);   // keep 1000ms
    }, []);

    // =============== AUTO-LOAD HISTORY ===============
    // Auto-load history + prepare comparison data (last 4 assessments)
    useEffect(() => {
        if (user) {
            loadHistory();
        }
    }, [user]);

    
    // Prepare comparison data for charts (last 4 assessments)
    useEffect(() => {
        if (history.length > 0) {
            const latest = history.slice(0, 4);
            setComparisonData(latest);

            // Force charts to redraw after data is ready
            setTimeout(() => {
                if (typeof window.drawBarChart === 'function') window.drawBarChart();
                if (typeof window.drawRadarChart === 'function') window.drawRadarChart();
            }, 300);
        }
    }, [history]);

    // Sync comparisonData to legacy script and force redraw
    useEffect(() => {
        window.comparisonData = comparisonData;
        console.log('✅ comparisonData synced to window. Count:', comparisonData.length);

        setTimeout(() => {
            if (typeof window.drawBarChart === 'function') window.drawBarChart();
            if (typeof window.drawRadarChart === 'function') window.drawRadarChart();
        }, 300);
    }, [comparisonData]);

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
            showToast('✅ Assessment saved successfully!' + supabaseError.message);
        } else {
            showToast('✅ Assessment saved successfully!');
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
            // Use the window version we already exposed - this avoids the closure error
            if (typeof window.setDomains === 'function') {
                window.setDomains(item.data.domains);
            }

            // Force redraw
            setTimeout(() => {
                if (typeof window.renderDomains === 'function') window.renderDomains();
                if (typeof window.calculate === 'function') window.calculate();
            }, 150);

            alert(`✅ Loaded assessment from ${item.review_date}`);
        } else {
            alert('No data found in this assessment');
        }
    };


    // =============== DOWNLOAD SAVED REPORT AS PDF ===============
    // =============== DOWNLOAD SAVED REPORT AS PDF ===============
    const downloadSavedReport = async (item) => {
        if (!item.data || !item.data.results) {
            alert('No report data found in this assessment');
            return;
        }

        const rows = item.data.results;
        const roundedOverall = item.data.overallScore || 0;
        const strongest = [...rows].sort((a, b) => b.avg - a.avg)[0];
        const weakest = [...rows].sort((a, b) => a.avg - b.avg)[0];
        const weakestThree = [...rows].sort((a, b) => a.avg - b.avg).slice(0, 3);

        let actionItems = '';
        weakestThree.forEach(r => {
            actionItems += `<li><strong>${r.name}</strong>: ${recommendationForDomain(r.name)}</li>`;
        });

        const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>School Health Report</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; margin: 0; padding: 40px; background: #ffffff; line-height: 1.5; }
    .wrap { max-width: 1000px; margin: 0 auto; }
    h1, h2 { margin: 0 0 12px; }
    h1 { font-size: 32px; }
    h2 { font-size: 22px; margin-top: 30px; }
    .meta { border: 1px solid #d1d5db; border-radius: 12px; padding: 20px; margin-bottom: 20px; background: #f8fafc; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }
    .stat { border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; background: #fff; text-align: center; }
    .label { font-size: 13px; color: #6b7280; }
    .value { font-size: 28px; font-weight: 700; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #d1d5db; padding: 12px 10px; text-align: left; }
    th { background: #f3f4f6; }
    .band { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 700; }
    .band-excellent { background: #dcfce7; color: #166534; }
    .band-strong { background: #dbeafe; color: #1d4ed8; }
    .band-stable { background: #fef3c7; color: #92400e; }
    .band-risk { background: #fee2e2; color: #991b1b; }
    .band-critical { background: #e5e7eb; color: #374151; }
    .improvement-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .plan-card { border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; background: #fff; }
    .footer { margin-top: 40px; font-size: 13px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>School Health Report</h1>
    <div class="meta">
      <p><strong>School:</strong> ${item.data.schoolName || 'Saved School'}</p>
      <p><strong>Review Date:</strong> ${item.review_date}</p>
      <p><strong>Reviewer:</strong> ${item.reviewer || 'Leadership Team'}</p>
    </div>

    <div class="summary-grid">
      <div class="stat"><div class="label">Overall Health Score</div><div class="value">${roundedOverall.toFixed(2)}</div></div>
      <div class="stat"><div class="label">Health Rating</div><div class="value">${scoreLabel(roundedOverall)}</div></div>
      <div class="stat"><div class="label">Strongest Domain</div><div class="value" style="font-size:18px;">${strongest ? strongest.name : '—'}</div></div>
      <div class="stat"><div class="label">Biggest Risk Area</div><div class="value" style="font-size:18px;">${weakest ? weakest.name : '—'}</div></div>
    </div>

    <h2>Domain Summary</h2>
    <table>
      <thead><tr><th>Domain</th><th>Average</th><th>Weight</th><th>Weighted Score</th><th>Risk Level</th></tr></thead>
      <tbody>
        ${rows.map(r => `<tr><td>${r.name}</td><td>${r.avg.toFixed(2)}</td><td>${r.weight}</td><td>${r.weighted.toFixed(2)}</td><td><span class="band ${bandClass(r.avg)}">${r.risk}</span></td></tr>`).join('')}
      </tbody>
    </table>

    <h2>Priority Actions</h2>
    <div class="box"><ul>${actionItems}</ul></div>

    <h2>30 / 60 / 90 Day Improvement Plan</h2>
    <div class="improvement-grid">
      ${weakestThree.map((r, index) => {
            const windows = ['30 Days', '60 Days', '90 Days'];
            return `
          <div class="plan-card">
            <h3>${windows[index]}</h3>
            <p><strong>Focus Area:</strong> ${r.name}</p>
            <p><span class="band ${bandClass(r.avg)}">${r.risk} (${r.avg.toFixed(2)})</span></p>
          </div>`;
        }).join('')}
    </div>

    <div class="footer">Generated by the School Health Calculator • ${item.review_date}</div>
  </div>
</body>
</html>`;


        const opt = {
            margin: 10,
            filename: `school-health-report-${item.review_date}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const html2pdf = (await import('html2pdf.js')).default;
        html2pdf().set(opt).from(reportHtml).save();
    };

    // =============== DELETE ASSESSMENT ===============
    const deleteAssessment = async (id) => {
        console.log('🔴 Delete clicked for ID:', id);
        console.log('Current user ID:', user?.id);

        if (!user) {
            alert('You must be logged in to delete assessments.');
            return;
        }

        if (!confirm('Delete this assessment permanently? This cannot be undone.')) return;

        console.log('Attempting Supabase delete for ID:', id);

        const { error, count } = await supabase
            .from('assessments')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);   // ← extra strict filter

        console.log('Supabase returned count:', count);

        if (error) {
            console.error('❌ Delete error:', error);
            alert('Delete failed: ' + error.message);
        } else if (count === 0) {
            console.log('⚠️ No rows were deleted — RLS is blocking it');
            alert('Delete failed — Supabase could not find or delete the row.');
            loadHistory();
        } else {
            console.log('✅ Delete successful in Supabase!');
            alert('✅ Assessment deleted successfully');
            loadHistory();
        }
    };
    // =============== SHOW TOAST ===============
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);   // auto dismiss after 3 seconds
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
                            A strategic platform for Christian school leaders to assess overall school health,
                            track year-over-year progress, identify strengths and growth opportunities, and generate clear, board-ready reports.
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

                        {/* Multi-Year Legend */}
                        {comparisonData.length > 1 && (
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
                                            <div style={{
                                                width: '14px',
                                                height: '14px',
                                                backgroundColor: colors[index % colors.length],
                                                borderRadius: '3px'
                                            }}></div>
                                            <span>{item.review_date || `Year ${index + 1}`}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

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

                {/* Controls - Only Save Assessment button */}
                <div className="controls no-print" style={{ marginTop: '20px' }}>
                    <button
                        onClick={saveAssessment}
                        style={{
                            background: '#166534',
                            color: 'white',
                            fontWeight: '700',
                            padding: '12px 24px',
                            fontSize: '1.1rem'
                        }}
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
                                            onClick={() => downloadSavedReport(item)}
                                            style={{
                                                background: '#166534',
                                                color: 'white',
                                                border: 'none',
                                                padding: '6px 14px',
                                                borderRadius: '8px',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            📄 Download PDF
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();           // important!
                                                deleteAssessment(item.id);
                                            }}
                                            className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 rounded-xl hover:bg-red-50"
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

                {/* Centered Toast Banner */}
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
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        zIndex: 10000,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        maxWidth: '90%',
                        minWidth: '320px'
                    }}>
                        {toast.message}
                    </div>
                )}
            </div>
        );
}