'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    QrCode, Shield, CheckCircle, ArrowRight, Download,
    Zap, Loader2, Share2, Printer, Smartphone,
    ChevronLeft, MapPin, User, Phone, Mail, Home, Building2, Hash, Package, CreditCard, Lock, Truck
} from 'lucide-react'
import QRCode from 'react-qr-code'
import toast, { Toaster } from 'react-hot-toast'

const CATEGORY_PRICES: Record<string, number> = {
    'vehicle': 299,
    'family': 299,
    'medical': 299,
    'assets': 299,
    'pets': 299,
    'travel': 299,
    'home': 299
}

const INDIA_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh'
]

function InstantContent() {
    const searchParams = useSearchParams()

    const categoryName = searchParams.get('category') || 'vehicle'
    const productName = searchParams.get('product') || 'QRdigit Safety Tag'
    const isSuccess = searchParams.get('success') === 'true'

    const [step, setStep] = useState<'personal' | 'delivery' | 'review' | 'paying' | 'done'>(
        isSuccess ? 'paying' : 'personal'
    )
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    const unitPrice = CATEGORY_PRICES[categoryName.toLowerCase()] || 299

    const [form, setForm] = useState({
        // Personal
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        // Delivery
        delivery_address: '',
        delivery_city: '',
        delivery_state: '',
        delivery_pincode: '',
        quantity: 1,
    })

    useEffect(() => { setMounted(true) }, [])

    // Auto-advance on payment success
    useEffect(() => {
        if (!isSuccess) return
        const timer = setTimeout(() => setStep('done'), 3000)
        return () => clearTimeout(timer)
    }, [isSuccess])

    const totalAmount = unitPrice * form.quantity

    function loadRazorpayScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            if ((window as any).Razorpay) { resolve(); return }
            if (document.querySelector('script[src*="razorpay"]')) { resolve(); return }
            const script = document.createElement('script')
            script.src = 'https://checkout.razorpay.com/v1/checkout.js'
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Razorpay load failed'))
            document.head.appendChild(script)
        })
    }

    async function handlePayment(isTesting = false) {
        setLoading(true)
        try {
            if (isTesting) {
                setStep('done')
                toast.success('Test mode — Order saved! ✅')
                setLoading(false)
                return
            }

            const res = await fetch('/api/razorpay/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: categoryName,
                    product_name: productName,
                    customer_name: form.customer_name,
                    customer_email: form.customer_email,
                    customer_phone: form.customer_phone,
                    delivery_address: form.delivery_address,
                    delivery_city: form.delivery_city,
                    delivery_state: form.delivery_state,
                    delivery_pincode: form.delivery_pincode,
                    quantity: form.quantity,
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            await loadRazorpayScript()

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
                amount: data.amount * 100,
                currency: data.currency,
                name: "QRdigit",
                description: `Purchase ${productName}`,
                order_id: data.order_id, 
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch('/api/razorpay/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                category: categoryName,
                                product: productName
                            })
                        });
                        const verifyData = await verifyRes.json();
                        
                        if (verifyRes.ok) {
                            setStep('done');
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
                    color: "#DC2626"
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

    // ─── PROGRESS BAR ───────────────────────────────────────────────────────────
    const steps = [
        { id: 'personal', label: 'Aapki Details' },
        { id: 'delivery', label: 'Delivery Address' },
        { id: 'review', label: 'Review & Pay' },
    ]
    const stepIndex = { personal: 0, delivery: 1, review: 2, paying: 3, done: 3 }

    // ─── DONE STATE ─────────────────────────────────────────────────────────────
    if (step === 'done' || isSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
                <div className="max-w-lg w-full bg-white rounded-[2.5rem] shadow-2xl border border-green-100 p-12 text-center space-y-8">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-500/30">
                        <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-slate-800">Order Place Ho Gaya! 🎉</h2>
                        <p className="text-slate-500 font-light text-lg leading-relaxed">
                            <strong>{form.customer_name || 'Aapka'}</strong> order confirm ho gaya hai.<br />
                            QRdigit QR Tag 3-5 working days mein courier ke through aapke address par pahuch jaayega.
                        </p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-3 border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order Summary</p>
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-slate-600">Product</span>
                            <span className="text-slate-800">{productName} × {form.quantity}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-slate-600">Total Paid</span>
                            <span className="text-green-600 font-bold">₹{totalAmount}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-slate-600">Delivery To</span>
                            <span className="text-slate-800 text-right max-w-[200px]">{form.delivery_city}, {form.delivery_state} - {form.delivery_pincode}</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 font-light">
                        📧 Confirmation email <strong>{form.customer_email}</strong> par bhej diya gaya hai.
                    </p>
                    <Link href="/" className="block w-full py-5 bg-red-600 text-white rounded-2xl font-semibold text-lg hover:bg-red-700 transition-all">
                        Homepage Par Jaayein →
                    </Link>
                </div>
            </div>
        )
    }

    // ─── MAIN FORM ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F5F7FA]" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');`}</style>
            <Toaster position="top-center" />

            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4">
                <Link href="/shop" className="flex items-center gap-2 text-slate-400 hover:text-red-600 transition-colors text-sm font-medium">
                    <ChevronLeft className="w-5 h-5" /> Shop
                </Link>
                <div className="h-4 w-px bg-slate-200"></div>
                <span className="text-sm font-medium text-slate-600">{productName}</span>
                <div className="ml-auto flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                    <Lock className="w-3 h-3" /> Secure Checkout
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: FORM */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Progress */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-0">
                            {steps.map((s, i) => (
                                <React.Fragment key={s.id}>
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${stepIndex[step] > i ? 'bg-green-500 text-white' :
                                            stepIndex[step] === i ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' :
                                                'bg-slate-100 text-slate-400'
                                            }`}>
                                            {stepIndex[step] > i ? <CheckCircle className="w-4 h-4" /> : i + 1}
                                        </div>
                                        <span className={`text-[10px] font-semibold whitespace-nowrap ${stepIndex[step] === i ? 'text-red-600' : 'text-slate-400'}`}>{s.label}</span>
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${stepIndex[step] > i ? 'bg-green-500' : 'bg-slate-100'}`}></div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* STEP 1: PERSONAL DETAILS */}
                    {step === 'personal' && (
                        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600"><User className="w-5 h-5" /></div>
                                <div>
                                    <h2 className="text-xl text-gray-900 font-semibold">Aapki Personal Details</h2>
                                    <p className="text-sm text-slate-400 font-light">Order confirmation aur delivery tracking ke liye</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="sm:col-span-2 space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pura Naam *</label>
                                    <input
                                        type="text" placeholder="Jaise: Akash Kumar"
                                        value={form.customer_name}
                                        onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-base font-medium focus:border-red-500 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address *</label>
                                    <input
                                        type="email" placeholder="aap@email.com"
                                        value={form.customer_email}
                                        onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-base font-medium focus:border-red-500 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">WhatsApp Number *</label>
                                    <div className="flex bg-slate-50 border-2 border-slate-100 rounded-2xl overflow-hidden focus-within:border-red-500 transition-all">
                                        <span className="flex items-center px-4 text-sm font-bold text-slate-500 bg-slate-100 border-r border-slate-200">🇮🇳 +91</span>
                                        <input
                                            type="tel" placeholder="10-digit number"
                                            maxLength={10}
                                            value={form.customer_phone}
                                            onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value.replace(/\D/g, '') }))}
                                            className="flex-1 px-5 py-4 bg-transparent text-base font-medium outline-none text-slate-900 placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    if (!form.customer_name || !form.customer_email || !form.customer_phone) {
                                        toast.error('Sabhi zaroori fields fill karein')
                                        return
                                    }
                                    if (!/^\d{10}$/.test(form.customer_phone)) {
                                        toast.error('Valid 10-digit phone number daalein')
                                        return
                                    }
                                    setStep('delivery')
                                }}
                                className="w-full py-5 bg-red-600 text-white rounded-2xl font-semibold text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-3"
                            >
                                Aage Badho — Delivery Details <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* STEP 2: DELIVERY ADDRESS */}
                    {step === 'delivery' && (
                        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Truck className="w-5 h-5" /></div>
                                <div>
                                    <h2 className="text-xl font-semibold">Delivery Address</h2>
                                    <p className="text-sm text-slate-400 font-light">QRdigit tag courier se is address par aayega</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="sm:col-span-2 space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ghar / Flat / Street Address *</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Jaise: 12/A, Raj Nagar, Near City Mall..."
                                        value={form.delivery_address}
                                        onChange={e => setForm(f => ({ ...f, delivery_address: e.target.value }))}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-base font-medium focus:border-blue-500 outline-none transition-all resize-none text-slate-900 placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Shehar (City) *</label>
                                    <input
                                        type="text" placeholder="Jaise: Lucknow"
                                        value={form.delivery_city}
                                        onChange={e => setForm(f => ({ ...f, delivery_city: e.target.value }))}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-base font-medium focus:border-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">State *</label>
                                    <select
                                        value={form.delivery_state}
                                        onChange={e => setForm(f => ({ ...f, delivery_state: e.target.value }))}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-base font-medium focus:border-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                    >
                                        <option value="">State chunein...</option>
                                        {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">PIN Code *</label>
                                    <input
                                        type="text" placeholder="Jaise: 226001"
                                        maxLength={6}
                                        value={form.delivery_pincode}
                                        onChange={e => setForm(f => ({ ...f, delivery_pincode: e.target.value.replace(/\D/g, '') }))}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-base font-medium focus:border-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Quantity (Kitne Tags?) *</label>
                                    <select
                                        value={form.quantity}
                                        onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) }))}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-base font-medium focus:border-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                    >
                                        {[1, 2, 3, 5, 10].map(q => (
                                            <option key={q} value={q}>{q} Tag{q > 1 ? 's' : ''} — ₹{unitPrice * q}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep('personal')}
                                    className="px-8 py-4 border-2 border-slate-200 rounded-2xl font-medium text-slate-600 hover:border-slate-400 transition-all"
                                >
                                    ← Wapas
                                </button>
                                <button
                                    onClick={() => {
                                        if (!form.delivery_address || !form.delivery_city || !form.delivery_state || !form.delivery_pincode) {
                                            toast.error('Delivery address poora fill karein')
                                            return
                                        }
                                        if (form.delivery_pincode.length !== 6) {
                                            toast.error('Valid 6-digit PIN code daalein')
                                            return
                                        }
                                        setStep('review')
                                    }}
                                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-semibold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                                >
                                    Review & Pay <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: REVIEW */}
                    {step === 'review' && (
                        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600"><CheckCircle className="w-5 h-5" /></div>
                                <div>
                                    <h2 className="text-xl text-gray-900 font-semibold">Order Review Karein</h2>
                                    <p className="text-sm text-slate-400 font-light">Sab kuch check karein — phir payment karein</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Personal Info</p>
                                    <p className="font-semibold text-slate-800">{form.customer_name}</p>
                                    <p className="text-slate-500 text-sm">{form.customer_email} • +91 {form.customer_phone}</p>
                                </div>

                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Delivery Address</p>
                                    <p className="font-medium text-slate-700 leading-relaxed">{form.delivery_address}</p>
                                    <p className="text-slate-500 text-sm">{form.delivery_city}, {form.delivery_state} — {form.delivery_pincode}</p>
                                </div>

                                <div className="p-5 bg-red-50 rounded-2xl border border-red-100 space-y-3">
                                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Order Details</p>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 font-medium">{productName}</span>
                                        <span className="font-bold">× {form.quantity}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-red-100">
                                        <span className="text-red-600">Total Amount</span>
                                        <span className="text-red-600">₹{totalAmount}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => handlePayment(false)}
                                    disabled={loading}
                                    className="w-full py-6 bg-red-600 text-white rounded-2xl font-bold text-xl hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-3 disabled:opacity-70"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CreditCard className="w-6 h-6" /> ₹{totalAmount} — Abhi Pay Karein</>}
                                </button>

                                {mounted && typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
                                    <button
                                        onClick={() => handlePayment(true)}
                                        className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 rounded-2xl text-xs font-bold uppercase tracking-widest hover:border-blue-300 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Zap className="w-3 h-3" /> Testing Mode (Bypass Payment)
                                    </button>
                                )}

                                <button onClick={() => setStep('delivery')} className="w-full text-center text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors py-2">
                                    ← Address Edit Karein
                                </button>
                            </div>

                            <p className="text-center text-xs text-slate-300 font-light">
                                🔒 100% Secure Payment via Razorpay • Cash on Delivery Available Nahi Hai
                            </p>
                        </div>
                    )}
                </div>

                {/* RIGHT: ORDER SUMMARY SIDEBAR */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5 sticky top-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                                <QrCode className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Product</p>
                                <h3 className="font-semibold text-slate-800 text-sm leading-tight">{productName}</h3>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {[
                                { label: 'Category', value: categoryName.charAt(0).toUpperCase() + categoryName.slice(1) },
                                { label: 'Unit Price', value: `₹${unitPrice}` },
                                { label: 'Quantity', value: `${form.quantity} Tag${form.quantity > 1 ? 's' : ''}` },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-medium">{item.label}</span>
                                    <span className="font-semibold text-slate-700">{item.value}</span>
                                </div>
                            ))}
                            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                                <span className="font-bold text-slate-700">Total</span>
                                <span className="text-2xl font-bold text-red-600">₹{totalAmount}</span>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            {[
                                '🚚 Free Delivery (3-5 Days)',
                                '🔒 Online Payment Only',
                                '✅ Physical QR Tag Courier',
                                '⚡ Lifetime QRdigit Access',
                            ].map((f, i) => (
                                <p key={i} className="text-xs text-slate-500 font-medium flex items-center gap-2">{f}</p>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function InstantGeneratePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
            </div>
        }>
            <InstantContent />
        </Suspense>
    )
}
