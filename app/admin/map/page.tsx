'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
    MapPin, Navigation, ExternalLink, Shield, Zap, Search,
    Target, Radar, AlertTriangle, Eye, Clock, Camera,
    User, Phone, ChevronRight, X, FileText, Activity, ShieldCheck
} from 'lucide-react'
import { getAlertDetails } from '@/app/admin/actions'

export default function MapPage() {
    const [locations, setLocations] = useState<any[]>([])
    const [selectedLocation, setSelectedLocation] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [extraDetails, setExtraDetails] = useState<any>(null)
    const [showContactPopup, setShowContactPopup] = useState(false)

    useEffect(() => {
        loadLocations()
    }, [])

    useEffect(() => {
        if (selectedLocation) {
            fetchExtraDetails(selectedLocation)
        }
    }, [selectedLocation?.id])

    async function fetchExtraDetails(loc: any) {
        setExtraDetails(null)
        if (loc.type === 'emergency' || loc.alert_type === 'scan') {
            setDetailsLoading(true)
            try {
                // If it's an emergency, use getAlertDetails
                if (loc.type === 'emergency') {
                    const res = await getAlertDetails(loc.id)
                    if (res.success) setExtraDetails(res.data)
                } else {
                    // If it's a scan, just get owner details
                    const { data: owner } = await supabase
                        .from('qr_details')
                        .select('*')
                        .eq('qr_id', loc.qr_id)
                        .maybeSingle()

                    const { data: contacts } = await supabase
                        .from('emergency_contacts')
                        .select('*')
                        .eq('qr_id', loc.qr_id)
                        .limit(10)

                    setExtraDetails({ owner, contacts })
                }
            } catch (e) {
                console.error(e)
            } finally {
                setDetailsLoading(false)
            }
        }
    }

    async function loadLocations() {
        try {
            setLoading(true)
            // 1. Identify User and Hierarchy
            const superProSession = localStorage.getItem('super_pro_admin_session')
            const adminSession = localStorage.getItem('admin_session')
            let userId = null
            let isSuperPro = false

            if (superProSession) {
                isSuperPro = true
            } else if (adminSession) {
                try {
                    const session = JSON.parse(adminSession)
                    userId = session.id
                } catch (e) { }
            }

            // 2. Build Query Filters
            let alertsQuery = supabase.from('emergency_alerts').select('*').order('alert_time', { ascending: false })
            let scansQuery = supabase.from('scan_logs').select('*').not('latitude', 'is', null).order('scanned_at', { ascending: false })

            if (!isSuperPro && userId) {
                // Fetch user's role and sub-admins
                const { data: userData } = await supabase.from('users').select('role').eq('id', userId).maybeSingle()
                let targetUserIds = [userId]

                if (userData?.role === 'super_admin') {
                    const { data: subs } = await supabase.from('users').select('id').eq('created_by', userId)
                    if (subs) targetUserIds = [...targetUserIds, ...subs.map(s => s.id)]
                }

                // Get QR IDs belonging to these users
                const { data: qrData } = await supabase.from('qr_codes').select('id').in('generated_by', targetUserIds)
                const myQrIds = (qrData || []).map(q => q.id)

                if (myQrIds.length > 0) {
                    alertsQuery = alertsQuery.in('qr_id', myQrIds)
                    scansQuery = scansQuery.in('qr_id', myQrIds)
                } else {
                    setLocations([])
                    setLoading(false)
                    return
                }
            }

            const [alertsRes, scansRes] = await Promise.all([
                alertsQuery,
                scansQuery
            ])

            const alerts = (alertsRes.data || []).map(a => ({
                ...a,
                type: 'emergency',
                timestamp: a.alert_time,
                display_type: a.alert_type === 'sos_trigger' ? 'SOS ALERT' : a.alert_type === 'location_share' ? 'LOCATION SHARE' : 'CALL TRIGGER'
            }))

            const scans = (scansRes.data || []).map(s => ({
                ...s,
                type: 'scan',
                timestamp: s.scanned_at,
                display_type: 'QR SCAN VISIT',
                alert_type: 'scan'
            }))

            const combined = [...alerts, ...scans].sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )

            // Efficiently fetch names and numbers for the list
            const uniqueQrIds = Array.from(new Set(combined.map(l => l.qr_id)))
            const [ownersRes, qrsRes] = await Promise.all([
                supabase.from('qr_details').select('qr_id, full_name, phone').in('qr_id', uniqueQrIds),
                supabase.from('qr_codes').select('id, qr_number, users(name)').in('id', uniqueQrIds)
            ])

            const ownersMap = (ownersRes.data || []).reduce((acc: any, o) => {
                acc[o.qr_id] = { name: o.full_name, phone: o.phone }
                return acc
            }, {})

            const qrsMap = (qrsRes.data || []).reduce((acc: any, q) => {
                const cName = Array.isArray((q as any)?.users) ? (q as any).users[0]?.name : (q as any)?.users?.name
                acc[q.id] = { number: q.qr_number, operator: cName }
                return acc
            }, {})

            const finalData = combined.map(l => {
                const qrInfo = qrsMap[l.qr_id]
                const ownerInfo = ownersMap[l.qr_id]
                
                return {
                    ...l,
                    owner_name: ownerInfo?.name || (qrInfo?.operator ? `Operator: ${qrInfo.operator}` : (qrInfo?.number ? `Unit: ${qrInfo.number}` : `Device #${l.qr_id?.toString().slice(0, 8)}`)),
                    owner_phone: ownerInfo?.phone || 'Encrypted Contact',
                    qr_codes: { qr_number: qrInfo?.number || '??' }
                }
            })

            setLocations(finalData)
            if (finalData.length > 0) {
                setSelectedLocation(finalData[0])
            }
        } catch (error) {
            console.error('Error loading locations:', error)
        } finally {
            setLoading(false)
        }
    }

    const filtered = locations.filter(l =>
        l.location_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.qr_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="h-[calc(100vh-100px)] bg-[#020202] relative overflow-hidden selection:bg-primary/30 font-sans border-t border-white/5">
            {/* 1. Full-Screen Tactical Map Layer */}
            <div className="absolute inset-0 z-0">
                {selectedLocation ? (
                    <div className="w-full h-full relative">
                        <iframe
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            style={{ border: 0, filter: 'invert(100%) hue-rotate(180deg) brightness(0.4) contrast(1.5)' }}
                            src={`https://maps.google.com/maps?q=${selectedLocation.latitude},${selectedLocation.longitude}&z=16&output=embed&t=k`}
                            allowFullScreen
                        ></iframe>
                        {/* Interactive Scan Line Effect */}
                        <div className="absolute inset-x-0 h-[2px] bg-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.5)] top-0 animate-[scan_4s_linear_infinite] pointer-events-none" />
                    </div>
                ) : (
                    <div className="w-full h-full bg-[#050505] flex flex-col items-center justify-center">
                        <div className="relative">
                            <Radar className="w-40 h-40 text-zinc-900 animate-pulse" />
                            <div className="absolute inset-0 w-40 h-40 border-2 border-primary/10 rounded-full animate-ping" />
                        </div>
                        <h2 className="mt-10 text-xl font-black text-zinc-800 uppercase tracking-[0.6em] italic animate-pulse">Establishing Satellite Uplink...</h2>
                    </div>
                )}
                {/* Visual Depth Overlays */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_20%,_rgba(0,0,0,0.8)_100%)]" />
            </div>

            {/* 2. Floating Asset Feed (Left) */}
            <div className="absolute left-6 top-6 bottom-6 w-80 lg:w-96 z-40 flex flex-col gap-4 group">
                <div className="bg-black/40 backdrop-blur-[30px] border border-white/10 rounded-[2.5rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col h-full overflow-hidden transition-all duration-500 group-hover:border-primary/20">
                    <div className="mb-6 shrink-0">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                                <span className="text-[10px] font-black text-white hover:text-primary transition-colors uppercase tracking-[0.4em] italic">Live Assets</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                                <Activity className="w-2.5 h-2.5 text-primary" />
                                <span className="text-[8px] font-black text-primary uppercase">{locations.length} Connected</span>
                            </div>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-colors group-focus-within:text-primary" />
                            <input
                                type="text"
                                placeholder="LOCATE UNIT..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black focus:border-primary/40 focus:bg-white/[0.05] transition-all outline-none text-white placeholder:text-zinc-800 uppercase tracking-widest"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 space-y-3 pb-4">
                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => <div key={i} className="h-28 bg-white/[0.02] rounded-3xl animate-pulse" />)
                        ) : (
                            filtered.map((loc) => (loc.latitude && loc.longitude) && (
                                <button
                                    key={loc.id}
                                    onClick={() => setSelectedLocation(loc)}
                                    className={`w-full text-left p-5 rounded-[2rem] border transition-all duration-700 group/item relative overflow-hidden ${selectedLocation?.id === loc.id ? 'bg-primary/20 border-primary shadow-[0_0_30px_rgba(168,85,247,0.15)] ring-1 ring-primary/20' : 'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.06]'}`}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-transform duration-500 group-hover/item:scale-110 ${loc.type === 'emergency' ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-primary/10 text-primary border-primary/20 group-hover/item:border-primary/40'}`}>
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-[9px] font-black text-zinc-500 group-hover/item:text-zinc-400 transition-colors uppercase tracking-[0.2em]">{new Date(loc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                {loc.type === 'emergency' && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
                                            </div>
                                            <h3 className="text-[13px] font-black text-white hover:text-primary transition-colors uppercase italic truncate tracking-tight">{loc.owner_name}</h3>
                                            <p className="text-[9px] font-bold text-zinc-600 uppercase truncate italic mt-1 group-hover/item:text-zinc-500 transition-colors">📍 {loc.location_address || 'TETHERING...'}</p>
                                        </div>
                                    </div>
                                    {selectedLocation?.id === loc.id && (
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_20px_rgba(168,85,247,1)]" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Central HUD Overlays */}
            {selectedLocation && (
                <>
                    {/* Top Stats Strip - Re-positioned to avoid sidebar clash */}
                    <div className="absolute top-8 right-6 left-[410px] lg:left-[430px] z-30 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/60 backdrop-blur-[30px] border border-white/10 px-10 py-5 rounded-[2rem] flex items-center gap-16 shadow-[0_0_50px_rgba(0,0,0,0.5)] pointer-events-auto border-glow-primary transition-all duration-700 hover:border-primary/40">
                            <div className="flex flex-col items-center">
                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-1.5">Vector Lock</span>
                                <span className="text-sm font-black text-white italic tracking-widest tabular-nums leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{selectedLocation.longitude?.toFixed(6)} : {selectedLocation.latitude?.toFixed(6)}</span>
                            </div>
                            <div className="w-[1px] h-10 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                            <div className="flex flex-col items-center">
                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-1.5">Link Stability</span>
                                <div className="flex gap-1.5 items-end h-3">
                                    {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-1 rounded-sm transition-all duration-700 ${i <= 4 ? 'bg-primary shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-white/10'} ${i === 1 ? 'h-1' : i === 2 ? 'h-2' : i === 3 ? 'h-3' : i === 4 ? 'h-2' : 'h-1.5'}`} />)}
                                </div>
                            </div>
                            <div className="w-[1px] h-10 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                            <button
                                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedLocation.latitude},${selectedLocation.longitude}`, '_blank')}
                                className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-xl active:scale-90 group/btn"
                            >
                                <ExternalLink className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Left Bottom Floating Intelligence Card */}
                    <div className="absolute bottom-6 left-[410px] right-[160px] lg:left-[430px] lg:right-[180px] z-40 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <div className="bg-black/80 backdrop-blur-[40px] border border-white/10 rounded-[2.5rem] p-6 lg:p-8 shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col gap-5 overflow-hidden relative group border-glow-primary transition-all duration-500">
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-all duration-1000" />

                            {/* Row 1: Identity & Primary Stats */}
                            <div className="flex items-start gap-8 relative z-10">
                                <div className="relative shrink-0 group/photo">
                                    {extraDetails?.owner?.additional_data?.photo_url ? (
                                        <img src={extraDetails.owner.additional_data.photo_url} className="w-20 h-20 lg:w-24 lg:h-24 rounded-3xl object-cover ring-2 ring-primary/20 shadow-2xl transition-all duration-700 group-hover/photo:ring-primary/40 group-hover/photo:scale-105" />
                                    ) : (
                                        <div className="w-20 h-20 lg:w-24 lg:h-24 bg-zinc-900 rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl group-hover:border-primary/30 transition-colors">
                                            <User className="w-10 h-10 lg:w-12 lg:h-12 text-zinc-700 group-hover:text-primary/40 transition-colors" />
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 lg:w-9 lg:h-9 bg-green-500 rounded-xl border-4 border-[#0a0a0a] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                                        <ShieldCheck className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-3 mb-2.5">
                                        <div className="px-3 py-1 bg-primary/10 border border-primary/20 text-[8px] font-black text-primary uppercase italic rounded-lg tracking-widest shadow-[0_0_10px_rgba(168,85,247,0.1)] transition-colors group-hover:bg-primary/20">Secured Digital Twin</div>
                                        {selectedLocation.type === 'emergency' && (
                                            <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-[8px] font-black text-red-500 uppercase italic rounded-lg tracking-widest animate-pulse">Critical Link Active</div>
                                        )}
                                    </div>
                                    <h2 className="text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tighter truncate leading-none mb-4 transition-all group-hover:translate-x-1">{extraDetails?.owner?.full_name || selectedLocation.owner_name}</h2>

                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                                        <div className="flex flex-col">
                                            <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest italic mb-0.5">Contact Vector</span>
                                            <span className="text-[11px] font-bold text-zinc-300 tabular-nums uppercase">{extraDetails?.owner?.phone || selectedLocation.owner_phone || 'Unknown'}</span>
                                        </div>
                                        <div className="w-px h-5 bg-white/10" />
                                        <div className="flex flex-col">
                                            <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest italic mb-0.5">Base Station</span>
                                            <span className="text-[11px] font-bold text-zinc-300 uppercase truncate max-w-[200px] italic">{selectedLocation.location_address || 'No Fixed Address'}</span>
                                        </div>
                                        <div className="w-px h-5 bg-white/10" />
                                        <div className="flex flex-col">
                                            <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest italic mb-0.5">Biometric</span>
                                            <span className="text-[11px] font-black text-red-500 italic uppercase leading-none">{extraDetails?.owner?.blood_group || '--'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Emergency Signal & Team Uplinks */}
                            <div className="flex items-center justify-between gap-6 pt-5 border-t border-white/5 relative z-10 transition-all group-hover:border-primary/10">
                                <div className="flex-1 min-w-0">
                                    {selectedLocation.type === 'emergency' ? (
                                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-4 group/msg hover:bg-red-500/15 transition-all">
                                            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0 border border-red-500/30">
                                                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em] italic mb-0.5 animate-pulse">Emergency Signal Detected</p>
                                                <p className="text-[11px] font-bold text-white uppercase italic truncate">"{extraDetails?.emergency?.details || selectedLocation.details || 'SOS TRIGGERED BY USER'}"</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 group/chain overflow-x-auto custom-scrollbar no-scrollbar pb-1">
                                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em] italic shrink-0">Uplink Chain:</span>
                                            <div className="flex items-center gap-3">
                                                {extraDetails?.contacts?.slice(0, 3).map((c: any, i: number) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => window.location.href = `tel:${c.phone}`}
                                                        className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl hover:bg-primary/20 hover:border-primary/40 transition-all group/contact relative overflow-hidden"
                                                    >
                                                        <div className="w-8 h-8 lg:w-9 lg:h-9 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center shrink-0 group-hover/contact:border-primary/50">
                                                            <span className="text-primary font-black italic text-sm">{c.name[0]}</span>
                                                        </div>
                                                        <div className="flex flex-col items-start min-w-0">
                                                            <span className="text-[10px] font-black text-white uppercase truncate max-w-[80px] leading-tight group-hover/contact:text-primary transition-colors">{c.name}</span>
                                                            <span className="text-[7.5px] font-black text-zinc-600 uppercase tracking-widest leading-none mt-1 group-hover/contact:text-zinc-400">{c.relationship || 'Emergency'}</span>
                                                        </div>
                                                        <div className="ml-1 w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center group-hover/contact:bg-primary group-hover/contact:scale-110 transition-all">
                                                            <Phone className="w-3 h-3 text-zinc-500 group-hover/contact:text-white" />
                                                        </div>
                                                    </button>
                                                ))}
                                                {(!extraDetails?.contacts || extraDetails.contacts.length === 0) && (
                                                    <p className="text-[9px] font-bold text-zinc-700 uppercase italic tracking-widest pl-2">Signal Silence (No Contacts)</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        onClick={() => setShowContactPopup(true)}
                                        className="px-6 py-3 bg-red-600/20 border border-red-500/30 rounded-2xl transition-all shadow-xl active:scale-95 hover:bg-red-600/30 flex items-center gap-3 group/sos"
                                    >
                                        <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center group-hover/sos:scale-110 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                                            <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-[7.5px] font-black text-red-500 uppercase tracking-widest leading-none mb-0.5">Emergency</span>
                                            <span className="text-[10px] font-black text-white uppercase italic tracking-widest">Call Uplinks</span>
                                        </div>
                                    </button>

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tactical Contact Modal */}
                    {showContactPopup && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowContactPopup(false)} />
                            <div className="bg-zinc-950 border border-white/10 rounded-[3rem] w-full max-w-lg overflow-hidden relative shadow-[0_0_100px_rgba(0,0,0,1)] border-glow-primary animate-in zoom-in-95 duration-300">
                                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

                                <div className="p-8 pb-4 flex items-center justify-between border-b border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                                            <Shield className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Response Network</h3>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Establishing secure communication...</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowContactPopup(false)}
                                        className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors group"
                                    >
                                        <X className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
                                    </button>
                                </div>

                                <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                    {extraDetails?.contacts?.length > 0 ? extraDetails.contacts.map((c: any, i: number) => (
                                        <button
                                            key={i}
                                            onClick={() => window.location.href = `tel:${c.phone}`}
                                            className="w-full flex items-center justify-between p-5 bg-white/[0.03] border border-white/5 rounded-3xl hover:bg-primary/10 hover:border-primary/30 transition-all group/contact relative overflow-hidden"
                                        >
                                            <div className="flex items-center gap-5 relative z-10">
                                                <div className="w-14 h-14 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center shrink-0 group-hover/contact:border-primary/50 shadow-xl transition-all">
                                                    <span className="text-primary font-black italic text-xl">{c.name[0]}</span>
                                                </div>
                                                <div className="flex flex-col items-start min-w-0">
                                                    <span className="text-lg font-black text-white uppercase truncate group-hover/contact:text-primary transition-colors italic">{c.name}</span>
                                                    <span className="px-3 py-0.5 bg-white/5 rounded-full text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1.5 group-hover/contact:bg-primary/20 group-hover/contact:text-primary transition-all">{c.relationship || 'Emergency Responder'}</span>
                                                </div>
                                            </div>
                                            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg transform translate-x-12 opacity-0 group-hover/contact:translate-x-0 group-hover/contact:opacity-100 transition-all duration-500">
                                                <Phone className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-end group-hover/contact:opacity-0 transition-opacity">
                                                <span className="text-[10px] font-bold text-zinc-600 tabular-nums">{c.phone}</span>
                                                <span className="text-[7px] font-black text-primary uppercase tracking-widest mt-1">Ready</span>
                                            </div>
                                        </button>
                                    )) : (
                                        <div className="py-12 flex flex-col items-center justify-center opacity-30 italic">
                                            <Radar className="w-16 h-16 text-zinc-700 animate-pulse" />
                                            <span className="mt-4 text-[10px] font-black uppercase tracking-[0.3em]">No Uplinks Configured</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 bg-white/[0.02] border-t border-white/5">
                                    <div className="flex items-center gap-3 px-6 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest italic">Encrypted Connection Ready for Dispatch</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Right-side Visual Feed Hub (Floating) */}
                    <div className="absolute right-6 top-[136px] bottom-10 w-28 lg:w-36 z-40 flex flex-col gap-5 animate-in slide-in-from-right duration-1000">
                        <div className="bg-black/50 backdrop-blur-[30px] border border-white/10 rounded-[2.5rem] p-5 shadow-[0_0_50px_rgba(0,0,0,0.6)] flex flex-col h-full hover:border-primary/30 transition-colors">
                            <p className="text-[8px] font-black text-primary uppercase text-center mb-6 tracking-[0.4em] italic drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">Live Feed</p>
                            <div className="space-y-5 overflow-y-auto custom-scrollbar flex-1 pr-1">
                                {extraDetails?.photos && extraDetails.photos.length > 0 ? extraDetails.photos.map((photo: string, idx: number) => (
                                    <div key={idx} className="aspect-square rounded-[1.8rem] overflow-hidden border-2 border-white/10 relative group bg-zinc-950 cursor-pointer shadow-xl transition-all duration-700 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                                        <img src={photo} className="w-full h-full object-cover transition-all duration-1000 grayscale group-hover:grayscale-0 scale-125 group-hover:scale-100 brightness-75 group-hover:brightness-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-500">
                                                <Eye className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                        <div className="absolute inset-0" onClick={() => window.open(photo, '_blank')} />
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-1 h-1 rounded-full bg-primary" />
                                            <div className="w-1 h-1 rounded-full bg-primary" />
                                            <div className="w-1 h-1 rounded-full bg-primary" />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-3 italic">
                                        <Camera className="w-8 h-8 text-zinc-700" />
                                        <span className="text-[7px] font-black uppercase tracking-[0.2em] text-center">No Signal</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style jsx global>{`
                @keyframes scan {
                    0% { transform: translateY(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(100vh); opacity: 0; }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 2px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(168, 85, 247, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(168, 85, 247, 0.4);
                }
                .border-glow-primary {
                    box-shadow: 0 0 40px rgba(0,0,0,0.5), inset 0 0 1px rgba(168,85,247,0.2);
                }
                .border-glow-primary:hover {
                    box-shadow: 0 0 50px rgba(168,85,247,0.1), inset 0 0 2px rgba(168,85,247,0.3);
                }
            `}</style>
        </div>
    )
}
