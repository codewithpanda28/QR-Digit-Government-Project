'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { UserCog, Plus, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubAdminsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAccess();
    }, []);

    async function checkAccess() {
        // Check if user is super_admin
        const adminSession = localStorage.getItem('admin_session');
        if (!adminSession) {
            toast.error('Access denied! Please login.');
            router.push('/admin/super-login');
            return;
        }

        try {
            const session = JSON.parse(adminSession);
            if (session.role !== 'super_admin') {
                toast.error('Only Super Admins can access this page!');
                router.push('/admin/dashboard');
                return;
            }
            setLoading(false);
        } catch (e) {
            toast.error('Invalid session!');
            router.push('/admin/super-login');
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <UserCog className="w-8 h-8 text-primary" />
                            Sub-Admin Management
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Create and manage your sub-admin team members
                        </p>
                    </div>
                    <button className="px-6 py-3 bg-primary text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors">
                        <Plus className="w-5 h-5" />
                        Create Sub-Admin
                    </button>
                </div>

                {/* Coming Soon Card */}
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Sub-Admin Features Coming Soon!</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        This page will allow you to create and manage sub-admin accounts for your team.
                    </p>
                </div>
            </div>
        </div>
    );
}
