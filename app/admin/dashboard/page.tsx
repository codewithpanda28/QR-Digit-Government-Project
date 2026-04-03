'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
    QrCode, TrendingUp, Plus,
    Activity, ArrowRight, Clock,
    AlertTriangle, Phone, MapPin, Calendar, LayoutDashboard, Shield, ArrowUpRight, Loader2,
    BarChart3, ShieldCheck, CreditCard, UserCog, UserPlus, Users, Crown, Trash2, Edit, Copy, Radar, User,
    Package, Truck, RefreshCw, Mail, CheckCircle
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts'
import { getAdminDashboardStats, getPurchaseOrdersServer, updatePurchaseOrderStatusServer } from '@/app/admin/actions'

const scanData = [
    { name: 'Mon', scans: 45, alerts: 2 },
    { name: 'Tue', scans: 52, alerts: 1 },
    { name: 'Wed', scans: 38, alerts: 4 },
    { name: 'Thu', scans: 65, alerts: 0 },
    { name: 'Fri', scans: 48, alerts: 3 },
]

export default function DashboardPage() {
    const router = useRouter()
    const [stats, setStats] = useState<any>({
        totalQRCodes: 0,
        activeQRCodes: 0,
        emergencyAlerts: 0,
        totalScans: 0,
        scanStats: []
    })
    const [recentAlerts, setRecentAlerts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<'super_pro_admin' | 'super_admin' | 'sub_admin' | 'analytics_admin' | null>(null)
    const [adminName, setAdminName] = useState<string>('')
    const [adminSlug, setAdminSlug] = useState<string>('')
    const searchParams = useSearchParams()
    const [activeTab, setActiveTab] = useState<'overview' | 'orders'>((searchParams.get('tab') as any) === 'orders' ? 'orders' : 'overview')
    const [orders, setOrders] = useState<any[]>([])
    const [ordersLoading, setOrdersLoading] = useState(false)

    useEffect(() => {
        checkUserRole()
        loadStats()

        const channel = supabase
            .channel('dashboard-feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'emergency_alerts' }, (payload) => {
                toast.error('NEW EMERGENCY DETECTED', { icon: '🚨', position: 'top-center' })
                loadStats()
            })
            .subscribe()

        if (searchParams.get('tab') === 'orders') {
            loadOrders();
        }

        return () => { supabase.removeChannel(channel) }
    }, [searchParams])

    async function loadStats() {
        try {
            const superProSession = localStorage.getItem('super_pro_admin_session')
            const adminSession = localStorage.getItem('admin_session')
            
            let targetId = null
            let isSuperPro = false

            if (superProSession) {
                isSuperPro = true
                targetId = 'super_pro_admin'
            } else if (adminSession) {
                targetId = JSON.parse(adminSession).id
            }

            if (targetId) {
                const result = await getAdminDashboardStats(targetId, isSuperPro)
                if (result.success && result.data) {
                    setStats({
                        totalQRCodes: result.data.totalQRs || 0,
                        activeQRCodes: result.data.activeQRs || 0,
                        emergencyAlerts: result.data.alerts || 0,
                        totalScans: result.data.scans || 0,
                        scanStats: result.data.scanStats || []
                    })
                    setRecentAlerts(result.data.recentAlerts || [])
                }
            }
        } catch (error) {
            console.error('Error loading stats:', error)
        } finally {
            setLoading(false)
        }
    }

    async function checkUserRole() {
        const superProSession = localStorage.getItem('super_pro_admin_session')
        if (superProSession) {
            try {
                const session = JSON.parse(superProSession)
                setUserRole('super_pro_admin')
                setAdminName(session.name || 'Master Admin')
                setAdminSlug('MASTER_CONTROL')
                return 
            } catch (e) {
                localStorage.removeItem('super_pro_admin_session')
            }
        }

        const adminSession = localStorage.getItem('admin_session')
        if (adminSession) {
            try {
                const session = JSON.parse(adminSession)
                setUserRole(session.role)
                setAdminName(session.name)
                setAdminSlug(session.id.substring(0, 8))
            } catch (e) {
                localStorage.removeItem('admin_session')
            }
        }
    }

    async function loadOrders() {
        setOrdersLoading(true);
        const res = await getPurchaseOrdersServer();
        if (res.success) setOrders(res.data || []);
        setOrdersLoading(false);
    }

    async function updateOrderStatus(orderId: string, newStatus: string) {
        const res = await updatePurchaseOrderStatusServer(orderId, newStatus);
        if (!res.success) { toast.error('Status update failed'); return; }
        toast.success(`Order status → ${newStatus}`);
        loadOrders();

        // WhatsApp Notification
        const order = orders.find((o: any) => o.order_id === orderId);
        if (order && order.customer_phone) {
            let msg = `*QRdigit Order Update* 📦\n\nNamaste ${order.customer_name} ji,\nAapka order (${order.product_name}) ka status update hua hai:\n\n*Current Status:* ${newStatus}\n`;
            if (newStatus === 'PROCESSING') msg += '\nAapka order pack kiya ja raha hai aur jaldi dispatch hoga. 🚚';
            else if (newStatus === 'SHIPPED') msg += '\nAapka order courier ke through nikal chuka hai! Jaldi aapke paas pahunchega. 📍';
            else if (newStatus === 'DELIVERED') msg += '\nAapka order successfully deliver ho chuka hai! QRdigit se judne ke liye shukriya. ✅';
            msg += '\n\n- QRdigit Team 🛡️';
            
            const waPhone = order.customer_phone.replace(/\D/g, '');
            const waLink = `https://wa.me/91${waPhone}?text=${encodeURIComponent(msg)}`;
            
            toast((t) => (
                <div className="flex flex-col gap-2">
                    <span className="font-semibold px-1 text-black text-xs">WhatsApp message bhejein?</span>
                    <button 
                        onClick={() => { window.open(waLink, '_blank'); toast.dismiss(t.id); }}
                        className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2"
                    >
                        Send WhatsApp Now
                    </button>
                </div>
            ), { duration: 6000 });
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    )

    return (
        <div className="p-4 lg:p-12 space-y-12 bg-black min-h-screen">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-4">
                        <img 
                            src="/Logo.png" 
                            alt="Raksha Logo" 
                            className="h-12 w-auto object-contain" 
                        />
                        <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">
                            Welcome, {adminName}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                        <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
                        <p className="text-primary font-black uppercase tracking-widest text-[10px] bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                            ADMIN ID: {adminSlug}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 no-print">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-primary text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Overview
                    </button>
                    {userRole === 'super_pro_admin' && (
                        <button 
                            onClick={() => { setActiveTab('orders'); loadOrders(); }}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-primary text-white shadow-lg' : 'text-zinc-500 hover:text-white'} flex items-center gap-2`}
                        >
                            <Package className="w-4 h-4" />
                            Purchase Orders
                        </button>
                    )}
                    <button onClick={() => router.push('/admin/map')} className="px-6 py-2.5 text-zinc-500 hover:text-white font-black text-xs uppercase tracking-widest transition-all">Network Radar</button>
                </div>
            </header>

            {activeTab === 'overview' ? (
                <>
                {/* Global Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard icon={QrCode} label="Total QR Codes" value={stats.totalQRCodes.toString()} color="purple" />
                    <StatCard icon={Activity} label="Active QR Codes" value={stats.activeQRCodes.toString()} color="blue" />
                    <StatCard icon={AlertTriangle} label="Emergency Alerts" value={stats.emergencyAlerts.toString()} color="red" />
                    <StatCard icon={TrendingUp} label="Total Scans" value={stats.totalScans.toString()} color="green" />
                </div>

                {/* Core Services Quick Links */}
                <div>
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 italic uppercase">
                        <Shield className="w-6 h-6 text-primary" />
                        Core Services
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {userRole !== 'analytics_admin' && (
                            <ModuleLink href="/admin/generate" title="Batch Generation" desc="Create new QR fleet" icon={Plus} color="purple" />
                        )}
                        <ModuleLink href="/admin/qrcodes" title="QR Inventory" desc="Manage all codes" icon={QrCode} color="blue" />
                        <ModuleLink href="/admin/expiry" title="Expiry Status" desc="Track validity" icon={Clock} color="orange" />
                        <ModuleLink href="/admin/map" title="Live Radar" desc="Track locations" icon={MapPin} color="blue" />
                        <ModuleLink href="/admin/alerts" title="Emergency Logs" desc="Recent incidents" icon={Shield} color="red" />
                    </div>
                </div>

                {/* Charts & Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-zinc-950 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden h-[400px]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
                                <BarChart3 className="w-6 h-6 text-primary" />
                                Scan Velocity
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                <span className="w-2 h-2 bg-primary rounded-full"></span> Regular Scans
                            </div>
                        </div>
                        <div className="h-full w-full">
                            <ResponsiveContainer width="100%" height="80%">
                                <AreaChart data={stats.scanStats}>
                                    <defs>
                                        <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ background: '#09090b', border: '1px solid #1f2937', borderRadius: '12px' }}
                                        itemStyle={{ color: '#a855f7', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="scans" stroke="#a855f7" strokeWidth={4} fillOpacity={1} fill="url(#colorScans)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[400px]">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3 text-rose-500">
                                <Radar className="w-5 h-5 animate-[ping_2s_ease-out_infinite]" />
                                Live Radar Log
                            </h3>
                            <Link href="/admin/map" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors underline underline-offset-4">Open Matrix</Link>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                            {recentAlerts?.length > 0 ? (
                                recentAlerts.map((alert, i) => (
                                    <div key={i} className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-xl relative block">
                                        {/* Mini map header */}
                                        <div className="h-[90px] w-full relative bg-zinc-800">
                                            {alert.latitude && alert.longitude ? (
                                                <iframe
                                                    src={`https://maps.google.com/maps?q=${alert.latitude},${alert.longitude}&t=m&z=14&output=embed`}
                                                    className="w-full h-full object-cover opacity-60 pointer-events-none"
                                                    style={{ border: 0, filter: 'invert(100%) hue-rotate(180deg) brightness(0.6)' }}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-zinc-900 flex items-center justify-center opacity-30"><Radar className="w-8 h-8 text-zinc-600 animate-spin" /></div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                                            
                                            {/* Status Tag */}
                                            <div className="absolute top-3 left-3 flex gap-2">
                                                <div className="px-3 py-1 bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-xl flex items-center gap-2 shadow-lg">
                                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest italic">{alert.alert_type === 'sos_trigger' ? 'SOS Active' : 'Scan'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Body content floating over map */}
                                        <div className="px-4 pb-4 flex gap-4 mt-[-25px] relative z-10 transition-transform group-hover:translate-y-[-5px]">
                                            <div className="shrink-0 relative">
                                                {alert.evidence_photo ? (
                                                    <img src={alert.evidence_photo} className="w-14 h-14 rounded-2xl object-cover border-4 border-zinc-900 bg-black shadow-2xl" />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-2xl border-4 border-zinc-900 bg-zinc-800 flex items-center justify-center shadow-2xl">
                                                        <User className="w-6 h-6 text-zinc-600" />
                                                    </div>
                                                )}
                                                {alert.evidence_photo && (
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-md border-2 border-zinc-900 flex items-center justify-center">
                                                    <Shield className="w-2.5 h-2.5 text-black" />
                                                </div>
                                                )}
                                            </div>

                                            <div className="pt-7 min-w-0 flex-1">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <p className="font-black text-sm text-white italic uppercase truncate w-32 md:w-full">{alert.owner_name}</p>
                                                    <Link href="/admin/map" className="text-[9px] bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-all font-black tracking-widest shadow-[0_0_15px_rgba(168,85,247,0.2)]">TETHER ↗</Link>
                                                </div>
                                                <p className="text-[9px] font-bold text-zinc-500 uppercase truncate mb-1 border-l-2 border-primary/40 pl-2 ml-1">📍 {alert.location_address || 'Calculating Vector...'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                                    <ShieldCheck className="w-16 h-16 text-zinc-800 mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]" />
                                    <h4 className="text-white font-black text-lg uppercase tracking-tight italic mb-2">Perimeter Secured</h4>
                                    <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">No active threats detected</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                </>
            ) : (
                /* PURCHASE ORDERS VIEW */
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                                <Package className="w-8 h-8 text-primary" />
                                Order Management
                            </h2>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Operational Logistics • Delivery Pipeline</p>
                        </div>
                        <button 
                            onClick={loadOrders} 
                            disabled={ordersLoading}
                            className="p-3 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-500 hover:text-white hover:border-white/10 transition-all active:scale-95"
                        >
                            <RefreshCw className={`w-5 h-5 ${ordersLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {ordersLoading ? (
                        <div className="py-32 flex flex-col items-center justify-center gap-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">Syncing Order Matrix...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="py-32 bg-zinc-950 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-center">
                            <Package className="w-16 h-16 text-zinc-900 mb-6" />
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-1">Zero Orders Detected</h3>
                            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Inventory stack is currently dormant</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {orders.map((order) => (
                                <div key={order.id} className="bg-zinc-950 border border-white/5 rounded-[2.5rem] p-8 hover:border-primary/20 transition-all duration-500 group relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                     <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                                        
                                        {/* Status & ID */}
                                        <div className="lg:col-span-2 space-y-4">
                                            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border text-center ${
                                                order.status === 'PAID' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                order.status === 'PROCESSING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                order.status === 'SHIPPED' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                                order.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                'bg-zinc-800 text-zinc-500 border-zinc-700'
                                            }`}>
                                                {order.status}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Node Entry</p>
                                                <p className="text-xs font-mono text-zinc-500">#{order.order_id.substring(0, 12)}</p>
                                                <p className="text-[10px] text-zinc-700 mt-2">{new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>

                                        {/* Customer */}
                                        <div className="lg:col-span-3 space-y-4">
                                            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Credentials</p>
                                            <div className="space-y-1">
                                                <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">{order.customer_name}</h4>
                                                <p className="text-zinc-500 text-xs font-bold flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> +91 {order.customer_phone}</p>
                                                <p className="text-zinc-500 text-xs font-medium flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5" /> {order.customer_email}</p>
                                            </div>
                                        </div>

                                        {/* Logistics */}
                                        <div className="lg:col-span-4 space-y-4">
                                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Logistics Vector</p>
                                            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-2">
                                                <p className="text-white text-xs font-bold flex items-start gap-2 leading-relaxed">
                                                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                    {order.delivery_address}
                                                </p>
                                                <p className="text-zinc-500 text-[10px] font-bold uppercase pl-6">{order.delivery_city}, {order.delivery_state} — {order.delivery_pincode}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                                                    <p className="text-primary text-[10px] font-bold uppercase tracking-widest mb-0.5">{order.product_name}</p>
                                                    <p className="text-white text-xs font-black">₹{order.amount}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Control */}
                                        <div className="lg:col-span-3 space-y-4 pt-4 lg:pt-0">
                                             <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Terminal Actions</p>
                                             <div className="grid grid-cols-1 gap-2">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => updateOrderStatus(order.order_id, e.target.value)}
                                                    className="w-full px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase text-white tracking-widest outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="PAID">PAID (NEW)</option>
                                                    <option value="PROCESSING">PROCESSING</option>
                                                    <option value="SHIPPED">SHIPPED</option>
                                                    <option value="DELIVERED">DELIVERED</option>
                                                </select>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            const msg = `*QRdigit Order Update* 📦\n\nNamaste ${order.customer_name} ji,\nAapka order (${order.product_name}) check kiya gaya hai. 🛡️\n\n- QRdigit Team`;
                                                            window.open(`https://wa.me/91${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                                        }}
                                                        className="flex-1 py-3 bg-emerald-600/10 border border-emerald-600/20 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
                                                    >
                                                        WhatsApp
                                                    </button>
                                                    <button className="flex-1 py-3 bg-zinc-900 border border-white/5 text-zinc-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-white/20 transition-all">Details</button>
                                                </div>
                                             </div>
                                        </div>
                                     </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function StatCard({ icon: Icon, label, value, color }: any) {
    const colorMap: any = {
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
        green: 'bg-green-500/10 text-green-400 border-green-500/20',
    }
    return (
        <div className="bg-zinc-950 border border-white/5 p-6 rounded-[2.5rem] group hover:border-primary/50 transition-all relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-[40px] rounded-full -mr-12 -mt-12 group-hover:bg-primary/5 transition-all"></div>
            <div className={`p-3 w-fit rounded-2xl mb-4 relative z-10 ${colorMap[color] || colorMap.purple}`}><Icon className="w-6 h-6 border-none" /></div>
            <p className="text-4xl font-black text-white mb-1 relative z-10">{value}</p>
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] relative z-10">{label}</p>
        </div>
    )
}

function ModuleLink({ href, title, desc, icon: Icon, color }: any) {
    const colorStyles: any = {
        blue: 'from-blue-600/10 to-transparent border-blue-500/10 text-blue-400',
        purple: 'from-purple-600/10 to-transparent border-purple-500/10 text-purple-400',
        red: 'from-rose-600/10 to-transparent border-red-500/10 text-red-400',
        orange: 'from-orange-600/10 to-transparent border-orange-500/10 text-orange-400',
    }
    return (
        <Link href={href} className="group">
            <div className={`h-full p-6 rounded-[2.5rem] border bg-gradient-to-br ${colorStyles[color] || colorStyles.purple} hover:border-white/10 transition-all shadow-xl`}>
                <div className="p-3 rounded-2xl bg-zinc-900 border border-white/5 w-fit mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform"><Icon className="w-6 h-6" /></div>
                <h4 className="text-white font-black italic uppercase mb-1 group-hover:text-primary transition-colors">{title}</h4>
                <p className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider">{desc}</p>
            </div>
        </Link>
    )
}
