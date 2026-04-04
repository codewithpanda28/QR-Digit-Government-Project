'use client'

import React, { useState, useEffect } from 'react'
import NextLink from 'next/link'
import Image from 'next/image'
import { Menu, X, ShoppingCart, User, LogOut, LayoutDashboard, ChevronDown, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<{ name: string, photo: string | null } | null>(null)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
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

    return (
        <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200/50 py-3' : 'bg-transparent py-5'}`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                
                {/* Logo */}
                <NextLink href="/" className="flex items-center gap-2.5 group">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-black tracking-tight text-slate-900">
                        QR<span className="text-indigo-600">digit</span>
                    </span>
                </NextLink>

                {/* Desktop Nav */}
                <div className="hidden md:flex flex-1 items-center justify-center gap-8 font-semibold text-sm text-slate-600">
                    <NextLink href="/#solutions" className="hover:text-indigo-600 transition-colors">Solutions</NextLink>
                    <NextLink href="/shop" className="hover:text-indigo-600 transition-colors">Products</NextLink>
                    <NextLink href="/about" className="hover:text-indigo-600 transition-colors">About Us</NextLink>
                    <NextLink href="/contact" className="hover:text-indigo-600 transition-colors">Contact</NextLink>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-all font-semibold text-sm text-slate-700 shadow-sm"
                            >
                                <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 overflow-hidden font-bold">
                                    {profile?.photo ? (
                                        <Image src={profile.photo} alt="Profile" width={28} height={28} className="w-full h-full object-cover" unoptimized />
                                    ) : (
                                        (profile?.name || user.email)?.substring(0, 1).toUpperCase()
                                    )}
                                </div>
                                <span className="hidden sm:block truncate max-w-[100px]">{profile?.name || user.email?.split('@')[0]}</span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isUserMenuOpen && (
                                <div className="absolute top-12 right-0 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <NextLink
                                        href="/login"
                                        className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg font-medium text-sm text-slate-700 transition-all"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        <LayoutDashboard className="w-4 h-4 text-slate-400" /> Dashboard
                                    </NextLink>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 p-2 hover:bg-rose-50 rounded-lg font-medium text-sm text-rose-600 transition-all text-left"
                                    >
                                        <LogOut className="w-4 h-4" /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <NextLink href="/login" className="hidden sm:flex items-center gap-2 text-slate-600 font-semibold text-sm hover:text-indigo-600 transition-colors">
                            Login
                        </NextLink>
                    )}

                    <NextLink href="/shop" className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full font-semibold text-sm hover:bg-slate-800 transition-colors shadow-md">
                        Get Tags
                    </NextLink>

                    <button
                        className="md:hidden p-2 text-slate-600"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-slate-100 px-6 py-6 space-y-4 shadow-xl absolute w-full left-0 top-full">
                    <div className="flex flex-col space-y-1">
                        <NextLink href="/#solutions" className="px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 rounded-xl" onClick={() => setIsMenuOpen(false)}>Solutions</NextLink>
                        <NextLink href="/shop" className="px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 rounded-xl" onClick={() => setIsMenuOpen(false)}>Products</NextLink>
                        <NextLink href="/about" className="px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 rounded-xl" onClick={() => setIsMenuOpen(false)}>About Us</NextLink>
                        <NextLink href="/contact" className="px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 rounded-xl" onClick={() => setIsMenuOpen(false)}>Contact</NextLink>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                        {!user && (
                            <NextLink href="/login" className="px-4 py-3 font-semibold text-slate-700 text-center border border-slate-200 rounded-xl hover:bg-slate-50" onClick={() => setIsMenuOpen(false)}>
                                Login
                            </NextLink>
                        )}
                        <NextLink href="/shop" className="px-4 py-3 font-semibold text-white bg-indigo-600 text-center rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2" onClick={() => setIsMenuOpen(false)}>
                             <ShoppingCart className="w-4 h-4" /> Get Safety Tags
                        </NextLink>
                    </div>
                </div>
            )}
        </nav>
    )
}
