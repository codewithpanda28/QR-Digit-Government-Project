'use client';

import { useState, useEffect } from 'react';
import { Users, Shield, CreditCard, TrendingUp, DollarSign, Settings, UserCog, Search, Plus, Edit, Trash2, Eye, Lock, Unlock, Key } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Admin {
    id: string;
    email: string;
    role: 'super_admin' | 'sub_admin';
    created_at: string;
    status: 'active' | 'suspended';
    subscription_plan: string;
    subscription_expiry: string;
    total_qr_codes: number;
    monthly_revenue: number;
}

export default function SuperAdminPanel() {
    const router = useRouter();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPasscodeModal, setShowPasscodeModal] = useState(false);
    const [selectedAdminForPasscode, setSelectedAdminForPasscode] = useState<Admin | null>(null);
    const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Stats
    const [stats, setStats] = useState({
        totalAdmins: 0,
        activeSuperAdmins: 0,
        activeSubAdmins: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        totalQRCodes: 0
    });

    useEffect(() => {
        checkSuperProAdminAccess();
    }, []);

    function checkSuperProAdminAccess() {
        const session = localStorage.getItem('super_pro_admin_session');
        if (!session) {
            toast.error('Access Denied! Super Pro Admin login required.');
            router.push('/admin/super-login');
            return;
        }

        try {
            const sessionData = JSON.parse(session);
            if (sessionData.role !== 'super_pro_admin') {
                toast.error('Invalid session! Please login again.');
                localStorage.removeItem('super_pro_admin_session');
                router.push('/admin/super-login');
                return;
            }
        } catch (e) {
            toast.error('Session error! Please login again.');
            localStorage.removeItem('super_pro_admin_session');
            router.push('/admin/super-login');
            return;
        }

        // Session is valid, load data
        loadAdmins();
        loadStats();
    }

    async function loadAdmins() {
        try {
            setLoading(true);

            // Get all admin users
            const { data: users, error } = await supabase
                .from('profiles')
                .select('*')
                .in('role', ['super_admin', 'sub_admin'])
                .order('created_at', { ascending: false });

            if (error) throw error;

            // For each admin, get their QR codes count and revenue
            const adminsWithData = await Promise.all(
                (users || []).map(async (user) => {
                    const { count } = await supabase
                        .from('qr_codes')
                        .select('*', { count: 'exact', head: true })
                        .eq('created_by', user.id);

                    return {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        created_at: user.created_at,
                        status: user.status || 'active',
                        subscription_plan: user.subscription_plan || 'free',
                        subscription_expiry: user.subscription_expiry,
                        total_qr_codes: count || 0,
                        monthly_revenue: user.monthly_revenue || 0
                    };
                })
            );

            setAdmins(adminsWithData);
        } catch (error) {
            console.error('Error loading admins:', error);
            toast.error('Failed to load admins');
        } finally {
            setLoading(false);
        }
    }

    async function loadStats() {
        try {
            // Total admins
            const { count: totalCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .in('role', ['super_admin', 'sub_admin']);

            // Active super admins
            const { count: superCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'super_admin')
                .eq('status', 'active');

            // Active sub admins
            const { count: subCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'sub_admin')
                .eq('status', 'active');

            // Total QR codes
            const { count: qrCount } = await supabase
                .from('qr_codes')
                .select('*', { count: 'exact', head: true });

            setStats({
                totalAdmins: totalCount || 0,
                activeSuperAdmins: superCount || 0,
                activeSubAdmins: subCount || 0,
                totalRevenue: 125000, // Calculate from actual data
                monthlyRevenue: 15000, // Calculate from actual data
                totalQRCodes: qrCount || 0
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async function handleCreateAdmin(formData: any) {
        try {
            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: formData.email,
                password: formData.password,
                email_confirm: true
            });

            if (authError) throw authError;

            // Update profile with role and subscription
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    role: formData.role,
                    subscription_plan: formData.subscription_plan,
                    subscription_expiry: formData.subscription_expiry,
                    status: 'active'
                })
                .eq('id', authData.user.id);

            if (profileError) throw profileError;

            toast.success('Admin created successfully!');
            loadAdmins();
            loadStats();
            setShowAddModal(false);
        } catch (error: any) {
            console.error('Error creating admin:', error);
            toast.error(error.message || 'Failed to create admin');
        }
    }

    async function handleUpdateAdmin(adminId: string, updates: any) {
        try {
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', adminId);

            if (error) throw error;

            toast.success('Admin updated successfully!');
            loadAdmins();
            loadStats();
            setEditingAdmin(null);
        } catch (error: any) {
            console.error('Error updating admin:', error);
            toast.error(error.message || 'Failed to update admin');
        }
    }

    async function handleToggleStatus(adminId: string, currentStatus: string) {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        await handleUpdateAdmin(adminId, { status: newStatus });
    }

    async function handleDeleteAdmin(adminId: string) {
        if (!confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
            return;
        }

        try {
            // First, delete or reassign their QR codes
            const { error: qrError } = await supabase
                .from('qr_codes')
                .delete()
                .eq('created_by', adminId);

            if (qrError) throw qrError;

            // Delete auth user
            const { error: authError } = await supabase.auth.admin.deleteUser(adminId);
            if (authError) throw authError;

            toast.success('Admin deleted successfully!');
            loadAdmins();
            loadStats();
        } catch (error: any) {
            console.error('Error deleting admin:', error);
            toast.error(error.message || 'Failed to delete admin');
        }
    }

    const filteredAdmins = admins.filter(admin =>
        admin.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <UserCog className="w-8 h-8 text-white" />
                    </div>
                    Super Pro Admin Control Panel
                </h1>
                <p className="text-gray-600 text-lg">Complete control over all admins, subscriptions, and revenue</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <Users className="w-10 h-10 opacity-80" />
                        <span className="text-3xl font-bold">{stats.totalAdmins}</span>
                    </div>
                    <p className="text-blue-100 font-semibold">Total Admins</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <Shield className="w-10 h-10 opacity-80" />
                        <span className="text-3xl font-bold">{stats.activeSuperAdmins}</span>
                    </div>
                    <p className="text-purple-100 font-semibold">Super Admins</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <UserCog className="w-10 h-10 opacity-80" />
                        <span className="text-3xl font-bold">{stats.activeSubAdmins}</span>
                    </div>
                    <p className="text-indigo-100 font-semibold">Sub Admins</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <DollarSign className="w-10 h-10 opacity-80" />
                        <span className="text-3xl font-bold">₹{(stats.totalRevenue / 1000).toFixed(0)}K</span>
                    </div>
                    <p className="text-green-100 font-semibold">Total Revenue</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <TrendingUp className="w-10 h-10 opacity-80" />
                        <span className="text-3xl font-bold">₹{(stats.monthlyRevenue / 1000).toFixed(0)}K</span>
                    </div>
                    <p className="text-orange-100 font-semibold">Monthly Revenue</p>
                </div>

                <div className="bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <CreditCard className="w-10 h-10 opacity-80" />
                        <span className="text-3xl font-bold">{stats.totalQRCodes}</span>
                    </div>
                    <p className="text-pink-100 font-semibold">Total QR Codes</p>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search admins by email..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Add Admin Button */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add New Admin
                </button>
            </div>

            {/* Admins Table */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading admins...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Role</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Plan</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">QR Codes</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Revenue</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredAdmins.map((admin) => (
                                <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                                                {admin.email[0].toUpperCase()}
                                            </div>
                                            <span className="font-medium text-gray-900">{admin.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${admin.role === 'super_admin'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {admin.role === 'super_admin' ? 'SUPER ADMIN' : 'SUB ADMIN'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-gray-700 capitalize">{admin.subscription_plan}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-gray-900">{admin.total_qr_codes}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-green-600">₹{admin.monthly_revenue || 0}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleStatus(admin.id, admin.status)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${admin.status === 'active'
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                }`}
                                        >
                                            {admin.status === 'active' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                            {admin.status === 'active' ? 'Active' : 'Suspended'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setEditingAdmin(admin)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAdmin(admin.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Admin Modal */}
            {(showAddModal || editingAdmin) && (
                <AdminModal
                    admin={editingAdmin}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingAdmin(null);
                    }}
                    onSubmit={editingAdmin ?
                        (data: any) => handleUpdateAdmin(editingAdmin.id, data) :
                        handleCreateAdmin
                    }
                />
            )}
        </div>
    );
}

// Admin Modal Component
function AdminModal({ admin, onClose, onSubmit }: any) {
    const [formData, setFormData] = useState({
        email: admin?.email || '',
        password: '',
        role: admin?.role || 'sub_admin',
        subscription_plan: admin?.subscription_plan || 'starter',
        subscription_expiry: admin?.subscription_expiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        monthly_revenue: admin?.monthly_revenue || 0
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-8">
                <h2 className="text-2xl font-bold mb-6">
                    {admin ? 'Edit Admin' : 'Create New Admin'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Email</label>
                        <input
                            type="email"
                            required
                            disabled={!!admin}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {!admin && (
                        <div>
                            <label className="block text-sm font-semibold mb-2">Password</label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold mb-2">Role</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="super_admin">Super Admin</option>
                            <option value="sub_admin">Sub Admin</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Subscription Plan</label>
                        <select
                            value={formData.subscription_plan}
                            onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="free">Free (100 QR Codes)</option>
                            <option value="starter">Starter - ₹999/month (500 QR Codes)</option>
                            <option value="professional">Professional - ₹2999/month (2000 QR Codes)</option>
                            <option value="enterprise">Enterprise - ₹9999/month (Unlimited)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Subscription Expiry</label>
                        <input
                            type="date"
                            value={formData.subscription_expiry}
                            onChange={(e) => setFormData({ ...formData, subscription_expiry: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Monthly Revenue (₹)</label>
                        <input
                            type="number"
                            value={formData.monthly_revenue}
                            onChange={(e) => setFormData({ ...formData, monthly_revenue: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                        >
                            {admin ? 'Update Admin' : 'Create Admin'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
