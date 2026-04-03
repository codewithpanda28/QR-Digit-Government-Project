'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Shield, Lock, ArrowRight, Crown, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import { verifyAdminPasscode, completeLogin, getAdminBySlug } from '@/app/admin/actions';

export default function UniqueAdminLogin() {
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;

    const [passcode, setPasscode] = useState('');
    const [loading, setLoading] = useState(false);
    const [adminInfo, setAdminInfo] = useState<any>(null);
    const [loadingInfo, setLoadingInfo] = useState(true);

    useEffect(() => {
        // NUCLEAR RESET: If we are visiting a unique login link, 
        // we MUST clear all previous sessions to prevent data crossover.
        localStorage.removeItem('admin_session');
        localStorage.removeItem('super_pro_admin_session');

        loadAdminInfo();
    }, [slug]);

    async function loadAdminInfo() {
        try {
            setLoadingInfo(true);

            // Get admin by slug using secure server action (Master Access)
            const result = await getAdminBySlug(slug);

            if (!result.success || !result.data) {
                toast.error('Invalid login URL. Please check with your administrator.');
                return;
            }

            setAdminInfo(result.data);
        } catch (error) {
            console.error('Error loading admin info:', error);
            toast.error('Failed to load login page');
        } finally {
            setLoadingInfo(false);
        }
    }

    async function handlePasscodeLogin(e: React.FormEvent) {
        e.preventDefault();

        if (!adminInfo) {
            toast.error('Invalid login session');
            return;
        }

        if (!passcode || passcode.length < 4) {
            toast.error('Please enter a valid passcode');
            return;
        }

        try {
            setLoading(true);

            // Verify via server action which has Service Role access
            const result = await verifyAdminPasscode(adminInfo.id, passcode);

            if (!result.success) {
                toast.error(result.error === 'Passcode not found' ? 'No passcode found. Contact your administrator.' : 'Invalid passcode. Please try again.');
                return;
            }

            // Check if admin is active
            if (adminInfo.status !== 'active') {
                toast.error('Your account is suspended. Contact your administrator.');
                return;
            }

            // Create secure server-side session
            const loginResult = await completeLogin({
                id: adminInfo.id,
                email: adminInfo.email,
                name: adminInfo.name,
                role: adminInfo.role
            });

            if (!loginResult.success) {
                toast.error('Security handshake failed. Please try again.');
                return;
            }

            // Keep localStorage for current frontend compatibility
            const adminSession = {
                email: adminInfo.email,
                name: adminInfo.name,
                role: adminInfo.role,
                id: adminInfo.id,
                loginTime: new Date().toISOString()
            };

            localStorage.setItem('admin_session', JSON.stringify(adminSession));

            // Log activity
            await supabase.from('admin_activity_log').insert({
                admin_id: adminInfo.id,
                action: 'LOGIN',
                target_type: 'admin_panel',
                details: {
                    login_method: 'unique_url',
                    slug: slug,
                    role: adminInfo.role
                }
            });

            toast.success(`Welcome ${adminInfo.name}! 🎉`);

            // Redirect to admin dashboard
            router.push('/admin/dashboard');

        } catch (error: any) {
            console.error('Login error:', error);
            toast.error(error.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    }

    if (loadingInfo) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading login page...</p>
                </div>
            </div>
        );
    }

    if (!adminInfo) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-900 via-pink-900 to-purple-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">❌</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Login URL</h2>
                    <p className="text-gray-600 mb-6">
                        This login link is not valid or has been deactivated.
                    </p>
                    <p className="text-sm text-gray-500">
                        Please contact your administrator for the correct login link.
                    </p>
                </div>
            </div>
        );
    }

    const getRoleColor = () => {
        if (adminInfo.role === 'super_admin') return 'from-purple-900 via-indigo-900 to-blue-900';
        if (adminInfo.role === 'sub_admin') return 'from-blue-900 via-indigo-900 to-purple-900';
        return 'from-indigo-900 via-purple-900 to-pink-900';
    };

    const getRoleIcon = () => {
        if (adminInfo.role === 'super_admin') return <Crown className="w-12 h-12 text-purple-600" />;
        if (adminInfo.role === 'sub_admin') return <UserCog className="w-12 h-12 text-blue-600" />;
        return <Shield className="w-12 h-12 text-indigo-600" />;
    };

    const getRoleName = () => {
        if (adminInfo.role === 'super_admin') return 'Super Admin';
        if (adminInfo.role === 'sub_admin') return 'Sub Admin';
        return 'Admin';
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br ${getRoleColor()} flex items-center justify-center p-4`}>
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-2xl mb-4 overflow-hidden">
                        {adminInfo?.logo_url ? (
                            <img src={adminInfo.logo_url} alt="Logo" className="w-14 h-14 object-contain" />
                        ) : (
                            getRoleIcon()
                        )}
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">{adminInfo?.company_name || 'Safety QR'}</h1>
                    <p className="text-purple-200">{getRoleName()} Access</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Welcome</h2>
                        <p className="text-gray-600 mt-2 font-semibold">
                            {adminInfo.name}
                        </p>
                        <p className="text-sm text-gray-500">
                            {adminInfo.email}
                        </p>

                    </div>

                    <form onSubmit={handlePasscodeLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Enter Your Passcode
                            </label>
                            <input
                                type="password"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                placeholder="••••••"
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-lg text-center tracking-widest font-mono text-black"
                                maxLength={20}
                                required
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Contact your administrator if you forgot your passcode
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    Access Dashboard
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Role Badge */}
                    <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
                        <p className="text-sm text-indigo-900 text-center">
                            <strong>{getRoleName()}</strong> • Personal Login URL
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-purple-200 mt-6 text-sm">
                    🔒 Protected by advanced security • Unique personal access
                </p>
            </div>
        </div>
    );
}
