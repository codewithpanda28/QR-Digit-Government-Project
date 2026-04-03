'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
    Users, Search, Filter, MoreVertical, Edit, Trash2,
    Power, PowerOff, Calendar, QrCode, TrendingUp, Mail,
    Phone, ArrowLeft, UserPlus, Download, Eye
} from 'lucide-react'

interface SubAdmin {
    id: string
    name: string
    email: string
    phone: string | null
    created_at: string
    is_active: boolean
    subscription_start: string
    subscription_end: string
    config: {
        qr_quota: number
        qr_used: number
        commission_rate: number
        subscription_plan: string
        subscription_amount: number
        is_active: boolean
        allowed_categories: string[]
    } | null
}

export default function SubAdminsList() {
    const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([])
    const [filteredAdmins, setFilteredAdmins] = useState<SubAdmin[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
    const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null)

    useEffect(() => {
        loadSubAdmins()
    }, [])

    useEffect(() => {
        filterSubAdmins()
    }, [searchTerm, filterStatus, subAdmins])

    async function loadSubAdmins() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id, name, email, phone, created_at, is_active,
                    subscription_start, subscription_end,
                    config:sub_admin_config(*)
                `)
                .eq('role', 'sub_admin')
                .order('created_at', { ascending: false })

            if (error) throw error

            if (data) {
                setSubAdmins(data as any)
            }
        } catch (error: any) {
            console.error('Error loading sub-admins:', error)
            toast.error('Failed to load sub-admins')
        } finally {
            setLoading(false)
        }
    }

    function filterSubAdmins() {
        let filtered = subAdmins

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(admin =>
                admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                admin.phone?.includes(searchTerm)
            )
        }

        // Status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(admin =>
                filterStatus === 'active' ? admin.is_active : !admin.is_active
            )
        }

        setFilteredAdmins(filtered)
    }

    async function toggleAdminStatus(adminId: string, currentStatus: boolean) {
        try {
            const { error } = await supabase
                .from('users')
                .update({ is_active: !currentStatus })
                .eq('id', adminId)

            if (error) throw error

            toast.success(`Sub-admin ${!currentStatus ? 'activated' : 'deactivated'}`)
            loadSubAdmins()
        } catch (error: any) {
            toast.error('Failed to update status')
            console.error(error)
        }
    }

    async function deleteSubAdmin(adminId: string) {
        if (!confirm('Are you sure? This will delete all associated data.')) return

        try {
            // Delete user (cascade will handle related records)
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', adminId)

            if (error) throw error

            toast.success('Sub-admin deleted successfully')
            loadSubAdmins()
        } catch (error: any) {
            toast.error('Failed to delete sub-admin')
            console.error(error)
        }
    }

    function getSubscriptionStatus(endDate: string) {
        const end = new Date(endDate)
        const now = new Date()
        const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysLeft < 0) return { status: 'Expired', color: 'red', days: 0 }
        if (daysLeft <= 7) return { status: 'Expiring Soon', color: 'orange', days: daysLeft }
        return { status: 'Active', color: 'green', days: daysLeft }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 border-b-2 border-primary rounded-full animate-spin"></div>
                    <Users className="w-6 h-6 text-primary absolute" />
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
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
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Sub-Admin Management</h1>
                        <p className="text-muted-foreground">
                            Manage all your sub-admin accounts, quotas, and permissions
                        </p>
                    </div>
                    <Link
                        href="/admin/super/create-sub-admin"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-xl shadow-primary/20 active:scale-95 group"
                    >
                        <UserPlus className="w-5 h-5 mr-2" />
                        New Sub-Admin
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-card border border-border rounded-xl p-5">
                    <Users className="w-8 h-8 text-purple-500 mb-3" />
                    <p className="text-2xl font-bold">{subAdmins.length}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Sub-Admins</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <Power className="w-8 h-8 text-green-500 mb-3" />
                    <p className="text-2xl font-bold">{subAdmins.filter(a => a.is_active).length}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Accounts</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <QrCode className="w-8 h-8 text-indigo-500 mb-3" />
                    <p className="text-2xl font-bold">
                        {subAdmins.reduce((sum, admin) => {
                            const config = Array.isArray(admin.config) ? admin.config[0] : admin.config
                            return sum + (config?.qr_used || 0)
                        }, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">QR Codes Generated</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <TrendingUp className="w-8 h-8 text-cyan-500 mb-3" />
                    <p className="text-2xl font-bold">
                        {subAdmins.filter(a => {
                            const sub = getSubscriptionStatus(a.subscription_end)
                            return sub.status === 'Active' || sub.status === 'Expiring Soon'
                        }).length}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Subscriptions</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    <div className="flex gap-2">
                        {(['all', 'active', 'inactive'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-3 rounded-lg font-medium text-sm transition-all ${filterStatus === status
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-background border border-border hover:border-primary/50'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>

                    <button className="px-4 py-3 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors">
                        <Download className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Sub-Admins Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {filteredAdmins.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/30">
                                <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    <th className="px-6 py-4 text-left">Sub-Admin</th>
                                    <th className="px-6 py-4 text-left">Plan</th>
                                    <th className="px-6 py-4 text-left">QR Usage</th>
                                    <th className="px-6 py-4 text-left">Subscription</th>
                                    <th className="px-6 py-4 text-left">Commission</th>
                                    <th className="px-6 py-4 text-left">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredAdmins.map((admin) => {
                                    const config = Array.isArray(admin.config) ? admin.config[0] : admin.config
                                    const usagePercent = config ? (config.qr_used / config.qr_quota) * 100 : 0
                                    const subscription = getSubscriptionStatus(admin.subscription_end)

                                    return (
                                        <tr key={admin.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center font-bold text-white">
                                                        {admin.name[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm">{admin.name}</p>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="w-3 h-3" />
                                                                {admin.email}
                                                            </span>
                                                            {admin.phone && (
                                                                <span className="flex items-center gap-1">
                                                                    <Phone className="w-3 h-3" />
                                                                    {admin.phone}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/10 text-purple-400 capitalize w-fit mb-1">
                                                        {config?.subscription_plan || 'N/A'}
                                                    </span>
                                                    <span className="text-sm font-black text-white">
                                                        ₹{config?.subscription_amount?.toLocaleString() || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-medium">
                                                            {config?.qr_used || 0} / {config?.qr_quota === 999999 ? '∞' : config?.qr_quota || 0}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {usagePercent.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all"
                                                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${subscription.color === 'green' ? 'bg-green-500/10 text-green-400' :
                                                        subscription.color === 'orange' ? 'bg-orange-500/10 text-orange-400' :
                                                            'bg-red-500/10 text-red-400'
                                                        }`}>
                                                        {subscription.status}
                                                    </span>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {subscription.days > 0 ? `${subscription.days} days left` : 'Expired'}
                                                    </p>
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
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => toggleAdminStatus(admin.id, admin.is_active)}
                                                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                                                        title={admin.is_active ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {admin.is_active ? (
                                                            <PowerOff className="w-4 h-4 text-orange-500" />
                                                        ) : (
                                                            <Power className="w-4 h-4 text-green-500" />
                                                        )}
                                                    </button>
                                                    <button
                                                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4 text-indigo-500" />
                                                    </button>
                                                    <button
                                                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4 text-muted-foreground" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteSubAdmin(admin.id)}
                                                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-16 text-center">
                        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium text-muted-foreground mb-2">No sub-admins found</p>
                        <p className="text-sm text-muted-foreground mb-6">
                            {searchTerm || filterStatus !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Create your first sub-admin to get started'}
                        </p>
                        {!searchTerm && filterStatus === 'all' && (
                            <Link
                                href="/admin/super/create-sub-admin"
                                className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-xl transition-all"
                            >
                                <UserPlus className="w-5 h-5 mr-2" />
                                Create First Sub-Admin
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
