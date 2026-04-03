'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
    Users, Plus, Shield, Globe, 
    Link as LinkIcon, Trash2, Edit, 
    Copy, ShieldCheck, Mail, Key,
    ArrowRight, Loader2, QrCode
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createAdmin, getGlobalHierarchy, deleteAdmin } from '@/app/admin/actions'
import toast from 'react-hot-toast'

export default function AnalyticsManagementPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [hierarchyData, setHierarchyData] = useState<{ hierarchy: any[], orphans: any[] }>({ hierarchy: [], orphans: [] })
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ name: '', email: '', passcode: '', login_slug: '', brand_color: '#a5ff00' })

    const colorPresets = [
        { name: 'Neon Green', hex: '#a5ff00' },
        { name: 'Cyber Blue', hex: '#00ccff' },
        { name: 'Vapor Purple', hex: '#a855f7' },
        { name: 'Safety Orange', hex: '#f97316' },
        { name: 'Crimson Red', hex: '#ef4444' },
    ]

    useEffect(() => {
        checkAuth()
    }, [])

    async function checkAuth() {
        const superPro = localStorage.getItem('super_pro_admin_session')
        
        if (superPro) {
            setUserRole('super_pro_admin')
            loadData()
        } else {
            router.push('/admin/dashboard')
            toast.error('Access Denied: Super Pro access required')
        }
    }

    async function loadData() {
        setLoading(true)
        const result = await getGlobalHierarchy()
        if (result.success && result.data) setHierarchyData(result.data)
        setLoading(false)
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (form.passcode.length !== 6) return toast.error('Passcode must be 6 digits')
        
        setLoading(true)
        try {
            const superProSession = localStorage.getItem('super_pro_admin_session')
            const creatorId = superProSession ? 'super_pro_admin' : JSON.parse(localStorage.getItem('admin_session')!).id

            const slug = form.login_slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 
                         (form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6))

            const res = await createAdmin({
                ...form,
                role: 'analytics_admin',
                created_by: creatorId,
                login_slug: slug
            })

            if (!res.success) throw new Error(res.error)

            toast.success('Analytics Portal Created Successfully!')
            loadData()
            setShowModal(false)
            setForm({ name: '', email: '', passcode: '', login_slug: '', brand_color: '#a5ff00' })
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-[#09090b] p-8 lg:p-16">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
                    <div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic mb-4">
                            Managed Portals
                        </h1>
                        <p className="text-zinc-500 font-bold tracking-wide uppercase text-xs">
                            Central directory for client & society analytics dashboards
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-primary text-white font-black px-10 py-5 rounded-3xl hover:shadow-[0_20px_60px_rgba(168,85,247,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center gap-4 group"
                    >
                        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                        ONBOARD NEW SOCIETY
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {hierarchyData.orphans.map((client: any) => (
                        <div key={client.id} className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] hover:border-primary/40 transition-all group relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-32 h-32 blur-[50px] rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: client.brand_color || '#a855f7' }}></div>
                            
                            <div>
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10" style={{ borderColor: (client.brand_color || '#a855f7') + '40' }}>
                                            <Globe className="w-6 h-6" style={{ color: client.brand_color || '#a5ff00' }} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white uppercase italic">{client.name}</h3>
                                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">{client.email}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={async () => {
                                            if (confirm('Permanently delete this portal?')) {
                                                await deleteAdmin(client.id)
                                                loadData()
                                            }
                                        }}
                                        className="text-zinc-800 hover:text-rose-500 transition-colors p-2"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Fleet Strength</span>
                                        <span className="font-black italic" style={{ color: client.brand_color || '#a5ff00' }}>{client.total_qr_codes || 0} ACTIVE NODES</span>
                                    </div>

                                    <div className="bg-black border border-white/5 p-5 rounded-3xl group-hover:border-white/10 transition-all">
                                        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                            <LinkIcon className="w-3 h-3" style={{ color: client.brand_color || '#a5ff00' }} /> Shareable Portal URL
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 min-w-0">
                                                <code className="text-[11px] font-mono truncate block" style={{ color: (client.brand_color || '#a5ff00') + 'cc' }}>
                                                    {typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/admin/login/${client.login_slug}` : `/admin/login/${client.login_slug}`}
                                                </code>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const url = `${window.location.protocol}//${window.location.host}/admin/login/${client.login_slug}`;
                                                    navigator.clipboard.writeText(url);
                                                    toast.success('Client URL Copied!');
                                                }}
                                                className="bg-white/5 hover:bg-zinc-800 text-white p-3 rounded-2xl transition-all shadow-xl"
                                                title="Copy Link"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <button
                                    onClick={() => router.push(`/admin/generate?assign_to=${client.id}`)}
                                    className="flex-1 py-4 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn shadow-xl hover:scale-[1.02]"
                                    style={{ backgroundColor: client.brand_color || '#a855f7' }}
                                >
                                    <Plus className="w-3.5 h-3.5 group-hover/btn:rotate-90 transition-transform" />
                                    ADD INVENTORY
                                </button>
                                <button
                                    onClick={() => router.push(`/admin/qrcodes?owner_id=${client.id}`)}
                                    className="flex-1 py-4 border border-zinc-800 text-zinc-500 font-bold rounded-2xl text-[10px] uppercase tracking-widest hover:border-zinc-700 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    DIRECTORY
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {hierarchyData.orphans.length === 0 && (
                    <div className="text-center py-32 border-2 border-dashed border-zinc-800 rounded-[3rem]">
                        <Users className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
                        <h3 className="text-2xl font-black text-zinc-600 uppercase italic">No managed portals found</h3>
                        <p className="text-zinc-800 text-sm font-bold mt-2">Onboard your first society to see them in this directory.</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                    <div className="bg-zinc-950 border border-white/5 w-full max-w-xl rounded-[3rem] p-12 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                        
                        <h2 className="text-3xl font-black text-white italic uppercase mb-8 flex items-center gap-4">
                            <Plus className="text-primary" /> Onboard Society
                        </h2>

                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2 font-mono">Organization Name</label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                                        <input
                                            required
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className="w-full bg-black border border-zinc-800 rounded-2xl px-12 py-4 text-white font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-zinc-800"
                                            placeholder="e.g. Paramount Elite"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2 font-mono">Contact Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                                        <input
                                            required
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="w-full bg-black border border-zinc-800 rounded-2xl px-12 py-4 text-white font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-zinc-800"
                                            placeholder="manager@paramount.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2 font-mono">Access Passcode</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                                        <input
                                            required
                                            type="password"
                                            maxLength={6}
                                            value={form.passcode}
                                            onChange={(e) => setForm({ ...form, passcode: e.target.value.replace(/\D/g, '') })}
                                            className="w-full bg-black border border-zinc-800 rounded-2xl px-12 py-4 text-white font-bold text-2xl tracking-[0.5em] focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-zinc-800"
                                            placeholder="******"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2 font-mono">URL Path (Slug)</label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                                        <input
                                            type="text"
                                            value={form.login_slug}
                                            onChange={(e) => setForm({ ...form, login_slug: e.target.value })}
                                            className="w-full bg-black border border-zinc-800 rounded-2xl px-12 py-4 text-white font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-zinc-800"
                                            placeholder="paramount-sec"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2 font-mono">Theme Identity (Portal Color)</label>
                                <div className="flex flex-wrap items-center gap-4 bg-black/40 border border-zinc-800 p-4 rounded-3xl">
                                    {colorPresets.map((color) => (
                                        <button
                                            key={color.hex}
                                            type="button"
                                            onClick={() => setForm({ ...form, brand_color: color.hex })}
                                            className={`w-10 h-10 rounded-full border-4 transition-all hover:scale-110 relative ${form.brand_color === color.hex ? 'border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-transparent opacity-50'}`}
                                            style={{ backgroundColor: color.hex }}
                                            title={color.name}
                                        >
                                            {form.brand_color === color.hex && (
                                                <ShieldCheck className="w-4 h-4 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-5 border border-zinc-800 text-zinc-500 font-black rounded-3xl hover:bg-zinc-900 transition-all uppercase tracking-widest text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] py-5 bg-primary text-white font-black rounded-3xl hover:shadow-[0_20px_40px_rgba(168,85,247,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'SECURE ONBOARDING'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
