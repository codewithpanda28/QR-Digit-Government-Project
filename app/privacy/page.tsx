'use client'

import React from 'react'
import { ShieldAlert, Lock, CheckCircle2, Siren } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <Navbar />

            <main className="pt-32 pb-40">
                <section className="max-w-[1000px] mx-auto px-6 mb-16 text-center">
                    <div className="inline-flex items-center gap-3 px-5 py-2 bg-red-600 text-white rounded-full shadow-lg mb-6">
                        <Siren className="w-5 h-5 animate-bounce" />
                        <span className="text-xs font-bold tracking-widest uppercase">QRdigit — India's #1 Safety QR</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-semibold leading-[1.05] tracking-tight mb-6">
                        Humari <span className="text-red-600 italic">Privacy Policy.</span>
                    </h1>
                    <p className="text-xl font-light text-slate-500">Aapka data sirf aur sirf aapki safety ke liye use hoga, aur kuch nahi.</p>
                </section>

                <section className="max-w-[1000px] mx-auto px-6 space-y-12">
                    <div className="bg-white border-2 border-slate-100 p-12 rounded-[3rem] shadow-sm space-y-8">
                        <div>
                            <h2 className="text-2xl font-semibold flex items-center gap-3 mb-4 text-slate-800">
                                <ShieldAlert className="w-6 h-6 text-red-600" />
                                1. Hum Kya Data Collect Karte Hain?
                            </h2>
                            <p className="text-slate-500 font-light leading-relaxed mb-4">
                                Jab aap QRdigit QR register karte ho, tab hum aapse sirf kuch basic details maangte hain jaise aapka naam, phone number aur blood group, taki emergency ke time par rescue possible ho sake.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex gap-3 text-slate-600 font-light"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Aapke emergency contacts (Bhai, dost, family)</li>
                                <li className="flex gap-3 text-slate-600 font-light"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Aadhaar/ID sirf user ki consent ke saath hi store hoti hai</li>
                                <li className="flex gap-3 text-slate-600 font-light"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Order place karte hue name, address, payment details</li>
                            </ul>
                        </div>

                        <div className="h-px bg-slate-100 w-full" />

                        <div>
                            <h2 className="text-2xl font-semibold flex items-center gap-3 mb-4 text-slate-800">
                                <Lock className="w-6 h-6 text-blue-600" />
                                2. Aapka Data Bilkul Safe Hai
                            </h2>
                            <p className="text-slate-500 font-light leading-relaxed mb-4">
                                Hum samajhte hain ki privacy kitni important hai. Isiliye kisi bhi third-party scanning app ko aapka real Phone Number nahi dikhta. Hum ek proxy cloud calling bridge use karte hain. Pura communication encrypted hai. Hum kabhi aapke personal data ko marketing ke liye sell ya share nahi karte.
                            </p>
                        </div>

                        <div className="h-px bg-slate-100 w-full" />

                        <div>
                            <h2 className="text-2xl font-semibold flex items-center gap-3 mb-4 text-slate-800">
                                <ShieldAlert className="w-6 h-6 text-orange-600" />
                                3. Data Deletion
                            </h2>
                            <p className="text-slate-500 font-light leading-relaxed mb-4">
                                Aap kisi bhi time apne dashboard se login karke saara data ek click mein delete kar sakte hain. Agar aapko system pasand na aaye aur apne QR ko cancel karna ho — toh backend database (Supabase) se immediately saara record flush ho jaata hai. Permanently.
                            </p>
                            <p className="text-slate-500 font-light leading-relaxed mt-4 italic text-sm font-semibold">
                                * Last Updated On: March 2026<br/>
                                Email for Data Queries: privacy@qraksha.in
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
