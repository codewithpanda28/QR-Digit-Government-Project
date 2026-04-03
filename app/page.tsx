'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  QrCode, ArrowRight, Shield, Activity, Phone, MapPin, Zap,
  Target, Heart, Users, Volume2, ShieldAlert, Navigation, Siren,
  Smartphone, Lock, Stethoscope, Camera, FileText, Baby,
  UserCheck, Dog, Car, Briefcase, CreditCard, Luggage, CheckCircle,
  ShoppingCart, MessageSquare, Mic, Radio, Star
} from "lucide-react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState(0)

  const scanButtons = [
    {
      emoji: '🚨',
      label: 'SOS TRIGGER',
      color: 'bg-indigo-600',
      textColor: 'text-white',
      iconColor: 'text-white',
      icon: <Zap className="w-7 h-7" />,
      title: 'Emergency SOS Button',
      tagline: 'Priority Zero — 1-Click Direct Help',
      what: 'Jab koi bhi is button ko dabaata hai, ek AI Voice Call seedha owner ke phone par jaati hai. Intelligent protocols insure call pick-up and location delivery.',
      flow: [
        'Scanner → SOS Interface Activation',
        'System → Owner AI Voice Relay (Encrypted)',
        'Metadata → Incident ID & Exact Coordinates',
        'Dashboard → High-Priority Alert Broadcast'
      ]
    },
    {
      emoji: '📍',
      label: 'LIVE LOCATION',
      color: 'bg-emerald-600',
      textColor: 'text-white',
      iconColor: 'text-white',
      icon: <Navigation className="w-7 h-7" />,
      title: 'Real-Time GPS Tracking',
      tagline: 'Military-Grade Location Precision',
      what: 'Instant coordinate transmission via secure data bridge. Owner receives a high-res Google Maps link with the exact scanning radius.',
      flow: [
        'User → "Transmit Coordinates" Trigger',
        'Device Hardware → Precise Lat/Long Capture',
        'Relay → Secure WhatsApp Data Packet Sent',
        'Recipient → Real-time Navigation Start'
      ]
    },
    {
      emoji: '🏥',
      label: 'NEARBY MEDICAL',
      color: 'bg-indigo-500',
      textColor: 'text-white',
      iconColor: 'text-white',
      icon: <Stethoscope className="w-7 h-7" />,
      title: 'Emergency Medical Matrix',
      tagline: 'Life-Saving Critical Infrastructure Search',
      what: 'Advanced algorithms identify the nearest hospitals, ambulance hubs, and blood banks within a 5km radius of the incident location.',
      flow: [
        'Scan Event → Radial Search Initialization',
        'API → Multi-source Medical Data Retrieval',
        'UI → Distance-sorted Facility List',
        'Action → One-Tap Direct Dispatch Call'
      ]
    },
    {
      emoji: '👮',
      label: 'POLICE / FIRE',
      color: 'bg-indigo-700',
      textColor: 'text-white',
      iconColor: 'text-white',
      icon: <Siren className="w-7 h-7" />,
      title: 'Public Safety Interface',
      tagline: 'Direct Local Authority Linkages',
      what: 'Instant connection to local public safety answering points (100, 112). Automatically routes to the nearest precinct via GPS tagging.',
      flow: [
        'Selection → Regional Helpline Mapping',
        'Native Dialler → Encrypted Outbound Connection',
        'Location Sync → Coordinates shared with Dispatch',
        'Status → Active Case ID Generated'
      ]
    },
    {
      emoji: '📸',
      label: 'SAFETY SIGNALS',
      color: 'bg-emerald-600',
      textColor: 'text-white',
      iconColor: 'text-white',
      icon: <Camera className="w-7 h-7" />,
      title: 'Digital Forensic Capture',
      tagline: 'Encrypted Evidence Log Acquisition',
      what: 'Seamless background session for high-fidelity audio/photo capture. All data is time-stamped and signed for security verification.',
      flow: [
        'Authorization → Secure Media Session Start',
        'Sensors → Burst Mode Imaging & Audio Stream',
        'Upload → Instant Cloud Persistence (AWS/Supabase)',
        'Receipt → Admin dashboard verification link'
      ]
    }
  ]

  const categories = [
    { title: 'Car & Bikes', emoji: '🚗', icon: <Car className="w-8 h-8" />, desc: 'Accident alert, wrong parking, theft rescue. Windshield par sticker lagao.', color: 'border-slate-200', image: '/products/car.jpeg' },
    { title: 'Child Safety', emoji: '👶', icon: <Baby className="w-8 h-8" />, desc: 'School bag ya wristband par. Kisi bhi museebat mein bachon ki sahi jagah pata karein.', color: 'border-blue-100', image: '/products/child.jpeg' },
    { title: 'Pets & Animals', emoji: '🐕', icon: <Dog className="w-8 h-8" />, desc: 'Collar par lagao. Kho jaaye toh finder seedha aapko call kar sakta hai.', color: 'border-orange-100', image: '/products/pet.jpeg' },
    { title: 'Travel & Luggage', emoji: '🧳', icon: <Luggage className="w-8 h-8" />, desc: 'Airport bag ya suitcase par. International travel mein bhi item track karein.', color: 'border-rose-100', image: '/products/luggage.jpeg' },
    { title: 'Home & Doorbell', emoji: '🔔', icon: <Smartphone className="w-8 h-8" />, desc: 'Ghar ke doorbell par lagao. Jab koi doorbell scan karega, aapko AI voice call aayegi.', color: 'border-blue-100', image: '/products/doorbell.jpeg' },
    { title: 'Bike Safety', emoji: '🏍️', icon: <Zap className="w-8 h-8" />, desc: 'Bike ya scooter ke console par. Accident ya wrong parking alert turant milega.', color: 'border-emerald-100', image: '/products/Bike.jpeg' },
  ]

  return (
    <main className="min-h-screen bg-white text-[#1a1a1b]">
      <style jsx global>{`
        .solid-card {
          background: white;
          border: 2px solid #F1F5F9;
          border-radius: 2rem;
          box-shadow: 0 4px 20px -4px rgba(0,0,0,0.05);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .solid-card:hover {
          border-color: #4F46E5;
          box-shadow: 0 20px 40px -8px rgba(79, 70, 229, 0.12);
          transform: translateY(-8px);
        }
        .flow-step::before {
          content: '→';
          margin-right: 10px;
          color: #4F46E5;
          font-weight: 700;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .premium-gradient {
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
        }
      `}</style>

      <Navbar />

      {/* ============================================================
          HERO SECTION — HINGLISH + IMAGE
      ============================================================ */}
      <section className="pt-32 pb-20 bg-white overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          {/* LEFT: HINGLISH TEXT */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-indigo-600/10 text-indigo-700 rounded-full border border-indigo-600/20 shadow-sm animate-fade-in">
              <Shield className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-bold tracking-[0.2em] uppercase">QRdigit — Global Smart Safety OS</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1] tracking-tight text-slate-900">
              Apno ki Safety <br />
              <span className="text-indigo-600 decoration-8 decoration-indigo-600/20">Ek Scan Away.</span>
            </h1>

            <p className="text-xl md:text-2xl font-medium text-slate-500 max-w-xl leading-relaxed mx-auto lg:mx-0">
              Gaadi, bache, ya bujurg — <strong className="text-slate-900">QRdigit</strong> emergency mein khud help bula leta hai. Bina kisi app ke, sirf ek scan aur poori family alert.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto lg:mx-0">
              {[
                '✨ Swipe for Emergency AI Call',
                '🧿 Zero Privacy Leaks',
                '🛰️ Live 1-Tap GPS Alert',
                '🛡️ 24/7 Shield Protection'
              ].map((point, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl hover:bg-white hover:shadow-md transition-all">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  {point}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start pt-4">
              <Link href="/shop" className="px-10 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-bold text-xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/25 flex items-center gap-4 group hover:scale-[1.02] active:scale-95">
                Get Your Smart Tag <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Link>
              <Link href="#how-it-works" className="px-10 py-5 border-2 border-slate-200 rounded-[1.5rem] font-bold text-xl hover:border-indigo-600 transition-all text-slate-600 hover:text-indigo-600">
                Documentation
              </Link>
            </div>
          </div>

          {/* RIGHT: HERO IMAGE */}
          <div className="relative group">
            <div className="absolute -inset-12 bg-indigo-500/10 rounded-[5rem] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative bg-white rounded-[4rem] p-3 border border-slate-100 shadow-2xl overflow-hidden">
              <div className="relative w-full aspect-square rounded-[3.2rem] overflow-hidden group-hover:scale-[1.03] transition-all duration-1000">
                <Image
                  src="/products/hero.jpeg"
                  alt="QRdigit Premium Safety Tag"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                  quality={90}
                />
              </div>
              <div className="absolute top-10 left-10 bg-white/95 backdrop-blur-xl px-6 py-4 rounded-[1.5rem] border border-white shadow-2xl flex items-center gap-4 animate-float">
                <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full animate-ping"></div>
                <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Network Secure</span>
              </div>
              <div className="absolute bottom-10 left-10 right-10 gradient-indigo p-8 rounded-[2rem] border border-white/20 shadow-2xl shadow-indigo-500/30 flex items-center justify-between backdrop-blur-md bg-indigo-600/90">
                <div>
                  <p className="text-[10px] text-indigo-200 font-black uppercase tracking-[0.3em] mb-2">Operational Status</p>
                  <p className="text-lg font-bold text-white">Full Matrix Protected · VPS-01</p>
                </div>
                <Activity className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SCAN DASHBOARD — EVERY BUTTON EXPLAINED
      ============================================================ */}
      <section className="py-24 bg-slate-50 border-y-2 border-slate-100" id="how-it-works">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <span className="text-indigo-600 font-black text-xs uppercase tracking-[0.5em]">System Core · Interactive Dashboard Protocols</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Jab Koi QRdigit Scan Karta Hai,<br /><span className="text-indigo-600">Ye Tools Milte Hain:</span></h2>
          </div>

          {/* Tab Selector */}
          <div className="flex flex-nowrap md:flex-wrap md:justify-center gap-2 md:gap-3 mb-10 overflow-x-auto no-scrollbar pb-3 md:pb-0 px-2">
            {scanButtons.map((btn, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`flex-shrink-0 px-4 md:px-7 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all duration-300 flex items-center gap-2 border-2 ${activeTab === idx
                  ? btn.color + ' text-white border-transparent shadow-lg'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
              >
                <span className="text-base md:text-lg">{btn.emoji}</span> {btn.label}
              </button>
            ))}
          </div>

          {/* Active Tab Content */}
          {scanButtons.map((btn, idx) => (
            <div key={idx} className={`${activeTab === idx ? 'block' : 'hidden'}`}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: What this button does */}
                <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-10 shadow-lg space-y-8">
                  <div className={`${btn.color} w-20 h-20 rounded-[2rem] flex items-center justify-center ${btn.iconColor} shadow-xl`}>
                    {btn.icon}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-3xl font-bold">{btn.title}</h3>
                    <p className="text-indigo-600 font-semibold text-lg italic">{btn.tagline}</p>
                  </div>
                  <p className="text-slate-600 text-lg font-medium leading-relaxed">{btn.what}</p>
                </div>

                {/* Right: Step-by-step flow */}
                <div className="bg-[#1a1a1b] text-white rounded-[2.5rem] p-10 shadow-xl space-y-6">
                  <div>
                    <p className="text-xs text-indigo-500 font-black uppercase tracking-widest mb-4">Command Flow</p>
                    <h4 className="text-2xl font-bold mb-6">Exactly Kya Hota Hai?</h4>
                  </div>
                  <div className="space-y-5">
                    {btn.flow.map((step, si) => (
                      <div key={si} className="flex items-start gap-4">
                        <div className={`${btn.color} text-white text-xs font-black px-3 py-1 rounded-lg flex-shrink-0 mt-0.5`}>
                          {String(si + 1).padStart(2, '0')}
                        </div>
                        <p className="text-white/80 font-light leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          CATEGORIES — ALL 8
      ============================================================ */}
      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
            <div className="space-y-3">
              <span className="text-indigo-500 font-black text-xs uppercase tracking-[0.5em]">QRdigit ecosystem</span>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight text-slate-900">Kiske Liye <span className="text-indigo-600 italic font-medium underline decoration-indigo-200">Kaunsa Path?</span></h2>
            </div>
            <Link href="/shop" className="px-8 py-4 border-2 border-slate-200 rounded-2xl font-bold hover:border-indigo-500 transition-all text-slate-600 flex items-center gap-3 whitespace-nowrap group">
              Inventory Overview <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map((cat, idx) => (
              <div key={idx} className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-700 hover:-translate-y-2">
                <div className="aspect-[4/3] overflow-hidden relative">
                  <Image
                    src={cat.image}
                    alt={cat.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-1000"
                    loading="lazy"
                    quality={80}
                  />
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                    <span className="px-4 py-2 bg-white/90 backdrop-blur-md text-[#1a1a1b] text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg border border-white">
                      {cat.title.split(' ')[0]} Pack
                    </span>
                    <span className="px-4 py-2 bg-indigo-600 text-white text-sm font-black rounded-xl shadow-lg">
                      ₹299
                    </span>
                  </div>
                </div>

                <div className="p-5 md:p-8 space-y-4 md:space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg md:text-2xl font-bold text-[#1a1a1b] flex items-center gap-3">
                      <span className="text-2xl md:text-3xl">{cat.emoji}</span> {cat.title}
                    </h3>
                    <p className="text-slate-500 text-[13px] md:text-sm font-light leading-relaxed line-clamp-2">
                      {cat.desc}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/shop/instant?product=${encodeURIComponent(cat.title)}`}
                      className="flex items-center justify-center gap-3 w-full py-4 md:py-5 bg-[#1a1a1b] text-white rounded-xl md:rounded-2xl text-[10px] md:text-[12px] font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl group/btn"
                    >
                      Provision Instant Guard <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          ACTIVATION STEPS
      ============================================================ */}
      <section className="py-24 bg-slate-50 border-y-2 border-slate-100">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <span className="text-indigo-600 font-black text-xs uppercase tracking-[0.5em]">Deployment Protocol</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Sirf <span className="text-indigo-600">4 Kadam</span> — Aur Aap Safe!</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { n: '01', icon: <ShoppingCart className="w-8 h-8" />, t: 'Pack Order Karein', d: 'Shop se apni zaroorat ke hisaab se pack chuno — Car, Bike, Bachon ke liye ya Pets ke liye. Ghar baithe delivery aa jaayegi.', color: 'bg-indigo-600' },
              { n: '02', icon: <QrCode className="w-8 h-8" />, t: 'Naya QR Scan Karein', d: 'Naya sticker milne ke baad use apne phone se scan karo. Ek "Connect to Account" button dikhega — use dabao.', color: 'bg-slate-800' },
              { n: '03', icon: <FileText className="w-8 h-8" />, t: 'Details Fill Karein', d: 'Apna naam, blood group, aur 3 emergency contacts ke numbers daalo (Papa, Bhai, Dost — koi bhi). Bas ho gaya.', color: 'bg-emerald-600' },
              { n: '04', icon: <Shield className="w-8 h-8" />, t: 'Chipka Do — Ready!', d: '3M Adhesive se sticker ko gaadi ya bag par chipkao. Ab aap 24/7 protected hain. Koi bhi scan karega — Help aa jaayegi.', color: 'bg-blue-600' },
            ].map((step, idx) => (
              <div key={idx} className="bg-white border-2 border-slate-100 rounded-[2rem] p-8 shadow-md flex flex-col gap-6 hover:border-indigo-200 hover:shadow-xl transition-all duration-300">
                <div className={`${step.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                  {step.icon}
                </div>
                <div className="space-y-3">
                  <div className="text-5xl font-black text-slate-300 leading-none">{step.n}</div>
                  <h3 className="text-xl font-semibold -mt-2">{step.t}</h3>
                  <p className="text-slate-500 font-light text-sm leading-relaxed">{step.d}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Login guide */}
          <div className="mt-12 bg-white border-2 border-indigo-100 rounded-[2rem] p-10 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2 space-y-3">
              <p className="text-xs text-indigo-600 font-black uppercase tracking-widest">Portal Access Guide</p>
              <h3 className="text-2xl font-semibold">Login Karna Bahut Aasaan Hai</h3>
              <ul className="space-y-2 text-slate-500 font-light text-sm">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> <strong>Option 1:</strong> Apna QR khud scan karo → Dashboard khul jaayega</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> <strong>Option 2:</strong> QRdigit.in par jaao → Login karein OTP se</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> <strong>Option 3:</strong> Dashboard link ko bookmark karke rakho (1-click access)</li>
              </ul>
            </div>
            <div className="text-center">
              <Link href="/login" className="inline-block px-10 py-5 bg-[#1a1a1b] text-white rounded-2xl font-semibold text-lg hover:bg-black transition-all shadow-xl">
                User Login Karein →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          BENEFITS (WHY Q-RAKSHA)
      ============================================================ */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <span className="text-indigo-500 font-black text-xs uppercase tracking-[0.5em]">Why QRdigit?</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Doosre Stickers Se <span className="text-indigo-600 italic underline decoration-indigo-100">Kyun Alag Hai?</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { t: 'Koi App Nahi Chahiye', d: 'Scanner ko kuch bhi download nahi karna. Mobile ka default camera app se QR scan karo aur seedha browser mein sab kuch khul jaata hai.', i: <Smartphone className="w-10 h-10" />, color: 'text-blue-600', bg: 'bg-blue-50' },
              { t: 'Number Hamesha Safe Rehta Hai', d: 'Aapka real mobile number kisi ko bhi nahi dikhta. Communication ek secure encrypted bridge ke zariye hoti hai. 100% Privacy guaranteed.', i: <Lock className="w-10 h-10" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { t: 'AI Voice Alert (Miss Nahi Hogi)', d: 'Simple SMS nahi — ek zordar AI Authority Call jaati hai. Jab tak family pick up nahi kart, call retry hoti rahegi. Emergency miss nahi hogi.', i: <Volume2 className="w-10 h-10" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { t: 'Live GPS Radar Dashboard', d: 'Har scan ka exact location, time aur scanner ki details aapke personal dashboard par turant dikh jaate hain — real-time mein.', i: <Target className="w-10 h-10" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { t: 'Photo + Audio Evidence', d: 'Scanner ki device se scene ki photo aur audio secretly capture hokar aapke dashboard par upload ho jaati hai. Court-ready evidence.', i: <Camera className="w-10 h-10" />, color: 'text-orange-600', bg: 'bg-orange-50' },
              { t: 'Ek Baar Kharido, Hamesha Safe', d: 'Koi monthly subscription nahi. Ek baar Q-Raksha pack lo aur lifetime basic protection use karo. Zero hidden charges.', i: <Star className="w-10 h-10" />, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            ].map((b, idx) => (
              <div key={idx} className="solid-card p-8 flex gap-6">
                <div className={`${b.bg} ${b.color} w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm`}>{b.i}</div>
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold leading-tight">{b.t}</h4>
                  <p className="text-slate-500 font-light text-sm leading-relaxed">{b.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          CTA FOOTER
      ============================================================ */}
      <section className="py-24 bg-[#1a1a1b] text-white text-center">
        <div className="max-w-3xl mx-auto px-6 space-y-10">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
            Apno Ki Suraksha Ek<br /><span className="text-indigo-500 italic font-medium">Scan Away.</span>
          </h2>
          <p className="text-xl font-light text-white/50 max-w-xl mx-auto leading-relaxed">
            Gaon ho ya sheher, bache ho ya bujurg — Q-Raksha har kisi ke liye hai. Aaj hi lagao, hamesha ke liye befikr ho jaao.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
            <Link href="/shop" className="px-12 py-6 bg-indigo-600 text-white rounded-2xl font-bold text-xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/30 hover:scale-[1.05] active:scale-95">
              Secure Your Life Now
            </Link>
            <Link href="/login" className="px-12 py-6 border-2 border-white/15 rounded-2xl font-light text-xl hover:bg-white/5 transition-all">
              User Dashboard
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
