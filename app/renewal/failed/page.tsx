'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { XCircle, RefreshCw, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function RenewalFailedPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#060608]" />}>
            <FailedContent />
        </Suspense>
    )
}

function FailedContent() {
    const searchParams = useSearchParams()
    const order_id = searchParams.get('order_id')
    const reason = searchParams.get('reason')

    const reasonMessages: Record<string, string> = {
        missing_params: 'Required payment parameters were missing.',
        USER_DROPPED: 'Payment was cancelled by user.',
        PAYMENT_FAILED: 'Payment was declined by the bank.',
        TRANSACTION_FAILED: 'Transaction could not be completed.',
        db_error: 'QR update failed. Please contact support.',
        server_error: 'A server error occurred. Please try again.',
    }

    const friendlyMessage = reason ? (reasonMessages[reason] || `Payment failed: ${reason}`) : 'Payment was not completed.'

    return (
        <div className="min-h-screen bg-[#060608] text-zinc-100 relative overflow-hidden flex items-center justify-center px-4">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-rose-500/6 blur-[200px] rounded-full" />
            </div>

            <div className="relative z-10 text-center max-w-lg w-full">
                {/* Failed Icon */}
                <div className="w-28 h-28 bg-rose-500/20 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto mb-8">
                    <XCircle className="w-14 h-14 text-rose-500" />
                </div>

                <h1 className="text-4xl lg:text-5xl font-black uppercase italic tracking-tight mb-4">
                    Payment <span className="text-rose-400">Failed</span>
                </h1>
                <p className="text-zinc-500 font-bold text-sm mb-6">
                    {friendlyMessage}
                </p>

                {order_id && (
                    <div className="bg-zinc-900/50 border border-rose-500/10 rounded-2xl p-4 mb-8 inline-block">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">Order Reference</p>
                        <p className="text-xs font-black text-zinc-400">{order_id}</p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 shadow-[0_10px_30px_rgba(244,63,94,0.25)]"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                    <Link
                        href="/admin/expiry"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-300 font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95"
                    >
                        View Expiry Page
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <p className="mt-8 text-xs text-zinc-700 font-bold">
                    If money was deducted, it will be refunded within 5-7 business days. Contact support if needed.
                </p>
            </div>
        </div>
    )
}
