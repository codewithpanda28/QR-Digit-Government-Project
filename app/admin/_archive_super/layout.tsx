'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    Shield, LogOut, Menu, Bell,
    LayoutDashboard, Users, DollarSign, BarChart3, Settings,
    ShieldCheck, Crown
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [showPincodeModal, setShowPincodeModal] = useState(false)
    const [pincode, setPincode] = useState('')
    const [pincodeError, setPincodeError] = useState('')
    const [isPincodeVerified, setIsPincodeVerified] = useState(false)

    useEffect(() => {
        checkPincode()
    }, [])

    useEffect(() => {
        if (isPincodeVerified) {
            checkUser()
        }
    }, [isPincodeVerified])

    function checkPincode() {
        const verified = localStorage.getItem('super_admin_pincode_verified')
        if (verified === 'true') {
            setIsPincodeVerified(true)
        } else {
            setShowPincodeModal(true)
            setLoading(false)
        }
    }

    function handlePincodeSubmit(e: React.FormEvent) {
        e.preventDefault()
        const correctPincode = process.env.NEXT_PUBLIC_SUPER_ADMIN_PINCODE || '180117'

        if (pincode === correctPincode) {
            localStorage.setItem('super_admin_pincode_verified', 'true')
            setIsPincodeVerified(true)
            setShowPincodeModal(false)
            setPincodeError('')
        } else {
            setPincodeError('Incorrect pincode. Please try again.')
            setPincode('')
        }
    }

    async function checkUser() {
        // Check for Admin Session (LocalStorage) - This is super admin
        const adminSession = localStorage.getItem('admin_session')
        if (adminSession) {
            try {
                const session = JSON.parse(adminSession)
                if (session.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
                    setUser({ email: session.email, role: 'super_admin' })
                    setLoading(false)
                    return
                }
            } catch (e) {
                console.error('Invalid admin session', e)
                localStorage.removeItem('admin_session')
            }
        }

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            router.push('/admin/login')
            return
        }

        // For now, allow authenticated users (will add role check after migration)
        setUser(user)
        setLoading(false)
    }

    async function handleLogout() {
        localStorage.removeItem('admin_session')
        await supabase.auth.signOut()
        toast.success('Signed out')
        router.push('/')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 border-b-2 border-primary rounded-full animate-spin"></div>
                    <Shield className="w-6 h-6 text-primary absolute" />
                </div>
            </div>
        )
    }

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/super/dashboard' },
        { icon: Users, label: 'Sub-Admins', href: '/admin/super/sub-admins' },
        { icon: ShieldCheck, label: 'Subscription Plans', href: '/admin/super/plans' },
        { icon: DollarSign, label: 'Revenue', href: '/admin/super/revenue' },
        { icon: BarChart3, label: 'Analytics', href: '/admin/super/analytics' },
        { icon: Settings, label: 'Platform Settings', href: '/admin/super/settings' },
    ]

    // Pincode Modal
    if (showPincodeModal) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 selection:bg-purple-500/30">
                <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                    <div className="bg-[#18181b] border border-white/5 rounded-[2.5rem] p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-[60px] rounded-full -mr-16 -mt-16"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/10 blur-[60px] rounded-full -ml-16 -mb-16"></div>

                        {/* Header */}
                        <div className="text-center mb-10 relative">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_10px_30px_rgba(124,58,237,0.3)] rotate-3">
                                <Crown className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Access Restricted</h1>
                            <p className="text-zinc-500 text-sm font-medium">
                                Super Admin Identity Verification Required
                            </p>
                        </div>

                        {/* Pincode Form */}
                        <form onSubmit={handlePincodeSubmit} className="space-y-8 relative">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-center">
                                    6-Digit Secure Passcode
                                </label>
                                <div className="flex justify-between gap-2 max-w-[300px] mx-auto">
                                    {[...Array(6)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-10 h-14 border-2 rounded-xl flex items-center justify-center transition-all duration-300 ${pincode.length > i
                                                ? 'border-purple-500 bg-purple-500/10 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                                : 'border-zinc-800 bg-zinc-900/50 text-zinc-700'
                                                }`}
                                        >
                                            {pincode[i] ? (
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            ) : (
                                                <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <input
                                    type="password"
                                    value={pincode}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                                        setPincode(value)
                                        setPincodeError('')
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-default"
                                    autoFocus
                                    maxLength={6}
                                />
                                {pincodeError && (
                                    <p className="text-xs text-rose-500 mt-4 text-center font-bold animate-shake bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">
                                        Invalid access code. Authorization denied.
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={pincode.length !== 6}
                                className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-2xl hover:shadow-[0_10px_40px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale disabled:scale-100 flex items-center justify-center gap-3"
                            >
                                UNLOCK DASHBOARD
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="mt-10 pt-8 border-t border-white/5 text-center">
                            <div className="flex items-center justify-center gap-2 text-zinc-600">
                                <Shield className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">thinkTrust Layer 3 Security</span>
                            </div>
                        </div>
                    </div>
                </div>
                <style jsx>{`
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-5px); }
                        75% { transform: translateX(5px); }
                    }
                    .animate-shake {
                        animation: shake 0.2s ease-in-out 0s 2;
                    }
                `}</style>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 bg-background border-r border-border transition-all duration-300 lg:relative ${isSidebarOpen ? 'w-64' : 'w-0 lg:w-20'} overflow-hidden`}>
                <div className="flex flex-col h-full p-4">
                    <div className="flex items-center gap-3 px-2 mb-10 h-10">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                            <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div className={`transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                            <h1 className="text-lg font-bold tracking-tight">ThinkTrust</h1>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Super Admin</p>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-1">
                        {navItems.map((item, id) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={id}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive ? 'bg-gradient-to-r from-purple-600/10 to-indigo-600/10 text-primary ring-1 ring-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                                >
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                    <span className={`text-sm font-medium transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Regular Admin Access */}
                    <div className="mb-4 pt-4 border-t border-border">
                        <Link
                            href="/admin/dashboard"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all group"
                        >
                            <ShieldCheck className="w-5 h-5" />
                            <span className={`text-sm font-medium transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>Regular Admin</span>
                        </Link>
                    </div>

                    <div className="pt-4 border-t border-border">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all group"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className={`text-sm font-medium transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Viewport */}
            <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
                {/* Navbar */}
                <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/50 backdrop-blur-xl sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-muted-foreground"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="hidden md:flex items-center text-sm font-medium text-muted-foreground">
                            <span className="opacity-50">Super Admin Portal</span>
                            <span className="mx-2">/</span>
                            <span className="text-foreground capitalize">{pathname?.split('/').pop()?.replace('-', ' ') || 'Dashboard'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-primary rounded-full"></span>
                        </button>
                        <div className="h-8 w-[1px] bg-border mx-1"></div>
                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold leading-none">{user?.email?.split('@')[0]}</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                                    <Crown className="w-3 h-3" />
                                    Super Admin
                                </p>
                            </div>
                            <div className="w-9 h-9 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full flex items-center justify-center font-bold text-white shadow-lg overflow-hidden ring-2 ring-white/10">
                                {user?.email?.[0].toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto custom-scrollbar">
                    {children}
                </main>
            </div>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #27272a;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #3f3f46;
                }
            `}</style>
        </div>
    )
}
