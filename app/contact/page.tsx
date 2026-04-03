'use client'

import React from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin, Search, MessageSquare, ArrowRight, ShieldCheck, Siren } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <Navbar />

            <main className="pt-32 pb-40">
                <section className="max-w-[1200px] mx-auto px-6 mb-24 text-center">
                     <div className="inline-flex items-center gap-3 px-5 py-2 bg-red-600 text-white rounded-full shadow-lg mb-6">
                         <Siren className="w-5 h-5 animate-bounce" />
                         <span className="text-xs font-bold tracking-widest uppercase">Q-Raksha — India's #1 Safety QR</span>
                     </div>
                    <h1 className="text-5xl md:text-7xl font-semibold leading-[1.05] tracking-tight mb-6">
                        Humse <span className="text-red-600 italic">Baat Karein.</span>
                    </h1>
                    <p className="text-xl font-light text-slate-500 max-w-2xl mx-auto">
                        Aapko madad chahiye ya koi sawaal pochhna hai? Humari Q-Raksha team aapko 24/7 support karne ke liye taiyaar hai.
                    </p>
                </section>

                <section className="max-w-[1000px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
                    {/* Block 1 */}
                    <div className="bg-white border-2 border-slate-100 p-10 rounded-[3rem] shadow-sm hover:border-red-200 transition-all flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-6">
                            <Phone className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">Call Ya WhatsApp</h2>
                        <p className="text-slate-500 font-light mb-6">Dophar 10 AM se lekar shaam 6 PM tak hum call aur chat par available hain.</p>
                        <a href="tel:+918252472186" className="bg-slate-50 border-2 border-slate-100 px-6 py-3 rounded-2xl font-bold text-lg text-slate-700 hover:text-red-600 hover:border-red-200 transition-all">
                            +91 8252472186
                        </a>
                    </div>
                    {/* Block 2 */}
                    <div className="bg-white border-2 border-slate-100 p-10 rounded-[3rem] shadow-sm hover:border-blue-200 transition-all flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6">
                            <Mail className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">Email Support</h2>
                        <p className="text-slate-500 font-light mb-6">Koi order issue ya custom requirement ho toh seedha mail likhein.</p>
                        <a href="mailto:contact@thinkaiq.com" className="bg-slate-50 border-2 border-slate-100 px-6 py-3 rounded-2xl font-bold text-lg text-slate-700 hover:text-blue-600 hover:border-blue-200 transition-all">
                            contact@thinkaiq.com
                        </a>
                    </div>
                </section>

                <section className="bg-white py-24 border-y-2 border-slate-100">
                    <div className="max-w-[1000px] mx-auto px-6">
                        <div className="bg-slate-50 border-2 border-slate-100 p-12 lg:p-16 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-12 group hover:border-red-200 transition-all">
                            <div className="space-y-4 max-w-sm text-center md:text-left">
                                <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center mx-auto md:mx-0">
                                    <MapPin className="w-8 h-8" />
                                </div>
                                <h3 className="text-3xl font-semibold">Humara Head Office</h3>
                                <p className="text-slate-500 leading-relaxed font-light">
                                    Q-Raksha Safety Systems<br />
                                    Dhanbad, Jharkhand, India - 828307<br />
                                    Aap chaho toh offline bhi aa sakte ho!
                                </p>
                            </div>
                            <div className="w-full md:w-1/2 min-h-[400px] bg-slate-200 rounded-[2rem] overflow-hidden shadow-inner flex items-center justify-center text-slate-400 font-bold border border-slate-300 group-hover:shadow-2xl transition-all">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d116843.43577742187!2d86.32624479904313!3d23.79153574246837!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f6bc97a96495cb%3A0xc39f977a45638c1a!2sDhanbad%2C%20Jharkhand!5e0!3m2!1sen!2sin!4v1711476722000!5m2!1sen!2sin"
                                    className="w-full h-full min-h-[400px]"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* <section className="max-w-[1000px] mx-auto px-6 pt-24 text-center">
                    <h3 className="text-3xl font-semibold mb-8">Apna Track Karein Ya Partner Banein</h3>
                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <Link href="/track" className="px-10 py-5 bg-white border-2 border-slate-200 rounded-2xl font-medium text-lg hover:border-red-500 hover:text-red-600 transition-all text-slate-700 flex items-center justify-center gap-3">
                            <Search className="w-5 h-5" /> Order Track Karein
                        </Link>
                        <Link href="/shop" className="px-10 py-5 bg-[#1a1a1b] text-white rounded-2xl font-semibold text-lg hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-3">
                            <ShieldCheck className="w-5 h-5" /> Q-Raksha Shop Menu
                        </Link>
                    </div>
                </section> */}
            </main>

            <Footer />
        </div>
    )
}
