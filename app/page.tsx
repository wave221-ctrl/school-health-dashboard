'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default function Home() {
    const { isSignedIn, user } = useUser();

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
                        <UserButton afterSignOutUrl="/" />
                    </div>
                )}
            </nav>

            <div className="max-w-7xl mx-auto px-6 pt-12 pb-24 grid md:grid-cols-2 gap-16 items-center">

                {/* Left - Text Content */}
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
                                Get Started Free
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
                            href="/billing"
                            className="border-2 border-slate-300 hover:border-slate-400 text-slate-700 text-xl font-semibold px-10 py-5 rounded-3xl transition-all text-center"
                        >
                            See Pricing
                        </Link>
                    </div>
                </div>

                {/* Right - Hero Image */}
                <div className="relative">
                    <img
                        src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1"
                        alt="Christian school leaders collaborating"
                        className="rounded-3xl shadow-2xl w-full object-cover aspect-video"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/10 to-transparent rounded-3xl"></div>
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