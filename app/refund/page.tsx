'use client'

import React from 'react'
import { RotateCcw, Truck, CheckCircle2, Clock, Siren } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function RefundPolicyPage() {
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
                        Humari <span className="text-red-600 italic">Refund Policy.</span>
                    </h1>
                    <p className="text-xl font-light text-slate-500">Simple aur saaf, bina kisi tension ke.</p>
                </section>

                <section className="max-w-[1000px] mx-auto px-6 space-y-12">
                    <div className="bg-white border-2 border-slate-100 p-12 rounded-[3rem] shadow-sm space-y-8">
                        <div>
                            <h2 className="text-2xl font-semibold flex items-center gap-3 mb-4 text-slate-800">
                                <RotateCcw className="w-6 h-6 text-red-600" />
                                1. Refund Kis Condition Mein Milega?
                            </h2>
                            <p className="text-slate-500 font-light leading-relaxed mb-4">
                                Khareediye bilkul befikar hoke. Hum chahte hain aap QRdigit se khush rahein. Agar aapka order neeche di gayi conditions mein aata hai toh refund possible hai:
                            </p>
                            <ul className="space-y-3">
                                <li className="flex gap-3 text-slate-600 font-light"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> QR tag kharab/toota hua (Damaged) receive hua ho.</li>
                                <li className="flex gap-3 text-slate-600 font-light"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> QR tag scan na kar pa raha ho (Defective barcode/chip).</li>
                                <li className="flex gap-3 text-slate-600 font-light"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Order place hone ke baad bhi product dispatch nahi hua.</li>
                            </ul>
                            <p className="text-slate-500 font-light leading-relaxed mt-4">
                                Note: Physical QR Sticker ya tag agar chipakne ke baad aap nikaloge toh wo kharab (void) ho jayega. Us condition mein refund/return accept nahi kiya jayega.
                            </p>
                        </div>

                        <div className="h-px bg-slate-100 w-full" />

                        <div>
                            <h2 className="text-2xl font-semibold flex items-center gap-3 mb-4 text-slate-800">
                                <Clock className="w-6 h-6 text-blue-600" />
                                2. Kya Hai Timeline?
                            </h2>
                            <p className="text-slate-500 font-light leading-relaxed mb-4">
                                Order deliver hone ke <strong>3 din ke andar</strong> aapko refund request submit karni hogi. Uske baad system automatically request accept karna band kar dega kyunki tag service mein include ho chuka hoga.
                            </p>
                        </div>

                        <div className="h-px bg-slate-100 w-full" />

                        <div>
                            <h2 className="text-2xl font-semibold flex items-center gap-3 mb-4 text-slate-800">
                                <Truck className="w-6 h-6 text-orange-600" />
                                3. Refund Kaise Aayega?
                            </h2>
                            <p className="text-slate-500 font-light leading-relaxed mb-4">
                                Refund sirf original source a/c mein bheja jayega taaki payment gateway ke rules follow hon. Matlab agar payment UPI see kiya tha toh wahi ID mein refund deposit hoga. Proceed hone ke baad almost 5-7 working days lag sakte hain bank process mein.
                            </p>
                            <p className="text-slate-500 font-light leading-relaxed mt-4 italic text-sm font-semibold">
                                * Last Updated On: March 2026<br/>
                                Email for Returns: support@qraksha.in
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
