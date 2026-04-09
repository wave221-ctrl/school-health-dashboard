'use client';

import HealthCalculator from '../components/HealthCalculator';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default function CalculatorPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">

                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-700 rounded-2xl flex items-center justify-center text-white font-bold">S</div>
                            <span className="font-semibold text-xl">School Health Score</span>
                        </div>

                        {/* My Tools Dropdown - Fixed hover area */}
                        <div className="relative group">
                            <button className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium px-5 py-3 rounded-2xl hover:bg-slate-100 transition">
                                My Tools
                                <span className="text-xs">▼</span>
                            </button>

                            {/* Dropdown with better hover tolerance */}
                            <div className="absolute left-0 mt-2 w-64 bg-white rounded-3xl shadow-xl border border-slate-100 py-2 z-50 
                            opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                            transition-all duration-200">
                                <Link
                                    href="/calculator"
                                    className="block px-6 py-3 hover:bg-emerald-50 text-slate-700 font-medium"
                                >
                                    School Health Calculator
                                </Link>
                                <Link
                                    href="/enrollment-projection"
                                    className="block px-6 py-3 hover:bg-emerald-50 text-slate-700 font-medium"
                                >
                                    Enrollment Projection Calculator
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* User Button */}
                    <UserButton />

                </div>
            </div>
                    </div>

                    {/* User Button - Logout/Profile */}
                    <UserButton />

                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                <HealthCalculator />
            </div>
        </div>
    );
}