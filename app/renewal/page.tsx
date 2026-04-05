'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
    QrCode, ArrowRight, Loader2, ShieldCheck, Zap, Phone, User, Mail, Clock, CheckCircle2, Calendar
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function RenewalPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><Loader2 className="animate-spin text-slate-400" /></div>}>
            <RenewalContent />
        </Suspense>
    )
}

function RenewalContent() {
    const searchParams = useSearchParams()
    const qr_id = searchParams.get('qr_id')
    const qr_number = searchParams.get('qr_number')

    const [loading, setLoading] = useState(false)
    const [selectedDays, setSelectedDays] = useState(365)
    const [customYears, setCustomYears] = useState<number | ''>('')
    const [isCustom, setIsCustom] = useState(false)
    const [form, setForm] = useState({ name: '', email: '', phone: '' })

    const BASE_YEARLY_PRICE = 299

    const PLANS = [
        { days: 365, label: '1 Year Protection', price: 299, icon: <ShieldCheck className="w-5 h-5" />, recommended: true }
    ]

    const activePrice = isCustom
        ? (Number(customYears) || 0) * BASE_YEARLY_PRICE
        : (PLANS.find(p => p.days === selectedDays)?.price || 0)

    const activeDays = isCustom ? (Number(customYears) || 0) * 365 : selectedDays

    async function handlePayment(isTesting = false) {
        if (activeDays <= 0) return toast.error('Please select or enter duration')
        if (!form.name || !form.email || !form.phone) return toast.error('Please fill all details')
        if (!/^\d{10}$/.test(form.phone)) return toast.error('Enter valid 10-digit phone number')

        setLoading(true)
        try {
            if (isTesting) {
                 // Fallback dev testing
                 window.location.href = `/renewal/success?qr_id=${qr_id}&days=${activeDays}`
                 return
            }

            const res = await fetch('/api/razorpay/create-renewal-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qr_id,
                    days: activeDays,
                    customer_name: form.name,
                    customer_email: form.email,
                    customer_phone: form.phone,
                    custom_amount: activePrice
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            await loadRazorpayScript()

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
                amount: data.amount * 100,
                currency: data.currency,
                name: "QRdigit Renewal",
                description: `Extend QR safety coverage by ${activeDays} days`,
                order_id: data.order_id, 
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch('/api/razorpay/verify-renewal', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                qr_id,
                                days: activeDays
                            })
                        });
                        const verifyData = await verifyRes.json();
                        
                        if (verifyRes.ok) {
                            window.location.href = `/renewal/success?qr_id=${qr_id}&days=${verifyData.days}&expiry=${verifyData.expiry}`
                        } else {
                            toast.error(verifyData.error || 'Payment verification failed');
                        }
                    } catch (e) {
                         toast.error('Payment verification failed');
                    }
                },
                prefill: {
                    name: data.customer_name,
                    email: data.customer_email,
                    contact: data.customer_phone
                },
                theme: {
                    color: "#0F172A" // slate-900 color for renewal page aesthetic
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any){
                 toast.error('Payment Failed: ' + response.error.description);
            });
            rzp.open();
        } catch (err: any) {
            toast.error(err.message || 'Payment failed')
        } finally {
            setLoading(false)
        }
    }

    function loadRazorpayScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof window !== 'undefined' && (window as any).Razorpay) { 
                resolve(); 
                return; 
            }
            
            const existingScript = document.querySelector('script[src*="razorpay"]');
            if (existingScript) { 
                const checkInterval = setInterval(() => {
                    if ((window as any).Razorpay) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                setTimeout(() => {
                    clearInterval(checkInterval);
                    reject(new Error('Razorpay load timeout'));
                }, 10000);
                return; 
            }

            const script = document.createElement('script')
            script.src = 'https://checkout.razorpay.com/v1/checkout.js'
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Razorpay load failed'))
            document.head.appendChild(script)
        })
    }

    if (!qr_id) return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-400 font-bold uppercase tracking-widest">QR ID Missing</div>

    return (
        <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4 md:p-10 font-sans" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <Toaster position="top-right" />

            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-[2rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-100">

                {/* Left side: Plan Selection */}
                <div className="p-8 md:p-12 bg-slate-50 border-r border-slate-100 space-y-8">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Pick Your Plan</h1>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Choose how long you want protection</p>
                    </div>

                    <div className="space-y-4">
                        {PLANS.map(plan => {
                            const active = selectedDays === plan.days && !isCustom;
                            return (
                                <button
                                    key={plan.days}
                                    onClick={() => { setSelectedDays(plan.days); setIsCustom(false); }}
                                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden
                                        ${active ? 'border-slate-800 bg-white shadow-xl scale-[1.02]' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white'}`}
                                >
                                    {plan.recommended && (
                                        <div className="absolute top-0 right-0 bg-slate-800 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                                            Most Popular
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${active ? 'bg-slate-800 text-white shadow-lg shadow-slate-200' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                            {plan.icon}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-xs font-bold uppercase tracking-tight ${active ? 'text-slate-800' : 'text-slate-400'}`}>{plan.label}</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-black text-slate-900">₹{plan.price}</span>
                                            </div>
                                        </div>
                                        {active && <CheckCircle2 className="w-5 h-5 text-slate-800" />}
                                    </div>
                                </button>
                            )
                        })}

                        {/* Custom Years Option */}
                        <div
                            className={`w-full p-5 rounded-2xl border-2 transition-all relative
                                ${isCustom ? 'border-slate-800 bg-white shadow-xl scale-[1.02]' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white'}`}
                            onClick={() => setIsCustom(true)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isCustom ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className={`text-xs font-bold uppercase tracking-tight ${isCustom ? 'text-slate-800' : 'text-slate-400'}`}>Custom Years Renewal</p>
                                    {isCustom ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="Qty"
                                                className="w-16 bg-white border-2 border-slate-300 rounded-lg px-2 py-1.5 text-sm font-black text-slate-900 outline-none focus:border-slate-800 transition-all placeholder:text-slate-400"
                                                value={customYears}
                                                onChange={e => setCustomYears(e.target.value === '' ? '' : parseInt(e.target.value))}
                                                autoFocus
                                            />
                                            <span className="text-xs font-black text-slate-700 uppercase tracking-tight">Years @ ₹299/yr</span>
                                        </div>
                                    ) : (
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">₹299 per year</div>
                                    )}
                                </div>
                                {isCustom && <CheckCircle2 className="w-5 h-5 text-slate-800" />}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200">
                        <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="text-left">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Bill</p>
                                <p className="text-3xl font-black text-slate-900 leading-none mt-1">₹{activePrice}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selected Term</p>
                                <p className="text-sm font-bold text-slate-600 truncate max-w-[100px] mt-1">
                                    {isCustom ? `${customYears || 0} Years` : (PLANS.find(p => p.days === selectedDays)?.label || 'None')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side: Contact & Pay */}
                <div className="p-8 md:p-12 space-y-10 flex flex-col justify-center">
                    <div className="space-y-2 text-center md:text-left">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Billing Info</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Identity: {qr_number || 'ST-QR-XYZ'}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input
                                type="text" placeholder="Owner Name"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4.5 pl-12 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-slate-800 transition-all placeholder:text-slate-300 shadow-sm"
                                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            />
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input
                                type="email" placeholder="Billing Email"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4.5 pl-12 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-slate-800 transition-all placeholder:text-slate-300 shadow-sm"
                                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            />
                        </div>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input
                                type="tel" placeholder="Phone Number" maxLength={10}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4.5 pl-12 pr-4 text-sm font-bold text-slate-800 outline-none focus:border-slate-800 transition-all placeholder:text-slate-300 shadow-sm"
                                value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <button
                            onClick={() => handlePayment(false)}
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-black text-white py-5.5 rounded-2xl font-black text-xs uppercase tracking-[0.25em] shadow-2xl shadow-slate-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 group grow-0"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Pay ₹{activePrice} & Reactivate <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                        </button>

                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Secured Payment Gateway</p>
                            {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
                                <button onClick={() => handlePayment(true)} className="text-[9px] font-black text-slate-400 underline hover:text-slate-600 block mx-auto pt-2">
                                    (Dev Bypass)
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
