'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
    QrCode, ArrowRight, Shield, Activity, Phone, MapPin, Zap,
    Target, Heart, Users, Volume2, ShieldAlert, Navigation, Siren,
    Smartphone, Lock, Stethoscope, Camera, FileText, Baby,
    Dog, Car, Briefcase, CreditCard, Luggage, CheckCircle,
    ShoppingCart, Star, PlayCircle, Globe, Award, Sparkles, MoveRight,
    SearchLocation, PhoneCall, Building2, Tent
} from "lucide-react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
}

const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1 } }
}

export default function HomePage() {
    const [scrolled, setScrolled] = useState(false)
    const [activeTab, setActiveTab] = useState(0)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const features = [
        {
            icon: <PhoneCall className="w-8 h-8" />,
            title: "Instant AI Voice Call",
            desc: "The moment someone scans the QR, our AI immediately calls your emergency contacts. No SMS delays.",
            color: "text-blue-600",
            bg: "bg-blue-100/50"
        },
        {
            icon: <SearchLocation className="w-8 h-8" />,
            title: "Real-time Location",
            desc: "Get precise GPS coordinates and a Google Maps link instantly sent to your smartphone or dashboard.",
            color: "text-emerald-600",
            bg: "bg-emerald-100/50"
        },
        {
            icon: <ShieldAlert className="w-8 h-8" />,
            title: "SOS & Medical Alert",
            desc: "1-Tap access to nearest hospitals, blood banks, and police (112) with absolute zero privacy leaks.",
            color: "text-rose-600",
            bg: "bg-rose-100/50"
        }
    ]

    const useCases = [
        {
            title: 'Mela & Public Events',
            desc: 'Prevent missing persons in massive crowds like Kumbh. Instant identification via QR wristbands.',
            icon: <Tent className="w-6 h-6" />,
            color: "bg-orange-50 text-orange-600 border-orange-200"
        },
        {
            title: 'Govt & Infrastructure',
            desc: 'Secure buildings, track state assets, and manage deployments with a centralized, auditable dashboard.',
            icon: <Building2 className="w-6 h-6" />,
            color: "bg-indigo-50 text-indigo-600 border-indigo-200"
        },
        {
            title: 'Schools & Education',
            desc: 'Ensure child safety on campus and buses. Real-time parent alerts and attendance integration.',
            icon: <Baby className="w-6 h-6" />,
            color: "bg-sky-50 text-sky-600 border-sky-200"
        },
        {
            title: 'Fleet & Logistics',
            desc: 'Asset tracking, driver emergency SOS, and transit visibility for private and public sector transport.',
            icon: <Car className="w-6 h-6" />,
            color: "bg-slate-50 text-slate-700 border-slate-200"
        }
    ]

    return (
        <main className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-500/30 overflow-hidden">
            <Navbar />

            {/* --- HERO SECTION --- */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Modern Abstract Background */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] opacity-30 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-300 via-purple-300 to-sky-300 blur-[100px] rounded-full mix-blend-multiply" />
                </div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8"
                    >
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        <span className="text-sm font-semibold text-slate-700">Next-Gen Intelligent Safety OS</span>
                    </motion.div>

                    <motion.h1
                        {...fadeIn}
                        className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tight text-slate-900 leading-[1.1] mb-6"
                    >
                        Bharat's Universal <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 inline-block mt-2">
                            Emergency Response
                        </span>
                    </motion.h1>

                    <motion.p
                        {...fadeIn}
                        transition={{ delay: 0.1 }}
                        className="text-xl md:text-2xl text-slate-600 font-medium max-w-3xl mx-auto mb-10 leading-relaxed"
                    >
                        Empowering Government deployments and everyday citizens alike. 
                        A single scan connects lost ones, triggers medical aid, and dispatches GPS SOS alerts — <strong className="text-slate-900">without any app.</strong>
                    </motion.p>

                    <motion.div
                         {...fadeIn}
                         transition={{ delay: 0.2 }}
                         className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link href="/shop" className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 w-full sm:w-auto bg-slate-900 text-white rounded-full font-semibold text-lg overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/20">
                            <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            <span className="relative z-10 flex items-center gap-2">
                                Choose Your Coverage <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Link>
                        
                        <Link href="#solutions" className="inline-flex items-center justify-center gap-3 px-8 py-4 w-full sm:w-auto bg-white text-slate-700 border-2 border-slate-200 rounded-full font-semibold text-lg hover:border-slate-300 hover:bg-slate-50 transition-colors">
                            Explore Enterprise <Building2 className="w-5 h-5" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* --- METRICS / TRUST MARK --- */}
            <section className="py-10 border-y border-slate-200/60 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-center text-sm font-bold tracking-widest text-slate-400 uppercase mb-8">Trusted by Institutions & Families Nationwide</p>
                    <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        {['Maha Kumbh Safety', 'City Traffic Police', 'Smart Schools', 'National Transport', 'Disaster Management'].map((brand, i) => (
                             <div key={i} className="text-lg md:text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-indigo-500" />
                                {brand}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- CORE CAPABILITIES --- */}
            <section className="py-24 bg-white relative">
                 <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                         <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">Core Technology</h2>
                         <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                             How the QRdigit System Saves Lives Instantly
                         </h3>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((f, i) => (
                             <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group relative p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300"
                             >
                                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${f.bg} ${f.color}`}>
                                     {f.icon}
                                 </div>
                                 <h4 className="text-2xl font-bold tracking-tight text-slate-900 mb-4">{f.title}</h4>
                                 <p className="text-slate-600 leading-relaxed font-medium">{f.desc}</p>
                             </motion.div>
                        ))}
                    </div>
                 </div>
            </section>

             {/* --- UNIFIED PLATFORM SECTION (THE DASHBOARD PREVIEW) --- */}
             <section className="py-32 bg-slate-900 relative overflow-hidden">
                {/* Dark mode abstract bg */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
                
                <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/10">
                             {/* Faux Browser Header */}
                             <div className="bg-slate-800/80 backdrop-blur px-4 py-3 flex items-center gap-2 border-b border-white/10">
                                 <div className="flex gap-1.5">
                                     <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                                     <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                                     <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                                 </div>
                                 <div className="mx-auto px-10 py-1 bg-slate-900/50 rounded-md text-[10px] text-slate-400 font-mono tracking-wider truncate max-w-[200px]">
                                     dashboard.qrdigit.com/command
                                 </div>
                             </div>
                             {/* Dashboard Image / Mockup */}
                             <div className="aspect-[4/3] bg-slate-800 relative flex items-center justify-center overflow-hidden">
                                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
                                 
                                 <div className="w-full h-full p-6 flex flex-col gap-4">
                                     <div className="flex justify-between items-center">
                                         <div className="w-32 h-6 bg-slate-700/50 rounded animate-pulse" />
                                         <div className="flex gap-2">
                                             <div className="w-8 h-8 rounded-full bg-indigo-500/20" />
                                             <div className="w-8 h-8 rounded-full bg-rose-500/20" />
                                         </div>
                                     </div>
                                     <div className="grid grid-cols-3 gap-4">
                                          {[1,2,3].map(i => (
                                              <div key={i} className="h-20 rounded-xl bg-slate-700/30 border border-white/5 p-3 flex flex-col justify-end">
                                                  <div className="w-1/2 h-4 bg-slate-600/50 rounded mb-2" />
                                                  <div className="w-3/4 h-3 bg-slate-600/30 rounded" />
                                              </div>
                                          ))}
                                     </div>
                                     <div className="flex-1 rounded-xl bg-slate-700/20 border border-white/5 mt-2 relative overflow-hidden">
                                        <div className="absolute top-4 left-4 w-40 h-5 bg-slate-600/40 rounded" />
                                        <div className="absolute right-4 top-4 bottom-4 w-32 bg-slate-600/10 rounded-lg border border-white/5" />
                                        
                                        {/* Mock Map Blips */}
                                        <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                                            <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
                                        </div>
                                        <div className="absolute top-1/3 right-1/2 w-3 h-3 bg-rose-400 rounded-full shadow-[0_0_15px_rgba(244,63,113,0.5)]">
                                            <div className="absolute inset-0 bg-rose-400 rounded-full animate-ping opacity-75" />
                                        </div>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                    
                    <div className="order-1 lg:order-2 space-y-8">
                        <div>
                            <h2 className="text-sm font-bold text-indigo-400 tracking-widest uppercase mb-3">Live Command Center</h2>
                            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                                Complete Control, <br /> Zero Blind Spots
                            </h3>
                        </div>
                        <p className="text-lg text-slate-400 leading-relaxed font-medium">
                            Whether managing thousands of pilgrims at a Mela or tracking fleet vehicles, the QRdigit Command Dashboard provides real-time oversight. Monitor scans, track GPS, and manage emergencies globally from a single pane of glass.
                        </p>
                        
                        <div className="space-y-4">
                            {['Global Event Activity Map', 'Encrypted Media (Photo/Voice) Evidence', 'Hierarchical Admin Access Control'].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20">
                                        <CheckCircle className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <span className="text-slate-300 font-semibold">{item}</span>
                                </div>
                            ))}
                        </div>

                        <Link href="/admin/login" className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors uppercase tracking-widest text-sm pt-4">
                            Access Administrator Panel <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
             </section>

             {/* --- SECTORS & SOLUTIONS --- */}
             <section className="py-24 bg-slate-50" id="solutions">
                 <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Built for Scale and Flexibility</h2>
                        <p className="text-slate-600 mt-4 font-medium text-lg">One core technology adaptable across the most critical public and private sectors.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {useCases.map((uc, i) => (
                            <div key={i} className={`p-8 rounded-3xl border ${uc.color} bg-white transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200`}>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-current opacity-10`} />
                                <div className="absolute top-8 left-8 w-12 h-12 flex items-center justify-center">
                                    {uc.icon}
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 mb-3">{uc.title}</h4>
                                <p className="text-slate-600 text-sm leading-relaxed font-medium">{uc.desc}</p>
                            </div>
                        ))}
                    </div>
                 </div>
             </section>

            {/* --- CTA SECTION --- */}
            <section className="py-32 bg-white relative overflow-hidden text-center border-t border-slate-100">
                <div className="max-w-4xl mx-auto px-6 relative z-10">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-8">
                        <QrCode className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">
                        Ready to deploy the <br /> safety net?
                    </h2>
                    <p className="text-xl text-slate-600 mb-10 font-medium max-w-2xl mx-auto">
                        Get your personal QR tags today or contact our enterprise team for large-scale government or corporate deployments.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/shop" className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2">
                             Buy Personal Tags <ShoppingCart className="w-5 h-5" />
                        </Link>
                        <Link href="/contact" className="px-8 py-4 bg-white text-slate-800 border-2 border-slate-200 rounded-full font-bold text-lg hover:border-slate-300 transition-colors shadow-sm">
                             Contact Enterprise Sales
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
