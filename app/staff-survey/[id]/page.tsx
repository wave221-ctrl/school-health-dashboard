'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';   // ← same path as your other pages

export default function PublicStaffSurvey() {
    const params = useParams();
    const surveyId = params.id as string;

    const [domains, setDomains] = useState([
        {
            name: 'Leadership Effectiveness',
            metrics: [
                { name: 'Clarity of vision and communication', help: 'Leaders clearly articulate direction and expectations', score: 3 },
                { name: 'Trust and approachability', help: 'Staff feel safe bringing concerns to leadership', score: 3 },
                { name: 'Decision-making transparency', help: 'Decisions are explained and staff feel heard', score: 3 }
            ]
        },
        {
            name: 'Staff Morale & Retention',
            metrics: [
                { name: 'Overall staff satisfaction', help: 'Staff enjoy coming to work and feel valued', score: 3 },
                { name: 'Intention to stay next year', help: 'Staff plan to return next school year', score: 3 },
                { name: 'Work-life balance', help: 'Staff feel supported and not burned out', score: 3 }
            ]
        },
        {
            name: 'Professional Development',
            metrics: [
                { name: 'Growth opportunities', help: 'Staff have access to meaningful training', score: 3 },
                { name: 'Mentorship and coaching', help: 'New and veteran teachers receive support', score: 3 },
                { name: 'Feedback culture', help: 'Constructive feedback is given regularly', score: 3 }
            ]
        },
        {
            name: 'Spiritual Culture',
            metrics: [
                { name: 'Faith integration in daily life', help: 'Staff experience spiritual formation at work', score: 3 },
                { name: 'Prayer and worship culture', help: 'Prayer is regular and meaningful', score: 3 },
                { name: 'Biblical worldview among staff', help: 'Staff model Christ-like character', score: 3 }
            ]
        }
    ]);

    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const updateScore = (domainIndex: number, metricIndex: number, score: number) => {
        const newDomains = [...domains];
        newDomains[domainIndex].metrics[metricIndex].score = score;
        setDomains(newDomains);
    };

    const submitSurvey = async () => {
        if (!surveyId) return alert('Invalid survey link');

        setLoading(true);

        const payload = {
            survey_id: surveyId,
            tool: 'staff-leadership',
            submitted_at: new Date().toISOString(),
            data: { domains }
        };

        const { error } = await supabase
            .from('assessments')
            .insert(payload);

        setLoading(false);

        if (error) {
            alert('Error submitting survey: ' + error.message);
        } else {
            setSubmitted(true);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <div className="max-w-md text-center">
                    <div className="text-6xl mb-6">✅</div>
                    <h1 className="text-3xl font-bold mb-3">Thank you!</h1>
                    <p className="text-slate-600">Your anonymous feedback has been recorded.</p>
                    <p className="text-slate-500 mt-8 text-sm">Your responses will help your school leadership improve.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="max-w-4xl mx-auto px-6">
                <div className="bg-white rounded-3xl shadow-sm border p-10">
                    <h1 className="text-3xl font-bold text-center mb-2">Staff & Leadership Health Survey</h1>
                    <p className="text-center text-slate-600 mb-10">
                        Your responses are completely anonymous.<br />
                        Please rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree).
                    </p>

                    {domains.map((domain, dIndex) => (
                        <div key={dIndex} className="mb-12">
                            <h2 className="text-xl font-semibold mb-6 border-b pb-3">{domain.name}</h2>
                            {domain.metrics.map((metric, mIndex) => (
                                <div key={mIndex} className="flex items-start gap-6 mb-8">
                                    <div className="flex-1">
                                        <div className="font-medium">{metric.name}</div>
                                        <div className="text-sm text-slate-500">{metric.help}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(score => (
                                            <button
                                                key={score}
                                                onClick={() => updateScore(dIndex, mIndex, score)}
                                                className={`w-10 h-10 rounded-2xl font-semibold transition-all ${metric.score === score
                                                        ? 'bg-emerald-700 text-white'
                                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                                    }`}
                                            >
                                                {score}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}

                    <div className="flex justify-center mt-10">
                        <button
                            onClick={submitSurvey}
                            disabled={loading}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white px-12 py-5 rounded-3xl font-semibold text-lg disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Anonymous Responses'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}