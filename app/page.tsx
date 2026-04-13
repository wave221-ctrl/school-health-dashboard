'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default function Home() {
    const { isSignedIn } = useUser();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
            {/* Navigation */}
            <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">S</div>
                    <span className="font-semibold text-2xl text-slate-900">School Health Score</span>
                </div>

                {isSignedIn && (
                    <div className="flex items-center gap-6">
                        <Link href="/calculator" className="font-medium text-slate-700 hover:text-slate-900">
                            Open Dashboard
                        </Link>
                        <UserButton />
                    </div>
                )}
            </nav>

            <div className="max-w-7xl mx-auto px-6 pt-12 pb-24 grid md:grid-cols-2 gap-16 items-center">

                {/* Left - Text */}
                <div>
                    <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
                        Know the true health of your school.
                    </h1>

                    <p className="text-2xl text-slate-600 mb-10">
                        A strategic platform for Christian school leaders to assess overall health,
                        track year-over-year progress, and generate clear, board-ready reports.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        {!isSignedIn ? (
                            <Link
                                href="/sign-in"
                                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xl font-semibold px-10 py-5 rounded-3xl transition-all text-center"
                            >
                                Sign in to access tools
                            </Link>
                        ) : (
                            <Link
                                href="/calculator"
                                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xl font-semibold px-10 py-5 rounded-3xl transition-all text-center"
                            >
                                Open Dashboard →
                            </Link>
                        )}

                        <Link
                            href="/pricing"
                            className="border-2 border-slate-300 hover:border-slate-400 text-slate-700 text-xl font-semibold px-10 py-5 rounded-3xl transition-all text-center"
                        >
                            See Pricing
                        </Link>
                    </div>
                                    
                </div>

                {/* Right - Hero Image */}
                <div className="relative">
                    <img
                        src="https://i.imgur.com/BeqNXWh.jpeg"
                        alt="Christian school leaders collaborating"
                        className="rounded-3xl shadow-2xl w-full object-cover aspect-video"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/10 to-transparent rounded-3xl"></div>
                </div>
            </div>

            {/* Highlighted Enrollment Projection Box */}
            <div className="max-w-5xl mx-auto px-6 pb-16">
                <div className="bg-white border border-emerald-200 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1">
                        <div className="inline-block bg-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-1 rounded-2xl mb-3">
                            NEW TOOL
                        </div>
                        <h2 className="text-3xl font-semibold text-slate-900 mb-3">
                            Enrollment Projection Calculator
                        </h2>
                        <p className="text-slate-600 text-lg">
                            Build accurate year-over-year enrollment forecasts by grade, model retention and new student growth,
                            and generate clean reports for budgeting and board presentations.
                        </p>
                        <Link
                            href={isSignedIn ? "/enrollment-projection" : "/sign-in"}
                            className="inline-block mt-6 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-8 py-4 rounded-3xl transition-all"
                        >
                            {isSignedIn ? 'Try Enrollment Projection Tool →' : 'Sign in to try'}
                        </Link>
                    </div>

                    <div className="flex-1 flex justify-center">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 text-center max-w-xs">
                            <div className="text-6xl mb-4">📈</div>
                            <p className="font-medium text-emerald-700">See your future enrollment at a glance</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Benefits */}
            <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-8 pb-20">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="text-4xl mb-4">📈</div>
                    <h3 className="font-semibold text-xl mb-2">Year-over-Year Tracking</h3>
                    <p className="text-slate-600">Visualize real progress with automatic multi-year charts and trends.</p>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="text-4xl mb-4">📋</div>
                    <h3 className="font-semibold text-xl mb-2">Board-Ready Reports</h3>
                    <p className="text-slate-600">Instant professional PDFs with summaries, charts, and action plans.</p>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="font-semibold text-xl mb-2">Mission-Aligned Insights</h3>
                    <p className="text-slate-600">Score your school with biblical anchors and practical leadership standards.</p>
                </div>
            </div>
        </div>
    );
}