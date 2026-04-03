'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import {
    CreditCard, CheckCircle, XCircle, Clock, RefreshCw,
    ArrowLeft, TrendingUp, IndianRupee, Calendar, Search,
    Filter, Download, QrCode, Eye
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface RenewalOrder {
    id: string
    order_id: string
    qr_id: string
    days: number
    amount: number
    status: string
    customer_name: string
    customer_email: string
    customer_phone: string
    cashfree_order_id: string | null
    new_expiry: string | null
    paid_at: string | null
    created_at: string
    qr_codes?: { qr_number: string }
}

export default function RenewalOrdersPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#060608] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>}>
            <RenewalOrdersContent />
        </Suspense>
    )
}

function RenewalOrdersContent() {
    const [orders, setOrders] = useState<RenewalOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [search, setSearch] = useState('')

    useEffect(() => { loadOrders() }, [])

    async function loadOrders() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('qr_renewal_orders')
                .select('*, qr_codes(qr_number)')
                .order('created_at', { ascending: false })
                .limit(100)

            if (error) throw error
            setOrders(data || [])
        } catch (err: any) {
            toast.error('Failed to load renewal orders')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const stats = {
        total: orders.length,
        success: orders.filter(o => o.status === 'SUCCESS').length,
        pending: orders.filter(o => o.status === 'PENDING').length,
        failed: orders.filter(o => ['FAILED', 'USER_DROPPED'].includes(o.status)).length,
        revenue: orders.filter(o => o.status === 'SUCCESS').reduce((sum, o) => sum + (o.amount || 0), 0)
    }

    const filtered = orders.filter(o => {
        if (statusFilter !== 'all' && o.status !== statusFilter) return false
        if (search) {
            const s = search.toLowerCase()
            return o.order_id.toLowerCase().includes(s) ||
                o.customer_name.toLowerCase().includes(s) ||
                o.customer_email.toLowerCase().includes(s) ||
                o.qr_codes?.qr_number?.toLowerCase().includes(s)
        }
        return true
    })

    const statusBadge = (status: string) => {
        const map: Record<string, { color: string; icon: React.ReactNode }> = {
            SUCCESS: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle className="w-3 h-3" /> },
            PENDING: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: <Clock className="w-3 h-3" /> },
            FAILED: { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: <XCircle className="w-3 h-3" /> },
            USER_DROPPED: { color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20', icon: <XCircle className="w-3 h-3" /> },
        }
        const s = map[status] || map.PENDING
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${s.color}`}>
                {s.icon} {status.replace('_', ' ')}
            </span>
        )
    }

    return (
        <div className="min-h-screen bg-[#060608] text-zinc-100 p-6 lg:p-10">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <Link href="/admin/expiry" className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-300 text-xs font-bold uppercase tracking-widest mb-4 transition-colors">
                        <ArrowLeft className="w-3 h-3" /> Back to Expiry
                    </Link>
                    <h1 className="text-5xl font-black uppercase italic tracking-tight leading-none">
                        Renewal <span className="text-purple-500">Orders</span>
                    </h1>
                    <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest mt-2">
                        Cashfree Payment Records
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
                    {[
                        { label: 'Total Orders', val: stats.total, icon: CreditCard, color: 'purple' },
                        { label: 'Successful', val: stats.success, icon: CheckCircle, color: 'emerald' },
                        { label: 'Pending', val: stats.pending, icon: Clock, color: 'amber' },
                        { label: 'Failed', val: stats.failed, icon: XCircle, color: 'rose' },
                        { label: 'Revenue', val: `₹${stats.revenue.toLocaleString()}`, icon: IndianRupee, color: 'blue' },
                    ].map(s => (
                        <div key={s.label} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
                            <div className={`w-8 h-8 rounded-xl bg-${s.color}-500/15 flex items-center justify-center mb-3`}>
                                <s.icon className={`w-4 h-4 text-${s.color}-400`} />
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">{s.label}</p>
                            <p className="text-2xl font-black text-white italic">{s.val}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <input
                            type="text"
                            placeholder="Search by Order ID, Name, Email, QR number..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-zinc-900/50 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-300 focus:outline-none focus:border-purple-500 transition-colors"
                    >
                        <option value="all">All Status</option>
                        <option value="SUCCESS">Success</option>
                        <option value="PENDING">Pending</option>
                        <option value="FAILED">Failed</option>
                        <option value="USER_DROPPED">User Dropped</option>
                    </select>
                    <button
                        onClick={loadOrders}
                        className="flex items-center gap-2 px-4 py-3 bg-zinc-900/50 border border-white/5 rounded-xl text-xs text-zinc-400 hover:text-white hover:border-white/20 transition-all font-black uppercase tracking-wider"
                    >
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>

                {/* Table */}
                <div className="bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-20 text-center">
                            <CreditCard className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                            <p className="text-zinc-600 font-black uppercase text-xs tracking-widest">No orders found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        {['Order ID', 'QR Number', 'Customer', 'Days', 'Amount', 'Status', 'Paid At', 'New Expiry'].map(h => (
                                            <th key={h} className="px-4 py-4 text-left text-[9px] font-black uppercase tracking-widest text-zinc-600">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((order, i) => (
                                        <tr key={order.id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-zinc-900/20'}`}>
                                            <td className="px-4 py-4">
                                                <p className="text-[10px] font-black text-zinc-400 break-all max-w-[140px]">{order.order_id}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <QrCode className="w-3 h-3 text-zinc-600" />
                                                    <span className="text-[10px] font-black text-zinc-300">{order.qr_codes?.qr_number || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-[10px] font-black text-white">{order.customer_name}</p>
                                                <p className="text-[9px] text-zinc-600">{order.customer_email}</p>
                                                <p className="text-[9px] text-zinc-700">{order.customer_phone}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm font-black text-purple-400 italic">{order.days}d</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm font-black text-white">₹{order.amount}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                {statusBadge(order.status)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-[10px] text-zinc-500 font-bold">
                                                    {order.paid_at ? new Date(order.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-[10px] text-emerald-400 font-bold">
                                                    {order.new_expiry ? new Date(order.new_expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                                </p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <p className="text-center text-[10px] text-zinc-700 font-bold mt-6 uppercase tracking-widest">
                    Showing {filtered.length} of {orders.length} orders
                </p>
            </div>
        </div>
    )
}
