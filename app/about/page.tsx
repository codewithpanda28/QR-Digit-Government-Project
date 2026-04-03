'use client'

import React from 'react'
import Link from 'next/link'
import { Shield, Target, Users, Heart, Zap, Lock, Siren, ArrowRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <Navbar />

            <main className="pt-32 pb-40">
                {/* Hero Section */}
                <section className="max-w-[1200px] mx-auto px-6 mb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                             <div className="inline-flex items-center gap-3 px-5 py-2 bg-red-600 text-white rounded-full shadow-lg">
                                 <Siren className="w-5 h-5 animate-bounce" />
                                 <span className="text-xs font-bold tracking-widest uppercase">QRdigit — India's #1 Safety QR</span>
                             </div>
                            
                            <h1 className="text-5xl md:text-7xl font-semibold leading-[1.05] tracking-tight">
                                Har Parivaar Ko <br/>
                                <span className="text-red-600 italic">Safe Banana.</span>
                            </h1>
                            
                            <p className="text-xl font-light text-slate-600 max-w-xl leading-relaxed">
                                Hamara maksad bahut simple hai — Technology ke zariye har citizen ko itna aatmanirbhar banana ki emergency mein wo khudki aur doosron ki safely madad kar sake, bina apni privacy compromise kiye.
                            </p>

                            <div className="flex gap-4 pt-4">
                                <div className="flex-1 bg-white border-2 border-slate-100 p-6 rounded-3xl shadow-sm">
                                    <Zap className="w-8 h-8 text-red-600 mb-3" />
                                    <h3 className="font-semibold text-lg mb-1">Instant Response</h3>
                                    <p className="text-slate-500 text-sm">Koi app install nahi karni.</p>
                                </div>
                                <div className="flex-1 bg-white border-2 border-slate-100 p-6 rounded-3xl shadow-sm">
                                    <Lock className="w-8 h-8 text-red-600 mb-3" />
                                    <h3 className="font-semibold text-lg mb-1">Privacy First</h3>
                                    <p className="text-slate-500 text-sm">Aapka number hidden rehta hai.</p>
                                </div>
                            </div>
                        </div>

                        {/* Image */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-red-600/10 blur-[80px] -z-10 group-hover:bg-red-600/20 transition-all duration-700"></div>
                            <div className="bg-white border-2 border-slate-100 rounded-[3rem] p-2 shadow-2xl overflow-hidden">
                                <img 
                                    src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?q=80&w=1000&auto=format&fit=crop" 
                                    className="w-full aspect-square object-cover rounded-[2.5rem] group-hover:scale-105 transition-transform duration-700" 
                                    alt="Family Safety" 
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Values */}
                <section className="bg-white py-24 border-y-2 border-slate-100">
                    <div className="max-w-[1200px] mx-auto px-6">
                        <div className="text-center mb-16 space-y-4">
                            <span className="text-red-600 font-black text-xs uppercase tracking-[0.5em]">QRdigit Pillars</span>
                            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">Jispar Hum <span className="text-red-600">Bharosa</span> Karte Hain.</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { t: '100% Privacy', i: <Lock />, d: 'Humara system encrypted bridge use karta hai. Scanner ko apka number nahi dikhega. Sirf helpline aayegi.' },
                                { t: 'Sabke Liye Aasaan', i: <Heart />, d: 'Bache se lekar buzurg tak — QR ko simply phone camera se scan karke help mangwaana possible hai.' },
                                { t: 'Community Strength', i: <Users />, d: 'Hum believe karte hain ki ek achha padosi/rahgir emergency mein sabse bada lifesaver hota hai.' }
                            ].map((val, i) => (
                                <div key={i} className="bg-slate-50 border-2 border-slate-100 p-10 rounded-[2.5rem] hover:border-red-200 transition-all group">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-red-600 mb-6 shadow-sm group-hover:scale-110 transition-transform">{val.i}</div>
                                    <h3 className="text-2xl font-semibold mb-3">{val.t}</h3>
                                    <p className="text-slate-500 font-light leading-relaxed">{val.d}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="max-w-[1200px] mx-auto px-6 pt-24">
                    <div className="bg-[#1a1a1b] rounded-[3rem] p-16 text-center text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 blur-[100px] rounded-full"></div>
                        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-8">System Ke Saath Judne Ke Liye Taiyaar Hain?</h2>
                        <Link href="/shop" className="inline-block bg-white text-red-600 font-semibold text-lg px-12 py-5 rounded-2xl hover:scale-105 transition-all shadow-xl">
                            Apna QR Tag Order Karein →
                        </Link>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    )
}
