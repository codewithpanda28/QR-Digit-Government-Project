'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
    DollarSign, TrendingUp, Calendar, Download, Filter,
    ArrowLeft, Users, CreditCard, Percent, ArrowUpRight
} from 'lucide-react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'

interface RevenueEntry {
    id: string
    qr_id: string
    sub_admin_id: string
    customer_name: string
    total_amount: number
    sub_admin_commission: number
    super_admin_revenue: number
    transaction_date: string
    payment_status: string
}

export default function RevenuePage() {
    const [revenueData, setRevenueData] = useState<RevenueEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'year'>('month')

    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalCommission: 0,
        netRevenue: 0,
        transactionCount: 0,
        avgTransaction: 0
    })

    // Sample chart data
    const monthlyData = [
        { month: 'Jan', revenue: 45000, commission: 6750 },
        { month: 'Feb', revenue: 52000, commission: 7800 },
        { month: 'Mar', revenue: 48000, commission: 7200 },
        { month: 'Apr', revenue: 61000, commission: 9150 },
        { month: 'May', revenue: 55000, commission: 8250 },
        { month: 'Jun', revenue: 67000, commission: 10050 },
    ]

    useEffect(() => {
        loadRevenueData()
    }, [filterPeriod])

    async function loadRevenueData() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('revenue_sharing')
                .select('*')
                .order('transaction_date', { ascending: false })
                .limit(50)

            if (error) throw error

            if (data) {
                setRevenueData(data as RevenueEntry[])

                // Calculate stats
                const total = data.reduce((sum, item) => sum + Number(item.total_amount), 0)
                const commission = data.reduce((sum, item) => sum + Number(item.sub_admin_commission), 0)
                const net = data.reduce((sum, item) => sum + Number(item.super_admin_revenue), 0)

                setStats({
                    totalRevenue: total,
                    totalCommission: commission,
                    netRevenue: net,
                    transactionCount: data.length,
                    avgTransaction: data.length > 0 ? total / data.length : 0
                })
            }
        } catch (error) {
            console.error('Error loading revenue data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-b-2 border-primary rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/admin/super/dashboard"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Revenue Analytics</h1>
                        <p className="text-muted-foreground">Track earnings, commissions, and financial performance</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={filterPeriod}
                            onChange={(e) => setFilterPeriod(e.target.value as any)}
                            className="px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                        </select>
                        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    {
                        label: 'Total Revenue',
                        value: `₹${stats.totalRevenue.toLocaleString()}`,
                        icon: DollarSign,
                        gradient: 'from-emerald-500 to-emerald-700',
                        change: '+12.5%'
                    },
                    {
                        label: 'Commission Paid',
                        value: `₹${stats.totalCommission.toLocaleString()}`,
                        icon: Percent,
                        gradient: 'from-orange-500 to-orange-700',
                        change: '+8.2%'
                    },
                    {
                        label: 'Net Revenue',
                        value: `₹${stats.netRevenue.toLocaleString()}`,
                        icon: TrendingUp,
                        gradient: 'from-purple-500 to-purple-700',
                        change: '+15.3%'
                    },
                    {
                        label: 'Transactions',
                        value: stats.transactionCount,
                        icon: CreditCard,
                        gradient: 'from-indigo-500 to-indigo-700',
                        change: '+24'
                    },
                    {
                        label: 'Avg Transaction',
                        value: `₹${Math.round(stats.avgTransaction).toLocaleString()}`,
                        icon: ArrowUpRight,
                        gradient: 'from-cyan-500 to-cyan-700',
                        change: '+3.1%'
                    },
                ].map((stat, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3`}>
                            <stat.icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-2xl font-bold mb-1">{stat.value}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                        <p className="text-xs text-emerald-500 font-bold">{stat.change}</p>
                    </div>
                ))}
            </div>

            {/* Revenue Chart */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold">Revenue Trend</h3>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="text-muted-foreground">Revenue</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span className="text-muted-foreground">Commission</span>
                        </div>
                    </div>
                </div>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData}>
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="commissionGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                            <XAxis dataKey="month" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                                itemStyle={{ color: '#10b981' }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revenueGradient)" />
                            <Area type="monotone" dataKey="commission" stroke="#f59e0b" strokeWidth={2} fill="url(#commissionGradient)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h3 className="text-lg font-bold">Recent Transactions</h3>
                </div>
                {revenueData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/30">
                                <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    <th className="px-6 py-4 text-left">Date</th>
                                    <th className="px-6 py-4 text-left">Customer</th>
                                    <th className="px-6 py-4 text-left">Sub-Admin</th>
                                    <th className="px-6 py-4 text-right">Total Amount</th>
                                    <th className="px-6 py-4 text-right">Commission</th>
                                    <th className="px-6 py-4 text-right">Your Revenue</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {revenueData.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-4 text-sm">
                                            {new Date(entry.transaction_date).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium">
                                            {entry.customer_name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {entry.sub_admin_id?.substring(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-right">
                                            ₹{Number(entry.total_amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-orange-500 text-right">
                                            -₹{Number(entry.sub_admin_commission).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-emerald-500 text-right">
                                            ₹{Number(entry.super_admin_revenue).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400">
                                                {entry.payment_status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-16 text-center">
                        <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                        <p className="text-muted-foreground font-medium">No revenue data yet</p>
                        <p className="text-xs text-muted-foreground mt-2">Transactions will appear here once sub-admins start selling QR codes</p>
                    </div>
                )}
            </div>
        </div>
    )
}
