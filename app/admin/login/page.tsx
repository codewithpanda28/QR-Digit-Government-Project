'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Mail, ArrowRight, Key, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [isSuperAdmin, setIsSuperAdmin] = useState(false)

    async function handleEmailSubmit(e: React.FormEvent) {
        e.preventDefault()

        // Check if super admin email
        if (email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
            setIsSuperAdmin(true)
        } else {
            // For sub-admins, just show password field
            setIsSuperAdmin(false)
        }
    }

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            // Super Admin Login
            if (email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
                if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
                    localStorage.setItem('admin_session', JSON.stringify({
                        email: email,
                        role: 'super_admin',
                        timestamp: new Date().toISOString()
                    }))
                    toast.success('Super Admin login successful!')
                    router.push('/admin/super/dashboard')
                } else {
                    toast.error('Invalid super admin password')
                }
                setLoading(false)
                return
            }

            // Sub-Admin Login with Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password: password
            })

            if (error) throw error

            toast.success('Login successful!')
            router.push('/admin/dashboard')
        } catch (error: any) {
            console.error('Login error:', error)
            toast.error(error.message || 'Invalid email or password')
        } finally {
            setLoading(false)
        }
    }


    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-purple-500/30">
            <div className="max-w-md w-full">
                {/* Logo */}
                <Link href="/" className="flex flex-col items-center justify-center mb-10">
                    <img 
                        src="/Logo.jpeg" 
                        alt="QRdigit Logo" 
                        className="h-16 md:h-20 w-auto object-contain hover:scale-105 transition-transform" 
                    />
                </Link>

                {/* Login Card */}
                <div className="bg-card rounded-3xl shadow-2xl p-8 border border-white/5">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
                    <p className="text-muted-foreground mb-8">
                        {isSuperAdmin || email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'Super Admin Login' : 'Sign in to your account'}
                    </p>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-background border border-white/10 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-zinc-600 transition-all"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-background border border-white/10 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-zinc-600 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <span>Logging in...</span>
                            ) : (
                                <>
                                    <span>Login</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-white/5 text-center">
                        <p className="text-muted-foreground">
                            Don't have an account?{' '}
                            <Link href="/admin/register" className="text-primary font-bold hover:text-purple-400 transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    <div className="mt-6 text-center">
                        <Link href="/" className="text-sm text-zinc-500 hover:text-foreground transition-colors">
                            ← Back to home
                        </Link>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-primary/10 border border-primary/20 rounded-2xl p-4">
                    <p className="text-sm text-primary/80 text-center">
                        <strong>� Secure Login:</strong> Enter your email and password to access your dashboard.
                    </p>
                </div>
            </div>
        </div>
    )
}
