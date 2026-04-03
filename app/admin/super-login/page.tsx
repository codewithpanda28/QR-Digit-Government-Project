'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Shield, Lock, ArrowRight, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { completeLogin } from '../actions';
import bcrypt from 'bcryptjs';

export default function SuperAdminLogin() {
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
                .eq('role', 'super_admin')
                .single();

            if (userError || !user) {
                toast.error('Invalid email or not a Super Admin account');
                return;
            }

            if (user.status !== 'active') {
                toast.error('Your account is suspended. Contact Super Pro Admin.');
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
                toast.error('Passcode not set or inactive. Contact Super Pro Admin.');
                return;
            }

            // Step 3: Verify passcode
            const isMatch = await bcrypt.compare(passcode, passcodeData.passcode_hash);

            if (!isMatch) {
                toast.error('Invalid passcode');
                return;
            }

            // Step 4: Create secure server-side session
            const loginResult = await completeLogin({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            });

            if (!loginResult.success) {
                toast.error('Security handshake failed. Please try again.');
                return;
            }

            // Create admin session for legacy frontend checks
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
                details: { login_method: 'email_passcode', role: 'super_admin' }
            });

            toast.success(`Welcome ${user.name || 'Super Admin'}! 👑`);
            router.push('/admin/dashboard');

        } catch (error: any) {
            console.error('Login error:', error);
            toast.error(error.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-10 flex flex-col items-center">
                    <img 
                        src="/Logo.png" 
                        alt="Raksha Logo" 
                        className="h-16 md:h-20 w-auto object-contain hover:scale-105 transition-transform" 
                    />
                    <p className="text-purple-200 mt-4 uppercase tracking-[0.2em] font-black text-[10px]">Super Admin Access</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                        <p className="text-gray-600 mt-2">
                            Enter your credentials to access the panel
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
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all"
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
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all text-lg tracking-widest"
                                maxLength={20}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    Access Super Admin Panel
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Info */}
                    <div className="mt-6 p-4 bg-purple-50 rounded-xl">
                        <p className="text-sm text-purple-900 text-center">
                            <strong>Super Admin:</strong> Full access + can create Sub Admins
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-purple-200 mt-6 text-sm">
                    Protected by advanced security • Powered by Super Pro Admin
                </p>
            </div>
        </div>
    );
}
