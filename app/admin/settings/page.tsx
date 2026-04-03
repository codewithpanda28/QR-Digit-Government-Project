'use client'

import { useState, useEffect } from 'react'
import { User, Bell, Shield, LogOut, Loader2, Lock, X, Settings, Palette, Globe, Smartphone, Save, Zap, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('profile')
    const [notifications, setNotifications] = useState({
        email: true,
        sms: true,
        push: false
    })

    // Password Change State
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordLoading, setPasswordLoading] = useState(false)

    useEffect(() => {
        loadUser()
    }, [])

    async function loadUser() {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            setUser(user)
        }
        setLoading(false)
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    const toggleNotification = (type: string) => {
        setNotifications((prev: any) => ({ ...prev, [type]: !prev[type] }))
        toast.success(`Protocol updated for ${type.toUpperCase()}`)
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match")
            return
        }
        setPasswordLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            if (error) throw error
            toast.success('Security credentials updated')
            setIsChangingPassword(false)
            setNewPassword('')
            setConfirmPassword('')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setPasswordLoading(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <Zap className="w-8 h-8 text-primary animate-pulse" />
        </div>
    )

    return (
        <div className="min-h-screen bg-background text-foreground p-6 lg:p-12 mb-20 md:mb-0 selection:bg-primary/30">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Visual Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.3em] mb-4">
                            <Settings className="w-4 h-4" />
                            System Configuration
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter">Preferences</h1>
                        <p className="text-muted-foreground text-lg font-medium mt-2">Fine-tune your administrative environment and security defaults.</p>
                    </div>
                    <button className="px-8 py-4 bg-white text-black font-black rounded-2xl flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-xl shadow-white/10">
                        <Save className="w-5 h-5" />
                        Save Changes
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Settings Navigation */}
                    <div className="w-full lg:w-72 shrink-0 space-y-2">
                        <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={User} label="Admin Profile" />
                        <NavButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon={Bell} label="Alert Routing" />
                        <NavButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={Shield} label="Security Vault" />
                        <NavButton active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} icon={Palette} label="System Theme" />
                        <div className="pt-8 border-t border-zinc-900 mt-8">
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 font-bold hover:bg-red-500/10 transition-all group"
                            >
                                <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                Terminate Session
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] p-10 backdrop-blur-3xl">
                        {activeTab === 'profile' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                                <div className="flex items-center gap-8">
                                    <div className="w-24 h-24 bg-primary/20 rounded-[2rem] flex items-center justify-center border-4 border-zinc-900 shadow-2xl relative group overflow-hidden">
                                        <User className="w-12 h-12 text-primary" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-[10px] font-black uppercase text-white">Edit</div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight">{user?.user_metadata?.full_name || 'System Admin'}</h3>
                                        <p className="text-zinc-500 font-medium">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-zinc-800/50">
                                    <FormInput label="Full Name" value={user?.user_metadata?.full_name || 'Administrator'} />
                                    <FormInput label="Official Email" value={user?.email || ''} />
                                    <FormInput label="Security Clearance" value="Super Admin (Level 4)" disabled />
                                    <FormInput label="Auth Method" value="Supabase Managed" disabled />
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                                <h3 className="text-2xl font-black mb-6">Real-time Alert Routing</h3>
                                <div className="space-y-4">
                                    <ToggleItem
                                        icon={Globe}
                                        label="Global Email Relays"
                                        desc="Dispatch incident logs to official email"
                                        active={notifications.email}
                                        onToggle={() => toggleNotification('email')}
                                    />
                                    <ToggleItem
                                        icon={Smartphone}
                                        label="SMS Direct Uplink"
                                        desc="Instant SMS for critical SOS triggers"
                                        active={notifications.sms}
                                        onToggle={() => toggleNotification('sms')}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                                <h3 className="text-2xl font-black mb-6">Security Access Vault</h3>
                                {isChangingPassword ? (
                                    <form onSubmit={handlePasswordChange} className="space-y-6">
                                        <div className="space-y-4">
                                            <input
                                                type="password"
                                                placeholder="New Master Password"
                                                className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 font-bold focus:border-primary transition-all outline-none"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                            <input
                                                type="password"
                                                placeholder="Confirm New Password"
                                                className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 font-bold focus:border-primary transition-all outline-none"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-4">
                                            <button type="submit" className="flex-1 py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-all">
                                                {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm New Password'}
                                            </button>
                                            <button type="button" onClick={() => setIsChangingPassword(false)} className="px-8 py-4 bg-zinc-800 text-white font-black rounded-2xl">Cancel</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-4">
                                        <button
                                            onClick={() => setIsChangingPassword(true)}
                                            className="w-full p-8 bg-black/40 border border-zinc-800 rounded-[2rem] flex items-center justify-between group hover:border-primary transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-primary/10 rounded-xl text-primary"><Lock className="w-6 h-6" /></div>
                                                <div className="text-left">
                                                    <p className="font-black text-white">Reset Administrative Password</p>
                                                    <p className="text-xs text-zinc-500 font-bold uppercase mt-1">Last changed: 3 months ago</p>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-zinc-700 group-hover:text-primary group-hover:translate-x-2 transition-all" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                                <h3 className="text-2xl font-black mb-6 shadow-text">Visual Interface Override</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <ThemeOption label="Deep Cosmos" color="bg-[#050505]" active />
                                    <ThemeOption label="Night Vision" color="bg-green-950" />
                                    <ThemeOption label="Tactical Grey" color="bg-zinc-900" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function NavButton({ active, icon: Icon, label, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${active ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
        >
            <Icon className="w-5 h-5" />
            {label}
        </button>
    )
}

function FormInput({ label, value, disabled }: any) {
    return (
        <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 pl-2">{label}</label>
            <input
                type="text"
                value={value}
                disabled={disabled}
                readOnly
                className="w-full bg-black/40 border border-zinc-800/50 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-primary transition-all outline-none"
            />
        </div>
    )
}

function ToggleItem({ icon: Icon, label, desc, active, onToggle }: any) {
    return (
        <div className="p-6 bg-black/20 border border-zinc-800 rounded-[2rem] flex items-center justify-between group">
            <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl ${active ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-600'}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="font-black text-white">{label}</p>
                    <p className="text-xs text-zinc-500 font-medium uppercase mt-0.5">{desc}</p>
                </div>
            </div>
            <button
                onClick={onToggle}
                className={`w-14 h-8 rounded-full flex items-center px-1 transition-all ${active ? 'bg-primary shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-zinc-800'}`}
            >
                <div className={`w-6 h-6 rounded-full bg-white shadow-xl transition-all ${active ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
        </div>
    )
}

function ThemeOption({ label, color, active }: any) {
    return (
        <div className={`p-4 rounded-[2rem] border-2 transition-all cursor-pointer group ${active ? 'border-primary bg-primary/5' : 'border-zinc-800 hover:border-zinc-600'}`}>
            <div className={`w-full h-24 rounded-2xl ${color} mb-4 border border-white/5`}></div>
            <p className={`text-[10px] font-black uppercase text-center tracking-widest ${active ? 'text-primary' : 'text-zinc-500 group-hover:text-zinc-300'}`}>{label}</p>
        </div>
    )
}
