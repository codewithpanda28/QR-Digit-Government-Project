'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Shield, Lock, ArrowRight, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import bcrypt from 'bcryptjs';

export default function SubAdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [passcode, setPasscode] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();

        if (!email || !passcode || passcode.length < 4) {
            toast.error('Please enter valid email and passcode');
            return;
        }

        try {
            setLoading(true);

            // Step 1: Find user by email first
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id, email, name, role, status')
                .eq('email', email)
                .eq('role', 'sub_admin')
                .single();

            if (userError || !user) {
                toast.error('Invalid email or not a Sub Admin account');
                return;
            }

            if (user.status !== 'active') {
                toast.error('Your account is suspended. Contact Super Admin.');
                return;
            }

            // Step 2: Get passcode for this user
            const { data: passcodeData, error: passcodeError } = await supabase
                .from('admin_passcodes')
                .select('passcode_hash')
                .eq('admin_id', user.id)
                .eq('is_active', true)
                .single();

            if (passcodeError || !passcodeData) {
                toast.error('Passcode not set or inactive. Contact Super Admin.');
                return;
            }

            // Step 3: Verify passcode
            const isMatch = await bcrypt.compare(passcode, passcodeData.passcode_hash);

            if (!isMatch) {
                toast.error('Invalid passcode');
                return;
            }

            // Create admin session
            const adminSession = {
                email: user.email,
                name: user.name,
                role: user.role,
                id: user.id,
                loginTime: new Date().toISOString()
            };

            // Store admin session
            localStorage.setItem('admin_session', JSON.stringify(adminSession));

            // Log activity
            await supabase.from('admin_activity_log').insert({
                admin_id: user.id,
                action: 'LOGIN',
                target_type: 'admin_panel',
                details: { login_method: 'email_passcode', role: 'sub_admin' }
            });

            toast.success(`Welcome ${user.name || 'Sub Admin'}! 🎯`);
            router.push('/admin/dashboard');

        } catch (error: any) {
            console.error('Login error:', error);
            toast.error(error.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-2xl mb-4">
                        <UserCog className="w-12 h-12 text-blue-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">Safety QR</h1>
                    <p className="text-blue-200">Sub Admin Access</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                        <p className="text-gray-600 mt-2">
                            Enter credentials to access QR management
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Passcode
                            </label>
                            <input
                                type="password"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                placeholder="Enter 6-digit passcode"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-lg tracking-widest"
                                maxLength={20}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    Access Sub Admin Panel
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Info */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                        <p className="text-sm text-blue-900 text-center">
                            <strong>Sub Admin:</strong> QR Codes & Data access only
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-blue-200 mt-6 text-sm">
                    Protected by advanced security • Managed by Super Admin
                </p>
            </div>
        </div>
    );
}
