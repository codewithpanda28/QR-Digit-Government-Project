'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Mail, User, ArrowRight, CheckCircle, Key } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
    const router = useRouter()
    const [step, setStep] = useState<'details' | 'otp'>('details')
    const [formData, setFormData] = useState({
        email: '',
        name: '',
    })
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSendOTP(e: React.FormEvent) {
        e.preventDefault()
        if (!formData.email || !formData.name) return toast.error('Please fill all details')
        setLoading(true)

        try {
            // 2. Call Custom OTP API (Gmail/Nodemailer) - This bypasses Supabase rate limits
            const res = await fetch('/api/auth/custom-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: formData.email.trim().toLowerCase(),
                    name: formData.name 
                })
            });
            const result = await res.json();

            if (result.success) {
                toast.success("Security code sent via Gmail!");
                setStep('otp')
            } else {
                console.error("Custom OTP failed:", result.error || "Uknown error");
                toast.error(`OTP Service Unavailable: ${result.error || 'Server Config Missing'}`);
            }
        } catch (error: any) {
            console.error('Registration error:', error)
            toast.error(error.message || 'Failed to send OTP')
        } finally {
            setLoading(false)
        }
    }

    async function handleVerifyOTP(e: React.FormEvent) {
        e.preventDefault()
        if (otp.length !== 6) return
        setLoading(true)

        try {
            const cleanEmail = formData.email.trim().toLowerCase()
            
            // 2. Call Custom Verification System (Bypasses Supabase Auth public tokens)
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: cleanEmail, code: otp })
            });

            const result = await res.json();

            if (res.ok && result.success && result.login_link) {
                toast.success("Account created and verified!");
                // 🚀 Bypassing Public Verify: Redirecting to the ACTION_LINK (Magic Link)
                window.location.replace(result.login_link);
            } else {
                throw new Error(result.error || "Verification failed");
            }
        } catch (error: any) {
            console.error('Final OTP verification error:', error)
            toast.error(error.message || 'Verification failed. Please check the code.')
        } finally {
            setLoading(false)
        }
    }

    // Step 1: Enter Details
    if (step === 'details') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-purple-500/30">
                <div className="max-w-md w-full">
                    {/* Logo */}
                    <Link href="/" className="flex items-center justify-center mb-10">
                        <img 
                            src="/Logo.jpeg" 
                            alt="Raksha Logo" 
                            className="h-16 md:h-20 w-auto object-contain hover:scale-105 transition-transform" 
                        />
                    </Link>

                    {/* Register Card */}
                    <div className="bg-card rounded-3xl shadow-2xl p-8 border border-white/5">
                        <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
                        <p className="text-muted-foreground mb-8">Get started with your free account</p>

                        <form onSubmit={handleSendOTP} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-background border border-white/10 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-zinc-600 transition-all"
                                        placeholder="Akash Kumar"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-background border border-white/10 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-zinc-600 transition-all"
                                        placeholder="you@example.com"
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
                                    <span>Sending OTP...</span>
                                ) : (
                                    <>
                                        <span>Send OTP</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-white/5 text-center">
                            <p className="text-muted-foreground">
                                Already have an account?{' '}
                                <Link href="/admin/login" className="text-primary font-bold hover:text-purple-400 transition-colors">
                                    Sign in
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
                            <strong>🔒 OTP Verification:</strong> We'll send a 6-digit code to your email.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // Step 2: Enter OTP
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-purple-500/30">
            <div className="max-w-md w-full">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center mb-10">
                    <img 
                        src="/Logo.jpeg" 
                        alt="QRdigit Logo" 
                        className="h-16 md:h-20 w-auto object-contain hover:scale-105 transition-transform" 
                    />
                </Link>

                {/* OTP Card */}
                <div className="bg-card rounded-3xl shadow-2xl p-8 border border-white/5">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-8 h-8 text-primary" />
                    </div>

                    <h1 className="text-3xl font-bold text-foreground mb-2 text-center">Check Your Email</h1>
                    <p className="text-muted-foreground mb-8 text-center">
                        We've sent a code to <br />
                        <strong className="text-foreground">{formData.email}</strong>
                    </p>

                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2 text-center">
                                Enter OTP Code
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                    className="w-full bg-background border border-white/10 pl-10 pr-4 py-4 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground text-center text-2xl font-bold tracking-widest placeholder:text-zinc-700 transition-all font-mono"
                                    placeholder="00000000"
                                    maxLength={8}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length < 6}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <span>Verifying...</span>
                            ) : (
                                <>
                                    <span>Verify & Create Account</span>
                                    <CheckCircle className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-white/5 text-center">
                        <p className="text-muted-foreground mb-3">
                            Didn't receive the code?
                        </p>
                        <button
                            onClick={() => {
                                setStep('details')
                                setOtp('')
                                toast('Please re-enter your details')
                            }}
                            className="text-primary font-bold hover:text-purple-400 transition-colors"
                        >
                            ← Go back & resend
                        </button>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-primary/10 border border-primary/20 rounded-2xl p-4">
                    <p className="text-sm text-primary/80 text-center">
                        <strong>📧 Check your inbox!</strong> The OTP code should arrive within 1-2 minutes.
                    </p>
                </div>
            </div>
        </div>
    )
}
