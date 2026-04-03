'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, QrCode, ArrowRight, Calendar, Shield } from 'lucide-react'
import Link from 'next/link'

export default function RenewalSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#060608]" />}>
            <SuccessContent />
        </Suspense>
    )
}

function SuccessContent() {
    const searchParams = useSearchParams()
    const order_id = searchParams.get('order_id')
    const days = searchParams.get('days')
    const expiry = searchParams.get('expiry')

    const expiryDate = expiry ? new Date(expiry) : null

    return (
        <div className="min-h-screen bg-[#060608] text-zinc-100 relative overflow-hidden flex items-center justify-center px-4">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-emerald-500/8 blur-[200px] rounded-full" />
            </div>

            <div className="relative z-10 text-center max-w-lg w-full">
                {/* Success Icon */}
                <div className="relative inline-flex mb-8">
                    <div className="w-28 h-28 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-14 h-14 text-emerald-500" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                        <span className="text-sm">✓</span>
                    </div>
                </div>

                <h1 className="text-4xl lg:text-5xl font-black uppercase italic tracking-tight mb-4">
                    Payment <span className="text-emerald-400">Successful!</span>
                </h1>
                <p className="text-zinc-500 font-bold text-sm mb-10">
                    Your QR code has been successfully renewed and is now active.
                </p>

                {/* Details Card */}
                <div className="bg-zinc-900/50 border border-emerald-500/20 rounded-3xl p-6 mb-8 text-left">
                    <div className="grid grid-cols-2 gap-4">
                        {order_id && (
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">Order ID</p>
                                <p className="text-xs font-black text-zinc-300 break-all">{order_id}</p>
                            </div>
                        )}
                        {days && (
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">Extended By</p>
                                <p className="text-lg font-black text-emerald-400 italic">{days} Days</p>
                            </div>
                        )}
                        {expiryDate && (
                            <div className="col-span-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">New Expiry Date</p>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-emerald-500" />
                                    <p className="text-base font-black text-white">
                                        {expiryDate.toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'long', year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-8">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-zinc-600">Your QR is now active and ready to use</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/admin/dashboard"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 shadow-[0_10px_30px_rgba(16,185,129,0.3)]"
                    >
                        Go to Dashboard
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/admin/expiry"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-300 font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95"
                    >
                        <QrCode className="w-4 h-4" />
                        View Expiry Status
                    </Link>
                </div>
            </div>
        </div>
    )
}
