'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Shield, Mail, Phone, Clock, Globe, ShieldAlert, CheckCircle2, ChevronRight, Activity } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="border-t-2 border-zinc-50 py-24 bg-zinc-50/50">
            <div className="max-w-[1400px] mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-16">
                    {/* Branding */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
                                <Shield className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-3xl font-black tracking-tighter text-zinc-900 leading-none">
                                    Q-<span className="text-indigo-600">Raksha</span>
                                </span>
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-1">Smart Safety Matrix</span>
                            </div>
                        </div>
                        <p className="text-zinc-500 font-medium text-sm leading-relaxed max-w-[320px]">
                            Redefining public safety with intelligent QR protocols. Secure, private, and global emergency response infrastructure for everyone.
                        </p>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 px-6 py-4 bg-white border border-zinc-100 rounded-2xl shadow-sm max-w-xs transition-all hover:border-indigo-100 hover:shadow-md">
                                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-600">ISO CERTIFIED STACKS</span>
                            </div>
                            <div className="flex items-center gap-3 px-6 py-4 bg-white border border-zinc-100 rounded-2xl shadow-sm max-w-xs transition-all hover:border-indigo-100 hover:shadow-md">
                                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-600">256-BIT ENCRYPTION</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-8">
                        <h4 className="text-zinc-400 font-black text-[11px] uppercase tracking-[0.25em] mb-6">Company</h4>
                        <ul className="space-y-4 text-sm font-bold text-zinc-600">
                            <li><Link href="/" className="hover:text-indigo-600 transition-colors tracking-tight flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -ml-4 group-hover:ml-0" />Home</Link></li>
                            <li><Link href="/about" className="hover:text-indigo-600 transition-colors tracking-tight flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -ml-4 group-hover:ml-0" />About Us</Link></li>
                            <li><Link href="/shop" className="hover:text-indigo-600 transition-colors tracking-tight flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -ml-4 group-hover:ml-0" />Our Products</Link></li>
                            <li><Link href="/contact" className="hover:text-indigo-600 transition-colors tracking-tight flex items-center gap-2 group"><ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -ml-4 group-hover:ml-0" />Support Center</Link></li>
                        </ul>
                    </div>

                    {/* Safety Matrix */}
                    <div className="space-y-8">
                        <h4 className="text-zinc-400 font-black text-[11px] uppercase tracking-[0.25em] mb-6">Safety Hub</h4>
                        <ul className="space-y-4 text-sm font-bold text-zinc-600">
                            <li><Link href="/shop?category=vehicle-safety" className="hover:text-indigo-600 transition-colors tracking-tight">Vehicle Safety</Link></li>
                            <li><Link href="/shop?category=child-safety" className="hover:text-indigo-600 transition-colors tracking-tight">Child Protection</Link></li>
                            <li><Link href="/shop?category=women-safety" className="hover:text-indigo-600 transition-colors tracking-tight">Women Security</Link></li>
                            <li><Link href="/shop?category=elderly-safety" className="hover:text-indigo-600 transition-colors tracking-tight">Senior Tracker</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-8">
                        <h4 className="text-zinc-400 font-black text-[11px] uppercase tracking-[0.25em] mb-6">Contact Matrix</h4>
                        <div className="space-y-6">
                            <Link href="mailto:support@q-raksha.in" className="flex flex-col gap-1 group">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Email Support</span>
                                <span className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">support@q-raksha.in</span>
                            </Link>
                            <Link href="tel:+919110083617" className="flex flex-col gap-1 group">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Hotline</span>
                                <span className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">+91 91100 83617</span>
                            </Link>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Operations</span>
                                <span className="text-sm font-bold text-zinc-900">10:00 - 18:00 IST</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subfooter */}
                <div className="pt-20 border-t border-zinc-100 flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8">
                        <div className="flex items-center gap-4 bg-zinc-900 px-6 py-2.5 rounded-full text-white shadow-lg">
                            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">SYSTEM STATE: OPTIMAL</span>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-400">
                             <Globe className="w-3.5 h-3.5" />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em]">India Mission Center</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center lg:items-end gap-3 text-[10px] text-zinc-400 font-black uppercase tracking-[0.4em]">
                        <p>© 2026 Q-RAKSHA | MISSION-CRITICAL OPS CONTROL</p>
                        <p className="flex items-center gap-2">
                             POWERED BY <a href="https://thinkaiq.com" target="_blank" className="text-zinc-900 underline decoration-indigo-600 decoration-2">THINKAIQ</a> 
                             <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span> 
                             INDIA&apos;S PREMIER SAFETY MATRIX
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}
