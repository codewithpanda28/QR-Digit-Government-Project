'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
    ArrowLeft, Plus, Edit, Trash2, Check, X,
    ShieldCheck, DollarSign, Calendar, QrCode, Percent,
    MoreVertical, Info, Loader2
} from 'lucide-react'

interface Plan {
    id: string
    plan_name: string
    plan_type: 'monthly' | 'quarterly' | 'yearly' | 'lifetime'
    qr_quota: number
    commission_rate: number
    price: number
    features: string[]
    is_active: boolean
    created_at: string
}

export default function ManagePlansPage() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null)

    const [formData, setFormData] = useState({
        plan_name: '',
        plan_type: 'monthly' as Plan['plan_type'],
        price: 0,
        qr_quota: 100,
        commission_rate: 10,
        features: ['QR Generation', 'Safety Dashboard', 'SOS Alerts'],
        is_active: true
    })

    useEffect(() => {
        loadPlans()
    }, [])

    async function loadPlans() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('price', { ascending: true })

            if (error) throw error
            if (data) setPlans(data as Plan[])
        } catch (error: any) {
            toast.error('Failed to load plans')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const openModal = (plan: Plan | null = null) => {
        if (plan) {
            setEditingPlan(plan)
            setFormData({
                plan_name: plan.plan_name,
                plan_type: plan.plan_type,
                price: plan.price,
                qr_quota: plan.qr_quota,
                commission_rate: plan.commission_rate,
                features: plan.features,
                is_active: plan.is_active
            })
        } else {
            setEditingPlan(null)
            setFormData({
                plan_name: 'Pro Pack - ' + (plans.length + 1),
                plan_type: 'monthly',
                price: 999,
                qr_quota: 100,
                commission_rate: 10,
                features: ['QR Generation', 'Safety Dashboard', 'SOS Alerts'],
                is_active: true
            })
        }
        setIsModalOpen(true)
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)

        try {
            if (editingPlan) {
                const { error } = await supabase
                    .from('subscription_plans')
                    .update({
                        plan_name: formData.plan_name,
                        plan_type: formData.plan_type,
                        price: formData.price,
                        qr_quota: formData.qr_quota,
                        commission_rate: formData.commission_rate,
                        features: formData.features,
                        is_active: formData.is_active
                    })
                    .eq('id', editingPlan.id)

                if (error) throw error
                toast.success('Plan updated successfully!')
            } else {
                const { error } = await supabase
                    .from('subscription_plans')
                    .insert([formData])

                if (error) throw error
                toast.success('New plan added!')
            }

            setIsModalOpen(false)
            loadPlans()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSaving(false)
        }
    }

    async function deletePlan(id: string) {
        if (!confirm('Are you sure you want to delete this plan?')) return

        try {
            const { error } = await supabase
                .from('subscription_plans')
                .delete()
                .eq('id', id)

            if (error) throw error
            toast.success('Plan deleted')
            loadPlans()
        } catch (error: any) {
            toast.error('Cannot delete plan')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link
                        href="/admin/super/dashboard"
                        className="inline-flex items-center text-sm text-zinc-500 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Core Hub
                    </Link>
                    <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3">
                        <ShieldCheck className="w-10 h-10 text-purple-500" />
                        Subscription Architecture
                    </h1>
                    <p className="text-zinc-500 font-medium text-sm mt-1">
                        Define pricing, duration, and quotas for all sub-admins
                    </p>
                </div>

                <button
                    onClick={() => openModal()}
                    className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl transition-all shadow-[0_10px_30px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2 group active:scale-95"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    CREATE NEW PLAN
                </button>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`bg-zinc-900 border ${plan.is_active ? 'border-zinc-800' : 'border-rose-900/50 opacity-60'} rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-purple-500/50 transition-all duration-500`}
                    >
                        {!plan.is_active && (
                            <div className="absolute top-4 right-8 px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest z-10">
                                Disabled
                            </div>
                        )}

                        <div className="mb-8">
                            <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] mb-2 block">
                                {plan.plan_type} SUBSCRIPTION
                            </span>
                            <h3 className="text-2xl font-black text-white group-hover:text-purple-400 transition-colors">
                                {plan.plan_name}
                            </h3>
                        </div>

                        <div className="mb-10">
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-white">₹{plan.price.toLocaleString()}</span>
                                <span className="text-zinc-500 font-bold text-sm">/{plan.plan_type}</span>
                            </div>
                        </div>

                        <div className="space-y-4 mb-10">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="p-2 bg-zinc-800 rounded-lg">
                                    <QrCode className="w-4 h-4 text-purple-500" />
                                </div>
                                <span className="text-zinc-300 font-medium">
                                    {plan.qr_quota === 999999 ? 'Unlimited' : plan.qr_quota} QR Quota
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="p-2 bg-zinc-800 rounded-lg">
                                    <Percent className="w-4 h-4 text-emerald-500" />
                                </div>
                                <span className="text-zinc-300 font-medium">{plan.commission_rate}% Platform Fee</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-6 border-t border-zinc-800">
                            <button
                                onClick={() => openModal(plan)}
                                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                            >
                                <Edit className="w-4 h-4" /> Edit
                            </button>
                            <button
                                onClick={() => deletePlan(plan.id)}
                                className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Decoration */}
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full"></div>
                    </div>
                ))}

                {plans.length === 0 && (
                    <div className="col-span-full py-20 bg-zinc-900 border border-zinc-800 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                            <Info className="w-10 h-10 text-zinc-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Plans Constructed</h3>
                        <p className="text-zinc-500 max-w-xs mx-auto">
                            Start by creating your first subscription architecture for sub-admins.
                        </p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 overflow-y-auto max-h-[90vh] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                                {editingPlan ? 'Refine Architecture' : 'Draft New Plan'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                                <X className="w-6 h-6 text-zinc-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Enterprise Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.plan_name}
                                        onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                                        className="w-full px-5 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-bold focus:outline-none focus:border-purple-600 transition-colors"
                                        placeholder="e.g. Professional Yearly"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Cycle Period</label>
                                    <select
                                        value={formData.plan_type}
                                        onChange={(e) => setFormData({ ...formData, plan_type: e.target.value as any })}
                                        className="w-full px-5 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-bold focus:outline-none focus:border-purple-600 transition-colors appearance-none"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="yearly">Yearly</option>
                                        <option value="lifetime">Lifetime</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Capital Amount (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                        className="w-full px-5 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-bold focus:outline-none focus:border-purple-600 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">QR Inventory Quota</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.qr_quota}
                                        onChange={(e) => setFormData({ ...formData, qr_quota: Number(e.target.value) })}
                                        className="w-full px-5 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-bold focus:outline-none focus:border-purple-600 transition-colors"
                                    />
                                    <p className="text-[10px] text-zinc-600 mt-2 italic">Use 999999 for Unlimited</p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Platform Fee (%)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.commission_rate}
                                        onChange={(e) => setFormData({ ...formData, commission_rate: Number(e.target.value) })}
                                        className="w-full px-5 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white font-bold focus:outline-none focus:border-purple-600 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 py-6">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-6 h-6 rounded-lg bg-zinc-950 border-zinc-800 text-purple-600 focus:ring-purple-600"
                                />
                                <label htmlFor="isActive" className="text-sm font-bold text-zinc-400 cursor-pointer">
                                    Publish architecture for sub-admins
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl transition-all shadow-[0_10px_40px_rgba(168,85,247,0.3)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : editingPlan ? 'UPDATE ARCHITECTURE' : 'RELEASE PLAN'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
