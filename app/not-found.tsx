'use client';

import Link from 'next/link';
import { Shield, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="relative inline-flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
                    <div className="bg-zinc-900 border border-white/10 p-6 rounded-3xl relative">
                        <Shield className="w-16 h-16 text-blue-500 animate-pulse" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg">
                        Error 404
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">
                        Link Not Found
                    </h1>
                    <p className="text-zinc-500 font-medium">
                        The requested operational endpoint does not exist or has been relocated.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Link 
                        href="/"
                        className="flex items-center justify-center gap-2 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95"
                    >
                        <Home className="w-4 h-4" /> Return to Base
                    </Link>
                    <button 
                        onClick={() => window.history.back()}
                        className="flex items-center justify-center gap-2 py-4 bg-zinc-900 text-zinc-400 border border-white/5 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" /> Go Back
                    </button>
                </div>

                <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-[0.3em]">
                    Safety QR • Secured Matrix System
                </p>
            </div>
        </div>
    );
}
