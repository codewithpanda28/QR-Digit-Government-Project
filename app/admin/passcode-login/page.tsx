'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Shield, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import bcrypt from 'bcryptjs';

export default function AdminPasscodeLogin() {
    const router = useRouter();
    const [passcode, setPasscode] = useState('');
    const [loading, setLoading] = useState(false);

    async function handlePasscodeLogin(e: React.FormEvent) {
        e.preventDefault();

        if (!passcode || passcode.length < 4) {
            toast.error('Please enter a valid passcode');
            return;
        }

        try {
            setLoading(true);

            // Get all admin passcodes
            const { data: passcodes, error } = await supabase
                .from('admin_passcodes')
                .select(`
          *,
          profiles:admin_id (
            id,
            email,
            role,
            status
          )
        `)
                .eq('is_active', true);

            if (error) throw error;

            if (!passcodes || passcodes.length === 0) {
                toast.error('No admin accounts found. Please contact Super Pro Admin.');
                return;
            }

            // Check passcode against all active admin passcodes
            let matchedAdmin = null;

            for (const pc of passcodes) {
                const isMatch = await bcrypt.compare(passcode, pc.passcode_hash);
                if (isMatch) {
                    matchedAdmin = pc.profiles;
                    break;
                }
            }

            if (!matchedAdmin) {
                toast.error('Invalid passcode. Please try again.');
                return;
            }

            // Check if admin is active
            if (matchedAdmin.status !== 'active') {
                toast.error('Your admin account is suspended. Please contact Super Pro Admin.');
                return;
            }

            // Check role
            if (matchedAdmin.role !== 'super_admin' && matchedAdmin.role !== 'sub_admin') {
                toast.error('Invalid admin role. Please contact Super Pro Admin.');
                return;
            }

            // Create admin session
            const adminSession = {
                email: matchedAdmin.email,
                role: matchedAdmin.role,
                id: matchedAdmin.id,
                loginTime: new Date().toISOString()
            };

            localStorage.setItem('admin_session', JSON.stringify(adminSession));

            // Log activity
            await supabase.from('admin_activity_log').insert({
                admin_id: matchedAdmin.id,
                action: 'LOGIN',
                target_type: 'admin_panel',
                details: { login_method: 'passcode' }
            });

            toast.success(`Welcome ${matchedAdmin.role === 'super_admin' ? 'Super Admin' : 'Sub Admin'}!`);

            // Redirect to admin dashboard
            router.push('/admin/dashboard');

        } catch (error: any) {
            console.error('Passcode login error:', error);
            toast.error(error.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-2xl mb-4">
                        <Shield className="w-12 h-12 text-indigo-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">Safety QR</h1>
                    <p className="text-purple-200">Admin Panel Access</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Enter Admin Passcode</h2>
                        <p className="text-gray-600 mt-2">
                            For Super Admin & Sub Admin Access
                        </p>
                    </div>

                    <form onSubmit={handlePasscodeLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Passcode
                            </label>
                            <input
                                type="password"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                placeholder="Enter your passcode"
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-lg text-center tracking-widest"
                                maxLength={20}
                                required
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Contact Super Pro Admin if you forgot your passcode
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
                                    Access Admin Panel
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Info */}
                    <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
                        <p className="text-sm text-indigo-900 text-center">
                            <strong>Note:</strong> Only Super Admin and Sub Admin can access this panel.
                            Contact Super Pro Admin for passcode creation.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-purple-200 mt-6 text-sm">
                    Protected by advanced security • Super Pro Admin Control
                </p>
            </div>
        </div>
    );
}
