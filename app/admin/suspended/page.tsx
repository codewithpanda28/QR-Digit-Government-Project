'use client'

import React from 'react'
import { AlertCircle, Phone, MessageSquare, ShieldAlert } from 'lucide-react'

export default function SuspendedPage() {
    return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/10 blur-[120px] rounded-full -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-500/10 blur-[120px] rounded-full -ml-64 -mb-64" />

            <div className="max-w-md w-full bg-[#111111] border border-rose-500/20 rounded-[40px] p-10 text-center relative z-10 backdrop-blur-3xl shadow-2xl">
                {/* Warning Icon Container */}
                <div className="w-24 h-24 bg-rose-500/10 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-rose-500/20 animate-pulse">
                    <ShieldAlert className="w-12 h-12 text-rose-500" />
                </div>

                <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">
                    Account <span className="text-rose-500">Restricted</span>
                </h1>
                
                <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-10">
                    Your security access has been suspended by the master administrator. Access to the command center is currently restricted.
                </p>

                {/* Contact Options */}
                <div className="space-y-4">
                    <button
                        onClick={() => window.location.href = 'tel:8252472186'}
                        className="w-full py-5 bg-zinc-950 border border-rose-500/30 text-rose-500 font-bold rounded-2xl transition-all hover:bg-rose-500 hover:text-white flex items-center justify-center gap-4 group"
                    >
                        <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        DIRECT HOTLINE
                    </button>

                    <button
                        onClick={() => {
                            const msg = encodeURIComponent("Requesting account reactivation for Safety QR system.")
                            window.open(`https://wa.me/918252472186?text=${msg}`, '_blank')
                        }}
                        className="w-full py-5 bg-zinc-950 border border-emerald-500/30 text-emerald-500 font-bold rounded-2xl transition-all hover:bg-emerald-500 hover:text-white flex items-center justify-center gap-4 group"
                    >
                        <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        WHATSAPP ADMIN
                    </button>
                </div>

                <div className="mt-10 pt-8 border-t border-white/5">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">SECURITY STATUS: LOCKED</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
