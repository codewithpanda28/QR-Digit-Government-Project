'use client';

import { useState, useEffect } from 'react';
import { Users, Shield, CreditCard, TrendingUp, Calendar, UserCog, Search, Plus, Edit, Trash2, Lock, Unlock, Crown, LogOut, QrCode, Key, FileText, IndianRupee, ShieldCheck, Activity, BarChart3, ChevronDown, ChevronRight, History, ExternalLink, Package, Truck, MapPin, Phone, Mail, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getAdmins, createAdmin, deleteAdmin, getGlobalHierarchy, updateAdmin, getMonthlyQRHistory, getAdminDashboardStats, getPurchaseOrdersServer, updatePurchaseOrderStatusServer, getGlobalAdminStats } from '../actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import toast from 'react-hot-toast';

interface Admin {
    id: string;
    email: string;
    name: string;
    role: 'super_admin' | 'sub_admin';
    created_at: string;
    status: 'active' | 'suspended';
    subscription_plan: string;
    subscription_expiry?: string;
    total_qr_codes: number;
    subscription_duration?: string;
    custom_price?: number;
    notes?: string;
    login_slug?: string;
    created_by?: string;
    sub_admins?: Admin[];
    stats?: {
        today: number;
        month: number;
        year: number;
        total: number;
    }
}

function SuperProAdminPanelContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeView, setActiveView] = useState<'grid' | 'matrix'>('grid');
    const [hierarchyData, setHierarchyData] = useState<any>({ hierarchy: [], orphans: [] });
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [historyModal, setHistoryModal] = useState<{ open: boolean; userId: string; name: string; isSuper: boolean }>({ open: false, userId: '', name: '', isSuper: false });
    const [activeTab, setActiveTab] = useState<'admins' | 'orders'>('admins');
    const [orders, setOrders] = useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    // Tab Parameter Control
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'orders') {
            setActiveTab('orders');
            loadOrders();
        } else {
            setActiveTab('admins');
        }
    }, [searchParams]);

    // Stats
    const [stats, setStats] = useState({
        totalSuperAdmins: 0, activeSuperAdmins: 0, pendingApprovals: 0, totalQRCodes: 0, activeQRCodes: 0, todayScans: 0
    });

    useEffect(() => { checkSuperProAdminAccess(); }, []);

    function checkSuperProAdminAccess() {
        const session = localStorage.getItem('super_pro_admin_session');
        if (!session) { router.push('/admin/super-pro-login'); return; }
        loadData();
    }

    async function loadData() {
        setLoading(true);
        // SECURITY: Verify session server-side
        const statsCheck = await getAdminDashboardStats();
        if (!statsCheck.success) {
            toast.error('Session Expired or Unauthorized');
            router.push('/admin/super-pro-login');
            return;
        }
        
        await Promise.all([loadAdmins(), loadStats(), loadHierarchy()]);
        setLoading(false);
    }

    async function loadHierarchy() {
        const result = await getGlobalHierarchy();
        if (result.success) setHierarchyData(result.data);
    }

    async function loadAdmins() {
        try {
            const response = await getAdmins();
            if (response.success) {
                const allFetched = response.data || [];
                
                // Nest children under parents, but show orphans at top level
                const topLevel = allFetched.filter((a: any) => 
                    a.role === 'super_admin' || 
                    a.role === 'analytics_admin' ||
                    !a.created_by || 
                    !allFetched.find((p: any) => p.id === a.created_by)
                );
                
                const nestedAdmins = topLevel.map((parent: any) => ({
                    ...parent,
                    sub_admins: allFetched.filter((child: any) => child.id !== parent.id && child.created_by === parent.id)
                }));
                
                setAdmins(nestedAdmins);
            }
        } catch (error) {
            console.error('Error loading admins:', error);
            toast.error('Failed to sync admin matrix');
        } finally {
            setLoading(false);
        }
    }

    async function loadStats() {
        try {
            const result = await getGlobalAdminStats();
            if (result.success) {
                setStats(result.data);
            }
        } catch (error) { console.error(error); }
    }

    const toggleRow = (id: string) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedRows(newSet);
    };

    async function handleDeleteAdmin(adminId: string) {
        if (!confirm('Are you sure?')) return;
        try {
            const result = await deleteAdmin(adminId);
            if (!result.success) throw new Error(result.error);
            toast.success('Admin Removed');
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete admin');
        }
    }

    async function handleUpdateAdmin(adminId: string, updates: any) {
        try {
            const result = await updateAdmin(adminId, updates);
            if (!result.success) throw new Error(result.error);
            toast.success('✅ Admin updated successfully!');
            loadData();
            setEditingAdmin(null);
        } catch (error: any) {
            console.error('Error updating admin:', error);
            toast.error(error.message || 'Failed to update admin');
        }

    }

    async function handleToggleStatus(adminId: string, currentStatus: string) {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        const result = await updateAdmin(adminId, { status: newStatus });
        if (result.success) {
            loadData();
        } else {
            toast.error('Failed to update status');
        }
    }

    const handleLogout = () => { localStorage.removeItem('super_pro_admin_session'); router.push('/'); };

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

        // --- WhatsApp Notification feature ---
        const order = orders.find((o: any) => o.order_id === orderId);
        if (order && order.customer_phone) {
            let msg = `*Q-Raksha Order Update* 📦\n\nNamaste ${order.customer_name} ji,\nAapka order (${order.product_name}) ka status update hua hai:\n\n*Current Status:* ${newStatus}\n`;
            
            if (newStatus === 'PROCESSING') msg += '\nAapka order pack kiya ja raha hai aur jaldi dispatch hoga. 🚚';
            else if (newStatus === 'SHIPPED') msg += '\nAapka order courier ke through nikal chuka hai! Jaldi aapke paas pahunchega. 📍\nSaath hi aap Q-Raksha dashboard me details scan pe daal sakte hai jisse QR tag active ho jaye.';
            else if (newStatus === 'DELIVERED') msg += '\nAapka order successfully deliver ho chuka hai! Q-Raksha se judne ke liye shukriya. ✅\nKoi problem aaye toh is number par support ke liye message karein.';
            
            msg += '\n\n- Q-Raksha Team 🛡️\nIndia\'s #1 Safety QR';
            
            const waPhone = order.customer_phone.replace(/\D/g, '');
            const waLink = `https://wa.me/91${waPhone}?text=${encodeURIComponent(msg)}`;
            
            toast((t) => (
                <div className="flex flex-col gap-2">
                    <span className="font-semibold px-1 text-black text-xs">WhatsApp message bhejein?</span>
                    <button 
                        onClick={() => { window.open(waLink, '_blank'); toast.dismiss(t.id); }}
                        className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                    >
                        Send WhatsApp Now
                    </button>
                </div>
            ), { duration: 6000 });
        }
    }

    const filteredAdmins = admins.filter(admin =>
        admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto min-h-screen bg-[#020202]">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 px-2">
                <div className="space-y-0.5">
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                            <Crown className="w-7 h-7 text-yellow-500" />
                        </div>
                        Super Pro Dashboard
                    </h1>
                    <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                        Control Matrix • Cloud Management
                    </p>
                </div>
                <button onClick={handleLogout} className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl font-bold text-xs transition-all border border-zinc-800 flex items-center gap-2">
                    <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
            </div>

            {/* TAB SWITCHER */}
            <div className="flex gap-2 bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 w-fit">
                <button
                    onClick={() => setActiveTab('admins')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'admins' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'
                    }`}
                >
                    <Users className="w-3.5 h-3.5" /> Admin Matrix
                </button>
                <button
                    onClick={() => { setActiveTab('orders'); loadOrders(); }}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'orders' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'
                    }`}
                >
                    <Package className="w-3.5 h-3.5" /> Purchase Orders
                    {orders.filter(o => o.status === 'PAID').length > 0 && (
                        <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                            {orders.filter(o => o.status === 'PAID').length}
                        </span>
                    )}
                </button>
            </div>


            {/* ADMIN TAB CONTENT */}
            {activeTab === 'admins' && (
            <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard icon={Users} label="Managed Admins" value={stats.totalSuperAdmins.toString()} trend="Global Pool" color="purple" />
                <StatCard icon={ShieldCheck} label="Online Nodes" value={stats.activeSuperAdmins.toString()} trend="Active Base" color="blue" />
                <StatCard icon={QrCode} label="Asset Fleet" value={stats.totalQRCodes.toString()} trend="Platform-Wide" color="indigo" />
                <StatCard icon={Activity} label="Health Index" value={stats.totalQRCodes > 0 ? `${((stats.activeQRCodes / stats.totalQRCodes) * 100).toFixed(0)}%` : '0%'} trend="Live Status" color="green" />
                <StatCard icon={BarChart3} label="Hourly Drift" value={stats.todayScans.toString()} trend="Live Scans" color="red" />
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-zinc-900/40 p-3 rounded-2xl border border-white/5">
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    <button onClick={() => setActiveView('grid')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'grid' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                        Overview Grid
                    </button>
                    <button onClick={() => { setActiveView('matrix'); loadHierarchy(); }} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'matrix' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                        Control Matrix
                    </button>
                </div>

                <div className="flex items-center gap-3 flex-1 max-w-xl">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
                        <input type="text" placeholder="Search operational ID..." className="w-full pl-10 pr-4 py-2 bg-black/40 border border-zinc-800/50 rounded-xl text-xs font-semibold text-white placeholder:text-zinc-700 transition-all outline-none focus:border-zinc-700 font-sans" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="px-5 py-2 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap shadow-md">
                        <Plus className="w-4 h-4" /> Create Admin
                    </button>
                </div>
            </div>

            {/* Main Table */}
            <div className="relative">
                {activeView === 'matrix' ? (
                    <MatrixView data={hierarchyData} onEdit={setEditingAdmin} onDelete={handleDeleteAdmin} />
                ) : (
                    <div className="bg-zinc-900/20 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-white/[0.01] border-b border-white/5">
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Identify</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Plan & Tier</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-blue-400">QR Stats</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Access Endpoint</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sync</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredAdmins.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-16 text-center">
                                                <UserCog className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                                <p className="text-muted-foreground font-medium">No admins found. Create your first admin!</p>
                                                <p className="text-xs text-zinc-700 uppercase tracking-widest mt-2">Start building your team</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAdmins.map((admin) => (
                                            <AdminRow
                                                key={admin.id}
                                                admin={admin}
                                                isExpanded={expandedRows.has(admin.id)}
                                                onToggle={() => toggleRow(admin.id)}
                                                onEdit={setEditingAdmin}
                                                onDelete={handleDeleteAdmin}
                                                onToggleStatus={handleToggleStatus}
                                                onShowHistory={(id: string, name: string, isSuper: boolean) => setHistoryModal({ open: true, userId: id, name, isSuper })}
                                            />
                                        ))
                                    )}

                                </tbody>
                            </table>
                        </div >
                    </div >
                )
                }
            </div >
            </>
            )}

            {/* PURCHASE ORDERS TAB */}
            {activeTab === 'orders' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Package className="w-5 h-5 text-yellow-500" /> Purchase Orders</h2>
                            <p className="text-zinc-600 text-xs mt-0.5">Saare Q-Raksha QR tag orders — courier dispatch ke liye</p>
                        </div>
                        <button onClick={loadOrders} className="p-2 text-zinc-500 hover:text-white transition-colors"><RefreshCw className="w-4 h-4" /></button>
                    </div>

                    {ordersLoading ? (
                        <div className="py-20 text-center"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
                    ) : orders.length === 0 ? (
                        <div className="py-20 text-center">
                            <Package className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                            <p className="text-zinc-600 font-medium">Abhi koi order nahi aaya hai</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {orders.map((order) => (
                                <div key={order.id} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                                        {/* Customer */}
                                        <div className="space-y-2">
                                            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Customer</p>
                                            <p className="text-white font-semibold text-sm">{order.customer_name}</p>
                                            <p className="text-zinc-500 text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> +91 {order.customer_phone}</p>
                                            <p className="text-zinc-500 text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> {order.customer_email}</p>
                                        </div>
                                        {/* Product */}
                                        <div className="space-y-2">
                                            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Product</p>
                                            <p className="text-white font-semibold text-sm">{order.product_name}</p>
                                            <p className="text-zinc-400 text-xs">Qty: {order.quantity || 1} × ₹{order.amount / (order.quantity || 1)}</p>
                                            <p className="text-yellow-500 font-bold text-sm">₹{order.amount}</p>
                                        </div>
                                        {/* Delivery Address */}
                                        <div className="space-y-2">
                                            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Delivery Address</p>
                                            <p className="text-zinc-300 text-xs leading-relaxed">{order.delivery_address || '—'}</p>
                                            <p className="text-zinc-400 text-xs">{order.delivery_city}, {order.delivery_state} - {order.delivery_pincode}</p>
                                        </div>
                                        {/* Status Control */}
                                        <div className="space-y-3">
                                            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Delivery Status</p>
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border ${
                                                order.status === 'PAID' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                order.status === 'PROCESSING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                order.status === 'SHIPPED' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                order.status === 'DELIVERED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                'bg-zinc-800 text-zinc-500 border-zinc-700'
                                            }`}>
                                                {order.status === 'PENDING' && <Clock className="w-3 h-3" />}
                                                {order.status === 'PAID' && <CheckCircle className="w-3 h-3" />}
                                                {order.status === 'SHIPPED' && <Truck className="w-3 h-3" />}
                                                {order.status === 'DELIVERED' && <CheckCircle className="w-3 h-3" />}
                                                {order.status}
                                            </div>
                                            <select
                                                value={order.status}
                                                onChange={(e) => updateOrderStatus(order.order_id, e.target.value)}
                                                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white font-bold outline-none"
                                            >
                                                <option value="PENDING">PENDING</option>
                                                <option value="PAID">PAID</option>
                                                <option value="PROCESSING">PROCESSING</option>
                                                <option value="SHIPPED">SHIPPED</option>
                                                <option value="DELIVERED">DELIVERED</option>
                                            </select>
                                            <p className="text-zinc-700 text-[9px]">{new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {historyModal.open && <HistoryModal {...historyModal} onClose={() => setHistoryModal({ ...historyModal, open: false })} />}
            {
                (showAddModal || editingAdmin) && (
                    <AdminModal 
                        admin={editingAdmin} 
                        onClose={() => { setShowAddModal(false); setEditingAdmin(null); }} 
                        onSubmit={async (d: any) => {
                            const tId = toast.loading(editingAdmin ? 'Updating identity...' : 'Establishing registry...');
                            try {
                                const result = editingAdmin ? await updateAdmin(editingAdmin.id, d) : await createAdmin(d);
                                if (result.success) {
                                    toast.success(editingAdmin ? 'Identity updated' : 'Access granted');
                                    loadData();
                                    setShowAddModal(false);
                                    setEditingAdmin(null);
                                } else {
                                    throw new Error(result.error);
                                }
                            } catch (e: any) {
                                toast.error(e.message || 'Registry failure');
                            } finally {
                                toast.dismiss(tId);
                            }
                        }} 
                    />
                )
            }
        </div >
    );
}

function AdminRow({ admin, isExpanded, onToggle, onEdit, onDelete, onToggleStatus, onShowHistory }: any) {
    const hasChildren = admin.sub_admins && admin.sub_admins.length > 0;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    return (
        <>
            <tr className={`group transition-all hover:bg-white/[0.02] ${isExpanded ? 'bg-white/[0.01]' : ''} border-b border-white/5`}>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onToggle} className={`p-1.5 rounded-lg transition-all ${isExpanded ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-white'} ${!hasChildren ? 'opacity-0' : ''}`}>
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${admin.role === 'super_admin' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-zinc-800 text-zinc-300'}`}>
                            {admin.name[0]}
                        </div>
                        <div>
                            <p className="font-semibold text-white text-sm">{admin.name}</p>
                            <p className="text-[10px] text-zinc-600 font-medium">{admin.email}</p>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase w-fit ${admin.role === 'super_admin' ? 'bg-yellow-500/5 text-yellow-500/80 border border-yellow-500/10' : 'bg-zinc-800/50 text-zinc-500'}`}>
                            {admin.role === 'super_admin' ? 'Fleet Command' : 'Base Node'}
                        </span>
                        <span className="text-[10px] font-semibold text-zinc-500 mt-1 capitalize">{admin.subscription_plan} • ₹{admin.custom_price || 0}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-zinc-600 uppercase">Today</span>
                            <span className="text-xs font-bold text-emerald-500">{admin.stats?.today || 0}</span>
                        </div>
                        <div className="h-6 w-px bg-white/5 mx-1"></div>
                        <button onClick={() => onShowHistory(admin.id, admin.name, admin.role === 'super_admin')} className="flex flex-col group/stats text-left">
                            <span className="text-[9px] font-bold text-zinc-600 uppercase group-hover/stats:text-blue-500 transition-colors">Month</span>
                            <span className="text-xs font-bold text-blue-500">{admin.stats?.month || 0}</span>
                        </button>
                        <div className="h-6 w-px bg-white/5 mx-1"></div>
                        <div className="flex flex-col text-left">
                            <span className="text-[9px] font-bold text-zinc-600 uppercase">Total</span>
                            <span className="text-xs font-bold text-zinc-300">{admin.stats?.total || 0}</span>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2 group/link">
                        <span className="text-[10px] font-mono text-zinc-700 truncate max-w-[150px]">
                            {admin.login_slug ? `${origin}/admin/login/${admin.login_slug}` : 'SYSTEM'}
                        </span>
                        {admin.login_slug && (
                            <a href={`${origin}/admin/login/${admin.login_slug}`} target="_blank" className="opacity-0 group-hover/link:opacity-100 transition-opacity text-zinc-500 hover:text-white">
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                </td>
                <td className="px-6 py-4">
                    <button onClick={() => onToggleStatus(admin.id, admin.status)} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all ${admin.status === 'active' ? 'bg-emerald-500/5 text-emerald-500/80 border-emerald-500/10' : 'bg-rose-500/5 text-rose-500/80 border-rose-500/10'}`}>
                        {admin.status}
                    </button>
                </td>
                <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                        <button onClick={() => onEdit(admin)} className="p-2 text-zinc-600 hover:text-white transition-all"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => onDelete(admin.id)} className="p-2 text-zinc-600 hover:text-rose-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                </td>
            </tr>

            {isExpanded && admin.sub_admins?.map((child: any) => (
                <tr key={child.id} className="bg-white/[0.005] border-b border-white/[0.02] border-l-2 border-l-blue-500/20">
                    <td className="px-6 py-3 pl-16">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center font-bold text-[10px] text-zinc-500 border border-white/5">{child.name[0]}</div>
                            <div>
                                <p className="text-xs font-bold text-zinc-400 capitalize">{child.name}</p>
                                <p className="text-[9px] text-zinc-600">{child.email}</p>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-3">
                        <span className="text-[8px] font-bold text-zinc-600 uppercase">Operator Node</span>
                    </td>
                    <td className="px-6 py-3">
                        <div className="flex gap-4">
                            <div className="flex gap-1.5"><span className="text-[8px] font-semibold text-zinc-700">Day:</span><span className="text-xs font-bold text-emerald-600/80">{child.stats?.today || 0}</span></div>
                            <button onClick={() => onShowHistory(child.id, child.name, false)} className="flex gap-1.5 hover:text-blue-400 transition-colors"><span className="text-[8px] font-semibold text-zinc-700">Month:</span><span className="text-xs font-bold text-blue-600/80">{child.stats?.month || 0}</span></button>
                        </div>
                    </td>
                    <td className="px-6 py-3">
                        <div className="flex items-center gap-2 group/childlink">
                            <span className="text-[9px] font-mono text-zinc-800 truncate max-w-[150px]">
                                {child.login_slug ? `${origin}/admin/login/${child.login_slug}` : 'N/A'}
                            </span>
                            {child.login_slug && (
                                <a href={`${origin}/admin/login/${child.login_slug}`} target="_blank" className="opacity-0 group-hover/childlink:opacity-100 transition-opacity text-zinc-600">
                                    <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                            )}
                        </div>
                    </td>
                    <td colSpan={2} className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-1">
                            <button onClick={() => onEdit(child)} className="p-1.5 text-zinc-700 hover:text-zinc-500"><Edit className="w-3 h-3" /></button>
                            <button onClick={() => onDelete(child.id)} className="p-1.5 text-zinc-700 hover:text-rose-900"><Trash2 className="w-3 h-3" /></button>
                        </div>
                    </td>
                </tr>
            ))}
        </>
    );
}

function HistoryModal({ userId, name, isSuper, onClose }: any) {
    const [history, setHistory] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMonthlyQRHistory(userId, isSuper).then((res: any) => {
            if (res.success) setHistory(res.data);
            setLoading(false);
        });
    }, [userId]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-[100]">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-xl w-full p-8 relative">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <History className="w-5 h-5 text-blue-500" /> Generation History
                        </h2>
                        <p className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5 tracking-wider">{name} • {isSuper ? 'Fleet' : 'Node'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all">✕</button>
                </div>

                {loading ? (
                    <div className="h-48 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div></div>
                ) : (
                    <div className="grid grid-cols-3 gap-2">
                        {Object.entries(history || {}).map(([month, count]: any) => (
                            <div key={month} className={`p-4 rounded-xl border ${count > 0 ? 'bg-blue-600/5 border-blue-500/20' : 'bg-black/20 border-white/5 opacity-30 grayscale'}`}>
                                <p className="text-[9px] font-bold text-zinc-600 uppercase mb-1">{month}</p>
                                <p className={`text-xl font-bold ${count > 0 ? 'text-white' : 'text-zinc-800'}`}>{count}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, trend, color }: any) {
    const themes: any = {
        purple: 'text-purple-500 bg-purple-500/5 border-purple-500/10',
        blue: 'text-blue-500 bg-blue-500/5 border-blue-500/10',
        indigo: 'text-indigo-500 bg-indigo-500/5 border-indigo-500/10',
        green: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10',
        red: 'text-rose-500 bg-rose-500/5 border-rose-500/10',
    };
    return (
        <div className="bg-zinc-900/40 border border-white/5 p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl border ${themes[color]}`}><Icon className="w-5 h-5" /></div>
                <span className="text-[9px] font-bold text-zinc-600 uppercase">{trend}</span>
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-1">{label}</p>
        </div>
    );
}

function MatrixView({ data, onEdit, onDelete }: any) {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.hierarchy?.map((admin: any) => (
                <div key={admin.id} className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 group relative">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-white"><ShieldCheck className="w-6 h-6" /></div>
                            <div>
                                <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{admin.name}</h4>
                                <p className="text-xs text-zinc-500">{admin.email}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-white">{admin.total_qr_codes}</p>
                            <p className="text-[9px] font-bold text-zinc-600 uppercase">Fleet Size</p>
                        </div>
                    </div>
                    {admin.sub_admins?.length > 0 && (
                        <div className="space-y-2 pl-4 border-l border-white/5">
                            {admin.sub_admins.map((sub: any) => (
                                <div key={sub.id} className="bg-black/20 p-3 rounded-xl flex items-center justify-between group/sub">
                                    <div>
                                        <p className="text-xs font-bold text-zinc-300 uppercase">{sub.name}</p>
                                        <div className="flex gap-4 mt-1">
                                            <span className="text-[9px] font-bold text-emerald-600/80">DAY: {sub.stats?.today || 0}</span>
                                            <span className="text-[9px] font-bold text-blue-600/80">MONTH: {sub.stats?.month || 0}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => onEdit(sub)} className="p-1.5 text-zinc-700 hover:text-white"><Edit className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => onDelete(sub.id)} className="p-1.5 text-zinc-700 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>

            {data.orphans?.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-4 px-2">
                        Independent Nodes <div className="h-px flex-1 bg-white/5"></div>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {data.orphans.map((sub: any) => (
                            <div key={sub.id} className="bg-zinc-900/40 border border-white/5 p-5 rounded-2xl flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white uppercase tracking-tight">{sub.name}</p>
                                        <p className="text-[10px] text-zinc-600 font-medium">{sub.email}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => onEdit(sub)} className="p-2 text-zinc-700 hover:text-white"><Edit className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => onDelete(sub.id)} className="p-2 text-zinc-700 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function AdminModal({ admin, onClose, onSubmit }: any) {
    const [formData, setFormData] = useState({
        name: admin?.name || '',
        email: admin?.email || '',
        passcode: admin?.passcode || '',
        role: admin?.role || 'super_admin',
        subscription_plan: admin?.subscription_plan || 'pro',
        subscription_duration: admin?.subscription_duration || 'monthly',
        subscription_expiry: admin?.subscription_expiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        custom_price: admin?.custom_price || 0,
        custom_days: admin?.custom_days || 0,
        status: admin?.status || 'active',
        login_slug: admin?.login_slug || '',
    });

    // Helper to calculate expiry
    const calculateExpiry = (plan: string, duration: string, customDays?: number) => {
        if (plan === 'permanent' || duration === 'lifetime') return null;

        const date = new Date();
        if (duration === 'monthly') date.setMonth(date.getMonth() + 1);
        else if (duration === 'quarterly') date.setMonth(date.getMonth() + 3);
        else if (duration === 'yearly') date.setFullYear(date.getFullYear() + 1);
        else if (duration === 'custom' && customDays) date.setDate(date.getDate() + customDays);
        else date.setFullYear(date.getFullYear() + 1); // Default

        return date.toISOString().split('T')[0];
    };

    useEffect(() => {
        if (!admin) {
            const expiry = calculateExpiry(formData.subscription_plan, formData.subscription_duration, formData.custom_days);
            if (expiry) setFormData(prev => ({ ...prev, subscription_expiry: expiry }));
        }
    }, [formData.subscription_plan, formData.subscription_duration, formData.custom_days, admin]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-[200]">
            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl max-w-xl w-full p-10 relative">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        {admin ? <Edit className="w-6 h-6 text-primary" /> : <Plus className="w-6 h-6 text-primary" />}
                        {admin ? 'Update Identity' : 'Registry Entry'}
                    </h2>
                    <button onClick={onClose} className="text-zinc-600 hover:text-white ✕ transition-all">✕</button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-1"><label className="block text-[10px] font-bold text-zinc-600 mb-2 uppercase">Identity Name</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white text-xs outline-none focus:border-white/20" /></div>
                        <div className="col-span-1"><label className="block text-[10px] font-bold text-zinc-600 mb-2 uppercase">Custom Access Slug (e.g. company-name)</label><input type="text" required placeholder="company-name" value={formData.login_slug} onChange={(e) => setFormData({ ...formData, login_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })} className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white text-xs outline-none focus:border-white/20 font-mono" /></div>
                        <div className="col-span-1"><label className="block text-[10px] font-bold text-zinc-600 mb-2 uppercase">Secure Email</label><input type="email" required disabled={!!admin} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white text-xs disabled:opacity-30" /></div>
                        <div><label className="block text-[10px] font-bold text-zinc-600 mb-2 uppercase">Cipher Key (6-Digit)</label><input type="text" required maxLength={6} pattern="[0-9]{6}" value={formData.passcode} onChange={(e) => setFormData({ ...formData, passcode: e.target.value })} className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white text-xs font-mono tracking-widest" /></div>
                        <div><label className="block text-[10px] font-bold text-zinc-600 mb-2 uppercase">Clearance</label><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as any })} className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white text-[10px] font-bold uppercase"><option value="super_admin">FLEET (SUPER)</option><option value="sub_admin">NODE (SUB)</option></select></div>

                        <div>
                            <label className="block text-[10px] font-bold text-zinc-600 mb-2 uppercase">Subscription Plan</label>
                            <select
                                value={formData.subscription_plan}
                                onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value })}
                                className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white text-[10px] font-bold uppercase"
                            >
                                <option value="pro">Pro (Renewable)</option>
                                <option value="business">Business (Renewable)</option>
                                <option value="permanent">Permanent (Lifetime)</option>
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-zinc-600 mb-2 uppercase">Price (₹)</label>
                            <input type="number" required value={formData.custom_price} onChange={(e) => setFormData({ ...formData, custom_price: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white text-xs outline-none focus:border-white/20" />
                        </div>
                        {formData.subscription_plan !== 'permanent' && (
                            <div className="col-span-1">
                                <label className="block text-[10px] font-bold text-zinc-600 mb-2 uppercase">Validity (Days)</label>
                                <input type="number" required value={formData.custom_days} onChange={(e) => setFormData({ ...formData, custom_days: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white text-xs outline-none focus:border-white/20" />
                            </div>
                        )}
                        {formData.subscription_plan === 'permanent' && (
                            <div className="col-span-1 flex flex-col justify-center px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                <span className="text-[10px] font-black text-emerald-500 uppercase">LIFETIME ACCESS</span>
                                <span className="text-[8px] font-bold text-emerald-600/60 uppercase">No Expiry Date Set</span>
                            </div>
                        )}
                        <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-zinc-600 mb-2 uppercase">Operational Status</label>
                            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white text-[10px] font-bold uppercase outline-none focus:border-white/20">
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="w-full py-4 bg-white text-black font-bold uppercase text-[10px] tracking-widest rounded-xl hover:bg-zinc-200 transition-all shadow-lg">Commit Registry</button>
                </form >
            </div >
        </div >
    );
}

export default function SuperProAdminPanel() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#020202] flex items-center justify-center text-zinc-500 font-bold uppercase tracking-widest text-xs animate-pulse">Initializing Data Flow...</div>}>
            <SuperProAdminPanelContent />
        </Suspense>
    );
}

