'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Shield } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="border-t-2 border-zinc-50 py-24 bg-zinc-50/50">
            <div className="max-w-[1400px] mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-black tracking-tighter text-zinc-900">
                                QR<span className="text-indigo-600">digit</span>
                            </span>
                        </div>
                        <p className="text-zinc-500 font-medium text-xs leading-relaxed max-w-[240px]">
                            Redefining safety with intelligent QR protocols. Secure, private, and global emergency response.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <h4 className="text-zinc-400 font-extrabold text-[10px] uppercase tracking-[0.2em] mb-4">Company</h4>
                        <ul className="space-y-3.5 text-sm font-bold text-zinc-600">
                            <li><Link href="/" className="hover:text-red-600 transition-colors tracking-tight">Home</Link></li>
                            <li><Link href="/about" className="hover:text-red-600 transition-colors tracking-tight">About us</Link></li>
                            <li><Link href="/shop" className="hover:text-red-600 transition-colors tracking-tight">Our Products</Link></li>
                            <li><Link href="/contact" className="hover:text-red-600 transition-colors tracking-tight">Contact Us</Link></li>
                        </ul>
                    </div>

                    {/* Safety Matrix */}
                    <div className="space-y-6">
                        <h4 className="text-zinc-400 font-extrabold text-[10px] uppercase tracking-[0.2em] mb-4">Safety Matrix</h4>
                        <ul className="space-y-3.5 text-sm font-bold text-zinc-600">
                            <li><Link href="/shop?category=vehicle-safety" className="hover:text-red-600 transition-colors tracking-tight">Vehicle Safety</Link></li>
                            <li><Link href="/shop?category=child-safety" className="hover:text-red-600 transition-colors tracking-tight">Child Safety</Link></li>
                            <li><Link href="/shop?category=women-safety" className="hover:text-red-600 transition-colors tracking-tight">Women Security</Link></li>
                            <li><Link href="/shop?category=elderly-safety" className="hover:text-red-600 transition-colors tracking-tight">Senior Tracker</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="space-y-6">
                        <h4 className="text-zinc-400 font-extrabold text-[10px] uppercase tracking-[0.2em] mb-4">Global Matrix Legal</h4>
                        <ul className="space-y-3.5 text-sm font-bold text-zinc-600">
                            <li><Link href="/privacy" className="hover:text-red-600 transition-colors tracking-tight">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-red-600 transition-colors tracking-tight">Terms of Service</Link></li>
                            <li><Link href="/refund" className="hover:text-red-600 transition-colors tracking-tight">Refund Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-zinc-100 pt-10 flex flex-col md:flex-row items-center justify-between text-[10px] text-zinc-400 font-black uppercase tracking-[0.4em] gap-6">
                    <p>© 2026 QRDIGIT.IN | ALL RIGHTS RESERVED</p>
                    <p>Powered by
                        <a href="https://thinkaiq.com" target="_blank" rel="noopener noreferrer" className="text-zinc-800 hover:text-red-600 transition-colors ml-1">ThinkAIQ</a>
                        <span className="mx-2 text-bold font-extrabold text-lg text-red-600">X</span>
                        <a href="https://theincreations.com/" target="_blank" rel="noopener noreferrer" className="text-zinc-800 hover:text-red-600 transition-colors"> INCREATIONS</a>
                    </p>
                </div>
            </div>
        </footer>
    )
}
