'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
    Users, TrendingUp, DollarSign, Activity, UserPlus, Search,
    MoreVertical, ArrowUpRight, Calendar, Shield, QrCode, AlertCircle, Loader2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#8b5cf6', '#6366f1', '#06b6d4', '#10b981', '#f59e0b']

interface SubAdmin {
    id: string
    name: string
    email: string
    phone: string | null
    created_at: string
    is_active: boolean
    config: {
        qr_quota: number
        qr_used: number
        commission_rate: number
        subscription_plan: string
        subscription_amount: number
        is_active: boolean
    } | null
}

interface Stats {
    totalSubAdmins: number
    activeSubAdmins: number
    totalQRGenerated: number
    totalRevenue: number
    thisMonthRevenue: number
    qrsByCategory: Array<{ name: string; value: number }>
}

export default function SuperAdminDashboard() {
    const router = useRouter()
    const [stats, setStats] = useState<Stats>({
        totalSubAdmins: 0,
        activeSubAdmins: 0,
        totalQRGenerated: 0,
        totalRevenue: 0,
        thisMonthRevenue: 0,
        qrsByCategory: []
    })
    const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [qrInput, setQrInput] = useState('')
    const [isScanning, setIsScanning] = useState(false)

    useEffect(() => {
        loadDashboardData()
    }, [])

    async function loadDashboardData() {
        try {
            // Get all sub-admins with their config
            const { data: subAdminData } = await supabase
                .from('users')
                .select(`
                    id, name, email, phone, created_at, is_active,
                    config:sub_admin_config(*)
                `)
                .eq('role', 'sub_admin')
                .order('created_at', { ascending: false })

            if (subAdminData) {
                setSubAdmins(subAdminData as any)
            }

            // Count total sub-admins
            const { count: totalSubAdmins } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'sub_admin')

            // Count active sub-admins
            const { count: activeSubAdmins } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'sub_admin')
                .eq('is_active', true)

            // Total QR codes generated
            const { count: totalQR } = await supabase
                .from('qr_codes')
                .select('*', { count: 'exact', head: true })

            // Total revenue
            const { data: revenueData } = await supabase
                .from('revenue_sharing')
                .select('total_amount, transaction_date')

            let totalRevenue = 0
            let thisMonthRevenue = 0
            const currentMonth = new Date().getMonth()
            const currentYear = new Date().getFullYear()

            if (revenueData) {
                revenueData.forEach(item => {
                    totalRevenue += Number(item.total_amount)
                    const transactionDate = new Date(item.transaction_date)
                    if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
                        thisMonthRevenue += Number(item.total_amount)
                    }
                })
            }

            // QR codes by category
            const { data: qrByCategory } = await supabase
                .from('qr_codes')
                .select('category')

            const categoryCounts: Record<string, number> = {}
            if (qrByCategory) {
                qrByCategory.forEach(item => {
                    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
                })
            }

            const qrsByCategory = Object.entries(categoryCounts).map(([name, value]) => ({
                name: name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                value
            }))

            setStats({
                totalSubAdmins: totalSubAdmins || 0,
                activeSubAdmins: activeSubAdmins || 0,
                totalQRGenerated: totalQR || 0,
                totalRevenue,
                thisMonthRevenue,
                qrsByCategory
            })

        } catch (error) {
            console.error('Error loading dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredSubAdmins = subAdmins.filter(admin =>
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleDigitalScan = (e: React.FormEvent) => {
        e.preventDefault()
        if (!qrInput.trim()) return
        setIsScanning(true)
        setTimeout(() => {
            router.push(`/scan/${qrInput.trim()}`)
            setIsScanning(false)
        }, 800)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 border-b-2 border-primary rounded-full animate-spin"></div>
                    <Shield className="w-6 h-6 text-primary absolute" />
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
            {/* Header / Digital Scanner Hub */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-10">
                <div className="flex-1">
                    <h1 className="text-4xl font-black tracking-tighter text-foreground mb-2 flex items-center gap-3">
                        <Shield className="w-10 h-10 text-primary" />
                        Super Management Hub
                    </h1>
                    <p className="text-muted-foreground text-sm flex items-center gap-2 font-medium">
                        <Calendar className="w-4 h-4" />
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"></span>
                        <span className="text-primary font-black uppercase tracking-widest text-[10px]">Root Access Terminal</span>
                    </p>
                </div>

                {/* Digital Activation Widget */}
                <div className="w-full xl:w-auto">
                    <form onSubmit={handleDigitalScan} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative group flex-1 sm:w-80">
                            <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                            <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center px-4 py-3 group-focus-within:border-primary transition-all">
                                <QrCode className="w-5 h-5 text-zinc-600 group-focus-within:text-primary transition-colors mr-3" />
                                <input
                                    type="text"
                                    placeholder="Enter QR ID to Setup/Update..."
                                    value={qrInput}
                                    onChange={(e) => setQrInput(e.target.value)}
                                    className="bg-transparent border-none p-0 text-sm font-bold tracking-wider focus:ring-0 w-full placeholder:text-zinc-700"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isScanning}
                            className="bg-white text-black hover:bg-zinc-200 px-8 py-3 rounded-2xl font-black text-sm tracking-widest transition-all shadow-xl shadow-white/5 active:scale-95 flex items-center justify-center min-w-[140px]"
                        >
                            {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SCAN'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        title: 'Total Sub-Admins',
                        value: stats.totalSubAdmins,
                        icon: Users,
                        color: 'purple',
                        trend: `${stats.activeSubAdmins} active`,
                        gradient: 'from-purple-500 to-purple-700'
                    },
                    {
                        title: 'QR Codes Generated',
                        value: stats.totalQRGenerated,
                        icon: QrCode,
                        color: 'indigo',
                        trend: 'All categories',
                        gradient: 'from-indigo-500 to-indigo-700'
                    },
                    {
                        title: 'Total Revenue',
                        value: `₹${stats.totalRevenue.toLocaleString()}`,
                        icon: DollarSign,
                        color: 'emerald',
                        trend: 'Lifetime',
                        gradient: 'from-emerald-500 to-emerald-700'
                    },
                    {
                        title: 'This Month',
                        value: `₹${stats.thisMonthRevenue.toLocaleString()}`,
                        icon: TrendingUp,
                        color: 'cyan',
                        trend: new Date().toLocaleDateString('en-US', { month: 'long' }),
                        gradient: 'from-cyan-500 to-cyan-700'
                    },
                ].map((stat, i) => (
                    <div key={i} className="bg-card border border-border p-6 rounded-2xl group hover:border-primary/50 transition-all relative overflow-hidden">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold tracking-tight mb-1">{stat.value}</p>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
                            {stat.title}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground/60">{stat.trend}</p>
                        <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full bg-gradient-to-r ${stat.gradient} transition-all duration-500`}></div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* QR Distribution by Category */}
                <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-6">QR Distribution by Category</h3>
                    {stats.qrsByCategory.length > 0 ? (
                        <div className="h-[300px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.qrsByCategory}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {stats.qrsByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center">
                            <div className="text-center">
                                <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                                <p className="text-sm text-muted-foreground">No QR codes generated yet</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="bg-white/20 p-3 rounded-xl mb-6 w-fit">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h4 className="text-xl font-bold mb-2">Platform Stats</h4>
                        <div className="space-y-3 mt-6">
                            <div className="flex items-center justify-between">
                                <span className="text-white/80 text-sm">Active Rate</span>
                                <span className="font-bold">
                                    {stats.totalSubAdmins > 0
                                        ? ((stats.activeSubAdmins / stats.totalSubAdmins) * 100).toFixed(1)
                                        : 0}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-white/80 text-sm">Avg QR/Admin</span>
                                <span className="font-bold">
                                    {stats.totalSubAdmins > 0
                                        ? Math.round(stats.totalQRGenerated / stats.totalSubAdmins)
                                        : 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-white/80 text-sm">Platform Status</span>
                                <span className="font-bold flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                </div>
            </div>

            {/* Sub-Admins Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <h3 className="text-lg font-bold">Sub-Admin Management</h3>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search sub-admins..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <Link
                            href="/admin/super/sub-admins"
                            className="text-xs font-bold text-primary hover:underline uppercase tracking-wider"
                        >
                            View All
                        </Link>
                    </div>
                </div>

                {filteredSubAdmins.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/30">
                                <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    <th className="px-6 py-4 text-left">Sub-Admin</th>
                                    <th className="px-6 py-4 text-left">Plan</th>
                                    <th className="px-6 py-4 text-left">QR Usage</th>
                                    <th className="px-6 py-4 text-left">Commission</th>
                                    <th className="px-6 py-4 text-left">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredSubAdmins.slice(0, 10).map((admin) => {
                                    const config = Array.isArray(admin.config) ? admin.config[0] : admin.config
                                    const usagePercent = config ? (config.qr_used / config.qr_quota) * 100 : 0

                                    return (
                                        <tr key={admin.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center font-bold text-white">
                                                        {admin.name[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm">{admin.name}</p>
                                                        <p className="text-xs text-muted-foreground">{admin.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/10 text-purple-400 capitalize w-fit mb-0.5">
                                                        {config?.subscription_plan || 'N/A'}
                                                    </span>
                                                    <span className="text-xs font-bold text-white">
                                                        ₹{config?.subscription_amount?.toLocaleString() || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-medium">
                                                            {config?.qr_used || 0} / {config?.qr_quota || 0}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {usagePercent.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all"
                                                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold">{config?.commission_rate || 0}%</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {admin.is_active ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400">
                                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400">
                                                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-16 text-center">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                        <p className="text-muted-foreground font-medium">No sub-admins found</p>
                        <p className="text-xs text-muted-foreground mt-2">Create your first sub-admin to get started</p>
                    </div>
                )}
            </div>
        </div>
    )
}
