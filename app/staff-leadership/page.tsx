'use client';

import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function StaffLeadershipDashboard() {
    const { user } = useUser();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Nav */}
            <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-700 rounded-2xl flex items-center justify-center text-white font-bold">S</div>
                            <span className="font-semibold text-xl">School Health Score</span>
                        </div>

                        <div className="relative group">
                            <button className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium px-5 py-3 rounded-2xl hover:bg-slate-100 transition">
                                My Tools
                                <span className="text-xs">▼</span>
                            </button>
                            <div className="absolute left-0 mt-2 w-64 bg-white rounded-3xl shadow-xl border border-slate-100 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <Link href="/calculator" className="block px-6 py-3 hover:bg-emerald-50 text-slate-700 font-medium">School Health Calculator</Link>
                                <Link href="/enrollment-projection" className="block px-6 py-3 hover:bg-emerald-50 text-slate-700 font-medium">Enrollment Projection</Link>
                                <Link href="/staff-leadership" className="block px-6 py-3 hover:bg-emerald-50 text-slate-700 font-medium">Staff & Leadership Health</Link>
                            </div>
                        </div>
                    </div>
                    <UserButton />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">
                <h1 className="text-4xl font-bold mb-2">Staff & Leadership Health Assessment</h1>
                <p className="text-slate-600 mb-8">Anonymous staff survey + aggregated insights</p>

                <div className="bg-white rounded-3xl shadow-sm border p-8">
                    <h2 className="text-2xl font-semibold mb-6">Current Survey Status</h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="border rounded-2xl p-6 text-center">
                            <p className="text-emerald-600 font-medium">Active Survey</p>
                            <p className="text-5xl font-bold text-slate-900 mt-2">Spring 2026</p>
                            <button className="mt-6 w-full bg-emerald-700 text-white py-3 rounded-2xl font-medium">
                                View Results
                            </button>
                        </div>

                        <div className="border rounded-2xl p-6 text-center">
                            <p className="text-slate-500">Responses Received</p>
                            <p className="text-5xl font-bold text-slate-900 mt-2">28 / 42</p>
                            <p className="text-sm text-slate-500 mt-1">67% response rate</p>
                        </div>

                        <div className="border rounded-2xl p-6 flex flex-col justify-center">
                            <button
                                onClick={() => alert('Survey link would be generated here')}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white py-4 rounded-2xl font-semibold"
                            >
                                Send New Anonymous Survey
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}