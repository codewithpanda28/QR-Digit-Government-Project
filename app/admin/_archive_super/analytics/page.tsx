'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
    BarChart3, ArrowLeft, TrendingUp, Users, QrCode, Activity,
    Calendar, Target, Zap, Eye
} from 'lucide-react'
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#8b5cf6', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalScans: 0,
        totalQRCodes: 0,
        activeUsers: 0,
        conversionRate: 0
    })

    // Sample data
    const scanTrend = [
        { day: 'Mon', scans: 120 },
        { day: 'Tue', scans: 180 },
        { day: 'Wed', scans: 150 },
        { day: 'Thu', scans: 220 },
        { day: 'Fri', scans: 280 },
        { day: 'Sat', scans: 310 },
        { day: 'Sun', scans: 260 },
    ]

    const categoryData = [
        { name: 'Child Safety', value: 450 },
        { name: 'Women Safety', value: 320 },
        { name: 'Vehicle Safety', value: 280 },
        { name: 'Elderly Safety', value: 200 },
        { name: 'School Safety', value: 150 },
    ]

    const subAdminPerformance = [
        { name: 'Admin A', qrSold: 145, revenue: 72500 },
        { name: 'Admin B', qrSold: 132, revenue: 66000 },
        { name: 'Admin C', qrSold: 98, revenue: 49000 },
        { name: 'Admin D', qrSold: 87, revenue: 43500 },
        { name: 'Admin E', qrSold: 76, revenue: 38000 },
    ]

    useEffect(() => {
        loadAnalytics()
    }, [])

    async function loadAnalytics() {
        setLoading(true)
        try {
            const { count: totalScans } = await supabase
                .from('scan_logs')
                .select('*', { count: 'exact', head: true })

            const { count: totalQRCodes } = await supabase
                .from('qr_codes')
                .select('*', { count: 'exact', head: true })

            const { count: activeUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true)

            setStats({
                totalScans: totalScans || 0,
                totalQRCodes: totalQRCodes || 0,
                activeUsers: activeUsers || 0,
                conversionRate: totalQRCodes && totalScans ? (totalQRCodes / totalScans) * 100 : 0
            })
        } catch (error) {
            console.error('Error loading analytics:', error)
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
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Platform Analytics</h1>
                    <p className="text-muted-foreground">Comprehensive insights into platform performance and user behavior</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        label: 'Total QR Scans',
                        value: stats.totalScans.toLocaleString(),
                        icon: Eye,
                        gradient: 'from-purple-500 to-purple-700',
                        change: '+18.2%',
                        trend: 'up'
                    },
                    {
                        label: 'QR Codes Created',
                        value: stats.totalQRCodes.toLocaleString(),
                        icon: QrCode,
                        gradient: 'from-indigo-500 to-indigo-700',
                        change: '+12.5%',
                        trend: 'up'
                    },
                    {
                        label: 'Active Users',
                        value: stats.activeUsers.toLocaleString(),
                        icon: Users,
                        gradient: 'from-emerald-500 to-emerald-700',
                        change: '+8.3%',
                        trend: 'up'
                    },
                    {
                        label: 'Engagement Rate',
                        value: `${stats.conversionRate.toFixed(1)}%`,
                        icon: Activity,
                        gradient: 'from-cyan-500 to-cyan-700',
                        change: '+2.1%',
                        trend: 'up'
                    },
                ].map((stat, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-3xl font-bold mb-1">{stat.value}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scan Trend */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-6">Weekly Scan Activity</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={scanTrend}>
                                <defs>
                                    <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                                <XAxis dataKey="day" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                                />
                                <Line type="monotone" dataKey="scans" stroke="#8b5cf6" strokeWidth={3} fill="url(#scanGradient)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-6">QR Distribution by Category</h3>
                    <div className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Sub-Admin Performance */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-6">Top Performing Sub-Admins</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subAdminPerformance}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                            <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                            />
                            <Bar dataKey="qrSold" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
                    <Target className="w-8 h-8 mb-4 opacity-80" />
                    <p className="text-2xl font-bold mb-2">87.5%</p>
                    <p className="text-sm opacity-90">Customer Satisfaction</p>
                    <p className="text-xs opacity-70 mt-2">Based on feedback ratings</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
                    <Zap className="w-8 h-8 mb-4 opacity-80" />
                    <p className="text-2xl font-bold mb-2">2.4 mins</p>
                    <p className="text-sm opacity-90">Avg Response Time</p>
                    <p className="text-xs opacity-70 mt-2">Customer support metrics</p>
                </div>

                <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-2xl p-6 text-white">
                    <TrendingUp className="w-8 h-8 mb-4 opacity-80" />
                    <p className="text-2xl font-bold mb-2">+42%</p>
                    <p className="text-sm opacity-90">Growth This Quarter</p>
                    <p className="text-xs opacity-70 mt-2">Compared to last quarter</p>
                </div>
            </div>
        </div>
    )
}
