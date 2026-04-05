"use client";
import React, { useState, useRef, useEffect, Suspense } from "react";
import { QrCode, ArrowRight, CheckCircle2, Shield, Activity, Phone, Car, MapPin, X, Loader2, AlertCircle, Camera, Siren, Volume2, ShieldAlert, RefreshCcw, ChevronRight, Calendar, Video } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { fetchAndLinkUserData, toggleQRStatus } from "./actions";

export default function LoginPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <Loader2 className="animate-spin text-slate-400 w-10 h-10" />
            </div>
        );
    }

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <Loader2 className="animate-spin text-slate-400 w-10 h-10" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}

function LoginContent() {
    const [step, setStep] = useState<"INITIALIZING" | "EMAIL" | "OTP" | "DASHBOARD">("INITIALIZING");
    const [mounted, setMounted] = useState(false);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]); // Restored to 6, as Supabase Auth default is 6. 4 is unsupported.
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [activeAssetIndex, setActiveAssetIndex] = useState(0);
    const [alertPageIndex, setAlertPageIndex] = useState(0);
    const [viewAlert, setViewAlert] = useState<any>(null);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Check if user is already logged in securely
    useEffect(() => {
        setMounted(true);
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    if (session.user.email) setEmail(session.user.email);
                    await loadUserData(session.user.id, session.user.email || "");
                } else {
                    setStep("EMAIL");
                }
            } catch (e) {
                setStep("EMAIL");
            }
        };
        checkSession();
    }, []);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setIsLoading(true);

        try {
            // 1. Check for Developer Bypass first (No email sent)
            if (email.toLowerCase().includes('dev') || email.toLowerCase().includes('test') || email === 'akashkumar18017@gmail.com') {
                toast.success("Developer Mode: Use 000000 to login");
                setStep("OTP");
                setIsLoading(false);
                return;
            }

            // 2. Call Custom OTP API (Gmail/Nodemailer) - This bypasses Supabase rate limits
            const res = await fetch('/api/auth/custom-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase() })
            });
            const result = await res.json();

            if (result.success) {
                toast.success("Security code sent via Gmail!");
                setStep("OTP");
            } else {
                console.error("Custom OTP failed:", result.error || "Uknown error");
                // 🛑 NO FALLBACK: FALLBACK CAUSES RATE LIMITS.
                // If it fails, it's likely a config error on server (Vercel environment variables)
                toast.error(`OTP Service Unavailable: ${result.error || 'Server Config Missing'}`);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to send code.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join("");
        if (code.length !== 6) return;
        setIsLoading(true);

        try {
            // 1. Check Developer Bypass
            if ((email.toLowerCase().includes('dev') || email.toLowerCase().includes('test') || email === 'akashkumar18017@gmail.com') && code === "000000") {
                toast.success("Developer Access Granted");
                await loadUserData("dev_user", email);
                return;
            }

            // 2. Call Custom Verification System (Bypasses Supabase Auth public tokens)
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase(), code })
            });

            const result = await res.json();

            if (res.ok && result.success && result.login_link) {
                toast.success("Successfully verified!");
                // 🚀 Bypassing Public Verify: Redirecting to the ACTION_LINK (Magic Link)
                // This will automatically set the session cookie in the browser
                // We use replace to prevent back-button loops
                window.location.replace(result.login_link);
            } else {
                throw new Error(result.error || "Verification failed");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Invalid code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const loadUserData = async (userId: string, userEmail: string = email) => {
        setIsLoading(true);
        try {
            const { success, data, error } = await fetchAndLinkUserData(userId, userEmail);

            if (error || !success) {
                console.error("Error fetching data:", error);
                throw new Error(error || "Unknown error");
            }

            if (data && data.length > 0) {
                setUserData(data);

                // Persist basic info for Navbar
                const firstProfile = data[0];
                const userProfile = {
                    name: firstProfile.qr_details?.[0]?.full_name || firstProfile.qr_details?.[0]?.owner_name || userEmail.split('@')[0],
                    photo: firstProfile.qr_details?.[0]?.profile_image_url || null
                };
                localStorage.setItem('q_raksha_user_profile', JSON.stringify(userProfile));
                window.dispatchEvent(new Event('storage')); // Trigger update in other tabs/components
            } else {
                setUserData('NO_DATA');
                localStorage.removeItem('q_raksha_user_profile');
            }
            setStep("DASHBOARD");
        } catch (error: any) {
            console.error("Load error:", error);
            toast.error("Security Session Timed Out. Please Login again.");
            setStep("EMAIL");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleDeactivate = async () => {
        if (!userData || userData === 'NO_DATA') return;
        const activeItem = Array.isArray(userData) ? userData[activeAssetIndex] : userData;
        if (!activeItem) return;

        const confirmMsg = activeItem.status === 'activated'
            ? "Are you sure you want to DEACTIVATE your QR tag? Safety features will stop working."
            : "Re-activate your QR tag now?";

        if (!confirm(confirmMsg)) return;

        setIsLoading(true);
        const res = await toggleQRStatus(activeItem.id, activeItem.status);
        if (res.success) {
            toast.success(`QR Tag is now ${res.newStatus === 'activated' ? 'Active' : 'Suspended'}`);
            loadUserData(activeItem.activated_by || activeItem.managed_by || email, email); // Use any valid id and re-fetch
        } else {
            toast.error(res.error || "Failed to update status");
        }
        setIsLoading(false);
    };

    // Real-time Subscriptions for Dashboard
    useEffect(() => {
        if (userData && userData !== 'NO_DATA' && step === "DASHBOARD") {
            const activeItem = Array.isArray(userData) ? userData[activeAssetIndex] : userData;
            if (!activeItem) return;

            // --- 1. REAL-TIME RADAR (FAST) ---
            const channel = supabase
                .channel(`dashboard_updates_${activeItem.id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'emergency_alerts', filter: `qr_id=eq.${activeItem.id}` },
                    (payload) => {
                        console.log('📡 RADAR DETECTED NEW SIGNAL:', payload.new);
                        setUserData((current: any) => {
                            if (!current || current === 'NO_DATA') return current;
                            const curArr = Array.isArray(current) ? current : [current];
                            const updatedArr = curArr.map((item: any, idx: number) => {
                                if (idx !== activeAssetIndex) return item;
                                if (item.emergency_alerts?.some((a: any) => a.id === payload.new.id)) return item;
                                const freshAlerts = [payload.new, ...(item.emergency_alerts || [])];
                                return { ...item, emergency_alerts: freshAlerts.sort((a, b) => (b.created_at || '') > (a.created_at || '') ? 1 : -1) };
                            });
                            return updatedArr;
                        });
                        try {
                            const audio = new window.Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
                            audio.volume = 0.5;
                            audio.play().catch(() => { });
                        } catch (ae) { }
                        toast.error("🚨 LIVE RADAR: New Activity Logged!", { icon: '🆘', duration: 5000 });
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'emergency_alerts', filter: `qr_id=eq.${activeItem.id}` },
                    (payload) => {
                        console.log('📡 RADAR STATUS UPDATE:', payload.new);
                        setUserData((current: any) => {
                            if (!current || current === 'NO_DATA') return current;
                            const curArr = Array.isArray(current) ? current : [current];
                            const updatedArr = curArr.map((item: any) => {
                                if (item.id !== activeItem.id) return item;
                                const updatedAlerts = item.emergency_alerts?.map((a: any) => a.id === payload.new.id ? payload.new : a);
                                return { ...item, emergency_alerts: updatedAlerts };
                            });
                            return updatedArr;
                        });

                        // 🚀 SYNC ACTIVE MODAL: If this alert is being viewed, update the view state too
                        setViewAlert((current: any) => {
                            if (current?.id === payload.new.id) return payload.new;
                            return current;
                        });
                    }
                )
                .subscribe();

            // --- 2. STEALTH POLLING (SAFETY NET - 15s) ---
            const pollInterval = setInterval(async () => {
                const { data: freshAlerts } = await supabase
                    .from('emergency_alerts')
                    .select('*')
                    .eq('qr_id', activeItem.id)
                    .order('created_at', { ascending: false })
                    .limit(30);

                if (freshAlerts) {
                    setUserData((current: any) => {
                        if (!current || current === 'NO_DATA') return current;
                        const curArr = Array.isArray(current) ? current : [current];
                        const updatedArr = curArr.map((item: any) => {
                            if (item.id !== activeItem.id) return item;
                            return { ...item, emergency_alerts: freshAlerts };
                        });
                        return updatedArr;
                    });

                    // 🚀 SYNC ACTIVE MODAL (Polling)
                    setViewAlert((current: any) => {
                        if (!current) return null;
                        const matching = freshAlerts.find((a: any) => a.id === current.id);
                        return matching || current;
                    });
                }
            }, 15000);

            return () => {
                supabase.removeChannel(channel);
                clearInterval(pollInterval);
            };
        }
    }, [userData, step, activeAssetIndex]);

    // Removed standalone loadEvidenceImages as it is now per-alert

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setStep("EMAIL");
        setEmail("");
        setOtp(["", "", "", "", "", ""]);
        setUserData(null);
        toast.success("Logged out safely");
    };

    const handleOtpChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    if (step === "DASHBOARD") {
        const activeItem = userData && userData !== 'NO_DATA' && Array.isArray(userData) ? userData[activeAssetIndex] : userData;

        const details = activeItem && activeItem !== 'NO_DATA' && activeItem.qr_details?.length > 0 ? activeItem.qr_details[0] : null;
        const rawAlerts = activeItem && activeItem !== 'NO_DATA' && activeItem.emergency_alerts ? activeItem.emergency_alerts : [];
        // Sort alerts: Newest First
        const contacts = activeItem && activeItem !== 'NO_DATA' && activeItem.emergency_contacts ? activeItem.emergency_contacts : [];
        // Sort alerts: Absolute Newest First (Descending Lock)
        const sortedAlerts = [...rawAlerts].sort((a: any, b: any) =>
            (b.created_at || '') > (a.created_at || '') ? 1 : -1
        );

        const handleToolClick = (toolName: string, autoParam: string) => {
            const toolKeywords: any = {
                'VIDEO': ['VIDEO', 'MOTION', 'CLIP'],
                'IMAGE': ['IMAGE', 'PHOTO', 'CAMERA', 'MANUAL'],
                'RECORDING': ['AUDIO', 'RECORD', 'VOICE', 'MIC'],
                'PANIC': ['SOS', 'PANIC', 'DANGER', 'INCIDENT', 'HELP'],
                'TRACKING': ['TRACKING', 'LIVE', 'SHARE', 'LOCATION'],
                'HELPLINE': ['HELPLINE CALL', '112', '108', '100']
            };

            const keywords = toolKeywords[toolName.toUpperCase()] || [toolName.toUpperCase()];

            // 1. PRIORITY: If we have an exact match for the number/param clicked (e.g. '100')
            let match = sortedAlerts.find((a: any) => {
                const type = a.alert_type?.toUpperCase() || '';
                return autoParam && type.includes(autoParam.trim().toUpperCase());
            });

            // 2. FALLBACK: General category keywords
            if (!match) {
                match = sortedAlerts.find((a: any) => {
                    const type = a.alert_type?.toUpperCase() || '';
                    return keywords.some((k: string) => type.includes(k));
                });
            }

            // 3. LAST RESORT fallback for SOS
            if (toolName === 'SOS' && !match && sortedAlerts.length > 0) {
                match = sortedAlerts[0];
            }

            if (match) {
                setViewAlert(match);
            } else {
                const target = activeItem?.qr_number || details?.id;
                window.open(`/scan/${target}?auto=${autoParam}`, '_blank');
                toast.success(`Broadcasting Remote Request - Initializing ${toolName}`);
            }
        };

        return (
            <div className="min-h-screen bg-slate-50 pb-20">
                <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
                    <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
                        <Link href="/" className="flex items-center">
                            <img
                                src="/Logo.jpeg"
                                alt="Raksha Logo"
                                className="h-10 md:h-14 w-auto object-contain hover:scale-105 transition-transform"
                            />
                        </Link>
                        <button onClick={handleLogout} className="text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors">
                            Logout
                        </button>
                    </div>
                </nav>

                <main className="max-w-[1400px] mx-auto px-4 py-8 md:py-12">
                    {Array.isArray(userData) && userData.length > 1 && (
                        <div className="mb-8 p-4 bg-white rounded-2xl border border-slate-200 flex gap-3 overflow-x-auto custom-scrollbar shadow-sm">
                            {userData.map((u: any, idx: number) => {
                                const qDetails = u.qr_details?.[0] || {};
                                const name = qDetails.full_name || qDetails.owner_name || `Tag ${idx + 1}`;
                                return (
                                    <button
                                        key={u.id || idx}
                                        onClick={() => setActiveAssetIndex(idx)}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeAssetIndex === idx ? 'bg-red-600 text-white shadow-md' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                                    >
                                        <Shield className={`w-4 h-4 ${activeAssetIndex === idx ? 'text-white' : 'text-slate-400'}`} />
                                        {name}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {userData === 'NO_DATA' ? (
                        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">No QR Tag Found</h2>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto">We couldn't find any active Safety QR tags linked to this email address.</p>
                            <Link href="/#products" className="bg-red-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-red-700 transition">Get a QR Tag</Link>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Profile Info */}
                            <div className="w-full md:w-[350px] space-y-6">
                                <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-50 relative overflow-hidden group">
                                    {/* Sleek Top Tricolor Bar */}
                                    <div className="h-2.5 flex flex-row shadow-sm">
                                        <div className="flex-1" style={{ backgroundColor: '#FF9933' }}></div>
                                        <div className="flex-1 bg-white"></div>
                                        <div className="flex-1" style={{ backgroundColor: '#138808' }}></div>
                                    </div>

                                    <div className="p-10 flex flex-col items-center">
                                        {/* Profile Photo with National Glow */}
                                        <div className="relative mb-8">
                                            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#FF9933] via-white to-[#138808] opacity-30 group-hover:opacity-60 blur-sm transition-opacity duration-500"></div>
                                            <div className="relative w-28 h-28 bg-white rounded-full border-4 border-white shadow-xl overflow-hidden transform group-hover:scale-105 transition-all duration-500">
                                                {(details?.profile_image_url || details?.additional_data?.photo_url) ? (
                                                    <img src={details.profile_image_url || details.additional_data.photo_url} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                                                        <span className="text-3xl font-black uppercase tracking-tighter">{email.substring(0, 2)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="text-center">
                                            <h2 className="text-2xl font-black text-slate-800 mb-1 tracking-tighter uppercase drop-shadow-sm">{details?.full_name || details?.owner_name || email}</h2>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-6">Registered Safety Executive</p>
                                            
                                            <div className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl transition-all">
                                                <Shield className="w-4 h-4 text-[#FF9933]" />
                                                Verified Official
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-red-600" />
                                        Plan & Security
                                    </h3>
                                    <div className="border border-red-100 rounded-xl p-4 bg-red-50/50 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-red-700 text-sm">QR: {activeItem?.qr_number}</span>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded shadow-sm border uppercase ${activeItem?.status === 'activated' ? 'bg-white text-green-600 border-green-100' : 'bg-red-600 text-white border-red-700'}`}>
                                                {activeItem?.status === 'activated' ? 'Active' : activeItem?.status === 'suspended' ? 'Suspended' : activeItem?.status || 'Active'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center pt-2 border-t border-red-100">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expiry Date</span>
                                                <span className="text-sm font-bold text-slate-700">
                                                    {activeItem?.subscription_end ? new Date(activeItem.subscription_end).toLocaleDateString() : 'Lifetime'}
                                                </span>
                                            </div>
                                            <Calendar className="w-5 h-5 text-slate-300" />
                                        </div>

                                        <button
                                            onClick={handleToggleDeactivate}
                                            disabled={isLoading}
                                            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeItem?.status === 'activated'
                                                ? 'bg-white text-red-600 border-2 border-red-100 hover:bg-red-50'
                                                : 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                                                }`}
                                        >
                                            {activeItem?.status === 'activated' ? 'Deactivate Tag' : 'Activate Tag Now'}
                                        </button>
                                    </div>
                                </div>

                                {/* TACTICAL OPERATIONS CONSOLE */}
                                <div className="bg-slate-900 p-6 rounded-2xl shadow-xl shadow-slate-900/20 border border-slate-800 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                                    <h3 className="font-black text-white mb-1 flex items-center gap-2 uppercase tracking-wide relative z-10">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                        Safety Console
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5 relative z-10">Admin Remote Triggers</p>

                                    <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
                                        <button onClick={() => handleToolClick('VIDEO', 'MANUAL VIDEO')} className="relative bg-slate-800 hover:bg-blue-600/20 text-white rounded-xl p-3 flex flex-col items-center justify-center gap-2 border border-slate-700 hover:border-blue-500 transition-all group active:scale-95 overflow-hidden">
                                            {sortedAlerts.some((a: any) => ['VIDEO'].some(k => a.alert_type?.toUpperCase().includes(k))) && (
                                                <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-blue-600 text-[6px] font-black uppercase rounded text-white animate-pulse">Logged</span>
                                            )}
                                            <Video className="w-6 h-6 text-blue-400 group-hover:text-blue-500" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Take Video</span>
                                        </button>
                                        <button onClick={() => handleToolClick('IMAGE', 'MANUAL PHOTO')} className="relative bg-slate-800 hover:bg-purple-600/20 text-white rounded-xl p-3 flex flex-col items-center justify-center gap-2 border border-slate-700 hover:border-purple-500 transition-all group active:scale-95 overflow-hidden">
                                            {sortedAlerts.some((a: any) => ['PHOTO', 'IMAGE'].some(k => a.alert_type?.toUpperCase().includes(k))) && (
                                                <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-purple-600 text-[6px] font-black uppercase rounded text-white animate-pulse">Logged</span>
                                            )}
                                            <Camera className="w-6 h-6 text-purple-400 group-hover:text-purple-500" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Take Image</span>
                                        </button>
                                        <button onClick={() => handleToolClick('RECORDING', 'audio')} className="relative bg-slate-800 hover:bg-orange-600/20 text-white rounded-xl p-3 flex flex-col items-center justify-center gap-2 border border-slate-700 hover:border-orange-500 transition-all group active:scale-95 overflow-hidden">
                                            {sortedAlerts.some((a: any) => ['AUDIO', 'RECORD', 'VOICE', 'MIC'].some(k => a.alert_type?.toUpperCase().includes(k))) && (
                                                <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-orange-600 text-[6px] font-black uppercase rounded text-white animate-pulse">Logged</span>
                                            )}
                                            <Volume2 className="w-6 h-6 text-orange-400 group-hover:text-orange-500" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Recording</span>
                                        </button>

                                        {/* PANIC SIGNALS / DYNAMIC TOOL */}
                                        <button onClick={() => handleToolClick('PANIC', 'panic')} className="relative bg-slate-800 hover:bg-slate-700 text-white rounded-xl p-3 flex flex-col items-center justify-center gap-2 border border-slate-700 hover:border-slate-500 transition-all group active:scale-95 overflow-hidden">
                                            {sortedAlerts.some((a: any) => ['SOS', 'PANIC', 'DANGER', 'INCIDENT', 'HELP'].some(k => a.alert_type?.toUpperCase().includes(k))) && (
                                                <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-slate-600 text-[6px] font-black uppercase rounded text-white animate-pulse">Logged</span>
                                            )}
                                            <Activity className="w-6 h-6 text-slate-400 group-hover:text-slate-200" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Panic Signal</span>
                                        </button>
                                    </div>

                                    <button onClick={() => handleToolClick('SOS', 'sos')} className="w-full relative z-10 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black py-4 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-900/50 transition-all active:scale-95 border border-red-500/50">
                                        {sortedAlerts.some((a: any) => ['SOS', 'EMERGENCY', 'DANGER', 'HELP'].some(k => a.alert_type?.toUpperCase().includes(k))) && (
                                            <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-white text-[6px] font-black uppercase rounded text-red-600 animate-pulse z-20">Live SOS</span>
                                        )}
                                        <ShieldAlert className="w-5 h-5" /> Trigger SOS
                                    </button>

                                    <button onClick={() => handleToolClick('TRACKING', 'share')} className="w-full relative z-10 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-black py-4 mt-3 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 overflow-hidden">
                                        {sortedAlerts.some((a: any) => ['TRACKING', 'LIVE', 'SHARE', 'LOCATION'].some(k => a.alert_type?.toUpperCase().includes(k))) && (
                                            <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-emerald-500 text-[6px] font-black uppercase rounded text-white animate-pulse">Sharing</span>
                                        )}
                                        <MapPin className="w-5 h-5 text-emerald-400" /> Live Share
                                    </button>

                                    {/* --- 🌍 LINK TO ALL PREVIOUS LOGS --- */}
                                    <button
                                        onClick={() => {
                                            const el = document.getElementById('historical-log');
                                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }}
                                        className="w-full mt-10 pt-4 border-t border-slate-800 flex items-center justify-between text-slate-500 hover:text-white transition-all group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">View Mission History</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* QUICK HELPLINES */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Phone className="w-5 h-5 text-green-600" />
                                        Quick Helplines
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { label: 'Emergency', num: '112', bg: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-100' },
                                            { label: 'Ambulance', num: '108', bg: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-100' },
                                            { label: 'Police', num: '100', bg: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100' },
                                        ].map(h => {
                                            const hasLog = sortedAlerts.some((a: any) => a.alert_type?.includes(h.num) || a.alert_type?.toUpperCase().includes(h.label.toUpperCase()));
                                            return (
                                                <button
                                                    key={h.num}
                                                    onClick={() => handleToolClick('HELPLINE', h.num)}
                                                    className={`relative flex flex-col items-center justify-center py-3 rounded-xl active:scale-95 transition-all ${h.bg}`}
                                                >
                                                    {hasLog && (
                                                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                        </span>
                                                    )}
                                                    <span className="text-sm font-black tracking-tight leading-none mb-1">{h.num}</span>
                                                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-80">{h.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                            {/* Detailed Specific Data */}
                            <div className="flex-1 space-y-6">
                                {/* CUSTOM FIELDS OR VEHICLE DATA */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                                            <Activity className="w-5 h-5 text-indigo-500" />
                                            Specific Intelligence
                                        </h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Legacy Vehicle Fallback */}
                                            {details?.category === 'vehicle' && (
                                                <>
                                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reg No.</span>
                                                        <p className="font-bold text-slate-800 mt-1">{details?.vehicle_number || '-'}</p>
                                                    </div>
                                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type / Model</span>
                                                        <p className="font-bold text-slate-800 mt-1">{details?.vehicle_type || 'Car'} • {details?.vehicle_model || '-'}</p>
                                                    </div>
                                                </>
                                            )}
                                            {/* Dynamic Custom Fields */}
                                            {details?.additional_data?.custom_fields?.map((field: any, idx: number) => (
                                                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:border-indigo-100 hover:bg-white transition-all">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{field.label}</span>
                                                    <p className="font-bold text-slate-800 truncate">{field.value || '-'}</p>
                                                </div>
                                            ))}
                                            {(!details?.additional_data?.custom_fields || details.additional_data.custom_fields.length === 0) && details?.category !== 'vehicle' && (
                                                <p className="text-sm text-slate-400 italic sm:col-span-2">No specific intelligence fields recorded.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* LOCATION & PROFILE */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                                            <MapPin className="w-5 h-5 text-emerald-500" />
                                            Location & Contact Base
                                        </h3>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="sm:col-span-2">
                                            <div className="bg-emerald-50/30 rounded-xl p-5 border border-emerald-100/50">
                                                <span className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest block mb-2">Registered Address</span>
                                                <p className="font-bold text-slate-800 text-sm leading-relaxed">
                                                    {details?.home_address || 'No address provided'}
                                                    {details?.additional_data?.landmark && `, Near ${details.additional_data.landmark}`}
                                                    <br />
                                                    {details?.additional_data?.city}{details?.additional_data?.state && `, ${details.additional_data.state}`}{details?.additional_data?.pincode && ` - ${details.additional_data.pincode}`}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Emergency Contacts</p>
                                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 h-full">
                                                {contacts.length > 0 ? contacts.map((contact: any, idx: number) => (
                                                    <div key={idx} className={`flex justify-between items-center ${idx !== contacts.length - 1 ? 'mb-4 border-b border-slate-200 pb-4' : ''}`}>
                                                        <div>
                                                            <span className="block font-bold text-slate-800 text-sm">{contact.name}</span>
                                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{contact.relationship} • {contact.phone}</span>
                                                        </div>
                                                        <a href={`tel:${contact.phone}`} className="w-9 h-9 shrink-0 rounded-full bg-emerald-100 shadow-sm flex items-center justify-center text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer">
                                                            <Phone className="w-4 h-4" />
                                                        </a>
                                                    </div>
                                                )) : (
                                                    <p className="text-sm text-slate-500 italic py-2">No emergency contacts added yet.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Medical Profile</p>
                                            <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 h-full flex flex-col justify-center">
                                                <div className="mb-4 border-b border-blue-100/50 pb-4">
                                                    <span className="block text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-1">Blood Group</span>
                                                    <span className="font-black text-blue-900 text-2xl">{details?.blood_group || 'N/A'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-2">Critical Medical Notes</span>
                                                    <span className="font-semibold text-blue-900 text-sm leading-snug block bg-blue-100/30 p-3 rounded-lg">{details?.medical_conditions || 'None specified.'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* LIVE RADAR / RECENT ALERTS - Paginated Multi-Column */}
                                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(220,38,38,0.08)] border border-red-100 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60 pointer-events-none"></div>
                                    <div className="p-6 border-b border-red-50 flex justify-between items-center bg-white relative z-10">
                                        <div className="flex flex-col">
                                            <h3 className="text-lg font-black text-red-600 flex items-center gap-2 uppercase tracking-wide">
                                                <AlertCircle className="w-5 h-5 animate-pulse" />
                                                Live Radar & SOS Logs
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 underline decoration-red-200">
                                                Real-time Matrix Feed • Active
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => {
                                                    supabase.auth.getSession().then(({ data }) => {
                                                        if (data.session) loadUserData(data.session.user.id, data.session.user.email || "");
                                                    });
                                                }}
                                                className="p-2 hover:bg-slate-100 rounded-full transition-all group"
                                                title="Refresh Data"
                                            >
                                                <RefreshCcw className={`w-4 h-4 text-slate-400 group-hover:text-slate-900 ${isLoading ? 'animate-spin' : ''}`} />
                                            </button>
                                            <span className="px-3 py-1 bg-red-100 text-red-700 shadow-sm border border-red-200 rounded-full text-xs font-black tracking-wider uppercase">
                                                {sortedAlerts.length} Alerts
                                            </span>
                                            <div className="flex gap-2">
                                                <button
                                                    disabled={alertPageIndex === 0}
                                                    onClick={() => setAlertPageIndex(prev => Math.max(0, prev - 1))}
                                                    className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-red-600 hover:text-white disabled:opacity-30 transition-all shadow-sm bg-white"
                                                    title="Previous Documents"
                                                >
                                                    <ChevronRight className="w-5 h-5 rotate-180 text-slate-900 group-hover:text-white transition-colors" />
                                                </button>
                                                <button
                                                    disabled={(alertPageIndex + 1) * 3 >= (sortedAlerts.length)}
                                                    onClick={() => setAlertPageIndex(prev => prev + 1)}
                                                    className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-red-600 hover:text-white disabled:opacity-30 transition-all shadow-sm bg-white"
                                                    title="Next Documents"
                                                >
                                                    <ChevronRight className="w-5 h-5 text-slate-900 group-hover:text-white transition-colors" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative z-10 bg-slate-50/30">
                                        {sortedAlerts.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                                {sortedAlerts.slice(alertPageIndex * 3, (alertPageIndex * 3) + 3).map((alert: any) => (
                                                    <AlertColumn key={alert.id} alert={alert} qrId={activeItem.id || activeItem.qr_number} />
                                                ))}
                                                {Array.from({ length: Math.max(0, 3 - sortedAlerts.slice(alertPageIndex * 3, (alertPageIndex * 3) + 3).length) }).map((_, i) => (
                                                    <div key={`filler-${i}`} className="hidden md:flex flex-col items-center justify-center p-12 opacity-[0.03] border-l border-slate-100 bg-slate-50">
                                                        <div className="relative">
                                                            <Shield className="w-24 h-24 text-slate-900" />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin opacity-40"></div>
                                                            </div>
                                                        </div>
                                                        <p className="mt-8 font-black uppercase tracking-[0.4em] text-slate-900 text-[10px]">Awaiting Signal</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-20">
                                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-slate-50">
                                                    <CheckCircle2 className="w-10 h-10 text-slate-300" />
                                                </div>
                                                <p className="font-black text-slate-800 text-lg">Radar Clear</p>
                                                <p className="text-sm font-medium text-slate-500 mt-1 max-w-xs mx-auto">No emergency alerts or location tracking events have been logged yet.</p>
                                            </div>
                                        )}
                                    </div>

                                </div>

                                {/* OPERATIONAL ASSET QUICK-VIEW MODAL */}
                                {viewAlert && (
                                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
                                        <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative animate-in zoom-in-95 duration-300 border border-white/20">
                                            {/* Header */}
                                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-20">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-200">
                                                        <Activity className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Operational Log Viewer</h3>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tactical Evidence Capture</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setViewAlert(null)} className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {/* Body */}
                                            <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
                                                <AlertColumn alert={viewAlert} qrId={activeItem.id} />

                                                {/* Actions */}
                                                <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                                                    <button
                                                        onClick={() => {
                                                            const toolMap: any = { 'SIREN': 'siren', 'PHOTO': 'camera', 'AUDIO': 'audio', 'CRASH': 'crash', 'SOS': 'sos' };
                                                            const type = viewAlert.alert_type?.toUpperCase();
                                                            const toolKey = Object.keys(toolMap).find(k => type?.includes(k)) || 'SOS';
                                                            const identifier = activeItem?.qr_number || activeItem?.id;
                                                            window.open(`/scan/${identifier}?auto=${toolMap[toolKey]}`, '_blank');
                                                        }}
                                                        className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black active:scale-95 transition-all shadow-xl shadow-slate-200"
                                                    >
                                                        <RefreshCcw className="w-4 h-4" /> RE-TRIGGER REMOTE SIGNAL
                                                    </button>
                                                    <button onClick={() => setViewAlert(null)} className="flex-1 bg-white border border-slate-200 text-slate-500 font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all">
                                                        DISMISS VIEWER
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* DETAILED ACTIVITY FEED */}
                                <div id="historical-log" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8 scroll-mt-10">
                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                                            <Activity className="w-5 h-5 text-indigo-500" />
                                            Historical Intelligence Log
                                        </h3>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sortedAlerts.length} Total Events</span>
                                    </div>
                                    <div className="max-h-[500px] overflow-y-auto">
                                        {sortedAlerts.length > 0 ? (
                                            <div className="divide-y divide-slate-100">
                                                {sortedAlerts.map((log: any, i: number) => {
                                                    const logDate = new Date(log.created_at);
                                                    const isValidDate = !isNaN(logDate.getTime());
                                                    const dateStr = isValidDate
                                                        ? logDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                        : 'Mission Pending';

                                                    return (
                                                        <div
                                                            key={log.id || i}
                                                            onClick={() => setViewAlert(log)}
                                                            className="p-4 hover:bg-slate-50 cursor-pointer transition-all flex items-center gap-4 group"
                                                        >
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${log.alert_type?.includes('SIREN') ? 'bg-orange-100 text-orange-600' :
                                                                log.alert_type?.includes('PHOTO') ? 'bg-purple-100 text-purple-600' :
                                                                    log.alert_type?.includes('AUDIO') ? 'bg-emerald-100 text-emerald-600' :
                                                                        log.alert_type?.includes('SOS') ? 'bg-red-100 text-red-600' :
                                                                            'bg-blue-100 text-blue-600'
                                                                }`}>
                                                                {log.alert_type?.includes('SIREN') ? <Siren className="w-5 h-5" /> :
                                                                    log.alert_type?.includes('PHOTO') ? <Camera className="w-5 h-5" /> :
                                                                        log.alert_type?.includes('AUDIO') ? <Volume2 className="w-5 h-5" /> :
                                                                            <Shield className="w-5 h-5" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{log.alert_type}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dateStr}</p>
                                                                    <span className="text-slate-200">•</span>
                                                                    <p className="text-[9px] font-bold text-slate-500 truncate max-w-[200px]">{log.location_address || 'GPS Unresolved'}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-black uppercase tracking-tight text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                Quick View
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="py-20 text-center opacity-30">
                                                <ShieldAlert className="w-12 h-12 mx-auto mb-4" />
                                                <p className="font-black uppercase tracking-widest text-xs">No entries in tactical log</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-white flex flex-col sm:bg-slate-50 relative">
            {/* Header */}
            <header className="p-6 sm:px-12 w-full flex justify-between items-center absolute top-0 left-0 z-10">
                <Link href="/" className="flex items-center">
                    <img
                        src="/Logo.jpeg"
                        alt="QRdigit Logo"
                        className="h-12 md:h-16 w-auto object-contain hover:scale-105 transition-transform"
                    />
                </Link>
                <Link href="/" className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
                    <X className="w-5 h-5 text-gray-600" />
                </Link>
            </header>

            {/* Auth Box */}
            <div className="flex-1 flex flex-col justify-center items-center px-4 pt-20">
                <div className="w-full max-w-[420px] bg-white sm:rounded-3xl sm:shadow-[0_8px_30px_rgb(0,0,0,0.08)] sm:border border-gray-100 p-8 sm:p-10">

                    {(step === "INITIALIZING" || (isLoading && step === "EMAIL")) && (
                        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-100 rounded-full blur-2xl animate-pulse"></div>
                                <Loader2 className="w-16 h-16 text-slate-900 animate-spin relative z-10" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mt-8">QRdigit Secure Grid</h2>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 animate-pulse text-center max-w-xs">
                                Initializing Secured Tactical Dashboard...
                            </p>
                        </div>
                    )}

                    {step === "EMAIL" && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
                                <Shield className="w-7 h-7" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">Access Profile</h1>
                            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                                Enter your registered email address to receive a secure OTP and view your real Safety QR data.
                            </p>

                            <form onSubmit={handleSendOTP} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full h-14 bg-gray-50 border border-gray-200 rounded-xl px-4 text-gray-900 font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder:font-normal"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading || !email}
                                    className="w-full h-14 bg-red-600 text-white font-bold text-lg rounded-xl flex items-center justify-center hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Get Real OTP Securely"}
                                        {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                                    </span>
                                </button>
                            </form>

                            <p className="mt-8 text-center text-xs text-gray-400 font-medium">
                                By continuing, you agree to our Terms of Service and Privacy Policy.
                            </p>
                        </div>
                    )}

                    {step === "OTP" && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                                <CheckCircle2 className="w-7 h-7" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">Verify Email</h1>
                            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                                We've sent a 6-digit real verification code to <strong className="text-gray-900 font-bold">{email}</strong>.
                                <button onClick={() => setStep("EMAIL")} className="text-red-600 mx-1 hover:underline font-bold">Edit</button>
                            </p>

                            <form onSubmit={handleVerifyOTP} className="space-y-8 relative">
                                {isLoading && (
                                    <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl animate-in fade-in duration-300">
                                        <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Verifying Tactical Link...</p>
                                    </div>
                                )}
                                <div className="flex justify-between gap-2">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => {
                                                otpRefs.current[index] = el;
                                            }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            className="w-10 sm:w-12 aspect-square bg-gray-50 border border-gray-200 rounded-xl text-center text-xl sm:text-2xl font-black text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                        />
                                    ))}
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading || otp.join("").length !== 6}
                                    className="w-full h-14 bg-red-600 text-white font-bold text-lg rounded-xl flex items-center justify-center hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Real Code"}
                                </button>
                            </form>

                            <p className="mt-8 text-center text-sm font-medium text-gray-500">
                                Didn't receive the code? <button onClick={handleSendOTP} className="text-red-600 font-bold hover:underline">Resend</button>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function AlertColumn({ alert, qrId }: { alert: any; qrId: string }) {
    const [images, setImages] = useState<string[]>([]);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const isSiren = alert.alert_type?.includes('SIREN');
    const isPhoto = alert.alert_type?.includes('PHOTO') || alert.alert_type?.includes('IMAGE');
    const isVideo = alert.alert_type?.includes('VIDEO');
    const isAudio = alert.alert_type?.includes('AUDIO') || alert.alert_type?.includes('RECORDING');
    const isHelpline = alert.alert_type?.includes('HELPLINE');
    const isCrash = alert.alert_type?.includes('CRASH') || alert.alert_type?.includes('IMPACT');
    const isSOS = alert.alert_type === 'sos' || (!isSiren && !isPhoto && !isVideo && !isAudio && !isHelpline && !isCrash);

    useEffect(() => {
        let isMounted = true;
        let retryCount = 0;
        let timeoutId: any = null;

        const fetchEvidence = async () => {
            if (!isMounted) return;
            setLoading(true);
            try {
                // 1. Storage Scan (Primary Path)
                let finalPath = `emergencies/${qrId}/${alert.id}`;
                let { data: files } = await supabase.storage.from("emergency-evidence").list(finalPath, { limit: 50, sortBy: { column: 'name', order: 'desc' } });

                const isImageFile = (name: string) => {
                    const lower = name.toLowerCase();
                    return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp');
                };
                const isVideoFile = (name: string) => {
                    const lower = name.toLowerCase();
                    return (lower.endsWith('.webm') || lower.endsWith('.mp4'));
                };
                const isAudioFile = (name: string) => {
                    const lower = name.toLowerCase();
                    return lower.endsWith('.aac') || lower.endsWith('.wav') || (lower.endsWith('.webm') && lower.includes('audio'));
                };

                let validFiles = (files || []).filter(f => isImageFile(f.name) || isAudioFile(f.name) || isVideoFile(f.name));
                const alertAgeMs = Date.now() - new Date(alert.created_at || Date.now()).getTime();
                const isVeryRecent = alertAgeMs < 480000; // 8 minutes

                // 🚀 SMART RETRY: If it's a recent alert, keep checking for up to 12 attempts 
                if (validFiles.filter(f => isImageFile(f.name)).length < 6 && isVeryRecent && retryCount < 12) {
                    retryCount++;
                    timeoutId = setTimeout(() => { if (isMounted) fetchEvidence(); }, 4000);
                    if (validFiles.length === 0) return; 
                }

                if (validFiles.length === 0) {
                    finalPath = `emergencies/${qrId}`;
                    const { data: rootFiles } = await supabase.storage.from("emergency-evidence").list(finalPath);
                    if (rootFiles) {
                        const filtered = rootFiles.filter(f => {
                            if (!isImageFile(f.name) && !isAudioFile(f.name)) return false;
                            const alertTime = new Date(alert.created_at).getTime();
                            const fileTime = f.created_at ? new Date(f.created_at).getTime() : 0;
                            return Math.abs(alertTime - fileTime) < 180000;
                        });
                        validFiles = [...filtered];
                    }
                }

                if (validFiles && validFiles.length > 0) {
                    const signedLinks = await Promise.all(validFiles.map(async (file) => {
                        const { data } = await supabase.storage.from("emergency-evidence").createSignedUrl(`${finalPath}/${file.name}`, 3600);
                        return { url: data?.signedUrl || null, name: file.name };
                    }));

                    const imageLinks = signedLinks.filter(u => isImageFile(u.name)).map(u => u.url).filter(Boolean) as string[];
                    if (isMounted && imageLinks.length > 0) setImages(imageLinks);

                    const audioLink = signedLinks.find(u => isAudioFile(u.name))?.url;
                    if (isMounted && audioLink) setAudioUrl(audioLink);

                    const videoLink = signedLinks.find(u => isVideoFile(u.name))?.url;
                    if (isMounted && videoLink) setVideoUrl(videoLink);
                } else {
                    // FINAL FALLBACK: If listing fails or is empty, use database links
                    if (isMounted && alert.evidence_photos?.length > 0) {
                        setImages(alert.evidence_photos);
                    }
                    if (isMounted && alert.evidence_video) {
                        setVideoUrl(alert.evidence_video);
                    }
                }
            } catch (e) {
                console.error("Evidence load failed", e);
            } finally {
                if (isMounted) {
                    // Only stop loading if we actually found something or hit the retry limit
                    // This prevents flickering between "Syncing" and "Offline" states
                    setLoading(false);
                }
            }
        };

        fetchEvidence();
        return () => { isMounted = false; if (timeoutId) clearTimeout(timeoutId); };
    }, [alert.id, qrId, alert.evidence_photos, alert.evidence_video]);

    return (
        <div className="p-6 flex flex-col h-full bg-white/40 hover:bg-white/80 transition-all duration-300 group shadow-[inset_0_0_20px_rgba(0,0,0,0.02)]">
            <div className="flex gap-4 items-start mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg relative ${isSOS ? 'bg-red-600 text-white shadow-red-200' :
                    isSiren ? 'bg-orange-600 text-white shadow-orange-200' :
                        isPhoto ? 'bg-purple-600 text-white shadow-purple-200' :
                            isAudio ? 'bg-emerald-600 text-white shadow-emerald-200' :
                                isHelpline ? 'bg-blue-600 text-white shadow-blue-200' :
                                    isCrash ? 'bg-indigo-600 text-white shadow-indigo-200' :
                                        'bg-slate-600 text-white'
                    }`}>
                    {isSOS && <AlertCircle className="w-6 h-6 animate-pulse" />}
                    {(isVideo || alert.alert_type?.includes('VIDEO')) && <Video className="w-6 h-6 animate-pulse" />}
                    {isPhoto && <Camera className="w-6 h-6" />}
                    {(isAudio || alert.alert_type?.includes('AUDIO')) && <Volume2 className="w-6 h-6" />}
                    {isHelpline && <Phone className="w-6 h-6" />}
                    {isCrash && <Activity className="w-6 h-6 animate-pulse" />}

                    {alert.status === 'active' && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                        </span>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className={`font-black text-xs uppercase tracking-tight truncate border-b pb-1 mb-1 ${isSOS ? 'text-red-700 border-red-100' :
                        (isVideo || alert.alert_type?.includes('VIDEO')) ? 'text-blue-700 border-blue-100' :
                            isPhoto ? 'text-purple-700 border-purple-100' :
                                (isAudio || alert.alert_type?.includes('AUDIO')) ? 'text-emerald-700 border-emerald-100' :
                                    'text-slate-700 border-slate-100'
                        }`}>
                        {alert.alert_type?.replace(/ACTIVATED|COLLECTED/g, '').trim() || 'Log Entry'}
                    </h4>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none truncate">
                            {alert.created_at ? new Date(alert.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Live Now'}
                        </p>
                    </div>
                </div>
            </div>

            {videoUrl && (
                <div className="mb-4 bg-blue-50 p-2 rounded-xl border border-blue-100 overflow-hidden shadow-sm">
                    <video src={videoUrl} controls className="w-full rounded-lg aspect-video bg-black" />
                </div>
            )}

            {audioUrl && !videoUrl && (
                <div className="mb-4 bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                    <audio src={audioUrl} controls className="w-full h-8 scale-90" />
                </div>
            )}

            <div className="bg-gradient-to-br from-slate-50 to-white p-3 rounded-xl border border-slate-100 shadow-inner mb-5 min-h-[50px] group-hover:border-slate-200 transition-colors">
                <p className="text-[11px] font-bold text-slate-700 line-clamp-2 leading-relaxed uppercase tracking-tight">
                    <span className="text-slate-400 mr-1">📍</span>
                    {(!alert.location_address || alert.location_address.includes('DETERMINING')) ? 'Syncing Precise Location...' : alert.location_address}
                </p>
            </div>

            {alert.latitude && alert.longitude && (
                <a href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`} target="_blank" rel="noreferrer" className={`w-full text-white text-[10px] uppercase tracking-[0.15em] font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 mb-8 shadow-md ${alert.alert_type === 'sos' ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 'bg-slate-900 hover:bg-black shadow-slate-200'}`}>
                    <MapPin className="w-4 h-4" /> Secure Map Link
                </a>
            )}

            <div className="mt-auto border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h5 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Camera className="w-4 h-4 text-red-500" /> Tactical Visuals
                    </h5>
                    {images.length > 0 && (
                        <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest">{images.length} Units</span>
                    )}
                </div>

                {loading && images.length === 0 ? (
                    <div className="grid grid-cols-3 gap-2.5">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square bg-slate-100 animate-pulse rounded-lg border border-slate-200"></div>)}
                    </div>
                ) : images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2.5">
                        {images.slice(0, 12).map((url, i) => (
                            <div key={i} className="relative aspect-square group/img rounded-xl overflow-hidden border-2 border-slate-100 bg-slate-900 cursor-pointer shadow-sm hover:border-red-500 transition-all duration-300 transform hover:scale-105" onClick={() => window.open(url, '_blank')}>
                                <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover/img:opacity-100 transition-opacity z-10 pointer-events-none"></div>
                                <img src={url} alt="Evidence" className="w-full h-full object-cover grayscale brightness-75 group-hover/img:grayscale-0 group-hover/img:brightness-100 transition-all duration-700" onError={(e) => {
                                    // Fallback for broken URLs (likely public URLs to private bucket)
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Syncing...';
                                }} />
                                <div className="absolute bottom-1 right-1 bg-black/50 text-[6px] text-white px-1 rounded uppercase font-bold backdrop-blur-sm">C-{i + 1}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center opacity-40">
                        <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center mb-2">
                            <Camera className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center">Optic Link Offline</span>
                    </div>
                )}
            </div>
        </div>
    );
}
