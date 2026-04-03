'use client'

import React from 'react'
import { FileText, CheckCircle2, Siren } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function TermsPage() {
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
                        Hamaare <span className="text-red-600 italic">Rules & Terms.</span>
                    </h1>
                    <p className="text-xl font-light text-slate-500">Service use karne se pehle zaroor padhein.</p>
                </section>

                <section className="max-w-[1000px] mx-auto px-6 space-y-12">
                    <div className="bg-white border-2 border-slate-100 p-12 rounded-[3rem] shadow-sm space-y-8">
                        <div>
                            <h2 className="text-2xl font-semibold flex items-center gap-3 mb-4 text-slate-800">
                                <span className="text-red-600 font-bold text-3xl">1.</span>
                                Acceptable Use Policy
                            </h2>
                            <p className="text-slate-500 font-light leading-relaxed mb-4">
                                Aap QRdigit ke QR Code tags sirf legal aur safety purposes ke liye use kar sakte hain. Aap in QR tags ko kisi galat maqsad (illegal activity) ke liye istemal nahi kar sakte hain. Aisa karne par aapka account aur access turant ban kar diya jaayega.
                            </p>
                        </div>

                        <div className="h-px bg-slate-100 w-full" />

                        <div>
                            <h2 className="text-2xl font-semibold flex items-center gap-3 mb-4 text-slate-800">
                                <span className="text-blue-600 font-bold text-3xl">2.</span>
                                User Information Accuracy
                            </h2>
                            <p className="text-slate-500 font-light leading-relaxed mb-4">
                                Account setup karte time, whatever data you provide (Jaise family contact numbers, aapka naam aur address), aapki responsibility hai ki wo 100% correct ho. Agar emergency ke time numbers wrong hote hain toh system aapki proper help nahi kar payega. Saari detail aap dashboard se verify zaroor karein.
                            </p>
                        </div>

                        <div className="h-px bg-slate-100 w-full" />

                        <div>
                            <h2 className="text-2xl font-semibold flex items-center gap-3 mb-4 text-slate-800">
                                <span className="text-orange-600 font-bold text-3xl">3.</span>
                                Availability of Service
                            </h2>
                            <p className="text-slate-500 font-light leading-relaxed mb-4">
                                Hum koshish karenge ki QRdigit server 99.9% up-time par rahe. Phir bhi, network problems ya kisi anadekhi technical dikkat ki wajah se SOS notifications aur alerts aane-jaane mein kuch seconds lag sakte hain. System puri tarah online infrastructure par nirbhar hai.
                            </p>
                        </div>

                        <div className="h-px bg-slate-100 w-full" />

                        <div>
                            <h2 className="text-2xl font-semibold flex items-center gap-3 mb-4 text-slate-800">
                                <span className="text-emerald-600 font-bold text-3xl">4.</span>
                                Liability Disclaimer
                            </h2>
                            <p className="text-slate-500 font-light leading-relaxed mb-4">
                                QRdigit ek notification aur alert tool hai, medical ya police equivalent nahi hai. Incident ke samay hum alert aur GPS information share karte hain par on-ground recovery local authorities par based hai. Hum har emergency ko physically rokne ka dawa nahi karte, balki time par proper information deliver karte hain.
                            </p>
                            <p className="text-slate-500 font-light leading-relaxed mt-4 italic text-sm font-semibold">
                                * Last Updated On: March 2026<br/>
                                In case of disputes, local jurisdiction (Jharkhand) will be applied. Email: legal@qrdigit.com
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
