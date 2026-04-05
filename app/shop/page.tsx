'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Shield, Car, Users, Activity, Laptop, Search, Zap, Lock, Volume2, CheckCircle, Star, ShoppingCart, Package, Siren, Baby } from 'lucide-react'
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

const CATEGORIES = [
    {
        id: "vehicle",
        emoji: "🚗",
        title: "Vehicle Safety",
        subtitle: "Gaadi & Bike ki suraksha",
        icon: <Car className="w-6 h-6" />,
        color: "bg-red-600",
        price: "299",
        desc: "Accident alert, wrong parking, theft rescue. Windshield ya handle pe chipkao.",
        tags: ["Accident Alert", "Parking Help", "Theft Rescue"],
        products: [
            { name: "Car Safety Tag", image: "/products/car.jpeg" },
            { name: "Bike Safety Tag", image: "/products/Bike.jpeg" },
        ]
    },
    {
        id: "pets",
        emoji: "🐕",
        title: "Pet Recovery",
        subtitle: "Pets ki hifazat",
        icon: <Users className="w-6 h-6" />,
        color: "bg-orange-600",
        price: "299",
        desc: "Collar par lagao. Kho jaaye toh finder seedha aapko call kar sakta hai.",
        tags: ["Pet Tracking", "Quick Connect", "Collar Tag"],
        products: [
            { name: "Smart Pet Collar Tag", image: "/products/pet.jpeg" },
        ]
    },
    {
        id: "travel",
        emoji: "🧳",
        title: "Travel & Luggage",
        subtitle: "Kho jaye toh milega",
        icon: <Package className="w-6 h-6" />,
        color: "bg-blue-600",
        price: "299",
        desc: "Airport bag ya suitcase par. International travel mein bhi item track karein.",
        tags: ["Bag Tracker", "Airport Safety", "Luggage ID"],
        products: [
            { name: "Premium Luggage Tag", image: "/products/luggage.jpeg" },
        ]
    },
    {
        id: "home",
        emoji: "🔔",
        title: "Home & Doorbell",
        subtitle: "Smart Home Entry",
        icon: <Zap className="w-6 h-6" />,
        color: "bg-emerald-600",
        price: "299",
        desc: "Doorbell ya gate par lagao. Jab koi scan karega, aapko AI voice call aayegi.",
        tags: ["Smart Entry", "Voice Alert", "Guest Contact"],
        products: [
            { name: "Smart Doorbell QR", image: "/products/doorbell.jpeg" },
        ]
    },
    {
        id: "child",
        emoji: "👶",
        title: "Child Safety",
        subtitle: "Bachon ki hifazat",
        icon: <Baby className="w-6 h-6" />,
        color: "bg-blue-600",
        price: "299",
        desc: "School bag ya wristband par. Kisi bhi museebat mein bachon ki sahi jagah pata karein.",
        tags: ["School Bag ID", "Quick Connect", "Child Safety"],
        products: [
            { name: "Smart Child Safety Tag", image: "/products/child.jpeg" },
        ]
    }
]

export default function ShopPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <ShopContent />
        </Suspense>
    )
}

