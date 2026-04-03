'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
    ArrowLeft, ShieldCheck, CreditCard,
    Calendar, QrCode, Percent, Check,
    Zap, Rocket, Crown, Info, ArrowRight, Loader2
} from 'lucide-react'

interface Plan {
    id: string
    plan_name: string
    plan_type: string
    qr_quota: number
    commission_rate: number
    price: number
    features: string[]
}

interface UserConfig {
    subscription_plan: string
    subscription_amount: number
    qr_quota: number
    qr_used: number
    commission_rate: number
}

export default function SubAdminSubscriptionPage() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [currentConfig, setCurrentConfig] = useState<UserConfig | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            // Get current user id
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Load all available plans
            const { data: plansData } = await supabase
                .from('subscription_plans')
                .select('*')
                .eq('is_active', true)
                .order('price', { ascending: true })

            // Load user's current config
            const { data: configData } = await supabase
                .from('sub_admin_config')
                .select('*')
                .eq('sub_admin_id', user.id)
                .single()

            if (plansData) setPlans(plansData as Plan[])
            if (configData) setCurrentConfig(configData)

        } catch (error: any) {
            console.error(error)
            toast.error('Failed to load subscription details')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
            {/* Header */}
            <div>
                <Link
                    href="/admin/dashboard"
                    className="inline-flex items-center text-sm text-zinc-500 hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Systems Hub
                </Link>
                <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3">
                    <ShieldCheck className="w-10 h-10 text-primary" />
                    Service Architecture
                </h1>
                <p className="text-zinc-500 font-medium text-sm mt-1">
                    Manage your node capacity and platform subscription status
                </p>
            </div>

            {/* Current Status Card */}
            {currentConfig && (
                <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest mb-4 inline-block">
                                Active Node Configuration
                            </span>
                            <h2 className="text-5xl font-black text-white tracking-tighter mb-4 capitalize">
                                {currentConfig.subscription_plan} STATUS
                            </h2>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2 bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800">
                                    <QrCode className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm font-bold text-zinc-300">
                                        Quota: {currentConfig.qr_quota === 999999 ? 'UNLIMITED' : currentConfig.qr_quota}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800">
                                    <Percent className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm font-bold text-zinc-300">
                                        Rate: {currentConfig.commission_rate}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-950/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 min-w-[280px]">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 text-center">Usage Metrics</p>
                            <div className="flex flex-col items-center">
                                <div className="text-6xl font-black text-white mb-2">
                                    {((currentConfig.qr_used / currentConfig.qr_quota) * 100).toFixed(0)}%
                                </div>
                                <p className="text-xs font-bold text-zinc-400 mb-6 uppercase tracking-wider">Node Utilization</p>

                                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-600 to-primary transition-all duration-1000"
                                        style={{ width: `${Math.min((currentConfig.qr_used / currentConfig.qr_quota) * 100, 100)}%` }}
                                    ></div>
                                </div>

                                <p className="text-[10px] text-zinc-500 font-medium">
                                    {currentConfig.qr_used} OF {currentConfig.qr_quota === 999999 ? '∞' : currentConfig.qr_quota} NODES DEPLOYED
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Background Detail */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
                </div>
            )}

            {/* Available Plans */}
            <div>
                <div className="flex items-center gap-3 mb-8">
                    <Zap className="w-6 h-6 text-yellow-500" />
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Scale Deployment</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`bg-card/40 border ${currentConfig?.subscription_plan === plan.plan_type ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border'} rounded-[2.5rem] p-10 relative overflow-hidden group hover:border-primary/50 transition-all duration-500`}
                        >
                            {currentConfig?.subscription_plan === plan.plan_type && (
                                <div className="absolute top-6 right-8 px-4 py-1 bg-primary text-white text-[10px] font-black rounded-full uppercase tracking-widest z-10">
                                    CURRENT
                                </div>
                            )}

                            <div className="mb-10">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 block">
                                    {plan.plan_type} SUBSCRIPTION
                                </p>
                                <h4 className="text-3xl font-black text-white group-hover:text-primary transition-colors">
                                    {plan.plan_name}
                                </h4>
                            </div>

                            <div className="mb-12">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-white tracking-tighter">₹{plan.price.toLocaleString()}</span>
                                    <span className="text-zinc-500 font-bold text-sm">/{plan.plan_type.replace('ly', '')}</span>
                                </div>
                            </div>

                            <div className="space-y-5 mb-12">
                                <div className="flex items-center gap-4 text-sm font-bold text-zinc-300">
                                    <div className="p-2 bg-zinc-900 rounded-xl">
                                        <QrCode className="w-5 h-5 text-purple-400" />
                                    </div>
                                    {plan.qr_quota === 999999 ? 'Unlimited' : plan.qr_quota} QR Nodes
                                </div>
                                <div className="flex items-center gap-4 text-sm font-bold text-zinc-300">
                                    <div className="p-2 bg-zinc-900 rounded-xl">
                                        <Percent className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    {plan.commission_rate}% Revenue Growth
                                </div>
                                <div className="pt-6 border-t border-white/5 space-y-3">
                                    {plan.features.slice(0, 4).map((f, i) => (
                                        <div key={i} className="flex items-center gap-3 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                                            <Check className="w-4 h-4 text-primary" />
                                            {f}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => toast.success('Contact Administrator or Scan QR to Upgrade')}
                                className={`w-full py-5 ${currentConfig?.subscription_plan === plan.plan_type ? 'bg-zinc-800 cursor-not-allowed' : 'bg-white hover:bg-zinc-200 text-black'} font-black rounded-2xl transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2 group active:scale-95`}
                            >
                                {currentConfig?.subscription_plan === plan.plan_type ? 'STAY ON PLAN' : 'UPGRADE NODE'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Support Notice */}
            <div className="bg-blue-600/10 border border-blue-600/20 rounded-3xl p-8 flex items-start gap-6">
                <div className="p-4 bg-blue-600/20 rounded-2xl">
                    <Info className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                    <h4 className="text-xl font-bold text-white mb-2">Scaling Requirements?</h4>
                    <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                        If your deployment needs exceed the standard architecture, please contact our core support team for custom enterprise solutions. We can increase node limits and adjust platform rates for large-scale operations.
                    </p>
                    <button className="mt-6 text-sm font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors">
                        Connect with Super Admin →
                    </button>
                </div>
            </div>
        </div>
    )
}
