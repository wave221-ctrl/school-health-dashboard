'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function DiscFill() {
    const { id } = useParams();
    const router = useRouter();

    const [name, setName] = useState('');
    const [D, setD] = useState(50);
    const [I, setI] = useState(50);
    const [S, setS] = useState(50);
    const [C, setC] = useState(50);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const submitAssessment = async () => {
        if (!name.trim()) {
            alert("Please enter your name");
            return;
        }

        setLoading(true);

        const { error } = await supabase.from('assessments').insert({
            tool: 'disc-assessment-response',
            review_date: new Date().toISOString().split('T')[0],
            data: {
                shareId: id,
                name: name.trim(),
                D,
                I,
                S,
                C,
                submittedAt: new Date().toISOString()
            }
        });

        setLoading(false);

        if (error) {
            alert("Error submitting. Please try again.");
            console.error(error);
        } else {
            setSubmitted(true);
            setTimeout(() => {
                router.push('/thank-you');
            }, 1800);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-6">
                    <div className="text-6xl mb-6">✅</div>
                    <h1 className="text-4xl font-bold text-emerald-700 mb-4">Thank You!</h1>
                    <p className="text-xl text-slate-600">
                        Your DISC assessment has been submitted successfully.<br />
                        Your leader will see your results shortly.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="max-w-2xl mx-auto px-6">
                <div className="bg-white rounded-3xl shadow-sm border p-10">
                    <h1 className="text-3xl font-bold text-center mb-2">DISC Assessment</h1>
                    <p className="text-center text-slate-600 mb-10">
                        Please rate yourself honestly from 0 to 100 for each trait.
                    </p>

                    <div className="space-y-10">
                        <div>
                            <label className="block font-medium mb-3 text-lg">Your Full Name</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full border rounded-2xl px-5 py-4 text-lg"
                                placeholder="Enter your full name"
                            />
                        </div>

                        {[
                            { label: "D — Dominance (Decisive, Results-oriented)", value: D, setter: setD, color: "text-red-600" },
                            { label: "I — Influence (Outgoing, Persuasive, Enthusiastic)", value: I, setter: setI, color: "text-amber-600" },
                            { label: "S — Steadiness (Patient, Team-player, Supportive)", value: S, setter: setS, color: "text-blue-600" },
                            { label: "C — Conscientiousness (Analytical, Detail-oriented, Accurate)", value: C, setter: setC, color: "text-emerald-600" }
                        ].map((item, idx) => (
                            <div key={idx}>
                                <label className="block font-medium mb-2">{item.label}</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={item.value}
                                    onChange={e => item.setter(Number(e.target.value))}
                                    className="w-full accent-emerald-600"
                                />
                                <div className={`text-center font-bold text-3xl mt-2 ${item.color}`}>
                                    {item.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={submitAssessment}
                        disabled={loading || !name.trim()}
                        className="mt-12 w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white py-4 rounded-2xl font-semibold text-lg transition"
                    >
                        {loading ? "Submitting..." : "Submit My DISC Profile"}
                    </button>
                </div>
            </div>
        </div>
    );
}