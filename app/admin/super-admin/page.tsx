'use client';

import { useState, useEffect } from 'react';
import { Users, Shield, TrendingUp, UserCog, Search, Plus, Edit, Trash2, Crown, LogOut, QrCode, ShieldCheck, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getSubAdmins, createAdmin, deleteAdmin } from '../actions';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface SubAdmin {
    id: string;
    email: string;
    name: string;
    created_at: string;
    status: 'active' | 'suspended';
    total_qr_codes: number;
    login_slug?: string;
    custom_price?: number;
    custom_days?: number;
    stats?: {
        today: number;
        month: number;
        year: number;
        total: number;
    };
}

export default function SuperAdminPanel() {
    const router = useRouter();
    const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentSuperAdminEmail, setCurrentSuperAdminEmail] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        passcode: '',
        company_name: '',
        logo_url: '',
        brand_color: '#4f46e5',
        custom_price: '0',
        custom_days: '365'
    });

    // Stats
    const [stats, setStats] = useState({
        totalSubAdmins: 0,
        activeSubAdmins: 0,
        totalQRCodes: 0,
    });

    useEffect(() => {
        checkSuperAdminAccess();
    }, []);

    function checkSuperAdminAccess() {
        const session = localStorage.getItem('admin_session');
        if (!session) {
            toast.error('Access Denied! Super Admin login required.');
            router.push('/admin/super-login');
            return;
        }

        try {
            const sessionData = JSON.parse(session);
            if (sessionData.role !== 'super_admin') {
                toast.error('Invalid access! Only Super Admins can view this page.');
                router.push('/admin/dashboard');
                return;
            }
            setCurrentSuperAdminEmail(sessionData.email);
        } catch (e) {
            toast.error('Session error! Please login again.');
            router.push('/admin/super-login');
            return;
        }

        // Session is valid, load data
        loadSubAdmins();
        loadStats();
    }

    async function loadSubAdmins() {
        try {
            setLoading(true);

            // Get current super admin user ID from session
            const adminSession = localStorage.getItem('admin_session');
            let userId = null;

            if (adminSession) {
                userId = JSON.parse(adminSession).id;
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                userId = user?.id;
            }

            if (!userId) {
                toast.error('User not found');
                return;
            }

            const response = await getSubAdmins(userId);

            if (!response.success) {
                throw new Error(response.error);
            }

            // Map data
            const subAdminsWithData = (response.data || []).map((subAdmin: any) => ({
                id: subAdmin.id,
                email: subAdmin.email,
                name: subAdmin.name || subAdmin.email?.split('@')[0] || 'Sub Admin',
                created_at: subAdmin.created_at,
                status: subAdmin.status || 'active',
                total_qr_codes: subAdmin.total_qr_codes || 0,
                login_slug: subAdmin.login_slug,
                custom_price: subAdmin.custom_price || 0,
                custom_days: subAdmin.custom_days || 365,
                stats: subAdmin.stats || { today: 0, month: 0, year: 0, total: 0 }
            }));

            setSubAdmins(subAdminsWithData);
        } catch (error: any) {
            console.error('Error loading sub-admins:', error);
            toast.error('Failed to load sub-admins');
        } finally {
            setLoading(false);
        }
    }

    async function loadStats() {
        try {
            const adminSession = localStorage.getItem('admin_session');
            let userId = null;

            if (adminSession) {
                userId = JSON.parse(adminSession).id;
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                userId = user?.id;
            }

            if (!userId) return;

            // Total sub-admins created by this super admin
            const { count: totalCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'sub_admin')
                .eq('created_by', userId);

            // Active sub-admins
            const { count: activeCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'sub_admin')
                .eq('created_by', userId)
                .eq('status', 'active');

            // Total QR codes by all sub-admins
            const { data: subAdmins } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'sub_admin')
                .eq('created_by', userId);

            let totalQRs = 0;
            if (subAdmins && subAdmins.length > 0) {
                const subAdminIds = subAdmins.map(sa => sa.id);
                const { count: qrCount } = await supabase
                    .from('qr_codes')
                    .select('*', { count: 'exact', head: true })
                    .in('user_id', subAdminIds);
                totalQRs = qrCount || 0;
            }

            setStats({
                totalSubAdmins: totalCount || 0,
                activeSubAdmins: activeCount || 0,
                totalQRCodes: totalQRs,
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async function handleCreateSubAdmin(e: React.FormEvent) {
        e.preventDefault();

        try {
            // Validate passcode
            if (!formData.passcode || formData.passcode.length !== 6) {
                toast.error('❌ Passcode must be exactly 6 digits');
                return;
            }

            // Get current super admin ID
            const adminSession = localStorage.getItem('admin_session');
            let userId = null;

            if (adminSession) {
                userId = JSON.parse(adminSession).id;
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                userId = user?.id;
            }

            if (!userId) {
                toast.error('User not found');
                return;
            }

            // Generate unique login slug from name
            const baseSlug = formData.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const loginSlug = `${baseSlug}-${randomSuffix}`;
            const randomPassword = Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16);

            // Call server action to create sub-admin
            const result = await createAdmin({
                name: formData.name,
                email: formData.email,
                password: randomPassword,
                passcode: formData.passcode,
                role: 'sub_admin',
                login_slug: loginSlug,
                created_by: userId,
                company_name: formData.company_name,
                logo_url: formData.logo_url,
                brand_color: formData.brand_color,
                custom_price: parseInt(formData.custom_price) || 0,
                custom_days: parseInt(formData.custom_days) || 365,
                subscription_plan: parseInt(formData.custom_price) > 0 ? 'pro' : 'free'
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            const loginUrl = `${window.location.origin}/admin/login/${loginSlug}`;

            toast.success(
                `✅ Sub-Admin Created Successfully!\n\n` +
                `👤 Name: ${formData.name}\n` +
                `📧 Email: ${formData.email}\n` +
                `🔑 Passcode: ${formData.passcode}\n\n` +
                `🔗 Unique Login URL:\n${loginUrl}\n\n` +
                `📋 Share these credentials with the sub-admin.`,
                {
                    duration: 30000,
                    style: {
                        background: '#10b981',
                        color: 'white',
                        padding: '20px',
                        maxWidth: '600px',
                        fontSize: '14px',
                    }
                }
            );

            // Reset form and close dialog
            setFormData({ name: '', email: '', passcode: '', company_name: '', logo_url: '', brand_color: '#4f46e5', custom_price: '0', custom_days: '365' });
            setShowAddModal(false);

            // Reload data
            loadSubAdmins();
            loadStats();

        } catch (error: any) {
            console.error('Error creating sub-admin:', error);
            toast.error(error.message || 'Failed to create sub-admin');
        }
    }

    async function handleDeleteSubAdmin(subAdminId: string) {
        if (!confirm('Are you sure you want to delete this sub-admin? This will also delete all their QR codes.')) {
            return;
        }

        try {
            // Call server action to delete sub-admin
            const result = await deleteAdmin(subAdminId);

            if (!result.success) {
                throw new Error(result.error);
            }

            toast.success('✅ Sub-Admin deleted successfully!');
            loadSubAdmins();
            loadStats();
        } catch (error: any) {
            console.error('Error deleting sub-admin:', error);
            toast.error('Failed to delete sub-admin');
        }
    }

    async function handleToggleStatus(subAdminId: string, currentStatus: string) {
        try {
            const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
            const result = await supabase
                .from('users')
                .update({ status: newStatus })
                .eq('id', subAdminId);

            if (result.error) throw result.error;

            toast.success(`✅ User is now ${newStatus.toUpperCase()}`);
            loadSubAdmins();
            loadStats();
        } catch (error: any) {
            console.error('Error toggling status:', error);
            toast.error('Failed to update status');
        }
    }

    function handleLogout() {
        localStorage.removeItem('admin_session');
        toast.success('👋 Logged out successfully');
        router.push('/');
    }

    const filteredSubAdmins = subAdmins.filter(subAdmin =>
        subAdmin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subAdmin.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 lg:p-10 space-y-10 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground mb-2 flex items-center gap-3 italic uppercase">
                        <Shield className="w-10 h-10 text-blue-400" />
                        Command Center
                    </h1>
                    <p className="text-muted-foreground text-sm flex items-center gap-2 font-medium">
                        <UserCog className="w-4 h-4" />
                        Manage Your Fleet of Node Operators
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card/40 backdrop-blur-xl border border-border p-6 rounded-3xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-white mb-1">{stats.totalSubAdmins}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Sub-Admins</p>
                </div>

                <div className="bg-card/40 backdrop-blur-xl border border-border p-6 rounded-3xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-green-500/10 border border-green-500/20">
                            <Shield className="w-5 h-5 text-green-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-white mb-1">{stats.activeSubAdmins}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Operators</p>
                </div>

                <div className="bg-card/40 backdrop-blur-xl border border-border p-6 rounded-3xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                            <QrCode className="w-5 h-5 text-purple-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-white mb-1">{stats.totalQRCodes}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">QR Codes by Team</p>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search sub-admins..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    NEW NODE OPERATOR
                </button>
            </div>

            {/* Sub-Admins Table */}
            <div className="bg-card/40 backdrop-blur-xl border border-border rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-black/20 border-b border-border">
                            <tr>
                                <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Operator</th>
                                <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-emerald-400">Generation Stats</th>
                                <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Pricing Plan</th>
                                <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                                <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Login URL</th>
                                <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-8">
                                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    </td>
                                </tr>
                            ) : filteredSubAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-8 text-muted-foreground">
                                        No sub-admins found
                                    </td>
                                </tr>
                            ) : (
                                filteredSubAdmins.map((subAdmin) => (
                                    <tr key={subAdmin.id} className="border-b border-border hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white">{subAdmin.name}</span>
                                                <span className="text-xs text-zinc-500">{subAdmin.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                                    <span className="text-[10px] font-bold text-emerald-500/70 uppercase">Today</span>
                                                    <span className="text-[10px] font-black text-emerald-400">{subAdmin.stats?.today || 0}</span>
                                                </div>
                                                <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                                                    <span className="text-[10px] font-bold text-blue-500/70 uppercase">Month</span>
                                                    <span className="text-[10px] font-black text-blue-400">{subAdmin.stats?.month || 0}</span>
                                                </div>
                                                <div className="flex items-center justify-between bg-zinc-500/10 border border-zinc-500/20 px-2 py-0.5 rounded-md">
                                                    <span className="text-[10px] font-bold text-zinc-500/70 uppercase">Lifetime</span>
                                                    <span className="text-[10px] font-black text-white">{subAdmin.stats?.total || 0}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-emerald-400 uppercase tracking-tighter">
                                                    {(subAdmin.custom_price || 0) > 0 ? 'PRO PLAN' : 'FREE'}
                                                </span>
                                                <span className="text-sm font-bold text-white">₹{subAdmin.custom_price || 0}</span>
                                                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{subAdmin.custom_days || 365} DAYS</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${subAdmin.status === 'active'
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                }`}>
                                                {subAdmin.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] text-zinc-600 font-mono break-all max-w-[200px]">
                                                    {subAdmin.login_slug ? `${window.location.origin}/admin/login/${subAdmin.login_slug}` : 'N/A'}
                                                </span>
                                                {subAdmin.login_slug && (
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`${window.location.origin}/admin/login/${subAdmin.login_slug}`)
                                                            toast.success('URL Copied!')
                                                        }}
                                                        className="text-[9px] text-blue-400 font-bold hover:underline text-left uppercase tracking-tighter"
                                                    >
                                                        COPY URL
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleStatus(subAdmin.id, subAdmin.status)}
                                                    className={`p-2 rounded-lg transition-all ${subAdmin.status === 'active'
                                                        ? 'hover:bg-yellow-500/10 text-yellow-500'
                                                        : 'hover:bg-green-500/10 text-green-500'
                                                        }`}
                                                    title={subAdmin.status === 'active' ? 'Suspend Operator' : 'Activate Operator'}
                                                >
                                                    {subAdmin.status === 'active' ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSubAdmin(subAdmin.id)}
                                                    className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-all"
                                                    title="Delete Sub-Admin"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Sub-Admin Modal */}
            {
                showAddModal && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-start justify-center p-4 overflow-y-auto py-10">
                        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 max-w-md w-full p-8 shadow-2xl relative">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Plus className="w-7 h-7 text-blue-400" />
                                    Create Sub-Admin
                                </h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-semibold"
                                >
                                    Close
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubAdmin} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-2 text-zinc-400 uppercase tracking-wide">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                                        placeholder="Akash Kumar"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-2 text-zinc-400 uppercase tracking-wide">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-2 text-zinc-400 uppercase tracking-wide">Passcode (6 digits) *</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={formData.passcode}
                                        onChange={(e) => setFormData({ ...formData, passcode: e.target.value.replace(/\D/g, '') })}
                                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white text-center tracking-widest font-mono text-xl"
                                        placeholder="000000"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold mb-2 text-zinc-400 uppercase tracking-wide">Plan Price (₹)</label>
                                        <input
                                            type="number"
                                            value={formData.custom_price}
                                            onChange={(e) => setFormData({ ...formData, custom_price: e.target.value })}
                                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white font-bold"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-2 text-zinc-400 uppercase tracking-wide">Validity (Days)</label>
                                        <input
                                            type="number"
                                            value={formData.custom_days}
                                            onChange={(e) => setFormData({ ...formData, custom_days: e.target.value })}
                                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white font-bold"
                                            placeholder="365"
                                        />
                                    </div>
                                </div>

                                {/* Customization Header */}
                                <div className="pt-4 border-t border-zinc-800">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Dashboard Customization</h3>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-2 text-zinc-400 uppercase tracking-wide">Sub-Admin Business Name</label>
                                    <input
                                        type="text"
                                        value={formData.company_name}
                                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                                        placeholder="e.g. Branch Alpha"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-2 text-zinc-400 uppercase tracking-wide">Brand Color</label>
                                    <div className="flex gap-2">
                                        <div
                                            className="w-10 h-10 rounded-lg border border-zinc-700 overflow-hidden relative"
                                            style={{ backgroundColor: formData.brand_color }}
                                        >
                                            <input
                                                type="color"
                                                value={formData.brand_color}
                                                onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.brand_color}
                                            onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                                            className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white text-sm font-mono uppercase"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-2 text-zinc-400 uppercase tracking-wide">Logo URL</label>
                                    <input
                                        type="url"
                                        value={formData.logo_url}
                                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white text-sm"
                                        placeholder="https://..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Create Sub-Admin Account
                                </button>
                            </form>
                        </div>
                    </div>
                )}
        </div>
    );
}
