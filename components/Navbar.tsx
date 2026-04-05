'use client'

import React, { useState, useEffect } from 'react'
import NextLink from 'next/link'
import Image from 'next/image'
import { Menu, X, ShoppingCart, User, LogOut, LayoutDashboard, ChevronDown, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function Navbar() {
    const [mounted, setMounted] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<{ name: string, photo: string | null } | null>(null)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

    useEffect(() => {
        setMounted(true);
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);

            // Initial load from storage
            const saved = localStorage.getItem('q_raksha_user_profile');
            if (saved) setProfile(JSON.parse(saved));
        };
        checkUser();

        const handleStorageChange = () => {
            const saved = localStorage.getItem('q_raksha_user_profile');
            if (saved) setProfile(JSON.parse(saved));
            else setProfile(null);
        };

        window.addEventListener('storage', handleStorageChange);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session) {
                localStorage.removeItem('q_raksha_user_profile');
                setProfile(null);
            }
        });

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('q_raksha_user_profile');
        toast.success("Successfully logged out");
        window.location.href = '/';
    };

    if (!mounted) {
        return (
            <nav className="fixed top-0 left-0 w-full bg-white z-50 border-b border-indigo-600 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="w-32 h-10 bg-slate-100 rounded-lg animate-pulse"></div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md z-50 border-b-2 border-indigo-600 shadow-sm">
            <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between h-20">
                {/* Logo — priority:true so it loads immediately (above the fold) */}
                <NextLink href="/" className="group flex items-center">
                    <img 
                        src="/Logo.jpeg" 
                        alt="QRdigit Logo" 
                        className="h-12 md:h-14 w-auto object-contain transform group-hover:scale-105 transition-transform duration-300" 
                    />
                </NextLink>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-10 font-bold text-sm uppercase tracking-widest text-zinc-600">
                    <NextLink href="/" className="hover:text-indigo-600 transition-colors">Home</NextLink>
                    <NextLink href="/about" className="hover:text-indigo-600 transition-colors">About Us</NextLink>
                    <NextLink href="/shop" className="hover:text-indigo-600 transition-colors">Products</NextLink>
                    <NextLink href="/contact" className="hover:text-indigo-600 transition-colors">Contact Us</NextLink>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-6">
                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-2 bg-slate-50 border-2 border-slate-100 px-3 py-1.5 rounded-full hover:border-red-200 transition-all font-bold text-[10px] uppercase tracking-widest text-zinc-900 shadow-sm"
                            >
                                <div className="w-8 h-8 md:w-9 md:h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm overflow-hidden text-xs">
                                    {profile?.photo ? (
                                        <Image src={profile.photo} alt="P" width={36} height={36} className="w-full h-full object-cover" unoptimized />
                                    ) : (
                                        (profile?.name || user.email)?.substring(0, 1).toUpperCase()
                                    )}
                                </div>
                                <div className="hidden sm:flex flex-col items-start leading-none gap-1 px-1">
                                    <span className="text-zinc-400 text-[8px] font-black uppercase tracking-[0.2em]">Active Owner</span>
                                    <span className="truncate max-w-[100px] text-[11px]">{profile?.name || user.email?.split('@')[0]}</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isUserMenuOpen && (
                                <div className="absolute top-12 right-0 w-48 bg-white border-2 border-slate-100 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <NextLink
                                        href="/login"
                                        className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-xl font-bold text-[10px] uppercase tracking-widest text-zinc-600 hover:text-red-600 transition-all"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        <LayoutDashboard className="w-4 h-4" /> My Dashboard
                                    </NextLink>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 p-3 hover:bg-red-50 rounded-xl font-bold text-[10px] uppercase tracking-widest text-red-600 transition-all"
                                    >
                                        <LogOut className="w-4 h-4" /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <NextLink href="/login" className="hidden sm:flex items-center gap-2 text-zinc-900 font-bold text-xs uppercase tracking-widest hover:text-red-600 transition-colors">
                            <User className="w-4 h-4" /> LOGIN
                        </NextLink>
                    )}
                    <NextLink href="/shop" className="text-red-600 p-2 hover:scale-110 active:scale-90 transition-all">
                        <ShoppingCart className="w-6 h-6" />
                    </NextLink>
                    <button
                        className="md:hidden text-zinc-600"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t px-6 py-8 space-y-6 shadow-xl absolute w-full left-0 animate-in slide-in-from-top duration-300">
                    <NextLink href="/" className="block font-black text-sm uppercase tracking-widest" onClick={() => setIsMenuOpen(false)}>Home</NextLink>
                    <NextLink href="/about" className="block font-black text-sm uppercase tracking-widest" onClick={() => setIsMenuOpen(false)}>About Us</NextLink>
                    <NextLink href="/shop" className="block font-black text-sm uppercase tracking-widest" onClick={() => setIsMenuOpen(false)}>Products</NextLink>
                    <NextLink href="/contact" className="block font-black text-sm uppercase tracking-widest" onClick={() => setIsMenuOpen(false)}>Contact Us</NextLink>
                    <NextLink href="/login" className="block text-red-600 font-black text-sm uppercase tracking-widest" onClick={() => setIsMenuOpen(false)}>Login</NextLink>
                </div>
            )}
        </nav>
    )
}
