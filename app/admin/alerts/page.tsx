'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
    AlertTriangle, Phone, MapPin, CheckCircle, Clock, Search,
    Filter, Download, MoreVertical, ExternalLink, Shield,
    X, User, Info, Eye, Camera, MessageSquare, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { getAlertDetails } from '@/app/admin/actions'
import toast from 'react-hot-toast'

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedAlert, setSelectedAlert] = useState<any>(null)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [alertDetails, setAlertDetails] = useState<any>(null)

    useEffect(() => {
        loadAlerts()
    }, [])

    async function loadAlerts() {
        try {
            setLoading(true)

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

            if (!isSuperPro && !userId) {
                setLoading(false)
                setAlerts([])
                return
            }

            let myIds: string[] = []
            if (!isSuperPro && userId) {
                // Fetch user's own role to check if they are Super Admin
                const { data: userData } = await supabase.from('users').select('role').eq('id', userId).maybeSingle();

                let targetUserIds = [userId];

                // If Super Admin, also include their sub-admins' IDs
                if (userData?.role === 'super_admin') {
                    const { data: subs } = await supabase.from('users').select('id').eq('created_by', userId);
                    if (subs) targetUserIds = [...targetUserIds, ...subs.map(s => s.id)];
                }

                const { data: myQRs } = await supabase
                    .from('qr_codes')
                    .select('id')
                    .in('generated_by', targetUserIds)

                myIds = (myQRs || []).map(q => q.id)

                if (myIds.length === 0) {
                    setAlerts([])
                    return
                }
            }

            let query = supabase
                .from('emergency_alerts')
                .select('*')
                .order('alert_time', { ascending: false })

            if (!isSuperPro && myIds.length > 0) {
                query = query.in('qr_id', myIds)
            }

            const { data, error } = await query
            if (error) {
                console.error('Database Error:', error.message, error.details);
                throw error;
            }

            // Fetch owner names and QR numbers in parallel for better reliability
            const alertsWithDetails = await Promise.all((data || []).map(async (alert) => {
                const [ownerRes, qrRes] = await Promise.all([
                    supabase.from('qr_details').select('full_name').eq('qr_id', alert.qr_id).maybeSingle(),
                    supabase.from('qr_codes').select('qr_number').eq('id', alert.qr_id).maybeSingle()
                ]);

                return {
                    ...alert,
                    owner_name: ownerRes.data?.full_name || 'Anonymous',
                    qr_codes: qrRes.data || { qr_number: '??' }
                }
            }))

            setAlerts(alertsWithDetails)
        } catch (error: any) {
            console.error('Alert Sync Failure:', error.message || error);
        } finally {
            setLoading(false)
        }
    }

    async function handleViewDetails(alertId: string) {
        setSelectedAlert(alertId)
        setDetailsLoading(true)
        setAlertDetails(null)
        try {
            const result = await getAlertDetails(alertId)
            if (result.success) {
                setAlertDetails(result.data)
            } else {
                toast.error('Failed to load full details')
            }
        } catch (e) {
            toast.error('Connection error')
        } finally {
            setDetailsLoading(false)
        }
    }

    const filteredAlerts = alerts.filter(a =>
        a.location_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.qr_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-background text-foreground p-6 lg:p-12 mb-20 md:mb-0 selection:bg-red-500/30">
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-[0.3em] mb-4">
                            <AlertTriangle className="w-4 h-4 fill-red-500" />
                            Security Protocol Logs
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-red-600">Emergency Center</h1>
                        <p className="text-muted-foreground text-lg font-medium">Real-time SOS monitoring and incident response tracking.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-red-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by Name, Location, ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-11 pr-6 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl w-full sm:w-80 font-bold text-sm focus:border-red-500/50 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Incident & Owner</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Timestamp</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Location</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {loading ? (
                                    [1, 2, 3].map(i => <tr key={i} className="animate-pulse"><td colSpan={4} className="h-24 bg-white/5"></td></tr>)
                                ) : filteredAlerts.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-24 text-center">
                                            <Shield className="w-16 h-16 text-zinc-800 mx-auto mb-6 opacity-20" />
                                            <p className="text-xl font-bold text-zinc-500 tracking-tight">System Secure: No Alerts</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAlerts.map((alert) => (
                                        <tr key={alert.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-2xl ${alert.alert_type === 'call_trigger' ? 'bg-orange-500/10 text-orange-400' : alert.alert_type === 'location_share' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400 animate-pulse'}`}>
                                                        {alert.alert_type === 'call_trigger' ? <Phone className="w-5 h-5" /> : alert.alert_type === 'location_share' ? <MapPin className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white text-sm uppercase italic">{alert.owner_name}</p>
                                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{alert.alert_type?.replace(/_/g, ' ') || 'Alert'} • ID: {alert.qr_codes?.qr_number || alert.qr_id?.slice(0, 4) || '----'}</p>
                                                    </div >
                                                </div >
                                            </td >
                                            <td className="px-8 py-6">
                                                <p className="text-zinc-300 font-bold text-sm tracking-tighter">{new Date(alert.alert_time).toLocaleDateString()} {new Date(alert.alert_time).toLocaleTimeString()}</p>
                                            </td>
                                            <td className="px-8 py-6 max-w-sm">
                                                <div className="flex items-start gap-2 text-zinc-400">
                                                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                                                    <p className="text-sm font-medium line-clamp-1">{alert.location_address || 'GPS COORDINATES'}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button 
                                                    onClick={() => handleViewDetails(alert.id)}
                                                    className="px-6 py-2.5 bg-zinc-800 hover:bg-white hover:text-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl"
                                                >
                                                    View Case Details
                                                </button>
                                            </td>
                                        </tr >
                                    ))
                                )
}
                            </tbody >
                        </table >
                    </div >
                </div >
            </div >

    {/* Incident Details Modal */ }
{
    selectedAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setSelectedAlert(null)}></div>
            <div className="relative bg-zinc-950 border border-zinc-900 w-full max-w-5xl h-full max-h-[90vh] rounded-[3rem] overflow-hidden flex flex-col shadow-3xl animate-in fade-in zoom-in duration-300">
                {/* Modal Header */}
                <div className="p-8 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/20">
                    <div>
                        <h3 className="text-2xl font-black italic uppercase text-red-500 flex items-center gap-3">
                            <ShieldAlert className="w-8 h-8" />
                                    Incident Report #{ selectedAlert?.toString().slice(0, 8) || '---' }
                                </h3 >
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Detailed evidence & owner intelligence</p>
                            </div >
        <button onClick={() => setSelectedAlert(null)} className="p-4 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-colors">
            <X className="w-6 h-6 text-zinc-500" />
        </button>
                        </div >

    {
        detailsLoading?(
                            <div className = "flex-1 flex flex-col items-center justify-center space-y-4" >
                                <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
                                <p className="text-zinc-500 font-black text-xs uppercase tracking-widest">Retrying Evidence Uplink...</p>
                            </div>
                        ) : alertDetails ? (
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left Column: Owner & Stats */}
                <div className="space-y-8">
                    <section className="bg-zinc-900/30 p-8 rounded-3xl border border-white/5">
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                            <User className="w-4 h-4" /> User Digital Twins
                        </h4>
                        <div className="flex items-center gap-6">
                            {alertDetails.owner?.additional_data?.photo_url ? (
                                <img src={alertDetails.owner.additional_data.photo_url} className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white/5" />
                            ) : (
                                <div className="w-24 h-24 bg-zinc-800 rounded-2xl flex items-center justify-center"><User className="w-10 h-10 text-zinc-600" /></div>
                            )}
                            <div>
                                <p className="text-2xl font-black text-white italic uppercase tracking-tighter">{alertDetails.owner?.full_name || 'Unidentified'}</p>
                                <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mt-1">Age: {alertDetails.owner?.age || '--'} • Blood: {alertDetails.owner?.blood_group || '--'}</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-lg text-[9px] font-black uppercase">Emergency Beacon</span>
                                                        <span className="px-3 py-1 bg-white/5 text-zinc-400 rounded-lg text-[9px] font-black uppercase italic tracking-widest">QR #{alertDetails.alert?.qr_id?.slice(0, 8) || '----'}</span>
                                                    </div >
                                                </div >
                                            </div >
                                        </section >

                                        <section className="bg-zinc-900/30 p-8 rounded-3xl border border-white/5">
                                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                                <Info className="w-4 h-4" /> Physical Matrix
                                            </h4>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center p-3 rounded-xl bg-black/40 border border-white/5">
                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Home Address</span>
                                                    <span className="text-xs font-bold text-white text-right max-w-[200px] line-clamp-1">{alertDetails.owner?.home_address || 'Not Provided'}</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 rounded-xl bg-black/40 border border-white/5">
                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Alert Location</span>
                                                    <span className="text-xs font-bold text-white text-right max-w-[200px] line-clamp-1 italic">{alertDetails.alert.location_address || 'Unknown'}</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 rounded-xl bg-black/40 border border-white/5">
                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Coordinates</span>
                                                    <span className="text-xs font-bold font-mono text-white">{alertDetails.alert.latitude.toFixed(6)}, {alertDetails.alert.longitude.toFixed(6)}</span>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="bg-zinc-900/30 p-8 rounded-3xl border border-white/5">
                                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                                <Phone className="w-4 h-4" /> Guardian Network
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {alertDetails.contacts?.map((contact: any, idx: number) => (
                                                    <div key={idx} className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black italic">{contact.name[0]}</div>
                                                        <div>
                                                            <p className="text-sm font-bold text-white">{contact.name}</p>
                                                            <p className="text-[10px] font-bold text-zinc-500">{contact.phone}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!alertDetails.contacts || alertDetails.contacts.length === 0) && (
                                                    <p className="text-[10px] font-bold text-zinc-700 uppercase italic">No emergency contacts found.</p>
                                                )}
                                            </div>
                                        </section>
                                    </div >

        {/* Right Column: Visual Evidence */ }
        < div className = "space-y-8" >
                                        <section className="bg-zinc-900/30 p-6 rounded-[2.5rem] border border-white/5 h-[300px] overflow-hidden relative group">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                frameBorder="0"
                                                className="grayscale invert brightness-50 contrast-125"
                                                src={`https://maps.google.com/maps?q=${alertDetails.alert.latitude},${alertDetails.alert.longitude}&z=16&output=embed`}
                                            ></iframe>
                                            <div className="absolute inset-0 pointer-events-none border-[12px] border-zinc-950/20"></div>
                                            <a 
                                                href={`https://www.google.com/maps?q=${alertDetails.alert.latitude},${alertDetails.alert.longitude}`}
                                                target="_blank"
                                                className="absolute bottom-6 right-6 p-4 bg-red-600 text-white rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                            </a>
                                        </section>

                                        <section className="space-y-4">
                                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2 px-4">
                                                <Camera className="w-4 h-4" /> Visual Evidence Buffer
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                {alertDetails.photos?.map((photo: string, idx: number) => (
                                                    <div key={idx} className="aspect-[4/3] rounded-3xl overflow-hidden border border-white/5 bg-zinc-900 group relative">
                                                        <img src={photo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={`Evidence ${idx}`} />
                                                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <p className="text-[8px] font-black text-white uppercase tracking-widest italic">Cam Matrix {idx + 1}</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => window.open(photo, '_blank')}
                                                            className="absolute top-4 right-4 p-2 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {(!alertDetails.photos || alertDetails.photos.length === 0) && (
                                                    <div className="col-span-2 py-16 flex flex-col items-center border border-dashed border-white/5 rounded-[2.5rem] bg-zinc-900/20">
                                                        <Camera className="w-12 h-12 text-zinc-800 mb-4" />
                                                        <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest leading-relaxed text-center italic px-10">
                                                            No photographic evidence found in the incident buffer.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    </div >
                                </div >
                            </div >
                        ) : (
        <div className="p-20 text-center text-zinc-500">Uplink Failed.</div>
    )
}

{/* Footer */ }
<div className="p-8 border-t border-zinc-900 bg-zinc-900/10 flex justify-between items-center">
    <div className="flex items-center gap-4">
        <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">Incident Active • Digital Surveillance On</span>
    </div>
    <div className="flex gap-4">
        <button className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Dismiss</button>
        <button className="px-10 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-500/10">Mark Resolved</button>
    </div>
</div>
                    </div >
                </div >
            )}

<style jsx global>{`
                .animate-pulse-slow {
                    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #27272a;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #3f3f46;
                }
            `}</style>
        </div >
    )
}

function ShieldAlert(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
        </svg>
    )
}
