'use client'

import { supabase } from '@/lib/supabase'
import { QrCode, Search, Filter, ArrowRight, Shield, Download, Trash2, Eye, MoreVertical, Edit, Power, PowerOff, MapPin, Users, Activity, Plus } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'react-qr-code'
import toast from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'
import React, { Suspense, useState, useEffect } from 'react'

export default function MyQRCodesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Loading Inventory Matrix...</p>
            </div>
        }>
            <QRInventoryContent />
        </Suspense>
    )
}

function QRInventoryContent() {
    const searchParams = useSearchParams()
    const globalSearch = searchParams.get('search')

    const [qrcodes, setQrcodes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)

    useEffect(() => {
        setSearchTerm(globalSearch || '')
    }, [globalSearch])

    useEffect(() => {
        loadQRCodes()
    }, [])

    async function loadQRCodes() {
        try {
            setLoading(true)

            // Check session for filtering
            const superProSession = localStorage.getItem('super_pro_admin_session')
            const adminSession = localStorage.getItem('admin_session')
            let userId = null
            let isSuperPro = false

            if (superProSession) {
                isSuperPro = true
                setUserRole('super_pro_admin')
            } else if (adminSession) {
                try {
                    const session = JSON.parse(adminSession)
                    userId = session.id
                    setUserRole(session.role)
                } catch (e) { }
            }

            // Security: If not Super Pro and no User ID resolved from session, REJECT to 0 results
            if (!isSuperPro && !userId) {
                setQrcodes([])
                setLoading(false)
                return
            }

            let query = supabase
                .from('qr_codes')
                .select('*')
                .order('created_at', { ascending: false })

            if (!isSuperPro && userId) {
                // Fetch user's own role to check if they are Super Admin
                const { data: userData } = await supabase.from('users').select('role').eq('id', userId).maybeSingle();

                let targetUserIds = [userId];

                // If Super Admin, also include their sub-admins' IDs
                if (userData?.role === 'super_admin') {
                    const { data: subs } = await supabase.from('users').select('id').eq('created_by', userId);
                    if (subs) targetUserIds = [...targetUserIds, ...subs.map(s => s.id)];
                }

                query = query.in('generated_by', targetUserIds)
            }

            const { data, error } = await query

            if (error) throw error
            setQrcodes(data || [])
        } catch (error) {
            console.error('Error loading QR codes:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredQrs = qrcodes.filter(qr => {
        const ownerIdFilter = searchParams.get('owner_id')
        if (ownerIdFilter && qr.generated_by !== ownerIdFilter) return false

        return qr.qr_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            qr.category?.toLowerCase().includes(searchTerm.toLowerCase())
    })

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this QR code?')) return
        const tId = toast.loading('Deleting node from matrix...')
        try {
            const { deleteQRCode } = await import('@/app/admin/actions')
            const result = await deleteQRCode(id)
            
            if (!result.success) throw new Error(result.error)

            setQrcodes(prev => prev.filter(q => q.id !== id))
            setMenuOpenId(null)
            toast.success('Node deleted')
        } catch (error: any) {
            console.error('Delete failed:', error)
            toast.error(error.message || 'Failed to delete node')
        } finally {
            toast.dismiss(tId)
        }
    }

    async function toggleStatus(id: string, currentStatus: string) {
        // Toggle between 'activated' and 'inactive' (which maps to 'expired' in DB)
        const isCurrentlyInactive = currentStatus === 'inactive' || currentStatus === 'expired'
        const newStatus = isCurrentlyInactive ? 'activated' : 'inactive'

        const tId = toast.loading(`Changing status...`)
        try {
            const { toggleQRStatus } = await import('@/app/admin/actions')
            const result = await toggleQRStatus(id, newStatus)

            if (!result.success) throw new Error(result.error)

            setQrcodes(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q))
            toast.success(`Node is now ${newStatus === 'inactive' ? 'Inactive' : 'Active'}`)
        } catch (error: any) {
            console.error('Status toggle failed:', error)
            toast.error(error.message || 'Failed to update status')
        } finally {
            toast.dismiss(tId)
        }
    }

    return (
        <div className="min-h-screen bg-[#060608] text-zinc-100 p-6 lg:p-12 relative overflow-hidden" onClick={() => setMenuOpenId(null)}>
            {/* Background Decorative Elements */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Navigation & Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
                    <div className="space-y-4">
                        <Link
                            href="/admin/dashboard"
                            className="inline-flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors text-xs font-black uppercase tracking-[0.2em] group"
                        >
                            <span className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg group-hover:border-primary/50 transition-colors">
                                <ArrowRight className="w-3 h-3 rotate-180" />
                            </span>
                            Back to Core
                        </Link>
                        <div>
                            <h1 className="text-5xl lg:text-7xl font-black tracking-[-0.05em] uppercase italic leading-none mb-4">
                                QR <span className="text-primary drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">Inventory</span>
                            </h1>
                            <div className="flex items-center gap-4">
                                <div className="h-0.5 w-12 bg-primary"></div>
                                <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px] lg:text-xs">
                                    Manage your registered QR codes
                                </p>
                            </div>
                        </div>
                    </div>

                    {userRole !== 'analytics_admin' && (
                        <Link
                            href="/admin/generate"
                            className="group relative overflow-hidden px-12 py-5 bg-white text-black font-black rounded-2xl transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:shadow-primary/20 hover:-translate-y-1 active:scale-95 flex items-center justify-center"
                        >
                            <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <span className="relative z-10 flex items-center gap-3 group-hover:text-white transition-colors uppercase tracking-wider italic">
                                <Plus className="w-5 h-5" />
                                Create New QR
                            </span>
                        </Link>
                    )}
                </div>

                {/* Quick Stats Bar */}
                {!loading && filteredQrs.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <div className="bg-zinc-900/40 border border-white/5 backdrop-blur-md p-4 rounded-2xl">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">Total QRs</p>
                            <p className="text-2xl font-black text-white italic">{filteredQrs.length}</p>
                        </div>
                        <div className="bg-zinc-900/40 border border-white/5 backdrop-blur-md p-4 rounded-2xl">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">Active</p>
                            <p className="text-2xl font-black text-emerald-500 italic">{filteredQrs.filter(q => q.status === 'activated').length}</p>
                        </div>
                        <div className="bg-zinc-900/40 border border-white/5 backdrop-blur-md p-4 rounded-2xl">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">Inactive</p>
                            <p className="text-2xl font-black text-rose-500 italic">{filteredQrs.filter(q => q.status !== 'activated').length}</p>
                        </div>
                        <div className="bg-zinc-900/40 border border-white/5 backdrop-blur-md p-4 rounded-2xl">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">Search Match</p>
                            <p className="text-2xl font-black text-primary italic">{filteredQrs.length}</p>
                        </div>
                    </div>
                )}

                {/* Filters Section */}
                <div className="group relative mb-12">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-500/20 blur opacity-75 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200"></div>
                    <div className="relative flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="SEARCH BY QR ID, CATEGORY, OR NAME..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#0c0c0e] border border-white/10 rounded-[1.25rem] pl-16 pr-6 py-6 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-black tracking-widest placeholder:text-zinc-800 uppercase italic shadow-2xl"
                            />
                        </div>
                        <div className="flex items-center gap-2 px-6 py-4 bg-zinc-900/50 border border-white/10 rounded-2xl">
                            <Filter className="w-4 h-4 text-zinc-500" />
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">Filters Blocked</span>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="h-[420px] bg-zinc-900/20 rounded-[2.5rem] animate-pulse border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredQrs.length === 0 ? (
                    <div className="text-center py-40 bg-zinc-900/20 rounded-[4rem] border border-dashed border-white/5 backdrop-blur-sm relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        <div className="relative z-10">
                            <div className="w-28 h-28 bg-zinc-950 rounded-3xl flex items-center justify-center mx-auto mb-10 border border-white/10 shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                                <QrCode className="w-12 h-12 text-primary animate-pulse" />
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black mb-4 italic uppercase tracking-tighter">Inventory Empty</h2>
                            <p className="text-zinc-500 mb-12 max-w-md mx-auto font-bold uppercase tracking-widest text-xs leading-relaxed">
                                {userRole === 'analytics_admin' 
                                    ? 'No QR codes were found in this inventory matrix.' 
                                    : 'No QR codes found in your account. You can create one now.'}
                            </p>
                            {userRole !== 'analytics_admin' && (
                                <Link
                                    href="/admin/generate"
                                    className="inline-flex items-center px-12 py-5 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-all shadow-[0_20px_40px_rgba(168,85,247,0.3)] hover:-translate-y-1 active:scale-95 italic uppercase tracking-widest text-sm"
                                >
                                    Create First QR Code
                                    <ArrowRight className="w-5 h-5 ml-3" />
                                </Link>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredQrs.map((qr) => {
                            const cat = qr.category?.toLowerCase() || ''
                            let CategoryIcon = QrCode
                            let accentColor = 'primary'
                            let bgGlow = 'from-primary/20'

                            if (cat.includes('pet')) {
                                CategoryIcon = Shield
                                accentColor = 'orange-500'
                                bgGlow = 'from-orange-500/20'
                            } else if (cat.includes('vehicle') || cat.includes('car')) {
                                CategoryIcon = MapPin
                                accentColor = 'blue-500'
                                bgGlow = 'from-blue-500/20'
                            } else if (cat.includes('child')) {
                                CategoryIcon = Users
                                accentColor = 'emerald-500'
                                bgGlow = 'from-emerald-500/20'
                            } else if (cat.includes('elderly')) {
                                CategoryIcon = Activity
                                accentColor = 'rose-500'
                                bgGlow = 'from-rose-500/20'
                            }

                            const isActive = qr.status === 'activated'

                            return (
                                <div key={qr.id} className="group relative flex flex-col h-full">
                                    {/* The Card */}
                                    <div className="flex-1 bg-[#0c0c0e] border border-white/[0.03] rounded-[2.5rem] p-4 transition-all duration-700 hover:border-white/10 hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] relative flex flex-col">
                                        {/* Animated Background on Hover (Clipped container) */}
                                        <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
                                            <div className={`absolute inset-0 bg-gradient-to-br ${bgGlow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000`}></div>
                                        </div>

                                        {/* Status Header */}
                                        <div className="flex items-center justify-between mb-4 relative z-30">
                                            <div className={`px-4 py-1.5 rounded-full border ${isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'} flex items-center gap-2`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'} ${isActive ? 'animate-pulse' : ''}`}></div>
                                                <span className="text-[10px] font-black uppercase tracking-widest italic leading-none">
                                                    {isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>

                                            <div className="relative z-20">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setMenuOpenId(menuOpenId === qr.id ? null : qr.id)
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center bg-zinc-900/50 border border-white/5 rounded-xl text-zinc-600 hover:text-white hover:border-white/20 transition-all"
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>

                                                {menuOpenId === qr.id && (
                                                    <div className="absolute right-0 top-12 w-48 bg-[#121214] border border-white/10 rounded-2xl shadow-3xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-xl">
                                                        <Link href={`/scan/${qr.id}`} target="_blank" className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-[11px] font-black uppercase tracking-wider text-zinc-400 hover:text-white transition-all italic">
                                                            <Eye className="w-4 h-4" /> Preview Scan Page
                                                        </Link>
                                                        <div className="h-px bg-white/5 mx-2 my-1"></div>
                                                        {userRole !== 'analytics_admin' && (
                                                            <button
                                                                onClick={() => handleDelete(qr.id)}
                                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-500/10 text-[11px] font-black uppercase tracking-wider text-rose-500 transition-all italic"
                                                            >
                                                                <Trash2 className="w-4 h-4" /> Delete QR Code
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* QR Presentation */}
                                        <div className="flex flex-col items-center mb-4 relative z-10">
                                            <div className="relative p-2.5 bg-white rounded-[1.5rem] shadow-2xl group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
                                                <QRCode value={qr.full_url} size={140} level="H" bgColor="#ffffff" fgColor="#000000" />
                                                <div className="absolute -inset-2 border-2 border-primary/20 rounded-[1.8rem] opacity-0 group-hover:opacity-100 scale-110 group-hover:scale-100 transition-all duration-700"></div>
                                            </div>
                                        </div>

                                        {/* Info Section */}
                                        <div className="space-y-2 mb-6 relative z-10 text-center sm:text-left overflow-hidden">
                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                                <div className={`flex items-center gap-1.5 px-3 py-1 bg-zinc-950 border border-white/5 rounded-lg`}>
                                                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic">QR ID:</span>
                                                    <span className="text-[10px] font-bold text-white font-mono tracking-tighter">{qr.qr_number}</span>
                                                </div>
                                                <div className="px-2 py-1 bg-primary/5 border border-primary/10 rounded-lg">
                                                    <span className="text-[8px] font-black text-primary/60 uppercase tracking-widest italic">REF: #{qr.id.slice(0, 4)}</span>
                                                </div>
                                            </div>
                                            {qr.category && qr.category !== 'custom-category' && (
                                                <h3 className="text-lg lg:text-xl font-black text-zinc-400 uppercase italic tracking-tighter leading-tight group-hover:text-primary transition-colors">
                                                    {qr.category.replace(/-/g, ' ')}
                                                </h3>
                                            )}
                                        </div>

                                        {/* Action Bar */}
                                        <div className="flex items-center gap-2 relative z-10 mt-auto">
                                            <button
                                                onClick={() => toggleStatus(qr.id, qr.status)}
                                                title={isActive ? 'Deactivate' : 'Activate'}
                                                className={`flex-1 h-12 rounded-xl flex items-center justify-center transition-all border ${isActive ? 'bg-rose-500/5 text-rose-500 border-rose-500/10 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10 hover:bg-emerald-500 hover:text-white'}`}
                                            >
                                                {isActive ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                                            </button>

                                            <Link
                                                href={`/scan/${qr.id}`}
                                                target="_blank"
                                                title="Preview Scan Page"
                                                className="flex-1 h-12 bg-zinc-900 border border-white/5 text-zinc-500 hover:text-primary hover:border-primary/50 hover:bg-primary/5 rounded-xl flex items-center justify-center transition-all"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Link>

                                            <Link
                                                href={`/scan/${qr.id}`}
                                                title="Edit QR Details"
                                                className="flex-1 h-12 bg-white text-black hover:bg-zinc-200 rounded-xl flex items-center justify-center transition-all shadow-xl active:scale-95"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Bottom Decorative Line */}
                                    <div className={`mt-4 mx-auto w-1/3 h-1 rounded-full bg-gradient-to-r from-transparent via-${accentColor}/30 to-transparent group-hover:w-1/2 transition-all duration-1000`}></div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
