'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
    ArrowLeft, Settings, Save, Bell, Mail, Shield, Database,
    Globe, DollarSign, Key, AlertCircle, Check
} from 'lucide-react'

export default function PlatformSettingsPage() {
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        // General Settings
        platformName: 'ThinkTrust Safety QR',
        supportEmail: 'support@thinktrust.com',
        supportPhone: '+91 98765 43210',
        timezone: 'Asia/Kolkata',

        // Email Settings
        smtpHost: 'smtp.gmail.com',
        smtpPort: '587',
        smtpUser: 'noreply@thinktrust.com',
        smtpPassword: '',

        // Payment Settings
        razorpayKeyId: '',
        razorpayKeySecret: '',
        phonepeEnabled: false,

        // QR Settings
        defaultQRPrice: 500,
        commissionRate: 15,
        qrExpiryDays: 365,

        // Notification Settings
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: false,

        // Security Settings
        twoFactorAuth: false,
        sessionTimeout: 30,
        passwordMinLength: 8,

        // Features
        allowSubAdminRegistration: false,
        enableLiveTracking: true,
        enableGeofencing: true,
        enableCustomBranding: true,
    })

    async function handleSave() {
        setSaving(true)
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))
            toast.success('Settings saved successfully!')
        } catch (error) {
            toast.error('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
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
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Platform Settings</h1>
                        <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-xl disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Save All Changes
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* General Settings */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Globe className="w-5 h-5 text-purple-500" />
                    </div>
                    <h2 className="text-xl font-bold">General Settings</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Platform Name</label>
                        <input
                            type="text"
                            value={settings.platformName}
                            onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Support Email</label>
                        <input
                            type="email"
                            value={settings.supportEmail}
                            onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Support Phone</label>
                        <input
                            type="tel"
                            value={settings.supportPhone}
                            onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Timezone</label>
                        <select
                            value={settings.timezone}
                            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option value="America/New_York">America/New York (EST)</option>
                            <option value="Europe/London">Europe/London (GMT)</option>
                            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Email Settings */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Mail className="w-5 h-5 text-indigo-500" />
                    </div>
                    <h2 className="text-xl font-bold">Email Configuration</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">SMTP Host</label>
                        <input
                            type="text"
                            value={settings.smtpHost}
                            onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">SMTP Port</label>
                        <input
                            type="text"
                            value={settings.smtpPort}
                            onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">SMTP Username</label>
                        <input
                            type="text"
                            value={settings.smtpUser}
                            onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">SMTP Password</label>
                        <input
                            type="password"
                            value={settings.smtpPassword}
                            onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                            placeholder="••••••••"
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>
            </div>

            {/* Payment Settings */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                    </div>
                    <h2 className="text-xl font-bold">Payment Gateway</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Razorpay Key ID</label>
                        <input
                            type="text"
                            value={settings.razorpayKeyId}
                            onChange={(e) => setSettings({ ...settings, razorpayKeyId: e.target.value })}
                            placeholder="rzp_test_..."
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Razorpay Key Secret</label>
                        <input
                            type="password"
                            value={settings.razorpayKeySecret}
                            onChange={(e) => setSettings({ ...settings, razorpayKeySecret: e.target.value })}
                            placeholder="••••••••"
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.phonepeEnabled}
                                onChange={(e) => setSettings({ ...settings, phonepeEnabled: e.target.checked })}
                                className="w-5 h-5 rounded border-border"
                            />
                            <span className="text-sm font-medium">Enable PhonePe Gateway</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* QR Code Settings */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                        <Database className="w-5 h-5 text-cyan-500" />
                    </div>
                    <h2 className="text-xl font-bold">QR Code Configuration</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Default QR Price (₹)</label>
                        <input
                            type="number"
                            value={settings.defaultQRPrice}
                            onChange={(e) => setSettings({ ...settings, defaultQRPrice: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Default Commission (%)</label>
                        <input
                            type="number"
                            value={settings.commissionRate}
                            onChange={(e) => setSettings({ ...settings, commissionRate: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">QR Expiry (Days)</label>
                        <input
                            type="number"
                            value={settings.qrExpiryDays}
                            onChange={(e) => setSettings({ ...settings, qrExpiryDays: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>
            </div>

            {/* Feature Toggles */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                        <Settings className="w-5 h-5 text-orange-500" />
                    </div>
                    <h2 className="text-xl font-bold">Platform Features</h2>
                </div>
                <div className="space-y-4">
                    {[
                        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Send email alerts for important events' },
                        { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Send SMS alerts for emergency situations' },
                        { key: 'pushNotifications', label: 'Push Notifications', desc: 'Enable mobile push notifications' },
                        { key: 'allowSubAdminRegistration', label: 'Public Sub-Admin Registration', desc: 'Allow new sub-admins to register' },
                        { key: 'enableLiveTracking', label: 'Live GPS Tracking', desc: 'Enable real-time location tracking' },
                        { key: 'enableGeofencing', label: 'Geofencing Alerts', desc: 'Alert when users leave designated areas' },
                        { key: 'enableCustomBranding', label: 'Custom Branding', desc: 'Allow sub-admins to customize branding' },
                        { key: 'twoFactorAuth', label: 'Two-Factor Authentication', desc: 'Require 2FA for all admin accounts' },
                    ].map((feature) => (
                        <label key={feature.key} className="flex items-start gap-4 p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={settings[feature.key as keyof typeof settings] as boolean}
                                    onChange={(e) => setSettings({ ...settings, [feature.key]: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-indigo-600 transition-colors"></div>
                                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm">{feature.label}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Security Notice */}
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-orange-500">Security Notice</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Changes to security settings will affect all users. Make sure to test thoroughly before enabling in production.
                    </p>
                </div>
            </div>
        </div>
    )
}
