'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Shield, ArrowRight, Download, CheckCircle, Smartphone, Loader2, Copy } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import QRCode from 'react-qr-code'
import toast from 'react-hot-toast'

export default function GenerateCategoryPage() {
    const params = useParams()
    const router = useRouter()
    const category = params.category as string

    const [loading, setLoading] = useState(false)
    const [generatedQRs, setGeneratedQRs] = useState<any[]>([])
    const [quantity, setQuantity] = useState(1)
    const [customLabel, setCustomLabel] = useState('')

    const categoryTitle = category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())

    async function handleGenerate() {
        if (quantity < 1 || quantity > 100) {
            toast.error('Please enter a valid quantity (1-100)')
            return
        }

        setLoading(true)
        const newQRs = []

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error('You must be logged in to generate QR codes')
                router.push('/admin/login')
                return
            }

            // Ensure user exists in public 'users' table to satisfy FK constraint
            const { data: publicUser, error: fetchError } = await supabase
                .from('users')
                .select('id')
                .eq('id', user.id)
                .single()

            if (!publicUser) {
                console.log('User record missing in public table, creating now...')
                // Create missing user record
                const { error: createError } = await supabase
                    .from('users')
                    .insert({
                        id: user.id, // Sync ID with Auth
                        email: user.email,
                        name: user.user_metadata?.name || 'User',
                        role: 'customer', // Default role
                        is_active: true,
                        password_hash: 'otp_authenticated' // Placeholder to satisfy NOT NULL constraint
                    })

                if (createError) {
                    console.error('Failed to create public user record:', createError)
                    throw new Error('User synchronization failed. Please contact support.')
                }
            }

            // Fetch latest sequence number using multiple safety checks (Robust way)
            const { data: qrs, error: seqError } = await supabase
                .from('qr_codes')
                .select('qr_number, sequence_number')
                .or(`category.eq."${category}",qr_number.ilike."${category}-%"`)
                .order('sequence_number', { ascending: false })
                .limit(1)

            if (seqError) {
                console.warn('Sequence fetch warning:', seqError)
            }

            // Extract sequence from max sequence_number OR parse from qr_number if needed
            let currentSequence = 0
            if (qrs && qrs.length > 0) {
                const maxSeq = qrs[0].sequence_number || 0
                // Double check if we can parse it from the qr_number string
                const parts = qrs[0].qr_number.split('-')
                const lastPart = parseInt(parts[parts.length - 1])
                currentSequence = Math.max(maxSeq, isNaN(lastPart) ? 0 : lastPart)
            }

            for (let i = 0; i < quantity; i++) {
                currentSequence++
                const qrId = uuidv4()
                // Format: women-safety-001
                const qrNumber = `${category}-${String(currentSequence).padStart(3, '0')}`

                const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || window.location.origin
                newQRs.push({
                    generated_by: user.id,
                    id: qrId,
                    category: category,
                    status: 'generated',
                    qr_number: qrNumber,
                    // label: customLabel || categoryTitle, // Uncomment when column is fixed
                    sequence_number: currentSequence,
                    full_url: `${baseUrl}/scan/${qrId}`,
                    created_at: new Date().toISOString()
                })
            }

            // Insert into Supabase
            const { data, error } = await supabase
                .from('qr_codes')
                .insert(newQRs)
                .select()

            if (error) {
                console.error("Supabase Insert Error:", error)
                throw error
            }

            setGeneratedQRs([...data])
            toast.success(`Successfully generated ${quantity} QR codes!`)
        } catch (error: any) {
            console.error('Generation Error Details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            })
            const errorMsg = error.details || error.message || 'Unknown database error'
            toast.error(`Generation Failed: ${errorMsg}`, { duration: 8000 })
        } finally {
            setLoading(false)
        }
    }

    const downloadQR = (qrId: string, qrNumber: string) => {
        const svg = document.getElementById(qrId)
        if (!svg) return

        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const img = new Image()

        img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            ctx?.drawImage(img, 0, 0)
            const pngFile = canvas.toDataURL("image/png")

            const downloadLink = document.createElement("a")
            downloadLink.download = `SafetyQR-${qrNumber}.png`
            downloadLink.href = pngFile
            downloadLink.click()
        }

        img.src = "data:image/svg+xml;base64," + btoa(svgData)
        toast.success('QR Code downloaded!')
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-4 lg:p-12 font-sans selection:bg-purple-500/30">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="text-muted-foreground hover:text-foreground text-sm font-bold flex items-center mb-2 transition-colors"
                        >
                            ← Back to Categories
                        </button>
                        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
                            Generate <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{categoryTitle}</span> QRs
                        </h1>
                        <p className="text-muted-foreground">Configure and create new secure QR codes for your inventory.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Configuration Panel */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-card border border-border rounded-3xl p-6 shadow-2xl">
                            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-purple-500" />
                                Configuration
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                                        Quantity
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-purple-500 transition-all font-mono"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">Max 100 per batch generation.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                                        Custom Label (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Batch A-2026"
                                        value={customLabel}
                                        onChange={(e) => setCustomLabel(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-700"
                                    />
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            Generate Codes
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Tips Card */}
                        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-3xl p-6">
                            <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Pro Tip
                            </h4>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Generated QR codes are inactive by default until scanned and registered by a user. You can track their status in your dashboard.
                            </p>
                        </div>
                    </div>

                    {/* Results Panel */}
                    <div className="lg:col-span-2">
                        {generatedQRs.length === 0 ? (
                            <div className="h-full min-h-[400px] bg-card/50 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center p-8">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                    <Shield className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">Ready to Generate</h3>
                                <p className="text-muted-foreground max-w-sm">
                                    Configure your batch settings on the left and click generate to create new unique secure QR codes.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        Generated Batch
                                        <span className="bg-white/10 text-xs px-2 py-1 rounded-md text-zinc-300 ml-2">{generatedQRs.length} items</span>
                                    </h2>
                                    <button className="text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2">
                                        <Download className="w-4 h-4" />
                                        Download All
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {generatedQRs.map((qr, index) => (
                                        <div key={index} className="bg-card border-2 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)] p-4 rounded-2xl flex items-center gap-4 group hover:border-green-400 transition-all relative overflow-hidden">
                                            {/* NEW Badge */}
                                            <div className="absolute top-0 right-0 bg-green-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                                NEW {String(qr.sequence_number).padStart(3, '0')}
                                            </div>

                                            <div className="bg-white p-2 rounded-lg">
                                                <div style={{ height: "auto", margin: "0 auto", maxWidth: 64, width: "100%" }}>
                                                    <QRCode
                                                        size={256}
                                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                        value={qr.full_url || `${window.location.origin}/scan/${qr.id}`}
                                                        viewBox={`0 0 256 256`}
                                                        id={qr.id}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                                    {qr.category.replace('-', ' ')}
                                                </p>
                                                <p className="text-foreground font-mono font-bold truncate text-lg text-green-400">
                                                    {qr.qr_number}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <button
                                                        onClick={() => window.open(`${window.location.origin}/scan/${qr.id}`, '_blank')}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 rounded-md text-xs font-bold transition-all"
                                                        title="Simulate Scan"
                                                    >
                                                        <Smartphone className="w-3.5 h-3.5" />
                                                        Test Scan
                                                    </button>
                                                    <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(qr.full_url || `${window.location.origin}/scan/${qr.id}`)
                                                            toast.success('Link copied!')
                                                        }}
                                                        className="p-1.5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                                        title="Copy Link"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => downloadQR(qr.id, qr.qr_number)}
                                                        className="p-1.5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                                        title="Download PNG"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
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
