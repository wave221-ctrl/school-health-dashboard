'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 justify-center mx-auto">
                        <div className="w-10 h-10 bg-emerald-700 rounded-2xl flex items-center justify-center text-white font-bold text-3xl">S</div>
                        <span className="font-semibold text-3xl text-slate-900">School Health Score</span>
                    </div>
                </div>

                <SignIn
                    appearance={{
                        elements: {
                            rootBox: "mx-auto",
                            card: "shadow-xl rounded-3xl border border-slate-100",
                            headerTitle: "text-2xl font-semibold text-slate-900",
                            headerSubtitle: "text-slate-600",
                            formButtonPrimary: "bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl",
                            footerActionLink: "text-emerald-700 hover:text-emerald-800",
                        }
                    }}
                    afterSignInUrl="/calculator"
                    afterSignUpUrl="/calculator"
                />
            </div>
        </div>
    );
}