'use client'

import React, { useState, useEffect, Suspense } from 'react'
import {
    QrCode, Download, Printer, Layers,
    ArrowRight, Loader2, Shield, Box, FileImage
} from 'lucide-react'
import * as htmlToImage from 'html-to-image'
import { supabase } from '@/lib/supabase'
import { generateQRCodes } from '../actions'
import Link from 'next/link'
import QRCode from 'react-qr-code'
import toast from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'

function GenerateQRContent() {
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [generatedQRs, setGeneratedQRs] = useState<any[]>([])
    const [brandColor, setBrandColor] = useState('#a5ff00')
    const [format, setFormat] = useState<'standard' | 'card'>('standard')

    useEffect(() => {
        const adminSession = localStorage.getItem('admin_session')
        if (adminSession) {
            try {
                const session = JSON.parse(adminSession)
                fetchBrandColor(session.id)
            } catch (e) { }
        }
    }, [])

    async function fetchBrandColor(userId: string) {
        const { data } = await supabase.from('users').select('brand_color').eq('id', userId).maybeSingle()
        if (data?.brand_color) setBrandColor(data.brand_color)
    }

    const [quantity, setQuantity] = useState(10)
    const [expirationDays, setExpirationDays] = useState<number | null>(null)
    const [managedUsers, setManagedUsers] = useState<any[]>([])
    const [selectedUserId, setSelectedUserId] = useState<string>('')
    const [fixedCategory, setFixedCategory] = useState<string>('')

    useEffect(() => {
        const assignTo = searchParams.get('assign_to')
        if (assignTo) setSelectedUserId(assignTo)
        loadManagedUsers()
    }, [searchParams])

    async function loadManagedUsers() {
        const isSuperPro = !!localStorage.getItem('super_pro_admin_session')
        const adminSession = localStorage.getItem('admin_session')

        let query = supabase.from('users').select('id, name')

        if (isSuperPro) {
            query = query.in('role', ['super_admin', 'sub_admin', 'analytics_admin'])
        } else if (adminSession) {
            const session = JSON.parse(adminSession)
            // Super Admin sees their own sub-admins. Sub Admin sees nothing to assign to others.
            if (session.role === 'super_admin') {
                query = query.eq('role', 'sub_admin').eq('created_by', session.id)
            } else {
                setManagedUsers([])
                return
            }
        } else {
            setManagedUsers([])
            return
        }

        const { data: users } = await query
        setManagedUsers(users || [])
    }

    const handleGenerate = async () => {
        if (!quantity || quantity < 1 || quantity > 100) {
            toast.error('Enter quantity between 1-100')
            return
        }

        setLoading(true)
        try {
            const isSuperPro = !!localStorage.getItem('super_pro_admin_session')
            const userId = selectedUserId || undefined

            const result = await generateQRCodes(quantity, userId, isSuperPro, expirationDays, fixedCategory || null)

            if (result.success && Array.isArray(result.data)) {
                setGeneratedQRs(result.data)
                toast.success(`${quantity} Strategically Configured Nodes Initialized`)
            } else {
                toast.error(result.error || 'Generation failed')
            }
        } catch (error) {
            toast.error('Protocol error')
        } finally {
            setLoading(false)
        }
    }

    const downloadAll = async () => {
        if (generatedQRs.length === 0) return
        setLoading(true)
        toast.loading('Exporting inventory artifacts...', { id: 'export-status' })

        try {
            const container = document.getElementById('inventory-grid')
            if (!container) throw new Error('Inventory grid not detected')

            const cards = container.querySelectorAll('.qr-card[data-capture="true"]')
            if (cards.length === 0) throw new Error('No valid nodes for export')

            for (let i = 0; i < cards.length; i++) {
                const card = cards[i] as HTMLElement
                
                // Allow a small pause for any rendering updates
                await new Promise(r => setTimeout(r, 50))

                try {
                    const dataUrl = await htmlToImage.toJpeg(card, {
                        quality: 0.95,
                        pixelRatio: 2, // Equivalent to scale: 2 for sharp output
                        backgroundColor: '#ffffff',
                        cacheBust: true, // Prevents cached images from causing capture issues
                        style: {
                            borderRadius: '0', // Keep it clean for the export
                            boxShadow: 'none'
                        }
                    })

                    const link = document.createElement('a')
                    link.href = dataUrl
                    link.download = `raksha_qr_${generatedQRs[i]?.qr_number || String(i + 1).padStart(2, '0')}.jpg`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                } catch (imgError) {
                    console.error(`Error capturing node #${i + 1}:`, imgError)
                    continue; // Skip this one if it fails and continue with the rest
                }

                // Small delay to keep the UI responsive and browser happy
                await new Promise(r => setTimeout(r, 300))
            }

            toast.success('Inventory Assets Deployed', { id: 'export-status' })
        } catch (error) {
            console.error('Export Error:', error)
            toast.error('Export Protocol Interrupted', { id: 'export-status' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
            {/* AMBIENT GLOW REMOVED AS PER USER REQUEST */}

            <div className="max-w-[1600px] mx-auto relative z-10">
                <header className="mb-12 no-print">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8">
                        <Link href="/admin/dashboard" className="w-fit p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-white/20 transition-all group backdrop-blur-md">
                            <ArrowRight className="w-5 h-5 rotate-180 text-zinc-500 group-hover:text-white transition-colors" />
                        </Link>
                        <div className="flex items-center gap-6">
                            <Box className="w-6 h-6 text-zinc-800" />
                            <div className="h-6 w-px bg-zinc-800"></div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-600">Inventory Forge</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-5xl font-bold text-white uppercase italic tracking-tighter mb-2">Batch Generator</h1>
                        <p className="text-zinc-500 text-sm font-medium max-w-xl leading-relaxed">
                            Generate unassigned safety QR codes for immediate deployment.
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start h-full">
                    <aside className="lg:col-span-4 space-y-8 no-print">
                        <div className="bg-[#0e0e0e] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <div className="flex items-center gap-4 mb-8">
                                <Layers className="w-5 h-5" style={{ color: brandColor }} />
                                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Batch Config</h2>
                            </div>

                            <div className="space-y-8">

                                <div>
                                    <label className="block text-[8px] font-bold text-zinc-600 uppercase tracking-[0.3em] mb-3 px-2">Assign To </label>
                                    <select
                                        value={selectedUserId}
                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                        className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none transition-all appearance-none uppercase"
                                        style={{ borderColor: selectedUserId ? brandColor + '40' : 'rgba(255,255,255,0.05)' }}
                                    >
                                        <option value="">MASTER POOL (DEFAULT)</option>
                                        {managedUsers.map(u => (
                                            <option key={u.id} value={u.id} className="bg-zinc-900">{u.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[8px] font-bold text-zinc-600 uppercase tracking-[0.3em] mb-3 px-2">Quantity</label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        className="w-full bg-black border border-white/5 rounded-2xl px-6 py-5 text-xl font-bold text-white outline-none transition-all"
                                        style={{ borderColor: brandColor + '40' }}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[8px] font-bold text-zinc-600 uppercase tracking-[0.3em] mb-4 px-2">Validity</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'Permanent', val: null },
                                            { label: '24 Hours', val: 1 },
                                            { label: '2 Days', val: 2 },
                                            { label: '7 Days', val: 7 }
                                        ].map(({ label, val }) => (
                                            <button
                                                key={label}
                                                onClick={() => setExpirationDays(val)}
                                                className={`py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${expirationDays === val ? 'text-black' : 'bg-black text-zinc-600 border-white/5 hover:border-zinc-800'}`}
                                                style={{
                                                    backgroundColor: expirationDays === val ? brandColor : 'transparent',
                                                    borderColor: expirationDays === val ? brandColor : 'rgba(255,255,255,0.05)'
                                                }}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-4">
                                        <input
                                            type="number"
                                            placeholder="Custom Days..."
                                            onChange={(e) => setExpirationDays(e.target.value ? Number(e.target.value) : null)}
                                            className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-xs text-zinc-400 font-bold uppercase tracking-widest focus:outline-none transition-all placeholder:text-zinc-800"
                                            style={{ borderColor: expirationDays && ![null, 1, 2, 7].includes(expirationDays) ? brandColor : 'rgba(255,255,255,0.05)' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[8px] font-bold text-zinc-600 uppercase tracking-[0.3em] mb-4 px-2">Design Format</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'Standard', val: 'standard' },
                                            { label: 'Card Format', val: 'card' }
                                        ].map(({ label, val }) => (
                                            <button
                                                key={label}
                                                onClick={() => setFormat(val as any)}
                                                className={`py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${format === val ? 'text-black' : 'bg-black text-zinc-600 border-white/5 hover:border-zinc-800'}`}
                                                style={{
                                                    backgroundColor: format === val ? brandColor : 'transparent',
                                                    borderColor: format === val ? brandColor : 'rgba(255,255,255,0.05)'
                                                }}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Purpose selection moved inside Design Format */}
                                    <div className="mt-6 pt-6 border-t border-white/5">
                                        <label className="block text-[8px] font-bold text-zinc-600 uppercase tracking-[0.3em] mb-3 px-2">Assign Purpose / Category</label>
                                        <select
                                            value={fixedCategory}
                                            onChange={(e) => setFixedCategory(e.target.value)}
                                            className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none transition-all appearance-none uppercase"
                                            style={{ borderColor: fixedCategory ? brandColor : 'rgba(255,255,255,0.05)' }}
                                        >
                                            <option value="">STANDARD (SELECT ON SCAN)</option>
                                            <option value="child-safety">CHILD SAFETY (Locked)</option>
                                            <option value="women-safety">WOMEN SAFETY (Locked)</option>
                                            <option value="elderly-safety">ELDERLY SAFETY (Locked)</option>
                                            <option value="vehicle-safety">VEHICLE SAFETY (Locked)</option>
                                            <option value="mela-safety">MELA SAFETY (Locked)</option>
                                            <option value="event-safety">EVENT SAFETY (Locked)</option>
                                            <option value="tourist-safety">TOURIST SAFETY (Locked)</option>
                                        </select>
                                        <p className="mt-2 px-2 text-[8px] text-zinc-600 italic">
                                            {format === 'card' ? 'Card will print with this locked category' : 'QR will strictly open this category form'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full py-5 text-black font-bold rounded-2xl shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.2em]"
                                    style={{ backgroundColor: brandColor, boxShadow: `0 20px 40px ${brandColor}20` }}
                                >
                                    {loading ? <Loader2 className="animate-spin text-black w-5 h-5" /> : (
                                        <>
                                            CREATE BATCH <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="bg-[#0e0e0e]/30 border border-white/5 p-8 rounded-[2rem] space-y-4" style={{ borderColor: brandColor + '10' }}>
                            <Shield className="w-6 h-6" style={{ color: brandColor }} />
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Master Production</h3>
                            <p className="text-[9px] font-medium text-zinc-600 uppercase leading-relaxed">
                                Unassigned assets produced here are ready for physical distribution.
                            </p>
                        </div>
                    </aside>

                    <div className="lg:col-span-8">
                        {generatedQRs.length === 0 ? (
                            <div className="w-full h-[600px] border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-center p-20 bg-zinc-950/20 no-print">
                                <QrCode className="w-12 h-12 text-zinc-900 mb-6" />
                                <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter mb-2">Awaiting Generation</h3>
                            </div>
                        ) : (
                            <div className="w-full space-y-12">
                                <style jsx global>{`
                                    @media print {
                                        @page {
                                            size: 12in 18in;
                                            margin: 0;
                                        }
                                        body { background: white !important; padding: 0 !important; margin: 0 !important; }
                                        .no-print, nav, aside, header, button, .sidebar, footer { display: none !important; }
                                        .print-area { 
                                            display: grid !important; 
                                            grid-template-cols: ${format === 'card' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'} !important;
                                            gap: 0.2in !important;
                                            padding: 0.5in !important; 
                                            margin: 0 !important; 
                                            width: 100% !important; 
                                            box-sizing: border-box !important;
                                        }
                                        .qr-card { 
                                            break-inside: avoid !important; 
                                            border: none !important; 
                                            background: white !important;
                                            padding: 0 !important;
                                            margin: 0 !important;
                                            box-shadow: none !important;
                                            width: 100% !important;
                                            position: relative !important;
                                        }
                                        .qr-svg { 
                                            border: 1px solid #ddd !important; 
                                            padding: 5px !important;
                                            width: 100% !important;
                                            height: auto !important;
                                        }
                                        .card-background {
                                            display: block !important;
                                            width: 100% !important;
                                            height: auto !important;
                                        }
                                        .qr-index-number {
                                            font-size: 5pt !important;
                                            font-weight: 900 !important;
                                            opacity: 0.5 !important;
                                            line-height: normal !important;
                                        }
                                    }
                                `}</style>

                                <div className="flex items-center justify-between no-print mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brandColor }}></div>
                                        <h2 className="text-xl font-bold text-white uppercase italic tracking-tighter">Ready for Production</h2>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => window.print()} className="px-6 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-all flex items-center gap-3 text-[10px] uppercase tracking-widest shadow-xl">
                                            <Printer className="w-4 h-4" /> PRINT BATCH
                                        </button>
                                        <button onClick={downloadAll} className="px-5 py-3 text-zinc-500 hover:text-white font-bold flex items-center gap-2 text-[9px] uppercase tracking-widest transition-all">
                                            <FileImage className="w-4 h-4" /> EXPORT AS IMAGES
                                        </button>
                                    </div>
                                </div>

                                <div id="inventory-grid" className={`print-area grid gap-8 pb-20 ${format === 'card' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
                                    {generatedQRs.map((qr, i) => (
                                        format === 'card' ? (
                                            <div key={i} data-capture="true" className="qr-card relative w-full overflow-hidden group">
                                                <img
                                                    src="/card-format.png"
                                                    alt="Safety Card"
                                                    className="w-full h-auto card-background shadow-lg"
                                                />
                                                <div className="absolute top-[13.5%] left-[63.2%] w-[28.5%] aspect-square flex items-center justify-center pointer-events-none">
                                                    {qr.full_url ? (
                                                        <QRCode
                                                            value={qr.full_url}
                                                            size={256}
                                                            className="w-full h-full"
                                                            level="H"
                                                            bgColor="transparent"
                                                        />
                                                    ) : (
                                                        <div className="text-[10px] text-zinc-500 font-bold uppercase italic">Missing Node</div>
                                                    )}
                                                </div>
                                                {/* Card Index Number - Bottom Left */}
                                                <div className="qr-index-number absolute bottom-[2%] left-[3%] text-[9px] font-black text-black/50 pointer-events-none tabular-nums tracking-widest uppercase">
                                                    {String(i + 1).padStart(2, '0')}
                                                </div>
                                            </div>
                                        ) : (
                                            <div key={i} data-capture="true" className="qr-card bg-zinc-900/20 p-4 rounded-2xl flex flex-col items-center justify-center relative group backdrop-blur-sm border border-white/5">
                                                <div className="bg-white p-3 rounded-2xl shadow-xl qr-svg border border-black/5">
                                                    {qr.full_url ? (
                                                        <QRCode value={qr.full_url} size={130} level="H" />
                                                    ) : (
                                                        <div className="w-[130px] h-[130px] flex items-center justify-center text-[8px] text-zinc-500 font-bold uppercase italic">Missing Node</div>
                                                    )}
                                                </div>
                                                <p className="qr-index-number w-full text-left mt-1 text-[9px] font-black text-zinc-700 uppercase tracking-widest tabular-nums pl-2 opacity-60">
                                                    {String(i + 1).padStart(2, '0')}
                                                </p>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function GenerateQRPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center font-bold text-zinc-700 uppercase tracking-[0.5em]">Initializing Architecture...</div>}>
            <GenerateQRContent />
        </Suspense>
    )
}
