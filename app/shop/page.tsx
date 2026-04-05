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
        <main className="min-h-screen bg-gray-50">
            <style>{`
                .shop-card {
                    background: white;
                    border: 2px solid #E5E7EB;
                    transition: all 0.3s ease;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .shop-card:hover {
                    border-color: #EF4444;
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px rgba(0,0,0,0.1);
                }
                .cat-pill { transition: all 0.2s; }
                .cat-pill:hover { transform: translateY(-2px); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <Navbar />

            {/* ── HERO ── */}
            <section className="bg-white pt-20 border-b border-gray-100">
                <div className="max-w-[1400px] mx-auto px-6 py-14 text-center">
                    <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-6 font-semibold text-sm">
                        🇮🇳 Made in India — Trusted by 50,000+ Families
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight mb-6">
                        Apna Safety Pack <span className="text-red-600">Chuniye.</span>
                    </h1>

                    <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-8">
                        Ek baar kharido, hamesha protect raho. Physical QR tag courier se ghar aayega — sirf <strong className="text-gray-800">3-5 din</strong> mein.
                    </p>

                    {/* Trust badges */}
                    <div className="flex flex-wrap justify-center gap-3">
                        {[
                            { icon: '🚚', text: 'Free Delivery 3-5 Days' },
                            { icon: '🔒', text: 'Secure Payment' },
                            { icon: '📦', text: 'Physical QR Tag' },
                            { icon: '⚡', text: 'Lifetime Access' },
                        ].map((b, i) => (
                            <span key={i} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-4 py-2.5 rounded-full">
                                {b.icon} {b.text}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CATEGORY FILTER ── */}
            <section className="bg-white border-b border-gray-200 sticky top-[80px] z-40 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
                        <button
                            onClick={() => setActiveCategory(null)}
                            className={`cat-pill whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold border-2 flex-shrink-0 ${!activeCategory ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}
                        >
                            🛡️ Sabhi Packs
                        </button>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                                className={`cat-pill whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold border-2 flex items-center gap-2 flex-shrink-0 ${activeCategory === cat.id ? cat.color + ' text-white border-transparent shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}
                            >
                                {cat.emoji} {cat.title}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Search */}
            <div className="max-w-[600px] mx-auto px-6 py-6">
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search karo — Car, Kids, Medical..."
                        className="w-full pl-14 pr-6 py-4 bg-white border-2 border-gray-200 rounded-2xl text-base font-medium focus:border-red-500 outline-none transition-all"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* ── PRODUCTS ── */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-[1400px] mx-auto px-6 space-y-20">
                    {filteredCategories.map((cat) => (
                        <div key={cat.id} id={cat.id} className="scroll-mt-32">
                            {/* Category Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b-2 border-gray-200">
                                <div className="flex items-center gap-5">
                                    <div className={`${cat.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                                        {cat.icon}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{cat.subtitle}</p>
                                        <h2 className="text-3xl font-black text-gray-900">{cat.emoji} {cat.title}</h2>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black text-red-600">₹{cat.price}<span className="text-base text-gray-400 font-normal"> / tag</span></p>
                                    <p className="text-sm text-gray-400 max-w-xs">{cat.desc}</p>
                                </div>
                            </div>

                            {/* Feature Tags */}
                            <div className="flex flex-wrap gap-2 mb-8">
                                {cat.tags.map((tag, i) => (
                                    <span key={i} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 px-4 py-1.5 rounded-full">
                                        <CheckCircle className="w-3.5 h-3.5 text-green-500" /> {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Product Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {cat.products.map((product, j) => (
                                    <div key={j} className="shop-card rounded-2xl overflow-hidden flex flex-col group">
                                        <div className="aspect-video overflow-hidden bg-gray-100 relative">
                                            <div className="absolute inset-0 bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-wider">
                                                Image Space
                                            </div>
                                            <div className="absolute top-3 left-3 bg-green-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black">
                                                In Stock
                                            </div>
                                            <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-sm">
                                                ₹{cat.price}
                                            </div>
                                        </div>
                                        <div className="p-5 flex flex-col flex-1 gap-4">
                                            <h3 className="text-base font-black text-gray-900 leading-tight group-hover:text-red-600 transition-colors">{product.name}</h3>
                                            <div className="mt-auto">
                                                <Link
                                                    href={`/shop/instant?category=${cat.id}&product=${encodeURIComponent(product.name)}`}
                                                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-gray-900 text-white rounded-xl text-sm font-black hover:bg-red-600 transition-all group/btn"
                                                >
                                                    Abhi Kharido <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
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
                            <h3 className="text-2xl font-black text-gray-600">Koi product nahi mila</h3>
                            <p className="text-gray-400">Doosra keyword try karein</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ── WHY QRDIGIT ── */}
            <section className="bg-white py-20 border-t border-gray-100">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="text-center mb-14">
                        <div className="inline-block bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-bold text-sm mb-4">💡 Kyun Khariden?</div>
                        <h2 className="text-4xl lg:text-5xl font-black text-gray-900">Ek Tag, <span className="text-red-600">Hazaron Fayde.</span></h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: <Zap className="w-8 h-8 text-blue-600" />, bg: 'bg-blue-50', border: 'hover:border-blue-200', t: 'No App Required', d: 'Scanner ko kuch download nahi karna. Seedha camera se scan karo — sab kuch khul jaata hai.' },
                            { icon: <Lock className="w-8 h-8 text-emerald-600" />, bg: 'bg-emerald-50', border: 'hover:border-emerald-200', t: 'Number Hamesha Safe', d: 'Aapka real mobile number kisi ko nahi dikhta. Privacy encrypted bridge ke zariye protected hai.' },
                            { icon: <Volume2 className="w-8 h-8 text-red-600" />, bg: 'bg-red-50', border: 'hover:border-red-200', t: 'AI Authority Alert', d: 'Emergency mein SMS nahi — ek zordar AI Voice Call jaati hai jo family ignore nahi kar sakti.' },
                        ].map((b, i) => (
                            <div key={i} className={`bg-white border-2 border-gray-100 ${b.border} rounded-2xl p-8 flex gap-5 hover:shadow-lg transition-all group`}>
                                <div className={`${b.bg} w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>{b.icon}</div>
                                <div>
                                    <h4 className="text-xl font-black text-gray-900 mb-2">{b.t}</h4>
                                    <p className="text-gray-500 text-sm leading-relaxed">{b.d}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="bg-gray-900 py-24">
                <div className="max-w-[1400px] mx-auto px-6 text-center">
                    <div className="flex gap-2 justify-center mb-8">
                        <div className="h-1.5 w-10 rounded-full bg-[#FF9933]" />
                        <div className="h-1.5 w-10 rounded-full bg-white/30" />
                        <div className="h-1.5 w-10 rounded-full bg-[#138808]" />
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
                        Abhi Order Karein — <span className="text-red-500">Kal Safe Raho.</span>
                    </h2>
                    <p className="text-gray-400 text-xl mb-10 max-w-xl mx-auto">
                        Gaon ho ya sheher, QRdigit har kisi ki zaroorat hai. Courier se ghar aayega.
                    </p>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="px-12 py-5 bg-red-600 text-white rounded-xl font-black text-xl hover:bg-red-700 transition-all shadow-xl hover:scale-105"
                    >
                        Pack Chunne Ke Liye Upar Jaayein ↑
                    </button>
                </div>
            </section>

            <Footer />
        </main>
    )
}
