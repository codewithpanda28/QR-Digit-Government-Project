'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
    UserPlus, Mail, Phone, Lock, Shield, DollarSign,
    Calendar, ArrowLeft, Check, AlertCircle, QrCode, Percent
} from 'lucide-react'
import Link from 'next/link'

interface SubscriptionPlan {
    id: string
    plan_name: string
    plan_type: string
    qr_quota: number
    commission_rate: number
    price: number
    features: string[]
}

export default function CreateSubAdmin() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [plans, setPlans] = useState<SubscriptionPlan[]>([])
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        // Config
        qr_quota: 0,
        commission_rate: 0,
        subscription_plan: 'monthly',
        subscription_amount: 0,
        subscription_duration_months: 1, // For subscription end date calculation
        allowed_categories: [] as string[],
        branding: {
            logo: '',
            primaryColor: '#8b5cf6',
            companyName: ''
        }
    })

    const allCategories = [
        'missing-child',
        'senior-citizen-lost',
        'accident-emergency',
        'women-safety',
        'vehicle-safety',
        'parcel-delivery',
        'domestic-worker-verification',
        'pet-recovery',
        'school-event-safety',
        'emergency-medical',
        'custom-category'
    ]

    const categoryLabels: Record<string, string> = {
        'missing-child': 'Missing Child Recovery',
        'senior-citizen-lost': 'Senior Citizen Lost',
        'accident-emergency': 'Accident Emergency',
        'women-safety': 'Women Safety',
        'vehicle-safety': 'Vehicle & Parking',
        'parcel-delivery': 'Parcel & Delivery',
        'domestic-worker-verification': 'Domestic Worker ID',
        'pet-recovery': 'Pet Recovery',
        'school-event-safety': 'School & Event Safety',
        'emergency-medical': 'Emergency Medical',
        'custom-category': 'Custom Category'
    }


    useEffect(() => {
        loadPlans()
    }, [])

    async function loadPlans() {
        const { data } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true })

        if (data) {
            setPlans(data as SubscriptionPlan[])
        }
    }

    function handlePlanSelect(plan: SubscriptionPlan) {
        setSelectedPlan(plan.id)
        setFormData({
            ...formData,
            qr_quota: plan.qr_quota,
            commission_rate: plan.commission_rate,
            subscription_plan: plan.plan_type,
            subscription_amount: plan.price,
            subscription_duration_months: plan.plan_type === 'monthly' ? 1 : plan.plan_type === 'quarterly' ? 3 : 12
        })
    }

    function toggleCategory(category: string) {
        const newCategories = formData.allowed_categories.includes(category)
            ? formData.allowed_categories.filter(c => c !== category)
            : [...formData.allowed_categories, category]

        setFormData({ ...formData, allowed_categories: newCategories })
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            // Validation
            if (formData.password !== formData.confirmPassword) {
                toast.error('Passwords do not match')
                setLoading(false)
                return
            }

            if (formData.password.length < 6) {
                toast.error('Password must be at least 6 characters')
                setLoading(false)
                return
            }

            if (formData.allowed_categories.length === 0) {
                toast.error('Select at least one QR category')
                setLoading(false)
                return
            }

            // Check if email already exists in database
            const { data: existingUser } = await supabase
                .from('users')
                .select('email')
                .eq('email', formData.email)
                .single()

            if (existingUser) {
                toast.error('Email already registered. Please use a different email.')
                setLoading(false)
                return
            }

            // Create sub-admin user in Supabase Auth (No email confirmation required)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    emailRedirectTo: undefined, // Disable email confirmation
                    data: {
                        name: formData.name,
                        phone: formData.phone,
                        role: 'sub_admin'
                    }
                }
            })

            if (authError) {
                toast.error(authError.message)
                setLoading(false)
                return
            }

            if (!authData.user) {
                toast.error('Failed to create user')
                setLoading(false)
                return
            }

            // Calculate subscription dates
            const subscriptionStart = new Date()
            const subscriptionEnd = new Date()
            subscriptionEnd.setMonth(subscriptionEnd.getMonth() + formData.subscription_duration_months)

            // Insert user into users table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .insert([{
                    id: authData.user.id,
                    email: formData.email,
                    password_hash: 'managed_by_supabase_auth', // Supabase handles auth
                    name: formData.name,
                    role: 'sub_admin',
                    phone: formData.phone,
                    is_active: true,
                    subscription_start: subscriptionStart.toISOString(),
                    subscription_end: subscriptionEnd.toISOString(),
                    branding: formData.branding,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single()

            if (userError) {
                // Rollback: delete auth user
                await supabase.auth.admin.deleteUser(authData.user.id)
                toast.error('Failed to create user record: ' + userError.message)
                setLoading(false)
                return
            }

            // Insert sub-admin config
            const { error: configError } = await supabase
                .from('sub_admin_config')
                .insert([{
                    sub_admin_id: authData.user.id,
                    qr_quota: formData.qr_quota,
                    qr_used: 0,
                    commission_rate: formData.commission_rate,
                    allowed_categories: formData.allowed_categories,
                    subscription_plan: formData.subscription_plan,
                    subscription_amount: formData.subscription_amount,
                    is_active: true
                }])

            if (configError) {
                // Rollback
                await supabase.from('users').delete().eq('id', authData.user.id)
                await supabase.auth.admin.deleteUser(authData.user.id)
                toast.error('Failed to create config: ' + configError.message)
                setLoading(false)
                return
            }

            // Log activity
            await supabase.from('sub_admin_activity_logs').insert([{
                sub_admin_id: authData.user.id,
                action_type: 'account_created',
                action_details: {
                    created_by: 'super_admin',
                    plan: formData.subscription_plan,
                    quota: formData.qr_quota
                }
            }])

            toast.success('Sub-admin created successfully!')
            router.push('/admin/super/sub-admins')

        } catch (error: any) {
            console.error('Error creating sub-admin:', error)
            toast.error(error.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 lg:p-10 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/admin/super/dashboard"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Create New Sub-Admin</h1>
                <p className="text-muted-foreground">Set up a new sub-admin account with custom quotas and permissions</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Subscription Plans */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Choose Subscription Plan
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map((plan) => {
                            const isSelected = selectedPlan === plan.id
                            return (
                                <div
                                    key={plan.id}
                                    onClick={() => handlePlanSelect(plan)}
                                    className={`relative border rounded-xl p-6 cursor-pointer transition-all ${isSelected
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                                        : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                    <h3 className="font-bold text-lg mb-2">{plan.plan_name}</h3>
                                    <div className="text-3xl font-bold mb-4">
                                        ₹{plan.price.toLocaleString()}
                                        <span className="text-sm text-muted-foreground font-normal">/{plan.plan_type}</span>
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <QrCode className="w-4 h-4 text-primary" />
                                            <span>{plan.qr_quota === 999999 ? 'Unlimited' : plan.qr_quota} QR codes</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Percent className="w-4 h-4 text-primary" />
                                            <span>{plan.commission_rate}% commission</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        {plan.features.slice(0, 3).map((feature, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="w-1 h-1 bg-primary rounded-full"></div>
                                                {feature}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Basic Information */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary" />
                        Basic Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Full Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Akash Kumar"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Email Address *</label>
                            <div className="relative">
                                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Phone Number</label>
                            <div className="relative">
                                <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="+91 9876543210"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Company Name (Optional)</label>
                            <input
                                type="text"
                                value={formData.branding.companyName}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    branding: { ...formData.branding, companyName: e.target.value }
                                })}
                                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Acme Corp"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Password *</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Minimum 6 characters"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Confirm Password *</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Re-enter password"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Allowed QR Categories */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-primary" />
                        Allowed QR Categories
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {allCategories.map((category) => {
                            const isSelected = formData.allowed_categories.includes(category)
                            return (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => toggleCategory(category)}
                                    className={`p-4 border rounded-xl text-sm font-medium transition-all ${isSelected
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    {isSelected && <Check className="w-4 h-4 mb-2" />}
                                    {categoryLabels[category] || category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Summary & Submit */}
                <div className="bg-gradient-to-br from-purple-600/10 to-indigo-600/10 border border-purple-500/20 rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-4">Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">QR Quota</p>
                            <p className="text-2xl font-bold">{formData.qr_quota === 999999 ? '∞' : formData.qr_quota}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Commission Rate</p>
                            <p className="text-2xl font-bold">{formData.commission_rate}%</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Plan Amount</p>
                            <p className="text-2xl font-bold">₹{formData.subscription_amount.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Duration</p>
                            <p className="text-2xl font-bold capitalize">{formData.subscription_plan}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 mb-6 p-4 bg-background/50 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium mb-1">Important Notes:</p>
                            <ul className="text-muted-foreground space-y-1 text-xs list-disc list-inside">
                                <li>Credentials will be sent to the sub-admin's email</li>
                                <li>They can change their password after first login</li>
                                <li>You can modify quotas and permissions anytime</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Link
                            href="/admin/super/dashboard"
                            className="px-6 py-3 border border-border rounded-xl font-medium hover:bg-muted transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading || !selectedPlan}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Sub-Admin...' : 'Create Sub-Admin Account'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
