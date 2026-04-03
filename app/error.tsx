'use client';

import { ShieldAlert, RefreshCcw, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-10">
                {/* Visual Header */}
                <div className="relative inline-flex items-center justify-center">
                    <div className="absolute inset-0 bg-red-500/10 blur-[80px] rounded-full"></div>
                    <div className="bg-zinc-950 border border-red-500/20 w-24 h-24 rounded-3xl flex items-center justify-center relative shadow-2xl">
                        <ShieldAlert className="w-12 h-12 text-red-500" />
                    </div>
                    <div className="absolute -bottom-2 -right-4 bg-red-500 text-white text-[11px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-xl">
                        Server Drift Detected
                    </div>
                </div>

                {/* Error Messaging */}
                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                        System <br /> <span className="text-red-500">Glitch</span>
                    </h1>
                    <div className="space-y-2">
                        <p className="text-zinc-400 font-bold text-sm uppercase tracking-widest">
                            We've encountered a temporary synchronization error.
                        </p>
                        <p className="text-zinc-600 text-xs font-mono bg-white/[0.02] p-3 rounded-lg border border-white/5 opacity-50">
                            {error.message || "An unexpected operational error occurred."}
                        </p>
                    </div>
                </div>

                {/* Tactical Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => reset()}
                        className="col-span-2 py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                        <RefreshCcw className="w-4 h-4" /> Re-Sync Dashboard
                    </button>
                    <Link 
                        href="/" 
                        className="py-4 bg-zinc-900 text-zinc-400 border border-white/5 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Home className="w-3 h-3" /> Home
                    </Link>
                    <button 
                        onClick={() => window.history.back()}
                        className="py-4 bg-transparent text-zinc-600 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <ArrowLeft className="w-3 h-3" /> Back
                    </button>
                </div>

                {/* Footer Meta */}
                <div className="border-t border-white/5 pt-8">
                    <p className="text-[10px] text-zinc-800 font-black uppercase tracking-[0.4em] leading-relaxed">
                        Automatic Error Logging Active <br />
                        <span className="text-zinc-900">Safety QR • SecOps Protocol</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
