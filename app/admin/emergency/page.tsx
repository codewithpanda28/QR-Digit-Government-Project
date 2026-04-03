'use client';

import { useState, useEffect } from 'react';
import {
    Search, MapPin, Phone, User, Clock, AlertCircle,
    Camera, X, CheckCircle, XCircle, Shield, Bell,
    ArrowUpRight, Activity, Filter, RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface EmergencyAlert {
    id: string;
    qr_id: string;
    user_id: string;
    alert_type: string;
    latitude: number;
    longitude: number;
    location_address: string;
    status: 'active' | 'resolved' | 'false_alarm';
    created_at: string;
    updated_at: string;
    qr_codes?: {
        qr_number: string;
        category: string;
        qr_details: any;
    };
    emergency_contacts?: Array<{
        name: string;
        phone: string;
        relationship: string;
    }>;
}

export default function EmergencyDashboard() {
    const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null);
    const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);

    useEffect(() => {
        loadAlerts();

        const channel = supabase
            .channel('emergency-alerts')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'emergency_alerts' },
                (payload) => {
                    loadAlerts();
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('🚨 NEW EMERGENCY ALERT!', {
                            body: 'A new SOS has been activated. Check immediately!',
                        });
                    }
                })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function loadAlerts() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('emergency_alerts')
                .select(`
                    *,
                    qr_codes (
                        qr_number,
                        category,
                        qr_details
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAlerts(data || []);
        } catch (error) {
            console.error('Error loading alerts:', error);
        } finally {
            setLoading(false);
        }
    }

    async function loadAlertEvidence(id: string, qrId: string) {
        try {
            setEvidencePhotos([]);
            const folderPath = `emergencies/${qrId}/${id}`;
            const { data: files, error: listError } = await supabase.storage.from('emergency-evidence').list(folderPath);

            if (listError) throw listError;

            if (files && files.length > 0) {
                const urls = await Promise.all(files.map(async (f) => {
                    const { data } = await supabase.storage.from('emergency-evidence').createSignedUrl(`${folderPath}/${f.name}`, 3600);
                    return data?.signedUrl || '';
                }));
                setEvidencePhotos(urls.filter(u => u !== ''));
            }
        } catch (error) {
            console.error('Error loading evidence:', error);
        }
    }

    async function updateAlertStatus(id: string, newStatus: 'resolved' | 'false_alarm') {
        try {
            const { error } = await supabase
                .from('emergency_alerts')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            loadAlerts();
            setSelectedAlert(null);
        } catch (error) {
            console.error('Error updating alert:', error);
        }
    }

    const filteredAlerts = alerts.filter(alert => {
        const matchesFilter = filter === 'all' || alert.status === filter;
        const matchesSearch =
            alert.location_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            alert.qr_codes?.qr_number?.includes(searchQuery);
        return matchesFilter && matchesSearch;
    });

    const activeCount = alerts.filter(a => a.status === 'active').length;

    return (
        <div className="min-h-screen bg-[#030303] text-foreground p-4 lg:p-8">

            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
            </div>

            <main className="relative z-10 max-w-[1600px] mx-auto">

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-600/20">
                                <Bell className="w-5 h-5 text-white animate-bounce" />
                            </div>
                            <h1 className="text-4xl font-black tracking-tighter text-white italic uppercase">Emergency Command Center</h1>
                        </div>
                        <p className="text-zinc-500 font-medium">Real-time incident monitoring and response system</p>
                    </div>

                    <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-white/5 backdrop-blur-xl">
                        <button
                            onClick={() => setFilter('active')}
                            className={`px-6 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${filter === 'active' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                        >
                            Active ({activeCount})
                        </button>
                        <button
                            onClick={() => setFilter('resolved')}
                            className={`px-6 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${filter === 'resolved' ? 'bg-green-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                        >
                            Resolved
                        </button>
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-6 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${filter === 'all' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                        >
                            All Logs
                        </button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-12 gap-8">

                    {/* List of Alerts */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                                type="text"
                                placeholder="Search by QR number or location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white outline-none focus:border-red-500/50 transition-all placeholder:text-zinc-700"
                            />
                        </div>

                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
                                    <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">Syncing Alerts...</span>
                                </div>
                            ) : filteredAlerts.length === 0 ? (
                                <div className="bg-zinc-900/30 border border-dashed border-white/5 rounded-[2rem] p-12 text-center">
                                    <Shield className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                    <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">No active threats detected</p>
                                </div>
                            ) : (
                                filteredAlerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        onClick={() => {
                                            setSelectedAlert(alert);
                                            loadAlertEvidence(alert.id, alert.qr_id);
                                        }}
                                        className={`group relative bg-zinc-900/40 border transition-all cursor-pointer p-6 rounded-[2rem] overflow-hidden ${selectedAlert?.id === alert.id ? 'border-red-600 border-2 bg-zinc-900' : 'border-white/5 hover:border-white/20'}`}
                                    >
                                        {alert.status === 'active' && (
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 blur-[40px] rounded-full" />
                                        )}

                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alert.status === 'active' ? 'bg-red-600/20 text-red-500' : 'bg-green-600/20 text-green-500'}`}>
                                                    <Activity className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-white uppercase tracking-tighter">QR: {alert.qr_codes?.qr_number}</div>
                                                    <div className="text-[10px] font-bold text-zinc-500 uppercase">{alert.alert_type}</div>
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-black text-zinc-600 uppercase tabular-nums">
                                                {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2 text-zinc-400 mb-4">
                                            <MapPin className="w-3 h-3 mt-1 flex-shrink-0" />
                                            <p className="text-[11px] font-medium leading-relaxed line-clamp-1">{alert.location_address}</p>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${alert.status === 'active' ? 'bg-red-600 text-white animate-pulse' : 'bg-zinc-800 text-zinc-500'}`}>
                                                {alert.status}
                                            </div>
                                            <ArrowUpRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-colors" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Detailed Monitor */}
                    <div className="lg:col-span-8">
                        {selectedAlert ? (
                            <div className="bg-zinc-900/30 border border-white/5 rounded-[3rem] p-8 lg:p-12 min-h-[70vh] flex flex-col backdrop-blur-3xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8">
                                    <button onClick={() => setSelectedAlert(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-zinc-400 shadow-xl" />
                                    </button>
                                </div>

                                <div className="grid lg:grid-cols-2 gap-12 flex-grow">
                                    {/* Left: Victim Data */}
                                    <div className="space-y-10">
                                        <div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 mb-4">
                                                <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
                                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Incident In Progress</span>
                                            </div>
                                            <h2 className="text-5xl font-black text-white tracking-tighter mb-2 italic">
                                                {selectedAlert.qr_codes?.qr_details?.full_name || 
                                                 (Array.isArray(selectedAlert.qr_codes?.qr_details) ? selectedAlert.qr_codes.qr_details[0]?.full_name : 'Anonymous User')}
                                            </h2>
                                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">QR ID: {selectedAlert.qr_codes?.qr_number}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 bg-black/40 p-8 rounded-[2rem] border border-white/5">
                                            <div>
                                                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Age Group</div>
                                                <div className="text-lg font-black text-white">
                                                    {Array.isArray(selectedAlert.qr_codes?.qr_details)
                                                        ? selectedAlert.qr_codes.qr_details[0]?.age
                                                        : selectedAlert.qr_codes?.qr_details?.age || 'N/A'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Alert Category</div>
                                                <div className="text-lg font-black text-white capitalize">{selectedAlert.alert_type}</div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Emergency Contacts</h4>
                                            <div className="space-y-3">
                                                {selectedAlert.emergency_contacts && selectedAlert.emergency_contacts.length > 0 ? (
                                                    selectedAlert.emergency_contacts.map((contact, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-4 bg-zinc-900/60 rounded-2xl border border-white/5">
                                                            <div>
                                                                <div className="text-sm font-black text-white">{contact.name}</div>
                                                                <div className="text-[10px] font-bold text-zinc-500 uppercase">{contact.relationship}</div>
                                                            </div>
                                                            <a href={`tel:${contact.phone}`} className="p-3 bg-green-600 hover:bg-green-500 rounded-xl transition-colors">
                                                                <Phone className="w-4 h-4 text-white" />
                                                            </a>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-zinc-700 italic text-sm">No emergency contacts listed</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Location & Evidence */}
                                    <div className="space-y-8">
                                        <div className="relative aspect-video rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl group">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                frameBorder="0"
                                                src={`https://www.google.com/maps?q=${selectedAlert.latitude},${selectedAlert.longitude}&output=embed`}
                                                className="grayscale invert"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black p-6">
                                                <div className="flex items-start gap-3">
                                                    <MapPin className="w-5 h-5 text-red-600 flex-shrink-0" />
                                                    <p className="text-xs font-bold text-white leading-relaxed">{selectedAlert.location_address}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Evidence Feed</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                {evidencePhotos.length > 0 ? (
                                                    evidencePhotos.map((photo, i) => (
                                                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-white/5">
                                                            <Image src={photo} alt="Evidence" fill className="object-cover" />
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="col-span-2 py-10 flex flex-col items-center justify-center bg-zinc-900/40 rounded-[2rem] border border-white/5">
                                                        <Camera className="w-8 h-8 text-zinc-800 mb-2" />
                                                        <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">No Visual Evidence</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 flex flex-wrap gap-4 pt-8 border-t border-white/5">
                                    <button
                                        onClick={() => updateAlertStatus(selectedAlert.id, 'resolved')}
                                        className="flex-1 py-5 bg-green-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-green-500 shadow-xl shadow-green-600/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" /> Finalize Resolution
                                    </button>
                                    <button
                                        onClick={() => updateAlertStatus(selectedAlert.id, 'false_alarm')}
                                        className="flex-1 py-5 bg-zinc-800 text-zinc-400 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" /> False Alarm
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[70vh] flex flex-col items-center justify-center text-center p-12 bg-zinc-900/20 border border-white/5 border-dashed rounded-[4rem]">
                                <div className="w-32 h-32 bg-zinc-900 rounded-[3rem] flex items-center justify-center mb-8 border border-white/5 ring-8 ring-zinc-900/50">
                                    <Activity className="w-12 h-12 text-zinc-700" />
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-tighter mb-2 italic">AWAITING INCIDENT</h3>
                                <p className="text-zinc-600 max-w-xs text-xs font-bold leading-relaxed uppercase tracking-widest">Select an active alert from the feed to initiate investigation protocols.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
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
        </div>
    );
}
