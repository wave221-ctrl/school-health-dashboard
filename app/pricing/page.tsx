'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-slate-50">
         

            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4">Support the Project</h1>
                    <p className="text-xl text-slate-600 max-w-md mx-auto">
                        If these tools have helped your school, consider buying me a coffee ☕
                    </p>
                </div>

                {/* Buy Me a Coffee Section */}
                <div className="bg-white rounded-3xl shadow-sm border p-10 text-center">
                    <div className="mb-8">
                        <img
                            src="https://cdn.buymeacoffee.com/buttons/default-orange.png"
                            alt="Buy Me a Coffee"
                            className="mx-auto h-12"
                        />
                    </div>

                    <h2 className="text-3xl font-semibold mb-3">Buy Me a Coffee</h2>
                    <p className="text-slate-600 mb-8 max-w-md mx-auto">
                        Your support helps me keep building free tools for Christian school leaders.
                        Every coffee makes a difference!
                    </p>

                    {/* Main Buy Me a Coffee Button */}
                    <a
                        href="buymeacoffee.com/flourish_score"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-[#FFDD00] hover:bg-[#f5c800] text-black font-semibold text-lg px-10 py-4 rounded-2xl transition shadow-md"
                    >
                        ☕ Buy Me a Coffee
                    </a>

                    <div className="mt-10 pt-8 border-t text-sm text-slate-500">
                        Suggested amounts: $5 • $10 • $25 • Any amount is appreciated
                    </div>
                </div>

                {/* Optional Extra Support Options */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-3xl p-6 text-center border">
                        <div className="text-4xl mb-3">☕</div>
                        <h3 className="font-semibold mb-1">One-time Coffee</h3>
                        <p className="text-sm text-slate-600">Quick support</p>
                    </div>
                    <div className="bg-white rounded-3xl p-6 text-center border">
                        <div className="text-4xl mb-3">📚</div>
                        <h3 className="font-semibold mb-1">Monthly Supporter</h3>
                        <p className="text-sm text-slate-600">Ongoing encouragement</p>
                    </div>
                    <div className="bg-white rounded-3xl p-6 text-center border">
                        <div className="text-4xl mb-3">🙏</div>
                        <h3 className="font-semibold mb-1">Prayer & Feedback</h3>
                        <p className="text-sm text-slate-600">Also incredibly valuable</p>
                    </div>
                </div>

                <div className="text-center mt-16 text-slate-500 text-sm">
                    Thank you for using and supporting School Health Score ❤️
                </div>
            </div>
        </div>
    );
}