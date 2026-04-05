'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    QrCode, ArrowRight, Shield, Phone, MapPin, Zap, Bell,
    Navigation, Siren, Smartphone, Lock, Stethoscope, Camera,
    FileText, Baby, Dog, Car, Luggage, CheckCircle, ShoppingCart,
    AlertTriangle, Users, Star, Clock, Check, X
} from "lucide-react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

export default function HomePage() {
    const [selectedFeature, setSelectedFeature] = useState(0)

    return (
        <main className="min-h-screen bg-gray-50">
            <Navbar />

            {/* ============================================================
                HERO - Completely Different Layout
            ============================================================ */}
            <section className="relative bg-white pt-20">
                <div className="max-w-[1400px] mx-auto px-6 py-12">

                    {/* Top Banner */}


                    <div className="grid lg:grid-cols-2 gap-12 items-center">

                        {/* Left - Main Headline */}
                        <div>
                            <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-6 font-semibold text-sm">
                                🇮🇳 Made in India — Trusted by 50,000+ Families
                            </div>

                            <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight text-gray-900">
                                Kho Gaya?<br />
                                Mil Jayega! 🔍
                            </h1>

                            <p className="text-2xl text-slate-800 mb-8 font-medium">
                                Bacha, Gaadi, Pet ya Saman — kuch bhi kho jaaye,<br />
                                <span className="text-blue-600 font-bold">QR Scan = Instant Alert</span>
                            </p>

                            {/* Key Points with Icons */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="flex items-center gap-3 bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                                    <span className="font-semibold text-black">No App Required</span>
                                </div>
                                <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                                    <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                    <span className="font-semibold text-black">AI Voice Call</span>
                                </div>
                                <div className="flex items-center gap-3 bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                                    <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0" />
                                    <span className="font-semibold text-black">GPS Tracking</span>
                                </div>
                                <div className="flex items-center gap-3 bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                                    <CheckCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
                                    <span className="font-semibold text-black">100% Private</span>
                                </div>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex gap-4">
                                <Link href="/shop" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-lg font-bold text-lg flex items-center gap-2 shadow-lg">
                                    ₹299 Mein Order Karein
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link href="#demo" className="border-2 border-gray-300 hover:border-blue-600 px-8 py-4 rounded-lg font-bold text-lg text-gray-900">
                                    Demo Dekhein
                                </Link>
                            </div>

                            {/* Social Proof */}

                        </div>

                        {/* Right - Product Image with Floating Cards */}
                        <div className="relative">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                                <Image
                                    src="/products/hero.jpeg"
                                    alt="Q-Raksha Safety Tag"
                                    width={600}
                                    height={600}
                                    className="w-full h-auto"
                                    priority
                                />
                            </div>

                            {/* Floating Feature Cards */}
                            <div className="absolute -left-4 top-1/4 bg-white p-4 rounded-xl shadow-xl border-2 border-green-200 max-w-[200px]">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <span className="font-bold text-sm text-black">Tag Scanned</span>
                                </div>
                                <p className="text-xs text-slate-800">AI call jaati hai owner ko ✅</p>
                            </div>

                            <div className="absolute -right-4 top-1/2 bg-white p-4 rounded-xl shadow-xl border-2 border-blue-200 max-w-[200px]">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <span className="font-bold text-sm text-black">Live Location</span>
                                </div>
                                <p className="text-xs text-slate-800">GPS tracking active 📍</p>
                            </div>

                            <div className="absolute -left-4 bottom-1/4 bg-white p-4 rounded-xl shadow-xl border-2 border-orange-200 max-w-[200px]">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <span className="font-bold text-sm text-black">Privacy Safe</span>
                                </div>
                                <p className="text-xs text-slate-800">Number hidden rehta hai 🔒</p>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ============================================================
                PROBLEM - SOLUTION FORMAT
            ============================================================ */}
            <section className="py-16 bg-gradient-to-b from-red-50 to-white">
                <div className="max-w-6xl mx-auto px-6">

                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-black mb-4 text-gray-900">Ye Problems Aapko Bhi Hain? 🤔</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        {[
                            {
                                problem: "Mele mein bacha kho gaya",
                                icon: "😰",
                                image: "/products/child.jpeg"
                            },
                            {
                                problem: "Gaadi wrong parking kar di",
                                icon: "🚗",
                                image: "/products/car.jpeg"
                            },
                            {
                                problem: "Kutta ghar se bhaag gaya",
                                icon: "🐕",
                                image: "/products/pet.jpeg"
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-lg border-2 border-red-200">
                                <div className="relative h-48">
                                    <Image
                                        src={item.image}
                                        alt={item.problem}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm">
                                        ❌ Problem
                                    </div>
                                </div>
                                <div className="p-6">
                                    <p className="text-2xl mb-2">{item.icon}</p>
                                    <p className="text-xl font-bold text-gray-900">{item.problem}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Solution Arrow */}
                    <div className="text-center mb-12">
                        <div className="inline-block bg-green-500 text-white px-8 py-4 rounded-full font-bold text-xl">
                            ✅ Ab Solution Mil Gaya! 👇
                        </div>
                    </div>

                    {/* How QRdigit Solves */}
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 md:p-12 border-2 border-green-200">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div>
                                <h3 className="text-3xl font-black mb-6 text-gray-900">Q-Raksha Se Ye Hota Hai:</h3>
                                <div className="space-y-4">
                                    {[
                                        "Koi bhi QR scan kare → Aapko turant AI call",
                                        "Live GPS location share automatically",
                                        "Scanner ka naam/number aapko dikhega",
                                        "Emergency SOS button se instant help",
                                        "Aapka number kabhi leak nahi hoga"
                                    ].map((point, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <div className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                <Check className="w-4 h-4" />
                                            </div>
                                            <p className="text-lg font-semibold text-black">{point}</p>
                                        </div>
                                    ))}
                                </div>
                                <Link href="/shop" className="inline-block mt-6 bg-orange-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-orange-700">
                                    Abhi Order Karein →
                                </Link>
                            </div>
                            <div className="relative">
                                <Image
                                    src="/products/hero.jpeg"
                                    alt="Solution"
                                    width={400}
                                    height={400}
                                    className="rounded-xl shadow-2xl"
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* ============================================================
                PRODUCT CATEGORIES - Image Grid Style
            ============================================================ */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-6">

                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-black mb-4 text-gray-900">Kiske Liye Chahiye? 🎯</h2>
                        <p className="text-xl text-gray-600">Apni situation choose karein</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                title: "Bachon Ki Safety",
                                price: "₹299",
                                image: "/products/child.jpeg",
                                situations: ["Mele mein", "School mein", "Park mein"],
                                link: "Child Safety"
                            },
                            {
                                title: "Car & Bike",
                                price: "₹299",
                                image: "/products/car.jpeg",
                                situations: ["Wrong parking", "Accident", "Chori"],
                                link: "Car & Bikes"
                            },
                            {
                                title: "Pets & Animals",
                                price: "₹299",
                                image: "/products/pet.jpeg",
                                situations: ["Kho jaaye", "Bhaag jaaye", "Mil jaaye"],
                                link: "Pets & Animals"
                            },
                            {
                                title: "Travel Bag",
                                price: "₹299",
                                image: "/products/luggage.jpeg",
                                situations: ["Airport", "Bus stand", "Train"],
                                link: "Travel & Luggage"
                            },
                            {
                                title: "Home Doorbell",
                                price: "₹299",
                                image: "/products/doorbell.jpeg",
                                situations: ["Guest aaye", "Delivery", "Alert"],
                                link: "Home & Doorbell"
                            },
                            {
                                title: "Bike Helmet",
                                price: "₹299",
                                image: "/products/Bike.jpeg",
                                situations: ["Accident", "Emergency", "Tracking"],
                                link: "Bike Safety"
                            }
                        ].map((product, idx) => (
                            <div key={idx} className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border-2 border-gray-100 hover:border-blue-500">

                                {/* Image Section */}
                                <div className="relative h-64 overflow-hidden">
                                    <Image
                                        src={product.image}
                                        alt={product.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    {/* Price Tag */}
                                    <div className="absolute top-4 right-4 bg-orange-600 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                                        {product.price}
                                    </div>
                                    {/* Overlay on Hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>

                                {/* Content Section */}
                                <div className="p-6">
                                    <h3 className="text-2xl font-bold mb-3 text-gray-900">
                                        {product.title}
                                    </h3>

                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-gray-600 mb-2">Perfect For:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {product.situations.map((sit, i) => (
                                                <span key={i} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                                                    {sit}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <Link
                                        href={`/shop/instant?product=${encodeURIComponent(product.link)}`}
                                        className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-bold transition-colors"
                                    >
                                        Order Now →
                                    </Link>
                                </div>

                                {/* Quick Info Badge */}
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-900">
                                    ⚡ 2-Day Delivery
                                </div>

                            </div>
                        ))}
                    </div>

                </div>
            </section>

            {/* ============================================================
                HOW IT WORKS - Row Layout
            ============================================================ */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6">

                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black mb-4 text-gray-900">Kaise Kaam Karta Hai? ⚙️</h2>
                        <p className="text-xl text-slate-700">Bahut simple 4-step process</p>
                    </div>

                    {/* Steps - Row Layout */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                step: "1",
                                title: "Order Karein",
                                desc: "Apni zaroorat ke hisaab se product select karke order place karein. Free delivery milegi.",
                                icon: <ShoppingCart className="w-10 h-10" />
                            },
                            {
                                step: "2",
                                title: "QR Scan Karein",
                                desc: "Delivery ke baad apne phone se QR code scan karein. Automatic account ban jaayega.",
                                icon: <QrCode className="w-10 h-10" />
                            },
                            {
                                step: "3",
                                title: "Details Fill Karein",
                                desc: "Naam aur 3 emergency contacts add karein (Papa, Mummy, Bhai). Bas 2 minute ka kaam.",
                                icon: <FileText className="w-10 h-10" />
                            },
                            {
                                step: "4",
                                title: "Chipka Dein",
                                desc: "Sticker ko sahi jagah par chipka do aur tension-free ho jaao! Ab aap protected hain ✅",
                                icon: <Shield className="w-10 h-10" />
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent hover:border-blue-500 transition-all flex flex-col items-center text-center relative overflow-hidden group">
                                <div className="absolute -right-4 -top-6 text-9xl font-black text-gray-50 group-hover:text-blue-50 transition-colors z-0 select-none">
                                    {item.step}
                                </div>
                                <div className="bg-blue-50 text-blue-600 w-20 h-20 rounded-full flex items-center justify-center shadow-sm mb-6 relative z-10 group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <h3 className="text-2xl font-black text-black mb-4 relative z-10">{item.title}</h3>
                                <p className="text-base text-slate-700 leading-relaxed relative z-10">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                </div>
            </section>

            {/* ============================================================
                FEATURES - Interactive Tabs
            ============================================================ */}
            <section className="py-16 bg-white" id="demo">
                <div className="max-w-6xl mx-auto px-6">

                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-black mb-4 text-gray-900">Scan Karne Par Kya Milta Hai? 📱</h2>
                        <p className="text-xl text-slate-700">5 powerful features ek saath</p>
                    </div>

                    {/* Feature Tabs */}
                    <div className="flex overflow-x-auto gap-3 mb-8 pb-4">
                        {[
                            { name: "🆘 SOS Alert", icon: <AlertTriangle className="w-5 h-5 hidden md:block" />, color: "red" },
                            { name: "📍 GPS Location", icon: <MapPin className="w-5 h-5 hidden md:block" />, color: "blue" },
                            { name: "🏥 Hospital List", icon: <Stethoscope className="w-5 h-5 hidden md:block" />, color: "green" },
                            { name: "🚓 Police Help", icon: <Siren className="w-5 h-5 hidden md:block" />, color: "orange" },
                            { name: "📷 Evidence Record", icon: <Camera className="w-5 h-5 hidden md:block" />, color: "purple" }
                        ].map((feature, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedFeature(idx)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold whitespace-nowrap transition-all ${selectedFeature === idx
                                    ? feature.color === 'red' ? 'bg-red-600 text-white shadow-lg scale-105'
                                        : feature.color === 'blue' ? 'bg-blue-600 text-white shadow-lg scale-105'
                                            : feature.color === 'green' ? 'bg-green-600 text-white shadow-lg scale-105'
                                                : feature.color === 'orange' ? 'bg-orange-600 text-white shadow-lg scale-105'
                                                    : 'bg-purple-600 text-white shadow-lg scale-105'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {feature.icon}
                                {feature.name}
                            </button>
                        ))}
                    </div>

                    {/* Feature Content */}
                    <div className="w-full">
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 md:p-12 border-2 border-blue-200 shadow-xl relative overflow-hidden">
                            {/* Decorative blur */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-3xl -mr-20 -mt-20"></div>

                            <div className="text-center md:text-left relative z-10 mb-10">
                                <h3 className="text-3xl md:text-4xl font-black mb-4 text-gray-900">
                                    {["Emergency SOS", "Live GPS Tracking", "Nearby Hospitals", "Police/Fire Help", "Photo/Audio Record"][selectedFeature]}
                                </h3>
                                <p className="text-lg md:text-xl text-slate-800 leading-relaxed max-w-3xl">
                                    {[
                                        "Koi emergency mein hai? Ek button press karo aur family ko AI voice call jaayegi. Location bhi automatic share.",
                                        "Exact location turant WhatsApp par share hoti hai. Google Maps link se directly navigation start kar sakte ho.",
                                        "Paas ke hospitals, ambulance, blood banks ki list. Direct call karke help le sakte ho.",
                                        "100, 112 helpline ya najdeeki police/fire station ko turant call. Location automatic share.",
                                        "Emergency mein photo ya audio record karke cloud par save. Baad mein proof ke kaam aayega."
                                    ][selectedFeature]}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                                {[
                                    ["Button press → AI call", "GPS share → WhatsApp link", "Hospital search → Direct call", "Emergency dial → Location share"],
                                    ["QR scan → Location detect", "WhatsApp → Maps link", "Real-time → Live tracking", "Dashboard → History"],
                                    ["5km radius → Search", "List → Distance sorted", "One tap → Call connect", "Ambulance → Blood bank"],
                                    ["100/112 → Quick dial", "GPS → Auto share", "Nearest → Station list", "Direct → Call connection"],
                                    ["Camera → Photo click", "Audio → Recording", "Cloud → Auto save", "Dashboard → View all"]
                                ][selectedFeature].map((step, i) => (
                                    <div key={i} className="flex flex-col gap-3 bg-white hover:bg-blue-50 transition-all rounded-xl p-6 shadow-md border-2 border-transparent hover:border-blue-200 hover:shadow-lg group cursor-default">
                                        <div className="bg-blue-100 group-hover:bg-blue-600 text-blue-600 group-hover:text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-black shrink-0 transition-colors shadow-sm">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg text-black transition-colors leading-tight">{step.split(' → ')[0]}</div>
                                            <div className="text-sm text-slate-600 font-semibold mt-2">→ {step.split(' → ')[1]}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* ============================================================
                TESTIMONIALS - Real Stories
            ============================================================ */}
            <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
                <div className="max-w-6xl mx-auto px-6">

                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-black mb-4 text-gray-900">Real Stories 💬</h2>
                        <p className="text-xl text-gray-600">Logo ne kaise use kiya</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                name: "Rajesh Kumar",
                                location: "Delhi",
                                story: "Mele mein bacha kho gaya tha. Kisine ID card scan kiya aur 5 minute mein mil gaya!",
                                rating: 5,
                                image: "/products/child.jpeg"
                            },
                            {
                                name: "Priya Sharma",
                                location: "Mumbai",
                                story: "Wrong parking kar di thi. Police ne scan kiya aur call kiya. Challan se bach gayi!",
                                rating: 5,
                                image: "/products/car.jpeg"
                            },
                            {
                                name: "Amit Patel",
                                location: "Ahmedabad",
                                story: "Kutta bhaag gaya tha. 2 din baad kisine collar scan kiya. Mil gaya!",
                                rating: 5,
                                image: "/products/pet.jpeg"
                            }
                        ].map((testimonial, idx) => (
                            <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-gray-100">
                                <div className="relative h-48">
                                    <Image
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-1 mb-3">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="text-slate-800 mb-4 italic">"{testimonial.story}"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full"></div>
                                        <div>
                                            <p className="font-bold text-gray-900">{testimonial.name}</p>
                                            <p className="text-sm text-gray-500">{testimonial.location}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </section>

            {/* ============================================================
                COMPARISON TABLE
            ============================================================ */}
            <section className="py-16 bg-white">
                <div className="max-w-5xl mx-auto px-6">

                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-black mb-4 text-gray-900">Doosron Se Kyun Better? 🏆</h2>
                    </div>

                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-200">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left font-bold">Feature</th>
                                    <th className="px-6 py-4 text-center font-bold">Others</th>
                                    <th className="px-6 py-4 text-center font-bold bg-orange-600">QRdigit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {[
                                    { feature: "App Download", others: "Required ❌", qraksha: "Not Required ✅" },
                                    { feature: "Privacy", others: "Number Visible ❌", qraksha: "100% Hidden ✅" },
                                    { feature: "Alert Type", others: "SMS Only ❌", qraksha: "AI Voice Call ✅" },
                                    { feature: "GPS Tracking", others: "Manual ❌", qraksha: "Automatic ✅" },
                                    { feature: "Cost", others: "Monthly Fee ❌", qraksha: "One-time ✅" },
                                ].map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-semibold text-black">{row.feature}</td>
                                        <td className="px-6 py-4 text-center text-slate-800">{row.others}</td>
                                        <td className="px-6 py-4 text-center font-bold text-green-600 bg-green-50">{row.qraksha}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            </section>


            <Footer />
        </main>
    )
}