'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    Shield, QrCode, LogOut, Plus,
    Settings, BarChart3, Bell, Search, Menu,
    LayoutDashboard, MapPin, AlertTriangle, ShieldCheck, FileText, CreditCard,
    Crown, UserCog, Activity, Clock, Users, Package
} from 'lucide-react'
import toast from 'react-hot-toast'

import { Suspense } from 'react'

function AdminLayoutContent({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showNotifications, setShowNotifications] = useState(false)
    const [userRole, setUserRole] = useState<'super_pro_admin' | 'super_admin' | 'sub_admin' | null>(null)

    // Use a ref to prevent concurrent checkUser calls and redirect loops
    const isChecking = React.useRef(false)

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            checkUser()
        })

        checkUser()

        return () => {
            subscription.unsubscribe()
        }
    }, [pathname])

    async function checkUser() {
        // Prevent concurrent execution
        if (isChecking.current) return
        isChecking.current = true

        try {
            // --- 0. AUTH FRAGMENT OVERRIDE ---
            // If there is a hash in the URL, Supabase might be processing an auth token.
            // Redirecting now will cause an infinite loop and crash the dev server.
            if (typeof window !== 'undefined' && (window.location.hash || window.location.search.includes('code='))) {
                setLoading(true)
                return;
            }

            // --- 1. TOP LEVEL OVERRIDE ---
            // If we are visiting a unique admin login link, we MUST NOT redirect.
            // This takes priority over all existing sessions.
            const isSlugLogin = pathname?.startsWith('/admin/login/') && pathname !== '/admin/login';
            if (isSlugLogin) {
                localStorage.removeItem('admin_session');
                localStorage.removeItem('super_pro_admin_session');
                setUser(null);
                setUserRole(null);
                setLoading(false);
                return;
            }

            // 1. Priority: Local SaaS Sessions (Avoids Refresh Token Errors)
            const superProSession = localStorage.getItem('super_pro_admin_session')
            const adminSession = localStorage.getItem('admin_session')

            let activeUser = null
            let activeRole: 'super_pro_admin' | 'super_admin' | 'sub_admin' | null = null

            // 2. Identify Super Pro (Master)
            if (superProSession) {
                try {
                    const sp = JSON.parse(superProSession)
                    activeUser = { email: sp.email || 'SuperPro', name: sp.name || 'Super Pro Admin', isMaster: true }
                    activeRole = 'super_pro_admin'
                } catch (e) {
                    localStorage.removeItem('super_pro_admin_session')
                }
            }

            // 3. Identify Admin/Sub-Admin Context
            if (adminSession) {
                try {
                    const ad = JSON.parse(adminSession)

                    // Verify if user still exists in DB
                    const { data: dbUser, error: dbError } = await supabase
                        .from('users')
                        .select('status, company_name, logo_url, brand_color')
                        .eq('id', ad.id)
                        .maybeSingle()

                    if (dbUser?.status === 'suspended') {
                        // If suspended, don't clear session yet, but trap them on the suspended page
                        if (!pathname?.includes('/login') && !pathname?.startsWith('/admin/suspended')) {
                            router.push('/admin/suspended')
                            setLoading(false)
                            return
                        }
                        if (pathname?.startsWith('/admin/suspended')) {
                            setLoading(false)
                            return
                        }
                    }

                    if (dbError || !dbUser || dbUser.status !== 'active') {
                        localStorage.removeItem('admin_session')
                        localStorage.removeItem('super_pro_admin_session')

                        if (pathname !== '/' && !pathname?.includes('/login')) {
                            router.push('/')
                            return
                        }
                    } else {
                        // CRITICAL FIX: Only set activeRole to ad.role if we aren't already a Super Pro.
                        // This prevents session hijacking by lower-tier admin accounts.
                        if (!activeUser) {
                            activeUser = {
                                email: ad.email,
                                name: ad.name,
                                id: ad.id,
                                company_name: dbUser.company_name,
                                logo_url: dbUser.logo_url,
                                brand_color: dbUser.brand_color
                            }
                            activeRole = ad.role
                        } else {
                            // If we are a Super Pro, we can "impersonate" or manage this user.
                            activeUser = { ...activeUser, impersonatingId: ad.id, impersonatingName: ad.name }
                            // If we are NOT on the super-pro main page, we adopt the user's role for UI consistency
                            if (!pathname?.startsWith('/admin/super-pro')) {
                                activeRole = ad.role;
                            }
                        }
                    }
                } catch (e) {
                    localStorage.removeItem('admin_session')
                }
            }

            // 4. Last Resort: Supabase Auth
            if (!activeUser) {
                try {
                    const { data: { user: authUser } } = await supabase.auth.getUser()
                    if (authUser) {
                        const { data: userData } = await supabase.from('users').select('role').eq('id', authUser.id).maybeSingle()
                        activeUser = authUser
                        activeRole = userData?.role || 'sub_admin'
                    }
                } catch (authErr) {
                    console.debug('Supabase Auth skipped or failed.')
                }
            }

            const isAuthPage = pathname === '/admin/login' || pathname === '/admin/register' || pathname?.startsWith('/admin/login/') || pathname?.startsWith('/admin/super-login') || pathname?.startsWith('/admin/sub-login') || pathname?.startsWith('/admin/super-pro-login')

            if (!activeUser) {
                // AVOID RECURSIVE REDIRECT: Only redirect if not on an auth page AND not already on home
                if (!isAuthPage && pathname !== '/') {
                    router.push('/')
                    return
                }
                setLoading(false)
                return
            }

            // Role and Session Synchronization
            if (isAuthPage) {
                // If on a login page, let the page handle its own logic.
                // We only clear the loading state to show the form.
                setUser(activeUser)
                setUserRole(activeRole)
                setLoading(false)
                return
            }

            // Global State Update
            setUser(activeUser)
            setUserRole(activeRole)
            setLoading(false)
        } catch (e) {
            console.error('CheckUser failed:', e)
            setLoading(false)
        } finally {
            isChecking.current = false
        }
    }

    async function handleLogout() {
        // Clear server cookie
        const { logout } = await import('@/app/admin/actions');
        await logout();
        
        localStorage.removeItem('admin_session')
        localStorage.removeItem('super_pro_admin_session')
        await supabase.auth.signOut()
        router.push('/')
        toast.success('Logged out successfully')
    }

    function handleSearch(query: string) {
        setSearchQuery(query)
        const targetPath = '/admin/qrcodes'
        const searchParam = query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ''

        if (pathname !== targetPath) {
            router.push(`${targetPath}${searchParam}`)
        } else {
            router.replace(`${targetPath}${searchParam}`, { scroll: false })
        }
    }

    const isAuthPage = pathname === '/admin/login' || pathname === '/admin/register' || pathname?.startsWith('/admin/login/') || pathname?.startsWith('/admin/super-login') || pathname?.startsWith('/admin/sub-login') || pathname?.startsWith('/admin/super-pro-login')

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

    if (isAuthPage) {
        return (
            <main className="min-h-screen bg-background">
                {children}
            </main>
        )
    }

    // Define all possible nav items with role-based access
    const navItemsList = [
        // Core features (all admin types)
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard', roles: ['super_pro_admin', 'super_admin', 'sub_admin', 'analytics_admin'] },
        { icon: QrCode, label: 'QR Inventory', href: '/admin/qrcodes', roles: ['super_pro_admin', 'super_admin', 'sub_admin', 'analytics_admin'] },
        { icon: Plus, label: 'Generate', href: '/admin/generate', roles: ['super_pro_admin', 'super_admin', 'sub_admin'] },
        { icon: Clock, label: 'Expiry Status', href: '/admin/expiry', roles: ['super_pro_admin', 'super_admin', 'sub_admin', 'analytics_admin'] },
        { icon: CreditCard, label: 'Renewal Orders', href: '/admin/renewal-orders', roles: ['super_pro_admin', 'super_admin', 'sub_admin', 'analytics_admin'] },
        { icon: MapPin, label: 'Live Radar', href: '/admin/map', roles: ['super_pro_admin', 'super_admin', 'sub_admin', 'analytics_admin'] },
        { icon: Shield, label: 'Emergency Logs', href: '/admin/alerts', roles: ['super_pro_admin', 'super_admin', 'sub_admin', 'analytics_admin'] },

        { 
            icon: Package, 
            label: 'Purchase Orders', 
            href: userRole === 'super_pro_admin' ? '/admin/super-pro?tab=orders' : '/admin/dashboard?tab=orders', 
            roles: ['super_pro_admin', 'super_admin'] 
        },
        { icon: Crown, label: 'Manage Super-Admins', href: '/admin/super-pro', roles: ['super_pro_admin'], divider: true },

        // NEW: Analytics Management - Managed Client Portals
        { icon: Users, label: 'Managed Portals', href: '/admin/analytics', roles: ['super_pro_admin'] },

        // Super Admin ONLY - Sub Admin Management
        { icon: UserCog, label: 'Manage Node Operators', href: '/admin/super-admin', roles: ['super_admin'], divider: true },
    ]

    // Filter menu items based on user role - MUST HAVE ROLE
    const navItems = navItemsList.filter(item =>
        userRole && item.roles.includes(userRole)
    )

    // Sidebar navigation only rendered for logged in users
    return (
        <div
            className="min-h-screen bg-[#09090b] flex"
            style={{
                '--primary': user?.brand_color || '#a855f7',
                '--ring': user?.brand_color || '#a855f7'
            } as any}
        >
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? 'w-80' : 'w-24'} bg-[#09090b] border-r border-[#1a1a1a] transition-all duration-500 ease-in-out flex flex-col fixed h-full z-50`}
            >
                {/* Brand Header */}
                <div className="p-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-white/5 ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                            {user?.logo_url ? (
                                <img src={user.logo_url} alt="Logo" className="w-8 h-8 object-contain" />
                            ) : (
                                <Shield className="w-6 h-6 text-black" />
                            )}
                        </div>
                        {isSidebarOpen && (
                            <div className="flex flex-col">
                                <span className="text-xl font-black text-white tracking-tighter leading-none px-1">
                                    {user?.company_name || 'SAFETY QR'}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Command Ops</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Role Badge (Sidebar) */}
                {isSidebarOpen && userRole && (
                    <div className="px-8 mb-6">
                        <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                                    {userRole === 'super_pro_admin' ? <Crown className="w-4 h-4 text-primary" /> : <UserCog className="w-4 h-4 text-primary" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Access Level</span>
                                    <span className="text-xs font-bold text-white mt-1 capitalize">{userRole.replace(/_/g, ' ')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Scroll Area */}
                <nav className="flex-1 px-4 py-2 overflow-y-auto custom-scrollbar space-y-2">
                    {navItems.map((item, index) => (
                        <React.Fragment key={item.href}>
                            {item.divider && index !== 0 && (
                                <div className="mx-4 my-6 h-px bg-gradient-to-r from-transparent via-[#1a1a1a] to-transparent" />
                            )}
                            <Link
                                href={item.href}
                                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
                                    (pathname === item.href.split('?')[0] && (item.href.includes('?tab=') ? searchParams.get('tab') === item.href.split('tab=')[1] : true))
                                    ? 'bg-white text-black shadow-xl shadow-white/10 font-bold'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <item.icon className={`w-5 h-5 transition-transform duration-500 ${pathname === item.href.split('?')[0] ? 'scale-110' : 'group-hover:scale-110'}`} />
                                {isSidebarOpen && (
                                    <span className="text-sm font-black tracking-tight uppercase">{item.label}</span>
                                )}
                                {(pathname === item.href.split('?')[0]) && isSidebarOpen && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-black shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
                                )}
                            </Link>                        </React.Fragment>
                    ))}
                </nav>

                {/* Logout Button (Bottom) */}
                <div className="p-6 border-t border-[#1a1a1a] bg-[#09090b]/50 backdrop-blur-xl">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all duration-300 group"
                    >
                        <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                        {isSidebarOpen && <span className="text-sm font-black uppercase tracking-tight">System Logout</span>}
                    </button>
                    {isSidebarOpen && (
                        <div className="mt-4 px-6 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none">Server Active</span>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <main
                className={`flex-1 ${isSidebarOpen ? 'ml-80' : 'ml-24'} transition-all duration-500 ease-in-out min-h-screen relative bg-[#09090b]`}
            >
                {/* Background Decor */}
                <div className="fixed inset-0 pointer-events-none opacity-30">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -mr-64 -mt-64" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -ml-64 -mb-64" />
                </div>

                {/* Sticky Header */}
                <header className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-2xl border-b border-[#1a1a1a] px-12 py-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-3 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-300"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <div className="h-6 w-px bg-white/10" />
                            <div className="flex flex-col">
                                <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] leading-none mb-1.5">Current Vector</h2>
                                <h1 className="text-xl font-black text-white uppercase tracking-tight">
                                    {navItems.find(i => i.href === pathname)?.label || 'System Core'}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Search (Desktop) */}
                            <div
                                className="hidden lg:flex items-center gap-4 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl group focus-within:bg-white/10 focus-within:border-white/20 transition-all duration-300 cursor-text"
                                onClick={() => document.getElementById('global-search-input')?.focus()}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSearch(searchQuery)
                                    }}
                                    className="p-1 -m-1 hover:text-white transition-colors"
                                >
                                    <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                                </button>
                                <input
                                    id="global-search-input"
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search Global DB..."
                                    className="bg-transparent border-none focus:outline-none text-sm text-white font-bold placeholder:text-zinc-600 w-48"
                                />
                            </div>

                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="relative w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-300 group"
                                >
                                    <Bell className="w-5 h-5 transition-transform group-hover:scale-110" />
                                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(168,85,247,0.5)] border-2 border-[#09090b]" />
                                </button>

                                {showNotifications && (
                                    <div className="absolute top-16 right-0 w-80 bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-3xl z-50">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Recent Alerts</h3>
                                            <span className="text-[10px] text-primary font-bold">New</span>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                                                <p className="text-xs font-bold text-white mb-1">New Node Activated</p>
                                                <p className="text-[10px] text-zinc-500">System node #2901 just came online.</p>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                                                <p className="text-xs font-bold text-white mb-1">Security Checkup</p>
                                                <p className="text-[10px] text-zinc-500">All protocols are operating normally.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Profile */}
                            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                                <div className="flex flex-col items-end hidden sm:flex">
                                    <p className="text-sm font-black text-white leading-none uppercase tracking-tight">
                                        {user?.name || 'Administrator'}
                                    </p>
                                    <div className="flex flex-col items-end">
                                        <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest leading-tight">
                                            {userRole?.replace(/_/g, ' ') || 'System'}
                                        </p>
                                        {user?.impersonatingName && (
                                            <p className="text-[8px] font-black text-primary uppercase tracking-tighter bg-primary/10 px-1 rounded mt-0.5">
                                                Managing: {user.impersonatingName}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-white to-zinc-400 rounded-2xl flex items-center justify-center font-black text-black shadow-xl shadow-white/5 ring-1 ring-white/10 relative group">
                                    {user?.email?.[0].toUpperCase() || 'A'}
                                    {user?.isMaster && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center border-2 border-[#09090b]">
                                            <Crown className="w-2 h-2 text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Container */}
                {children}
                
                <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 255, 255, 0.1);
                    }
                `}</style>
            </main>
        </div>
    )
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 border-b-2 border-primary rounded-full animate-spin"></div>
                    <Shield className="w-6 h-6 text-primary absolute" />
                </div>
            </div>
        }>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </Suspense>
    )
}