function ShopContent() {
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const searchParams = useSearchParams()

    const filteredCategories = CATEGORIES.filter(cat =>
        activeCategory ? cat.id === activeCategory : true
    ).map(cat => ({
        ...cat,
        products: cat.products.filter(p =>
            searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
        )
    })).filter(cat => cat.products.length > 0)

    return (
        <main className="min-h-screen bg-white text-[#1a1a1b]">
            <style jsx global>{`
                .shop-card {
                    border: 2px solid #F1F5F9;
                    transition: all 0.35s cubic-bezier(0.19,1,0.22,1);
                    box-shadow: 0 4px 20px -4px rgba(0,0,0,0.05);
                }
                .shop-card:hover {
                    border-color: #EF4444;
                    transform: translateY(-6px);
                    box-shadow: 0 20px 40px -10px rgba(239,68,68,0.1);
                }
                .cat-pill { transition: all 0.2s; }
                .cat-pill:hover { transform: translateY(-2px); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <Navbar />

            {/* ── HERO ───────────────────────────────────── */}
            <section className="pt-24 md:pt-32 pb-8 md:pb-12 bg-white border-b border-slate-50">
                <div className="max-w-[1200px] mx-auto px-6 text-center space-y-4 md:space-y-6">
                    <div className="inline-flex items-center gap-3 px-5 py-2 bg-red-600 text-white rounded-full shadow-lg mb-6 scale-90 md:scale-100">
                        <Siren className="w-5 h-5 animate-bounce" />
                        <span className="text-xs font-bold tracking-widest uppercase">Q-Raksha — India's #1 Safety QR</span>
                    </div>

                    <h1 className="text-3xl md:text-7xl font-semibold tracking-tight leading-tight">
                        Apna <span className="text-red-600 italic font-light">Safety Pack</span> <br className="md:hidden" /> Chuniye.
                    </h1>

                    <p className="text-sm md:text-xl font-light text-slate-500 max-w-2xl mx-auto leading-relaxed">
                        Ek baar kharido, hamesha protect raho. Physical QR tag courier se ghar aayega — sirf <strong>3-5 din</strong> mein.
                    </p>

                    {/* Trust badges */}
                    <div className="grid grid-cols-2 md:flex md:flex-nowrap justify-center gap-3 md:gap-4 pt-4 max-w-4xl mx-auto">
                        {[
                            { icon: '🚚', text: 'Free Delivery 3-5 Days' },
                            { icon: '🔒', text: 'Online Payment Secure' },
                            { icon: '📦', text: 'Physical QR Tag Courier' },
                            { icon: '⚡', text: 'Lifetime Access Available' },
                        ].map((b, i) => (
                            <span key={i} className="flex items-center justify-center gap-2 text-[10px] md:text-sm text-slate-500 font-bold bg-slate-50 border border-slate-100 px-3 md:px-4 py-2.5 md:py-2 rounded-xl md:rounded-full">
                                {b.icon} {b.text}
                            </span>
                        ))}
                    </div>


                </div>
            </section>

            {/* ── CATEGORY FILTER ────────────────────────── */}
            <section className="py-3 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-[80px] z-40">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                    <div className="flex flex-nowrap md:flex-wrap gap-2 md:gap-3 overflow-x-auto md:justify-center pb-2 md:pb-0 no-scrollbar">
                        <button
                            onClick={() => setActiveCategory(null)}
                            className={`cat-pill whitespace-nowrap px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-semibold border-2 transition-all flex-shrink-0 ${!activeCategory ? 'bg-[#1a1a1b] text-white border-[#1a1a1b]' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}
                        >
                            🛡️ Sabhi Packs
                        </button>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                                className={`cat-pill whitespace-nowrap px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-semibold border-2 transition-all flex items-center gap-2 flex-shrink-0 ${activeCategory === cat.id ? cat.color + ' text-white border-transparent shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}
                            >
                                {cat.emoji} {cat.title}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Search */}
            <div className="max-w-lg mx-auto pt-8">
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                        type="text"
                        placeholder="Search karo — Car, Kids, Medical..."
                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-base font-medium focus:border-red-500 outline-none transition-all"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* ── PRODUCTS ───────────────────────────────── */}
            <main className="py-20 bg-white">
                <div className="max-w-[1200px] mx-auto px-6 space-y-24">
                    {filteredCategories.map((cat) => (
                        <div key={cat.id} id={cat.id} className="scroll-mt-40">
                            {/* Category Header */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-6 border-b-2 border-slate-50">
                                <div className="flex items-center gap-5">
                                    <div className={`${cat.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                                        {cat.icon}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{cat.subtitle}</p>
                                        <h2 className="text-3xl font-semibold tracking-tight">{cat.emoji} {cat.title}</h2>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <p className="text-3xl font-bold text-red-600">₹{cat.price}<span className="text-base text-slate-400 font-light"> / tag</span></p>
                                    <p className="text-sm font-light text-slate-400 max-w-xs text-right">{cat.desc}</p>
                                </div>
                            </div>

                            {/* Feature Tags */}
                            <div className="flex flex-wrap gap-3 mb-10">
                                {cat.tags.map((tag, i) => (
                                    <span key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-100 px-4 py-2 rounded-full">
                                        <CheckCircle className="w-3.5 h-3.5 text-green-500" /> {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Product Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                                {cat.products.map((product, j) => (
                                    <div key={j} className="shop-card bg-white rounded-2xl md:rounded-[2rem] overflow-hidden flex flex-col group">
                                        <div className="aspect-video overflow-hidden bg-slate-50 relative">
                                            <Image
                                                src={product.image}
                                                alt={product.name}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                                loading="lazy"
                                                quality={80}
                                            />
                                            <div className="absolute top-2 md:top-4 left-2 md:left-4 bg-white/90 backdrop-blur px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-bold text-slate-700 border border-white shadow-sm">
                                                No Sub
                                            </div>
                                            <div className="absolute top-2 md:top-4 right-2 md:right-4 bg-red-600 text-white px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-bold shadow-sm">
                                                ₹{cat.price}
                                            </div>
                                        </div>
                                        <div className="p-3 md:p-6 flex flex-col flex-1 gap-2 md:gap-4">
                                            <h3 className="text-xs md:text-base font-semibold leading-tight group-hover:text-red-600 transition-colors line-clamp-2">{product.name}</h3>
                                            <div className="mt-auto">
                                                <Link
                                                    href={`/shop/instant?category=${cat.id}&product=${encodeURIComponent(product.name)}`}
                                                    className="flex items-center justify-center gap-1.5 md:gap-2 w-full py-2.5 md:py-4 bg-[#1a1a1b] text-white rounded-xl md:rounded-2xl text-[10px] md:text-sm font-semibold hover:bg-red-600 transition-all group/btn"
                                                >
                                                    Kharido <ArrowRight className="w-3 h-3 md:w-4 md:h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredCategories.length === 0 && (
                        <div className="py-32 text-center space-y-4">
                            <p className="text-6xl">🔍</p>
                            <h3 className="text-2xl font-semibold text-slate-600">Koi product nahi mila</h3>
                            <p className="text-slate-400 font-light">Doosra keyword try karein</p>
                        </div>
                    )}
                </div>
            </main>

            {/* ── WHY Q-RAKSHA ──────────────────────────── */}
            <section className="py-20 bg-slate-50 border-y-2 border-slate-100">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="text-center mb-16 space-y-3">
                        <span className="text-red-600 font-bold text-xs uppercase tracking-widest">Kyun Khariden?</span>
                        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">Ek Tag, <span className="text-red-600 italic font-light">Hazaron Fayde.</span></h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: <Zap className="w-8 h-8 text-blue-500" />, bg: 'bg-blue-50', t: 'No App Required', d: 'Scanner ko kuch download nahi karna. Seedha camera se scan karo — sab kuch khul jaata hai.' },
                            { icon: <Lock className="w-8 h-8 text-emerald-500" />, bg: 'bg-emerald-50', t: 'Number Hamesha Safe', d: 'Aapka real mobile number kisi ko nahi dikhta. Privacy encrypted bridge ke zariye hai.' },
                            { icon: <Volume2 className="w-8 h-8 text-red-500" />, bg: 'bg-red-50', t: 'AI Authority Alert', d: 'Emergency mein SMS nahi — ek zordar AI Voice Call jaati hai jo family ignore nahi kar sakti.' },
                        ].map((b, i) => (
                            <div key={i} className="bg-white border-2 border-slate-100 rounded-[2rem] p-10 flex gap-6 hover:border-red-200 hover:shadow-lg transition-all group">
                                <div className={`${b.bg} w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0`}>{b.icon}</div>
                                <div className="space-y-2">
                                    <h4 className="text-xl font-semibold">{b.t}</h4>
                                    <p className="text-slate-500 font-light text-sm leading-relaxed">{b.d}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ────────────────────────────────────── */}
            <section className="py-20 bg-[#1a1a1b] text-white text-center">
                <div className="max-w-2xl mx-auto px-6 space-y-8">
                    <h2 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
                        Abhi Order Karein — <span className="text-red-500 italic font-light">Kal Safe Raho.</span>
                    </h2>
                    <p className="text-xl font-light text-white/40 leading-relaxed">
                        Gaon ho ya sheher, Q-Raksha har kisi ki zaroorat hai. Courier se ghar aayega.
                    </p>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="px-12 py-6 bg-red-600 text-white rounded-2xl font-semibold text-xl hover:bg-red-700 transition-all shadow-2xl shadow-red-500/20"
                    >
                        Pack Chunne Ke Liye Upar Jaayein ↑
                    </button>
                </div>
            </section>

            <Footer />
        </main>
    )
}
