'use client'

import { useEffect, useRef, useState, use } from 'react'
import { supabase } from '@/lib/supabase'
import {
    Navigation, Shield, MapPin, Zap, Clock, Wifi, WifiOff,
    Phone, AlertCircle, Share2, RefreshCcw, ChevronUp
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────
interface TrackingSession {
    id: string
    qr_id: string
    lat: number | null
    lng: number | null
    speed: number | null
    accuracy: number | null
    heading: number | null
    is_active: boolean
    route_points: { lat: number; lng: number; ts: number }[]
    started_at: string
    updated_at: string
    name?: string
    category?: string
}

// ─── Main Component ───────────────────────────────────────
export default function LiveTrackPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = use(params)

    const [session, setSession] = useState<TrackingSession | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
    const [mapReady, setMapReady] = useState(false)
    const [sheetExpanded, setSheetExpanded] = useState(false)

    // ── Load session + Realtime ───────────────────────────
    useEffect(() => {
        loadSession()

        const channel = supabase
            .channel(`track-${sessionId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'live_tracking_sessions',
                filter: `id=eq.${sessionId}`,
            }, (payload) => {
                handleLocationUpdate(payload.new as TrackingSession)
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [sessionId])

    // ── Realtime location observer ───
    useEffect(() => {
        if (session?.lat && session?.lng) {
            setMapReady(true)
        }
    }, [session?.lat, session?.lng])

    // ─── Functions ────────────────────────────────────────
    const loadSession = async () => {
        setLoading(true)
        try {
            // 1. Fetch Location Session
            const { data: sessionData, error: sessionError } = await supabase
                .from('live_tracking_sessions')
                .select('*')
                .eq('id', sessionId)
                .single()

            if (sessionError) throw sessionError

            // 2. Fetch Profile Info avoiding relational queries
            let userName = 'Unknown'
            let userCategory = 'Safety QR'

            if (sessionData?.qr_id) {
                const { data: qrData } = await supabase
                    .from('qr_codes')
                    .select('*')
                    .eq('id', sessionData.qr_id)
                    .single()
                
                if (qrData) {
                    userCategory = qrData.category || 'Safety QR'
                    const { data: detailsData } = await supabase
                        .from('qr_details')
                        .select('full_name')
                        .eq('qr_id', sessionData.qr_id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle()

                    if (detailsData?.full_name) {
                        userName = detailsData.full_name
                    }
                }
            }

            const combinedData = {
                ...sessionData,
                name: userName,
                category: userCategory
            }

            setSession(combinedData)
            if (combinedData.updated_at) setLastUpdate(new Date(combinedData.updated_at))
        } catch (err: any) {
            setError(err.message || 'Session not found or expired.')
        } finally {
            setLoading(false)
        }
    }

    const handleLocationUpdate = (data: TrackingSession) => {
        setSession(prev => prev ? { ...prev, ...data } : data)
        setLastUpdate(new Date())
    }

    // ─── Helpers ──────────────────────────────────────────
    const timeAgo = lastUpdate ? (() => {
        const diff = Math.floor((Date.now() - lastUpdate.getTime()) / 1000)
        if (diff < 5) return 'Just now'
        if (diff < 60) return `${diff}s ago`
        return `${Math.floor(diff / 60)}m ago`
    })() : '—'

    const name = session?.name || 'Unknown'
    const category = session?.category || 'Safety QR'
    const hasLocation = session?.lat && session?.lng

    const shareLink = () => {
        if (navigator.share) {
            navigator.share({ title: 'Live Location', url: window.location.href })
        } else {
            navigator.clipboard.writeText(window.location.href)
        }
    }

    // ─── Loading / Error States ───────────────────────────
    if (loading) return (
        <div className="fixed inset-0 bg-[#0a0f1a] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-green-500/30 border-t-green-400 animate-spin" />
            <p className="text-green-400 text-sm font-bold uppercase tracking-widest">Loading session...</p>
        </div>
    )

    if (error) return (
        <div className="fixed inset-0 bg-[#0a0f1a] flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-white font-black text-xl uppercase tracking-tight">Session Not Found</h2>
            <p className="text-slate-500 text-sm text-center">{error}</p>
            <p className="text-slate-600 text-xs text-center">The tracking session may have ended or the link is invalid.</p>
        </div>
    )

    // ─── Main Render ──────────────────────────────────────
    // Round to 4 decimals to prevent iframe micro-reloads when stationary
    const fixedLat = session?.lat?.toFixed(4) || ''
    const fixedLng = session?.lng?.toFixed(4) || ''
    const iframeSrc = hasLocation ? `https://www.google.com/maps?q=${fixedLat},${fixedLng}&t=m&z=16&output=embed` : ''

    return (
        <div className="fixed inset-0 bg-[#0a0f1a] overflow-hidden">
            {/* ── TOP BAR ── */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-safe pt-5 pb-4"
                style={{ background: 'linear-gradient(to bottom, rgba(10,15,26,0.95), transparent)' }}>
                {/* Brand */}
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center">
                        <Shield className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">Safety QR</p>
                        <p className="text-white font-black text-sm leading-none">Live Tracking</p>
                    </div>
                </div>

                {/* Live badge */}
                <div className="flex items-center gap-2">
                    {session?.is_active ? (
                        <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/25 px-3 py-1.5 rounded-full">
                            <span className="relative w-2 h-2">
                                <span className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75" />
                                <span className="relative w-2 h-2 bg-green-400 rounded-full block" />
                            </span>
                            <span className="text-green-300 text-[10px] font-black uppercase tracking-widest">Live</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full">
                            <WifiOff className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Ended</span>
                        </div>
                    )}
                    <button onClick={shareLink} className="w-9 h-9 bg-slate-800/80 border border-slate-700 rounded-full flex items-center justify-center">
                        <Share2 className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            </div>

            {/* ── MAP ── */}
            <div className="absolute inset-0 w-full h-full pt-[85px] pb-[320px] pointer-events-auto" style={{ zIndex: 1, backgroundColor: '#0a0f1a' }}>
                {hasLocation ? (
                    <iframe
                        src={iframeSrc}
                        width="100%"
                        height="100%"
                        style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)', opacity: 0.8 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                ) : null}
            </div>

            {/* No location yet */}
            {!hasLocation && !loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-2xl px-6 py-5 flex flex-col items-center gap-3">
                        <RefreshCcw className="w-6 h-6 text-slate-500 animate-spin" />
                        <p className="text-slate-400 text-sm font-bold">Waiting for first location...</p>
                    </div>
                </div>
            )}

            {/* ── BOTTOM SHEET ── */}
            <div className="absolute bottom-0 left-0 right-0 z-20 transition-all duration-300"
                style={{ background: 'linear-gradient(to top, rgba(10,15,26,1) 85%, transparent)' }}>

                {/* Pull handle */}
                <div className="flex justify-center pt-3 pb-1 cursor-pointer" onClick={() => setSheetExpanded(p => !p)}>
                    <div className="w-10 h-1 bg-slate-700 rounded-full" />
                </div>

                <div className="px-5 pb-safe pb-8 pt-2 space-y-4">

                    {/* Person info + update time */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-500/15 border border-green-500/20 rounded-2xl flex items-center justify-center shrink-0">
                            <Shield className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-white font-black text-base leading-none truncate">{name}</h2>
                            <p className="text-slate-500 text-xs font-semibold mt-0.5 capitalize">{category.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1 text-slate-500">
                                <Clock className="w-3 h-3" />
                                <span className="text-[10px] font-bold">{timeAgo}</span>
                            </div>
                            {session?.is_active
                                ? <Wifi className="w-3.5 h-3.5 text-green-500" />
                                : <WifiOff className="w-3.5 h-3.5 text-slate-600" />}
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            {
                                icon: <Zap className="w-4 h-4" />,
                                label: 'Speed',
                                value: session?.speed !== null && session?.speed !== undefined ? `${session.speed} km/h` : '— km/h',
                                color: 'text-yellow-400',
                                bg: 'bg-yellow-500/10 border-yellow-500/20',
                            },
                            {
                                icon: <Navigation className="w-4 h-4" />,
                                label: 'Points',
                                value: `${session?.route_points?.length ?? 0}`,
                                color: 'text-blue-400',
                                bg: 'bg-blue-500/10 border-blue-500/20',
                            },
                            {
                                icon: <MapPin className="w-4 h-4" />,
                                label: 'Accuracy',
                                value: session?.accuracy !== null && session?.accuracy !== undefined ? `±${session.accuracy}m` : '—',
                                color: 'text-purple-400',
                                bg: 'bg-purple-500/10 border-purple-500/20',
                            },
                        ].map(s => (
                            <div key={s.label} className={`flex flex-col items-center gap-1.5 rounded-2xl px-3 py-3 border ${s.bg}`}>
                                <span className={s.color}>{s.icon}</span>
                                <span className={`text-sm font-black ${s.color}`}>{s.value}</span>
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">{s.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Coords */}
                    {hasLocation && (
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-green-500 shrink-0" />
                            <span className="text-slate-400 text-[11px] font-mono">
                                {session!.lat!.toFixed(6)}, {session!.lng!.toFixed(6)}
                            </span>
                            <a
                                href={`https://maps.google.com/?q=${session!.lat},${session!.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-auto text-[10px] font-black text-green-400 uppercase tracking-wider shrink-0"
                            >
                                Open ↗
                            </a>
                        </div>
                    )}

                    {/* Emergency */}
                    <a href="tel:112"
                        className="flex items-center justify-center gap-3 w-full py-4 rounded-[20px] text-white font-black text-sm uppercase tracking-widest active:scale-[0.97] transition-all"
                        style={{ background: 'linear-gradient(135deg,#ef4444,#b91c1c)', boxShadow: '0 8px 24px rgba(239,68,68,0.35)' }}
                    >
                        <Phone className="w-5 h-5" />
                        Call Emergency — 112
                    </a>

                </div>
            </div>
        </div>
    )
}
