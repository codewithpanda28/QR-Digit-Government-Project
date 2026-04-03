'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
    QrCode, Calendar, Clock, AlertTriangle, ArrowRight,
    Search, ShieldAlert, CheckCircle2,
    Lock, Eye, Edit, RefreshCw, CreditCard
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'

export default function ExpiryManagementPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Accessing Expiry Matrix...</p>
            </div>
        }>
            <ExpiryContent />
        </Suspense>
    )
}

function ExpiryContent() {
    const [qrs, setQrs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | '24h' | '48h' | '7d' | 'expired' | 'permanent'>('all')
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            setLoading(true)
            const superProSession = localStorage.getItem('super_pro_admin_session')
            const adminSession = localStorage.getItem('admin_session')
            let userId = null
            let isSuperPro = false

            if (superProSession) {
                isSuperPro = true
            } else if (adminSession) {
                try {
                    const session = JSON.parse(adminSession)
                    userId = session.id
                } catch (e) { }
            }

            // FALLBACK: Check Supabase Auth if local session not found
            if (!isSuperPro && !userId) {
                const { data: { user: authUser } } = await supabase.auth.getUser()
                if (authUser) userId = authUser.id
            }

            if (!isSuperPro && !userId) {
                setQrs([])
                return
            }

            let query = supabase
                .from('qr_codes')
                .select('*')
                .order('created_at', { ascending: false })

            if (!isSuperPro && userId) {
                // Fetch user's role and sub-admins
                const { data: userData } = await supabase.from('users').select('role').eq('id', userId).maybeSingle()
                let targetUserIds = [userId]

                if (userData?.role === 'super_admin') {
                    const { data: subs } = await supabase.from('users').select('id').eq('created_by', userId)
                    if (subs) targetUserIds = [...targetUserIds, ...subs.map(s => s.id)]
                }

                query = query.in('generated_by', targetUserIds)
            }

            const { data, error } = await query
            if (error) throw error
            setQrs(data || [])
        } catch (error: any) {
            console.error('Error loading expiry data:', error)
            toast.error('Failed to load expiry data')
        } finally {
            setLoading(false)
        }
    }

    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)
    const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const filteredQrs = qrs.filter(qr => {
        const matchesSearch = qr.qr_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            qr.category?.toLowerCase().includes(searchTerm.toLowerCase())
        if (!matchesSearch) return false

        if (filter === 'all') return true

        const expiry = qr.subscription_end ? new Date(qr.subscription_end) : null
        const isPending = !expiry && qr.subscription_period > 0;

        if (filter === 'permanent') return expiry === null && !isPending
        if (filter === 'expired') return expiry !== null && expiry < now
        if (filter === '24h') return (expiry !== null && expiry >= now && expiry <= in24h) || (isPending && qr.subscription_period === 1)
        if (filter === '48h') return (expiry !== null && expiry > in24h && expiry <= in48h) || (isPending && qr.subscription_period === 2)
        if (filter === '7d') return (expiry !== null && expiry > in48h && expiry <= in7d) || (isPending && qr.subscription_period > 2 && qr.subscription_period <= 7)
        return true
    })

    const stats = {
        total: qrs.length,
        permanent: qrs.filter(q => !q.subscription_end && !q.subscription_period).length,
        expired: qrs.filter(q => q.subscription_end && new Date(q.subscription_end) < now).length,
        within24h: qrs.filter(q => {
            const exp = q.subscription_end ? new Date(q.subscription_end) : null
            return (exp && exp >= now && exp <= in24h) || (!exp && q.subscription_period === 1)
        }).length,
        within48h: qrs.filter(q => {
            const exp = q.subscription_end ? new Date(q.subscription_end) : null
            return (exp && exp > in24h && exp <= in48h) || (!exp && q.subscription_period === 2)
        }).length,
        within7d: qrs.filter(q => {
            const exp = q.subscription_end ? new Date(q.subscription_end) : null
            return (exp && exp > in48h && exp <= in7d) || (!exp && q.subscription_period > 2 && q.subscription_period <= 7)
        }).length
    }

    return (
        <div className="min-h-screen bg-[#060608] text-zinc-100 p-6 lg:p-12 relative overflow-hidden">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10 px-4 md:px-0">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
                    <div className="space-y-4">
                        <Link
                            href="/admin/dashboard"
                            className="inline-flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors text-xs font-black uppercase tracking-[0.2em] group"
                        >
                            <span className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg group-hover:border-primary/50 transition-colors">
                                <ArrowRight className="w-3 h-3 rotate-180" />
                            </span>
                            Back to Core
                        </Link>
                        <div>
                            <h1 className="text-5xl lg:text-7xl font-black tracking-[-0.05em] uppercase italic leading-none mb-4">
                                Expiry <span className="text-primary drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">Status</span>
                            </h1>
                            <div className="flex items-center gap-4">
                                <div className="h-0.5 w-12 bg-primary"></div>
                                <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px] lg:text-xs">
                                    Track QR Expiration & Validity
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
                    {[
                        { id: 'all', label: 'All Operational', icon: Calendar, count: stats.total, color: 'primary' },
                        { id: 'expired', label: 'Nodes Expired', icon: ShieldAlert, count: stats.expired, color: 'rose-500' },
                        { id: '24h', label: 'Next 24h', icon: Clock, count: stats.within24h, color: 'orange-500' },
                        { id: '48h', label: '24h to 48h', icon: Clock, count: stats.within48h, color: 'blue-500' },
                        { id: '7d', label: 'In 2-7 Days', icon: AlertTriangle, count: stats.within7d, color: 'amber-500' },
                        { id: 'permanent', label: 'Permanent', icon: Lock, count: stats.permanent, color: 'emerald-500' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id as any)}
                            className={`group p-6 rounded-[2.5rem] border transition-all duration-500 text-left relative overflow-hidden ${filter === tab.id
                                    ? `bg-${tab.color}/10 border-${tab.color}/30 shadow-[0_20px_40px_rgba(0,0,0,0.3)]`
                                    : 'bg-zinc-900/40 border-white/5 hover:border-white/10'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 ${filter === tab.id ? `bg-${tab.color} text-white` : 'bg-zinc-800 text-zinc-500'
                                }`}>
                                <tab.icon className="w-6 h-6" />
                            </div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${filter === tab.id ? `text-${tab.color}` : 'text-zinc-500'}`}>
                                {tab.label}
                            </p>
                            <p className="text-3xl font-black text-white italic">{tab.count}</p>

                            {filter === tab.id && (
                                <div className={`absolute bottom-0 left-0 h-1 bg-${tab.color} transition-all duration-1000`} style={{ width: '100%' }}></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative mb-12 group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-blue-500/10 blur opacity-75 group-focus-within:opacity-100 transition duration-1000"></div>
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-primary" />
                        <input
                            type="text"
                            placeholder="SEARCH BY QR ID OR CATEGORY..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0c0c0e] border border-white/10 rounded-2xl pl-16 pr-6 py-5 focus:outline-none focus:border-primary text-xs font-black tracking-[0.2em] uppercase italic transition-all"
                        />
                    </div>
                </div>

                {/* Node Grid */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 8].map(i => (
                                <div key={i} className="h-64 bg-zinc-900/20 rounded-[2rem] border border-white/5 animate-pulse"></div>
                            ))}
                        </div>
                    ) : filteredQrs.length === 0 ? (
                        <div className="py-20 text-center bg-zinc-900/20 rounded-[3rem] border border-dashed border-white/5">
                            <QrCode className="w-12 h-12 text-zinc-700 mx-auto mb-6" />
                            <h3 className="text-xl font-black text-zinc-500 uppercase italic tracking-widest">No nodes found for this criteria</h3>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredQrs.map((qr) => {
                                const expiry = qr.subscription_end ? new Date(qr.subscription_end) : null
                                const isExpired = expiry && expiry < now
                                const timeRemaining = expiry ? expiry.getTime() - now.getTime() : 0
                                const daysRemaining = expiry ? Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)) : null

                                return (
                                    <div
                                        key={qr.id}
                                        className="group relative flex flex-col bg-[#0c0c0e] border border-white/[0.03] hover:border-white/10 rounded-[2.5rem] p-6 transition-all duration-700 hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
                                    >
                                        {/* Accent Glow */}
                                        <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full -mr-16 -mt-16 transition-opacity duration-700 opacity-20 group-hover:opacity-40 ${isExpired ? 'bg-rose-500' : !expiry ? 'bg-emerald-500' : 'bg-primary'}`}></div>

                                        {/* Status Header */}
                                        <div className="flex items-center justify-between mb-8 relative z-10">
                                            <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest italic flex items-center gap-2 ${isExpired
                                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                                    : !expiry
                                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                                        : 'bg-primary/10 border-primary/20 text-primary'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></div>
                                                {isExpired ? 'Expired' : !expiry ? 'Permanent (Lifetime)' : 'Active QR'}
                                            </div>
                                            <div className="p-2 bg-zinc-900/50 rounded-lg border border-white/5">
                                                <QrCode className="w-4 h-4 text-zinc-600 group-hover:text-primary transition-colors" />
                                            </div>
                                        </div>

                                        {/* Expiry Content */}
                                        <div className="flex-1 relative z-10 mb-8">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none">QR ID: {qr.qr_number}</span>
                                                <span className="text-[8px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">REF: #{qr.id.slice(0, 4)}</span>
                                            </div>
                                            {qr.category && qr.category !== 'custom-category' && (
                                                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-tight mb-4 line-clamp-1 group-hover:text-primary transition-colors">
                                                    {qr.category.replace(/-/g, ' ')}
                                                </h3>
                                            )}

                                            <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-1 transition-all duration-500 ${isExpired
                                                    ? 'bg-rose-500/5 border-rose-500/10'
                                                    : !expiry
                                                        ? 'bg-emerald-500/5 border-emerald-500/10'
                                                        : daysRemaining !== null && daysRemaining <= 1
                                                            ? 'bg-orange-500/5 border-orange-500/10 group-hover:border-orange-500/30'
                                                            : 'bg-zinc-900/50 border-white/[0.03] group-hover:border-white/10'
                                                }`}>
                                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isExpired ? 'text-rose-500' : 'text-zinc-500'}`}>
                                                    {expiry ? 'Time Remaining' : qr.subscription_period > 0 ? 'Wait Period' : 'Life Span'}
                                                </span>
                                                <span className={`text-2xl font-black italic tracking-tighter ${isExpired ? 'text-rose-500' : !expiry ? (qr.subscription_period > 0 ? 'text-orange-500' : 'text-emerald-500') : daysRemaining !== null && daysRemaining <= 1 ? 'text-orange-500' : 'text-white'}`}>
                                                    {isExpired ? 'EXPIRED' : !expiry ? (qr.subscription_period > 0 ? `${qr.subscription_period}D PENDING` : 'PERMANENT') : `${daysRemaining} Days Left`}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="grid grid-cols-2 gap-3 relative z-10 pt-4 border-t border-white/[0.03]">
                                            <Link
                                                href={`/scan/${qr.id}`}
                                                target="_blank"
                                                className="py-3 bg-zinc-900 border border-white/5 rounded-xl text-zinc-500 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest italic"
                                            >
                                                <Eye className="w-4 h-4" /> View
                                            </Link>
                                            {isExpired ? (
                                                <Link
                                                    href={`/renewal?qr_id=${qr.id}&qr_number=${encodeURIComponent(qr.qr_number || '')}`}
                                                    className="py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest italic shadow-lg shadow-rose-500/20"
                                                >
                                                    <RefreshCw className="w-4 h-4" /> Renew
                                                </Link>
                                            ) : (
                                                <Link
                                                    href={`/admin/qrcodes`}
                                                    className="py-3 bg-white text-black rounded-xl hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest italic shadow-xl shadow-white/5"
                                                >
                                                    <Edit className="w-4 h-4" /> Manage
                                                </Link>
                                            )}
                                        </div>

                                        {/* Bottom Progress Bar */}
                                        {!isExpired && expiry && (
                                            <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-900/50">
                                                <div
                                                    className="h-full bg-primary transition-all duration-1000"
                                                    style={{ width: `${Math.max(5, Math.min(100, (daysRemaining! / 7) * 100))}%` }}
                                                ></div>
                                            </div>
                                        )}
                                        {!isExpired && !expiry && (
                                            <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500/20">
                                                <div className="h-full bg-emerald-500 w-full"></div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Styles for Tailwind colors that might not be detected if dynamic */}
            <style jsx>{`
                .bg-primary { background-color: rgb(168 85 247); }
                .text-primary { color: rgb(168 85 247); }
                .border-primary\/30 { border-color: rgba(168, 85, 247, 0.3); }
                .bg-primary\/10 { background-color: rgba(168, 85, 247, 0.1); }
                
                .bg-rose-500 { background-color: rgb(244 63 94); }
                .text-rose-500 { color: rgb(244 63 94); }
                .border-rose-500\/30 { border-color: rgba(244, 63, 94, 0.3); }
                .bg-rose-500\/10 { background-color: rgba(244, 63, 94, 0.1); }
                
                .bg-orange-500 { background-color: rgb(249 115 22); }
                .text-orange-500 { color: rgb(249 115 22); }
                .border-orange-500\/30 { border-color: rgba(249, 115, 22, 0.3); }
                .bg-orange-500\/10 { background-color: rgba(249, 115, 22, 0.1); }
                
                .bg-blue-500 { background-color: rgb(59 130 246); }
                .text-blue-500 { color: rgb(59 130 246); }
                .border-blue-500\/30 { border-color: rgba(59, 130, 246, 0.3); }
                .bg-blue-500\/10 { background-color: rgba(59, 130, 246, 0.1); }
            `}</style>
        </div>
    )
}
