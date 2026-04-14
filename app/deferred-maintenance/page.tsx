'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '../lib/supabase';
import { UserButton } from '@clerk/nextjs';

interface MaintenanceItem {
    id: string;
    category: string;
    description: string;
    estimatedCost: number;
    condition: number;
    yearsSinceLast: number;
    priority: 'High' | 'Medium' | 'Low';
}

const CATEGORIES = [
    'Roofing', 'HVAC', 'Plumbing', 'Electrical', 'Windows/Doors',
    'Exterior Paint/Siding', 'Interior Finishes', 'Parking Lot', 'Playground',
    'Kitchen Equipment', 'Other'
];

const conditionLegend = [
    { score: 1, label: "Critical", desc: "Immediate attention required. Safety risk or major failure imminent." },
    { score: 2, label: "Poor", desc: "Significant deterioration. Needs repair within 1-2 years." },
    { score: 3, label: "Fair", desc: "Average condition. Functional but showing wear." },
    { score: 4, label: "Good", desc: "Minor wear only. Generally reliable for several more years." },
    { score: 5, label: "Excellent", desc: "Like new or recently renovated. No action needed soon." }
];

export default function DeferredMaintenance() {
    const { user } = useUser();

    const [items, setItems] = useState<MaintenanceItem[]>([
        { id: '1', category: 'Roofing', description: 'Main sanctuary roof', estimatedCost: 125000, condition: 2, yearsSinceLast: 14, priority: 'High' },
        { id: '2', category: 'HVAC', description: 'Boiler system replacement', estimatedCost: 65000, condition: 3, yearsSinceLast: 9, priority: 'Medium' },
    ]);

    const [schoolName, setSchoolName] = useState('Trinity Lutheran School');
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [history, setHistory] = useState<any[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Automatic prioritization
    const calculatePriority = (condition: number, yearsSinceLast: number, cost: number): 'High' | 'Medium' | 'Low' => {
        const score = (6 - condition) * yearsSinceLast * (cost / 50000);
        if (score >= 25) return 'High';
        if (score >= 12) return 'Medium';
        return 'Low';
    };

    useEffect(() => {
        setItems(prev => prev.map(item => ({
            ...item,
            priority: calculatePriority(item.condition, item.yearsSinceLast, item.estimatedCost)
        })));
    }, [items.map(i => `${i.condition}-${i.yearsSinceLast}-${i.estimatedCost}`).join()]);

    const totalDeferred = items.reduce((sum, item) => sum + item.estimatedCost, 0);
    const highPriorityItems = items.filter(i => i.priority === 'High').length;

    const addItem = () => {
        const newItem: MaintenanceItem = {
            id: Date.now().toString(),
            category: 'Other',
            description: '',
            estimatedCost: 0,
            condition: 3,
            yearsSinceLast: 5,
            priority: 'Medium'
        };
        setItems([...items, newItem]);
    };

    const updateItem = (id: string, field: keyof MaintenanceItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const saveAssessment = async () => {
        if (!user?.id) return showToast('Please sign in to save', 'error');

        const reviewDateStr = `${currentYear}-01-01`;

        const payload = {
            user_id: user.id,
            tool: 'deferred-maintenance',
            review_date: reviewDateStr,
            overall_score: Math.round(totalDeferred / 1000),
            data: { schoolName, currentYear, items, totalDeferred, highPriorityItems }
        };

        const { error } = await supabase.from('assessments').insert(payload);

        if (error) {
            console.error('Supabase insert error:', error);
            showToast('Save failed: ' + error.message, 'error');
        } else {
            showToast('✅ Deferred Maintenance saved!', 'success');
            loadHistory();
        }
    };

    const loadHistory = async () => {
        if (!user?.id) return;
        const { data } = await supabase
            .from('assessments')
            .select('*')
            .eq('tool', 'deferred-maintenance')
            .eq('user_id', user.id)
            .order('review_date', { ascending: false });
        setHistory(data || []);
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Download PDF Report - Fixed TypeScript types
    const downloadReport = async () => {
        const html2pdf = (await import('html2pdf.js')).default;

        const reportHtml = `
            <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6;">
                <h1 style="color: #166534; text-align: center; margin-bottom: 10px;">Deferred Maintenance Report</h1>
                <p style="text-align: center; color: #666; margin-bottom: 40px;">${schoolName} — ${currentYear}</p>
                
                <h2 style="color: #166534;">Summary</h2>
                <p><strong>Total Deferred Maintenance:</strong> $${totalDeferred.toLocaleString()}</p>
                <p><strong>High Priority Items:</strong> ${highPriorityItems}</p>

                <h2 style="color: #166534; margin-top: 40px;">Facility Items</h2>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background: #f1f5f9;">
                            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Category</th>
                            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Description</th>
                            <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Est. Cost</th>
                            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Condition</th>
                            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Priority</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td style="padding: 12px; border: 1px solid #ddd;">${item.category}</td>
                                <td style="padding: 12px; border: 1px solid #ddd;">${item.description}</td>
                                <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">$${item.estimatedCost.toLocaleString()}</td>
                                <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${item.condition}</td>
                                <td style="padding: 12px; text-align: center; border: 1px solid #ddd; font-weight: bold; color: ${item.priority === 'High' ? '#991b1b' : item.priority === 'Medium' ? '#ca8a04' : '#166534'}">
                                    ${item.priority}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <p style="margin-top: 60px; text-align: center; color: #666; font-size: 12px;">
                    Generated by School Health Score • ${new Date().toLocaleDateString()}
                </p>
            </div>
        `;

        const opt = {
            margin: 15,
            filename: `deferred-maintenance-${schoolName.replace(/\s+/g, '-')}-${currentYear}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: {
                unit: 'mm' as const,
                format: 'a4' as const,
                orientation: 'portrait' as const
            }
        } as const;

        html2pdf().set(opt).from(reportHtml).save();
    };

    // Backlog Chart
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const maxCost = Math.max(...items.map(i => i.estimatedCost), 100000);
        items.forEach((item, i) => {
            const barHeight = (item.estimatedCost / maxCost) * 180;
            const x = 60 + i * 110;
            ctx.fillStyle = item.priority === 'High' ? '#991b1b' : item.priority === 'Medium' ? '#ca8a04' : '#166534';
            ctx.fillRect(x, 220 - barHeight, 70, barHeight);
            ctx.fillStyle = '#1e2937';
            ctx.font = '12px Arial';
            ctx.fillText(item.category.substring(0, 8), x + 10, 245);
            ctx.fillText(`$${Math.round(item.estimatedCost / 1000)}k`, x + 10, 265);
        });

        ctx.fillStyle = '#1e2937';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Deferred Maintenance Backlog', 50, 40);
    }, [items]);

    useEffect(() => {
        if (user) loadHistory();
    }, [user]);

    return (
        <div className="min-h-screen bg-slate-50">
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
                                <a href="/calculator" className="block px-6 py-3 hover:bg-emerald-50">School Health Calculator</a>
                                <a href="/staff-leadership" className="block px-6 py-3 hover:bg-emerald-50">Staff & Leadership</a>
                                <a href="/enrollment-projection" className="block px-6 py-3 hover:bg-emerald-50">Enrollment Projection</a>
                                <a href="/deferred-maintenance" className="block px-6 py-3 hover:bg-emerald-50 font-medium text-emerald-700">Deferred Maintenance</a>
                       
                            </div>
                        </div>
                    </div>
                    <UserButton />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Deferred Maintenance Calculator</h1>
                        <p className="text-slate-600">Track your facility backlog with automatic prioritization.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={downloadReport}
                            className="bg-white border border-slate-300 hover:bg-slate-50 px-6 py-3 rounded-2xl font-medium flex items-center gap-2"
                        >
                            📄 Download Report
                        </button>
                        <button
                            onClick={saveAssessment}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-2xl font-medium flex items-center gap-2"
                        >
                            💾 Save Assessment
                        </button>
                    </div>
                </div>

                {/* Condition Scoring Guide */}
                <div className="bg-white border rounded-3xl p-6 mb-8">
                    <h3 className="font-semibold mb-4 text-lg">Condition Scoring Guide (1-5)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {conditionLegend.map(item => (
                            <div key={item.score} className="border rounded-2xl p-4 hover:bg-slate-50 transition">
                                <div className="text-3xl font-bold text-emerald-700 mb-1">{item.score}</div>
                                <div className="font-medium mb-1">{item.label}</div>
                                <div className="text-sm text-slate-600 leading-snug">{item.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border p-6">
                            <h2 className="font-semibold mb-4">School Information</h2>
                            <input
                                value={schoolName}
                                onChange={e => setSchoolName(e.target.value)}
                                className="w-full border rounded-2xl px-4 py-3 mb-4"
                                placeholder="School Name"
                            />
                            <label className="block text-sm mb-1">Current School Year</label>
                            <input
                                type="number"
                                value={currentYear}
                                onChange={e => setCurrentYear(Number(e.target.value))}
                                className="w-full border rounded-2xl px-4 py-3"
                            />
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl shadow-sm border p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">Facility Items</h2>
                            <button
                                onClick={addItem}
                                className="bg-slate-100 hover:bg-slate-200 px-6 py-2 rounded-2xl font-medium"
                            >
                                + Add Item
                            </button>
                        </div>

                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3">Category</th>
                                    <th className="text-left py-3">Description</th>
                                    <th className="text-right py-3">Est. Cost</th>
                                    <th className="text-center py-3">Condition (1-5)</th>
                                    <th className="text-center py-3">Years Since</th>
                                    <th className="text-center py-3">Priority</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id} className="border-b">
                                        <td className="py-3">
                                            <select value={item.category} onChange={e => updateItem(item.id, 'category', e.target.value)} className="border rounded-lg px-3 py-1 w-40">
                                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </td>
                                        <td className="py-3">
                                            <input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} className="border rounded-lg px-3 py-1 w-full" />
                                        </td>
                                        <td className="py-3 text-right">
                                            <input type="number" value={item.estimatedCost} onChange={e => updateItem(item.id, 'estimatedCost', Number(e.target.value))} className="border rounded-lg px-3 py-1 w-28 text-right" />
                                        </td>
                                        <td className="py-3 text-center">
                                            <select value={item.condition} onChange={e => updateItem(item.id, 'condition', Number(e.target.value))} className="border rounded-lg px-3 py-1">
                                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                        </td>
                                        <td className="py-3 text-center">
                                            <input type="number" value={item.yearsSinceLast} onChange={e => updateItem(item.id, 'yearsSinceLast', Number(e.target.value))} className="border rounded-lg px-3 py-1 w-16 text-center" />
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className={`px-4 py-1 rounded-full text-xs font-medium ${item.priority === 'High' ? 'bg-red-100 text-red-700' :
                                                    item.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {item.priority}
                                            </span>
                                        </td>
                                        <td className="py-3 text-center">
                                            <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700">✕</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="mt-8 bg-emerald-50 rounded-3xl p-6 flex justify-between items-center">
                            <div>
                                <p className="text-emerald-700 text-sm">Total Deferred Maintenance</p>
                                <p className="text-4xl font-bold text-emerald-800">${totalDeferred.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-emerald-700 text-sm">High Priority Items</p>
                                <p className="text-4xl font-bold text-red-600">{highPriorityItems}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 bg-white rounded-3xl shadow-sm border p-8">
                    <h2 className="font-semibold mb-4">Backlog Visualization</h2>
                    <canvas ref={canvasRef} width="900" height="300" className="w-full" />
                </div>

                <div className="mt-12 bg-white rounded-3xl shadow-sm border p-8">
                    <h2 className="text-2xl font-semibold mb-6">Year-over-Year History</h2>
                    <button onClick={loadHistory} className="mb-4 text-sm bg-slate-100 hover:bg-slate-200 px-5 py-2 rounded-2xl">Refresh</button>
                    <div className="space-y-3">
                        {history.length === 0 ? (
                            <p className="text-slate-500">No assessments saved yet.</p>
                        ) : (
                            history.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-5 border rounded-2xl">
                                    <div><strong>{item.review_date?.substring(0, 4) || '—'}</strong></div>
                                    <div className="font-semibold">${item.data?.totalDeferred?.toLocaleString() || '0'}</div>
                                    <div className="text-emerald-700 font-medium">High Priority: {item.data?.highPriorityItems || 0}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
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
        </div>
    );
}