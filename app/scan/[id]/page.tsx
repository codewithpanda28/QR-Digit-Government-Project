'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, QRCode, QRDetails, EmergencyContact } from '@/lib/supabase'
import { getCurrentLocation as fetchgeoData, getAddressFromCoordinates } from '@/lib/location-utils'
import {
    Shield, Phone, MapPin, AlertCircle, Loader2, Heart, Info,
    Activity, LocateFixed, Camera, ShieldAlert, X, CheckCircle2,
    Smile, User, Target, Landmark, Droplets, ChevronRight, Bell,
    Users, MessageSquare, Car, ShieldCheck,
    Stethoscope, Smartphone, Navigation, NavigationOff, Truck, Flag, Search, Siren, Volume2,
    Flame, FileText, Download, ExternalLink, AlertTriangle, Lock, Unlock, KeyRound, HelpCircle,
    Edit2, RefreshCcw, Copy, Video, Play, StopCircle, PhoneOff, Clock, LayoutDashboard,
    Share2
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import UnifiedSafetyForm from '@/components/forms/UnifiedSafetyForm'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ScanPage() {
    const params = useParams()
    const id = params.id as string

    // Code & Data State
    const [qrCode, setQrCode] = useState<QRCode | null>(null)
    const [qrDetails, setQrDetails] = useState<QRDetails | null>(null)
    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
    const [loading, setLoading] = useState(true)

    const [securityAnswers, setSecurityAnswers] = useState<Record<number, string>>({})
    const [isUnlocked, setIsUnlocked] = useState(false)
    const [pendingDocUrl, setPendingDocUrl] = useState<string | null>(null)
    const [pendingEditMode, setPendingEditMode] = useState(false)

    // Emergency State
    const [geoData, setGeoData] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null)
    const [sendingAlert, setSendingAlert] = useState(false)
    const [isCapturing, setIsCapturing] = useState(false)
    const [autoCallInitiated, setAutoCallInitiated] = useState(false)
    const [sirenActive, setSirenActive] = useState(false)

    // Security State
    const [isLocked, setIsLocked] = useState(false)
    const [showUnlockModal, setShowUnlockModal] = useState(false)
    const [showForgotModal, setShowForgotModal] = useState(false)
    const [pinInput, setPinInput] = useState('')
    const [securityQuestions, setSecurityQuestions] = useState<any[]>([])

    // Edit State
    const [isEditing, setIsEditing] = useState(false)
    const [showEditAuthModal, setShowEditAuthModal] = useState(false)

    // Dynamic Incidents
    const [showIncidentModal, setShowIncidentModal] = useState(false)
    const [customIncidentMsg, setCustomIncidentMsg] = useState('')

    // Auto-Alert Trackers
    const hasTriggeredToolAlert = useRef(false)
    const prefetchedBlobsRef = useRef<{ blob: Blob; mode: string }[]>([])
    const prefetchEvidencePromise = useRef<Promise<any> | null>(null)

    const getIncidents = () => {
        const cat = qrCode?.category?.toLowerCase() || ''
        if (cat.includes('vehicle') || cat.includes('car') || cat.includes('bike') || cat.includes('scooter')) {
            return [
                { id: 'accident', label: 'Accident / दुर्घटना 💥', color: 'bg-red-600' },
                { id: 'parking', label: 'Wrong Parking / गलत पार्किंग 🚜', color: 'bg-orange-500' },
                { id: 'stolen', label: 'Theft / चोरी 🚔', color: 'bg-slate-900' },
                { id: 'medical', label: 'Medical Emergency / मेडिकल 🚑', color: 'bg-rose-500' }
            ]
        }
        if (cat.includes('women') || cat.includes('personal') || cat.includes('missing-child') || cat.includes('senior')) {
            return [
                { id: 'harassment', label: 'Harassment / छेड़खानी ⚠️', color: 'bg-orange-600' },
                { id: 'danger', label: 'Immediate Danger / खतरा 🆘', color: 'bg-red-600' },
                { id: 'medical', label: 'Medical Risk / मेडिकल 🚑', color: 'bg-rose-500' },
                { id: 'lost', label: 'Lost Person / गुमशुदा 🏃', color: 'bg-slate-800' }
            ]
        }
        if (cat.includes('pet') || cat.includes('dog') || cat.includes('cat')) {
            return [
                { id: 'lost', label: 'Lost Pet / खोया हुआ पालतू 🐕', color: 'bg-red-500' },
                { id: 'found', label: 'Found This Pet / पालतू मिला 🐾', color: 'bg-green-600' },
                { id: 'injured', label: 'Injured Pet / घायल पालतू 🩹', color: 'bg-orange-500' },
                { id: 'medical', label: 'Pet Medical Issue / मेडिकल 🏥', color: 'bg-blue-600' }
            ]
        }
        if (cat.includes('wallet') || cat.includes('laptop') || cat.includes('luggage') || cat.includes('asset')) {
            return [
                { id: 'found', label: 'I Found This Item / सामान मिला ✅', color: 'bg-green-600' },
                { id: 'stolen', label: 'Asset Stolen / चोरी हुआ 🚨', color: 'bg-red-600' },
                { id: 'other', label: 'Contact Owner / संपर्क करें 📱', color: 'bg-slate-800' }
            ]
        }
        return [
            { id: 'emergency', label: 'General SOS-Rescue / बचाव 🚨', color: 'bg-red-600' },
            { id: 'medical', label: 'Medical Crisis / मेडिकल 🚑', color: 'bg-rose-500' },
            { id: 'police', label: 'Police/Guard / पुलिस 🚔', color: 'bg-blue-600' },
            { id: 'fire', label: 'Fire Hazard / आग 🔥', color: 'bg-orange-600' }
        ]
    }

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // --- EFFECTS ---

    useEffect(() => {
        if (id) loadQRData()
    }, [id])

    useEffect(() => {
        if (typeof window === 'undefined' || !navigator.geolocation) return

        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        const isSecure = window.location.protocol === 'https:'
        if (!isSecure && !isLocal) return // Geolocation won't work anyway

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setGeoData({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy
                })
            },
            (err) => {
                if (err.code === 1) console.warn('GPS Permission Denied')
                else console.error('GPS Watch Error:', err.message)
            },
            {
                enableHighAccuracy: true,
                maximumAge: 5000, // Faster refresh
                timeout: 15000
            }
        )
        return () => navigator.geolocation.clearWatch(watchId)
    }, [])

    useEffect(() => {
        if (!loading && qrCode && typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const autoParam = urlParams.get('auto');
            if (!autoParam) return;

            // Only trigger once to avoid loops
            if ((window as any)._autoTriggered) return;
            (window as any)._autoTriggered = true;

            setTimeout(() => {
                if (autoParam === 'siren' && !sirenActive) toggleSiren()
                if (autoParam === 'camera' || autoParam === 'MANUAL PHOTO') openCamera('photo')
                if (autoParam === 'camera_video' || autoParam === 'MANUAL VIDEO') openCamera('video')
                // Ensure audio isn't already recording
                if (autoParam === 'audio' && !isRecordingAudio) startAudioEvidence(qrCode.id)
                if (autoParam === 'crash' && !crashDetectionEnabled) enableCrashDetection()
                if (autoParam === 'sos') {
                    setShowIncidentModal(true)
                    if (!prefetchEvidencePromise.current) {
                        prefetchEvidencePromise.current = captureAndUploadEvidence(qrCode.id, undefined)
                    }
                }
                if (autoParam === 'panic') {
                    handleEmergencyAlert('REMOTE PANIC', true)
                }
                if (autoParam === 'share') {
                    if (geoData) {
                        const link = `https://www.google.com/maps?q=${geoData.lat},${geoData.lng}`
                        window.open(`https://wa.me/?text=🚨 *LIVE LOCATION SHARE*\n\nMy current location coordinates are:\n${link}`, '_blank')
                    } else {
                        toast.error('GPS Data not ready yet. Please wait and try again.')
                    }
                }

                // Remove parameter from URL quietly so it doesn't trigger on refresh
                window.history.replaceState({}, document.title, window.location.pathname)
                toast.success('Admin Remote Trigger Activated')
            }, 800) // slight delay to allow location and DOM resolution
        }
    }, [loading, qrCode, geoData])
    // --- DATA LOADING ---

    async function loadQRData() {
        setLoading(true)
        try {
            // Determine if input is a potential UUID or a human QR Number
            const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)

            let query = supabase.from('qr_codes').select('*')
            if (isUUID) {
                query = query.or(`id.eq.${id},qr_number.eq.${id}`)
            } else {
                query = query.eq('qr_number', id)
            }

            const { data: qr } = await query.maybeSingle()

            if (!qr) throw new Error('Not Found')
            // Check for dynamic expiration
            if (qr.subscription_end) {
                // Ensure browser treats it as UTC if it's an ISO string without timezone
                const expiryStr = qr.subscription_end.includes('Z') || qr.subscription_end.includes('+')
                    ? qr.subscription_end
                    : `${qr.subscription_end}Z`;

                const expiry = new Date(expiryStr);
                const now = new Date();

                // Add a 2-minute grace period to account for clock skew between server and client
                // This prevents the QR from expiring immediately if the user's device clock is slightly ahead.
                if (expiry.getTime() + 120000 < now.getTime()) {
                    qr.status = 'expired';
                }
            }

            setQrCode(qr)

            // LOG THE SCAN (Only once per session)
            const scanKey = `scanned_${id}`
            if (!sessionStorage.getItem(scanKey)) {
                logScan(qr.id, qr.scan_count || 0)
                sessionStorage.setItem(scanKey, 'true')
            }

            if (qr.status === 'activated') {
                // Use maybeSingle and ordering to handle potential duplicates gracefully (Fixes 406 error)
                const { data: details, error: detailsError } = await supabase
                    .from('qr_details')
                    .select('*')
                    .eq('qr_id', qr.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                if (detailsError) console.error('Details Fetch Error:', detailsError)

                const { data: contacts, error: contactsError } = await supabase
                    .from('emergency_contacts')
                    .select('*')
                    .eq('qr_id', qr.id)
                    .order('priority', { ascending: true })

                if (contactsError) console.error('Contacts Fetch Error:', contactsError)

                if (details) {
                    setQrDetails(details)
                    // Check Locks
                    const hasPrivateFields = details.additional_data?.custom_fields?.some((f: any) => f.isPrivate)
                    const hasPrivateDocs = details.additional_data?.documents?.some((d: any) => d.isPrivate)
                    const isAddressLocked = details.additional_data?.is_address_private

                    if ((hasPrivateFields || hasPrivateDocs || isAddressLocked) && details.additional_data?.access_pin) {
                        setIsLocked(true)
                        setIsUnlocked(false)
                    }
                }
                if (contacts) setEmergencyContacts(contacts)
            }
        } catch (error) {
            toast.error('Identity Grid Offline')
        } finally {
            setLoading(false)
        }
    }

    async function logScan(qrId: string, currentCount: number) {
        try {
            const ua = navigator.userAgent
            let locAddress = 'Unknown Location'
            let lat = null
            let lng = null

            // Try to get quick location if already available
            if (geoData) {
                lat = geoData.lat
                lng = geoData.lng
                try {
                    locAddress = await getAddressFromCoordinates(lat, lng)
                } catch (e) { }
            }

            // Also update the main QR record with live stats
            await supabase.from('qr_codes').update({
                scan_count: currentCount + 1,
                last_scanned_at: new Date().toISOString(),
                last_scanned_location: locAddress
            }).eq('id', qrId)

            await supabase.from('scan_logs').insert({
                qr_id: qrId,
                user_agent: ua,
                scan_location: locAddress,
                latitude: lat,
                longitude: lng,
                metadata: {
                    platform: navigator.platform,
                    language: navigator.language
                }
            })
        } catch (e) {
            console.error('Scan Logging Failed:', e)
        }
    }

    // --- EMERGENCY ACTIONS ---

    async function captureAndUploadEvidence(qrId: string, alertId?: string): Promise<string[]> {
        const photos: string[] = []
        if (!videoRef.current || !canvasRef.current) return []
        setIsCapturing(true)

        // If we have prefetched blobs, upload them directly instead of re-capturing
        if (alertId && prefetchedBlobsRef.current.length > 0) {
            const blobs = [...prefetchedBlobsRef.current]
            prefetchedBlobsRef.current = [] // Clear it

            for (let i = 0; i < blobs.length; i++) {
                const { blob, mode } = blobs[i]
                const path = `emergencies/${qrId}/${alertId}/${mode}_${Date.now()}_${i}.jpg`
                await supabase.storage.from('emergency-evidence').upload(path, blob)
                const { data: { publicUrl } } = supabase.storage.from('emergency-evidence').getPublicUrl(path)
                photos.push(publicUrl)
            }
            setIsCapturing(false)
            return photos
        }

        const captureSequence = async (mode: 'user' | 'environment', count: number) => {
            let stream: MediaStream | null = null;
            try {
                if (videoRef.current?.srcObject) {
                    const oldStream = videoRef.current.srcObject as MediaStream
                    oldStream.getTracks().forEach(t => t.stop())
                    videoRef.current.srcObject = null;
                }

                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: mode }
                }).catch(() => navigator.mediaDevices.getUserMedia({ video: true }))

                if (videoRef.current && stream) {
                    videoRef.current.srcObject = stream
                    videoRef.current.setAttribute('playsinline', 'true');
                    await videoRef.current.play().catch(e => console.warn("Auto-play blocked:", e));

                    await new Promise((resolve) => {
                        const checkVideo = () => {
                            if (videoRef.current && videoRef.current.videoWidth > 0) resolve(null);
                            else setTimeout(checkVideo, 100);
                        };
                        checkVideo();
                        setTimeout(resolve, 2000); 
                    });

                    const context = canvasRef.current?.getContext('2d')
                    if (context && canvasRef.current) {
                        const uploadPromises: Promise<void>[] = [];
                        
                        for (let i = 0; i < count; i++) {
                            if (videoRef.current && videoRef.current.videoWidth > 0) {
                                canvasRef.current.width = 480;
                                canvasRef.current.height = 640;
                                context.drawImage(videoRef.current, 0, 0, 480, 640)
                                
                                const blob = await new Promise<Blob | null>(r => canvasRef.current?.toBlob(r, 'image/jpeg', 0.5))
                                if (blob) {
                                    if (alertId) {
                                        const path = `emergencies/${qrId}/${alertId}/${mode}_${Date.now()}_${photos.length + uploadPromises.length}.jpg`
                                        // 🚀 CONCURRENT UPLOAD
                                        const uploadTask = (async () => {
                                            const { error } = await supabase.storage.from('emergency-evidence').upload(path, blob)
                                            if (!error) {
                                                const { data: { publicUrl } } = supabase.storage.from('emergency-evidence').getPublicUrl(path)
                                                photos.push(publicUrl)
                                            }
                                        })();
                                        uploadPromises.push(uploadTask);
                                    } else {
                                        prefetchedBlobsRef.current.push({ blob, mode })
                                    }
                                }
                            }
                            await new Promise(r => setTimeout(r, 300)) // Faster burst
                        }
                        // Wait for this camera's uploads to finish before potential lens swap
                        await Promise.all(uploadPromises);
                    }
                }
            } catch (e) {
                console.error(`Camera capture failed for mode: ${mode}`, e)
            } finally {
                if (stream) stream.getTracks().forEach(t => t.stop());
                if (videoRef.current) videoRef.current.srcObject = null;
            }
        }

        // 1. Capture Face Camera (Quota: 3)
        await captureSequence('user', 3)
        
        // 🚀 SMART DELAY: Allow some time for focus and lens swap
        await new Promise(r => setTimeout(r, 800));

        // 2. Capture Environment Camera (Quota: 3)
        // We try it even if we have some photos already, to ensure variety
        await captureSequence('environment', 3)

        // 3. FALLBACK: Intense Burst if still under 6 units after both cams
        if (photos.length < 6) {
            const remaining = 6 - photos.length;
            await captureSequence('user', remaining);
        }

        setIsCapturing(false)
        return photos
    }

    async function handleEmergencyAlert(incidentLabel = 'SOS EMERGENCY', isSilent = false, customMsg = '', skipWhatsApp = false, isRealCall = false) {
        // MANDATORY: Check if GPS is enabled/permitted before proceeding
        let tId: any = null;
        if (!isSilent) tId = toast.loading('Calibrating GPS Signal...')

        // 🚀 SUPER FAST GPS: Use background cache if available to skip 3-5sec delay!
        let loc = geoData
        try {
            if (!loc || (loc.accuracy && loc.accuracy > 100)) {
                loc = await fetchgeoData()
                if (!isSilent) toast.dismiss(tId)
            } else {
                if (!isSilent) toast.dismiss(tId)
            }
        } catch (e: any) {
            if (!isSilent) toast.dismiss(tId)
            console.warn('GPS Accuracy:', e)

            if (!geoData) {
                if (e.code === 1) {
                    setShowLocationHelp(true)
                } else {
                    let errorMsg = 'Location (GPS) is OFF. Please turn it ON.'
                    if (e.code === 2) errorMsg = 'GPS Signal weak. Move to an open area.'
                    else if (e.code === 3) errorMsg = 'GPS Timeout. Please try again.'
                    toast.error(errorMsg, { duration: 5000 })
                }
                return
            }
            loc = geoData
            if (!isSilent) toast.success('Using last known location', { duration: 2000 })
        }

        if (!qrCode || !qrDetails || !loc) {
            toast.error('Location required to send alerts.')
            return
        }

        let alertId: string | undefined;
        if (!isSilent) alertId = toast.loading('Securing Evidence & Dispatching...')
        setSendingAlert(true)
        let alertIdCreated: string | undefined;
        let photos: string[] = [];
        try {
            // 1. 🚀 ULTRA-FAST DISPATCH: Update Radar Dashboard Instantly
            try {
                const alertResponse = await fetch('/api/emergency/trigger', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        qr_id: qrCode.id,
                        user_id: qrCode.generated_by,
                        alert_type: (incidentLabel || qrCode.category) + (customMsg ? ` - ${customMsg}` : ''),
                        lat: loc?.lat || 0,
                        lng: loc?.lng || 0,
                        address: 'Syncing Precise Location...',
                        skip_whatsapp: skipWhatsApp
                    })
                })
                const alertResult = await alertResponse.json()
                if (alertResponse.ok) alertIdCreated = alertResult.alert?.id;
            } catch (err) {
                console.error("Critical Radar Sync Error:", err)
            }

            // 2. Resolve Address & Photos in Parallel
            // If we have prefetched blobs, wait for the capture to finish if it hasn't, then upload them to the SUBFOLDER
            if (prefetchEvidencePromise.current) {
                await prefetchEvidencePromise.current;
                prefetchEvidencePromise.current = null; // Important: Clear it so the next SOS can prefetch
            }

            const [address, capturedPhotos] = await Promise.all([
                getAddressFromCoordinates(loc.lat, loc.lng).catch(() => 'Location Identified'),
                captureAndUploadEvidence(qrCode.id, alertIdCreated)
            ]);
            photos = capturedPhotos;

            // 3. 🚀 CRITICAL UPDATE: Patch the alert record with the real solved address and final data
            if (alertIdCreated) {
                fetch('/api/emergency/trigger', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        alert_id: alertIdCreated, // Pass ID to trigger an "UPDATE" instead of "CREATE"
                        address: address,
                        lat: loc.lat,
                        lng: loc.lng,
                        status: 'active',
                        skip_whatsapp: skipWhatsApp,
                        evidence_photos: photos || []
                    })
                }).catch(e => console.error("Alert Update Failed:", e))
            }

            const mapLink = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
            const evidencePhotos = photos || [];
            prefetchEvidencePromise.current = null; // Clean up
            const imageList = evidencePhotos && evidencePhotos.length > 0 ? evidencePhotos : []
            const primaryEvidence = imageList.length > 0 ? imageList[0] : null

            // 3. Compose Final Message (Simplified for clarity)
            const alertMsg = `🚨 *${incidentLabel.toUpperCase()}* EMERGENCY! 🚨

👤 Name: *${qrDetails.full_name}*
🆘 HELP NEEDED! (MUSIBAT MEIN HAIN)

${customMsg ? `💬 Info: ${customMsg}\n` : 'Please check immediately! Help is required.'}
${primaryEvidence ? `📸 Live Photo (Saboot): ${primaryEvidence}\n` : ''}
📍 Location (Maps): ${mapLink}
🏠 Address: ${address}

_Automatic Safety Alert by Q-Raksha_`

            // 🚀 FAST-TRACK WHATSAPP: Removed from here because it's now handled synchronously in the onClick handler
            // to bypass modern browser popup blockers which kill async window.open calls.

            // 4. Fire Client-Side WhatsApp Blast (Handled AFTER evidence is ready)
            if (!skipWhatsApp && emergencyContacts.length > 0) {
                emergencyContacts.forEach((contact, index) => {
                    const cleanPhone = contact.phone.replace(/\D/g, '')
                    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(alertMsg)}`

                    setTimeout(() => {
                        toast(`Dispatching to ${contact.name}...`, { icon: '📲' });
                        window.open(waUrl, '_blank')
                    }, index * 2000) // Sequential delay to reduce browser blocking
                })
            }

            // Unblock UI immediately
            if (!isSilent) {
                toast.dismiss(alertId)
                toast.success('Alert Sent with Evidence!')
            }
            hasTriggeredToolAlert.current = true
            setSendingAlert(false) // Give user control back to use tools

                // 5. Background Task: Send Emails and Server APIs
                ; (async () => {
                    try {
                        // Send Email with Evidence attached
                        const emailRecipients = ['xjony83@gmail.com']
                        if (qrDetails.additional_data?.emergency_email) {
                            emailRecipients.push(qrDetails.additional_data.emergency_email)
                        }

                        emailRecipients.forEach(email => {
                            fetch('/api/email/send', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    to: email,
                                    subject: `SOS EMERGENCY: ${qrDetails.full_name}`,
                                    message: alertMsg,
                                    qr_id: qrCode.id,
                                    evidenceImage: primaryEvidence
                                })
                            }).catch(err => console.error(`Email Trigger Failed for ${email}`, err))
                        })

                        // Send API WhatsApp (Background stealth alert simulation)
                        const contactNumbers = emergencyContacts.map(c => c.phone)
                        if (contactNumbers.length > 0 && !skipWhatsApp) {
                            fetch('/api/whatsapp/send', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    contacts: contactNumbers,
                                    message: alertMsg,
                                    images: imageList,
                                    location: { lat: loc?.lat, lng: loc?.lng, address }
                                })
                            }).catch(err => console.error('Server WA Failed', err))

                            // Trigger Automated Voice Calls (ONLY FOR MAIN SOS - NOT FOR SILENT TOOLS)
                            if (!isSilent) {
                                // 💡 IF isRealCall is true, we use the Bridge API to connect Scanner directly to Family
                                // We first play the recording on the bridge leg.
                                // We use the user_phone state which is synced with localStorage
                                const savedPhone = localStorage.getItem('safety_user_phone');

                                fetch('/api/emergency/call-contacts', {
                                    method: 'POST',
                                    mode: 'cors',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        contacts: contactNumbers,
                                        ownerName: qrDetails.full_name,
                                        incidentType: incidentLabel,
                                        isRealCall: isRealCall,
                                        scannerNumber: savedPhone // Required for bridging
                                    })
                                }).then(async res => {
                                    const callData = await res.json();
                                    console.log("Call API Result:", callData);
                                }).catch(err => console.error('Voice Call Trigger Failed', err))
                            }
                        }

                    } catch (bgErr) {
                        console.error("Background Alert Protocol Failed:", bgErr)
                    }
                })()

        } catch (e: any) {
            console.error('Alert Process Error:', e)
            if (!isSilent) {
                toast.dismiss(alertId);
                toast.error(`Alert Failed: ${e.message || 'Unknown Error'}`)
            }
            setSendingAlert(false)
        }
        return { id: alertIdCreated, photos: photos || [] };
    }

    // Auto-Alert Function for Tools
    const triggerToolAutoAlert = async (toolName: string, forcePriority = false, skipWhatsApp = false, isRealCall = false) => {
        if (!geoData) {
            toast.error('Location required for safety logs.');
            setShowLocationHelp(true);
            return { id: null, photos: [] };
        }
        return await handleEmergencyAlert(`${toolName}`, !forcePriority, '', skipWhatsApp, isRealCall)
    }

    // --- LOCATION HELPER (Mobile Optimized) ---
    async function fetchgeoData(): Promise<{ lat: number; lng: number; accuracy: number }> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                toast.error('Browser does not support GPS')
                return reject(new Error('Geolocation not supported'))
            }

            // CRITICAL MOBILE CHECK: Geolocation ONLY works on HTTPS (except localhost)
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            const isSecure = window.location.protocol === 'https:'

            if (!isSecure && !isLocal) {
                toast.error('Security: HTTPS required for location to work.', { duration: 6000 })
                return reject(new Error('Insecure Context'))
            }

            const geoOptions = {
                enableHighAccuracy: true,
                timeout: 5000, // Faster timeout for initial try
                maximumAge: 0   // Force FRESH LOCK every single time
            }

            const success = (pos: GeolocationPosition) => {
                const loc = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy
                }

                // If accuracy is poor (>150m), try again once more for a better lock
                if (pos.coords.accuracy > 150) {
                    toast.loading('Signal weak, wait for calibration...', { duration: 1500 });
                }

                setGeoData(loc)
                resolve(loc)
            }

            const error = (err: GeolocationPositionError) => {
                console.warn(`GPS High-Accuracy Error (${err.code}): ${err.message}`)

                if (err.code === 1) { // PERMISSION DENIED
                    return reject(err)
                }

                // If timeout or signal lost, TRY ONE LAST TIME with high-accuracy but longer timeout
                // DON'T fall back to low accuracy — that gives wrong locations (IP based).
                // Silent improvement in background
                // toast.loading('Improving GPS Lock... Move near a window or open area.');
                navigator.geolocation.getCurrentPosition(
                    success,
                    (finalErr) => {
                        toast.error('G-PAKSH: High Accuracy GPS FAILED. Please ensure GPS is ON and you are in an open area.', { duration: 6000 })
                        reject(finalErr)
                    },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
                )
            }

            navigator.geolocation.getCurrentPosition(success, error, geoOptions)
        })
    }


    // --- SECURITY FUNCTIONS ---

    const handleUnlock = () => {
        if (pinInput === qrDetails?.additional_data?.access_pin) {
            toast.success('Identity Verified')
            setIsUnlocked(true)
            setShowUnlockModal(false)
            setPinInput('')

            if (pendingDocUrl) {
                window.open(pendingDocUrl, '_blank')
                setPendingDocUrl(null)
            }
        } else {
            toast.error('Invalid Access PIN')
            setPinInput('')
        }
    }

    const handleEditAuth = () => {
        // If profile has no PIN, allow edit directly
        if (!qrDetails?.additional_data?.access_pin) {
            setIsEditing(true)
            setShowEditAuthModal(false)
            return
        }

        if (pinInput === qrDetails?.additional_data?.access_pin) {
            toast.success('Access Granted')
            setIsEditing(true)
            setShowEditAuthModal(false)
            setPinInput('')
        } else {
            toast.error('Invalid PIN')
            setPinInput('')
        }
    }

    const handleForgotPin = (fromEdit: boolean = false) => {
        // 📸 AUDIT TRAIL: Trigger a silent evidentiary alert to capture the person's photo
        // This photo will be saved to the Alert history on the login dashboard.
        triggerToolAutoAlert('PIN RECOVERY ATTEMPT', true, true);

        // Generate Security Questions based on Profile Data
        const questions = []

        // Q1: Address (Only if PRIVATE)
        if (qrDetails?.home_address && qrDetails?.additional_data?.is_address_private) {
            const firstWord = qrDetails.home_address.split(' ')[0]
            questions.push({
                id: 1,
                question: 'Confirm FIRST word of the Private Address?',
                answer: firstWord
            })
        }

        // Q2: Father's Name (Harder)
        if (qrDetails?.father_name) {
            questions.push({
                id: questions.length + 1,
                question: 'What is your Father\'s Registered Name?',
                answer: qrDetails.father_name
            })
        }

        // Q3: Mother's Name (Harder)
        if (qrDetails?.mother_name) {
            questions.push({
                id: questions.length + 1,
                question: 'What is your Mother\'s Registered Name?',
                answer: qrDetails.mother_name
            })
        }

        // Q4: School/Organization (Private details preferred)
        if (qrDetails?.school_name) {
            questions.push({
                id: questions.length + 1,
                question: 'What is the School/Organization Registered?',
                answer: qrDetails.school_name
            })
        }

        // Q5: Guardian 1 Phone (Last 4 - Not visible on page)
        if (emergencyContacts.length > 0) {
            const last4 = emergencyContacts[0].phone.slice(-4)
            questions.push({
                id: questions.length + 1,
                question: `Last 4 digits of ${emergencyContacts[0].name}'s Phone?`,
                answer: last4
            })
        }

        // Q6: Guardian 2 Phone (Last 4 - Not visible on page)
        if (emergencyContacts.length > 1) {
            const last4 = emergencyContacts[1].phone.slice(-4)
            questions.push({
                id: questions.length + 1,
                question: `Last 4 digits of ${emergencyContacts[1].name}'s Phone?`,
                answer: last4
            })
        }

        // --- FALLBACK QUESTIONS ---
        const fallbackQuestions = [
            { q: 'What is 5 + 3?', a: '8' },
            { q: 'What is the color of most Grass (Green/Red)?', a: 'Green' },
            { q: 'How many legs does a Normal Chair have?', a: '4' }
        ]

        let fbIndex = 0
        while (questions.length < 3 && fbIndex < fallbackQuestions.length) {
            questions.push({
                id: questions.length + 1,
                question: fallbackQuestions[fbIndex].q,
                answer: fallbackQuestions[fbIndex].a
            })
            fbIndex++
        }

        setSecurityQuestions(questions)
        setShowUnlockModal(false)
        setShowEditAuthModal(false)
        if (fromEdit) setPendingEditMode(true)
        setShowForgotModal(true)
    }

    const verifySecurityAnswers = () => {
        let correctCount = 0
        securityQuestions.forEach(q => {
            const userAns = securityAnswers[q.id]?.toLowerCase().trim()
            const correctAns = q.answer.toLowerCase().trim()
            if (userAns && correctAns.includes(userAns)) correctCount++
        })

        if (correctCount >= 2) {
            toast.success('Ownership Verified')
            setIsUnlocked(true)

            // Resume Edit Mode if that was the intent
            if (pendingEditMode) {
                setIsEditing(true)
                setPendingEditMode(false)
            }

            if (pendingDocUrl) {
                window.open(pendingDocUrl, '_blank')
                setPendingDocUrl(null)
            }

            setShowForgotModal(false)
        } else {
            toast.error(`Verification Failed. ${correctCount}/3 Correct`)
        }
    }

    // --- SECURE CALL SYSTEM (ONE-TIME SETUP) ---
    const [showSetupModal, setShowSetupModal] = useState(false)
    const [userPhone, setUserPhone] = useState('')
    const [targetContact, setTargetContact] = useState<any>(null)
    const [callingStatus, setCallingStatus] = useState<'idle' | 'calling' | 'connected'>('idle')
    const [showLocationHelp, setShowLocationHelp] = useState(false)

    const sirenRef = useRef<{ ctx: AudioContext; osc: OscillatorNode; gain: GainNode } | null>(null)
    const sirenIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // --- AUDIO EVIDENCE STATE ---
    const [isRecordingAudio, setIsRecordingAudio] = useState(false)
    const audioRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])

    // --- VIDEO EVIDENCE STATE ---
    const [isRecordingVideo, setIsRecordingVideo] = useState(false)
    const videoEvidenceRecorderRef = useRef<MediaRecorder | null>(null)
    const videoEvidenceChunksRef = useRef<Blob[]>([])
    const [lastCapturedVideo, setLastCapturedVideo] = useState<string | null>(null)

    // --- CRASH DETECTION STATE ---
    const [crashDetected, setCrashDetected] = useState(false)
    const [crashDetectionEnabled, setCrashDetectionEnabled] = useState(false)

    // --- LIVE CAMERA MODAL STATE ---
    const manualVideoRef = useRef<HTMLVideoElement>(null)
    const manualCanvasRef = useRef<HTMLCanvasElement>(null)
    const manualStreamRef = useRef<MediaStream | null>(null)
    const [showCameraModal, setShowCameraModal] = useState(false)
    const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment')
    const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo')
    const [capturedPreview, setCapturedPreview] = useState<string | null>(null) // image or video preview url
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
    const [lastCapturedPhoto, setLastCapturedPhoto] = useState<string | null>(null)
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
    const [videoTimer, setVideoTimer] = useState(0)
    const timerRef = useRef<any>(null)

    // --- NEW SAFETY FEATURES STATE ---
    const [timerActive, setTimerActive] = useState(false)
    const [timeLeft, setTimeLeft] = useState(300) // 5 mins
    const shieldTimerRef = useRef<any>(null)

    const [flashActive, setFlashActive] = useState(false)
    const flashIntervalRef = useRef<any>(null)

    const [showFakeCall, setShowFakeCall] = useState(false)
    const [fakeCallTimer, setFakeCallTimer] = useState(0)
    const fakeCallIntervalRef = useRef<any>(null)
    const [isFakeCalling, setIsFakeCalling] = useState(false)

    // --- LIVE TRACKING STATE ---
    const [isTracking, setIsTracking] = useState(false)
    const [trackingSessionId, setTrackingSessionId] = useState<string | null>(null)
    const [trackingCopied, setTrackingCopied] = useState(false)
    const trackingWatchRef = useRef<number | null>(null)
    const routePointsRef = useRef<{ lat: number; lng: number; ts: number }[]>([])

    useEffect(() => {
        // Load saved number on mount
        const saved = localStorage.getItem('safety_user_phone')
        if (saved) setUserPhone(saved)
    }, [])

    /* --- RIDER MODE AUTO-ON (Vehicle/Accident categories) ---
    useEffect(() => {
        if (!qrCode || loading) return;

        const cat = (qrCode.category || '').toLowerCase();
        // Check if QR belongs to Rider/Accident categories
        const isRiderMode = cat.includes('vehicle') || cat.includes('accident') || cat.includes('bike');

        if (isRiderMode && !crashDetectionEnabled && typeof window !== 'undefined') {
            // Permission workaround: System starts on first user CLICK/TOUCH anywhere
            const riderAction = () => {
                if (!crashDetectionEnabled) {
                    enableCrashDetection();
                    toast.success('🛡️ RIDER MODE: Crash Guard Active', {
                        duration: 5000,
                        icon: '💥'
                    });
                }
                window.removeEventListener('click', riderAction);
                window.removeEventListener('touchstart', riderAction);
            };
            window.addEventListener('click', riderAction);
            window.addEventListener('touchstart', riderAction);
            return () => {
                window.removeEventListener('click', riderAction);
                window.removeEventListener('touchstart', riderAction);
            };
        }
    }, [qrCode, loading, crashDetectionEnabled]); */

    const handleSecureCall = (contact: any) => {
        setTargetContact(contact)
        const saved = localStorage.getItem('safety_user_phone')

        if (saved) {
            // DIRECT CALL (No Form)
            executeCall(saved, contact.phone)
        } else {
            // First Time Setup
            setShowSetupModal(true)
        }
    }

    const executeCall = async (caller: string, receiver: string) => {
        setCallingStatus('calling')
        const tId = toast.loading('Connecting Securely...')

        try {
            const response = await fetch('/api/call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scannerNumber: caller, // The stored number
                    ownerNumber: receiver
                })
            })

            const data = await response.json()
            if (data.success) {
                toast.success('Call Initiated! Picking up...', { icon: '📞' })
                setCallingStatus('connected')
                // Close modal if open
                setShowSetupModal(false)
            } else {
                throw new Error(data.error)
            }
        } catch (e) {
            toast.error('Call Failed. Try again.')
            setCallingStatus('idle')
        } finally {
            toast.dismiss(tId)
            setTimeout(() => setCallingStatus('idle'), 5000)
        }
    }

    const saveAndCall = () => {
        if (userPhone.length < 10) return toast.error('Enter valid number')
        localStorage.setItem('safety_user_phone', userPhone)
        executeCall(userPhone, targetContact.phone)
    }

    // --- SIREN FUNCTIONS ---
    const startSiren = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = 'sawtooth'
            osc.frequency.setValueAtTime(800, ctx.currentTime)
            gain.gain.setValueAtTime(0.8, ctx.currentTime)
            osc.start()
            sirenRef.current = { ctx, osc, gain }

            // Oscillate frequency for wail effect
            let up = true
            sirenIntervalRef.current = setInterval(() => {
                if (!sirenRef.current) return
                const freq = up ? 1200 : 700
                sirenRef.current.osc.frequency.linearRampToValueAtTime(freq, sirenRef.current.ctx.currentTime + 0.5)
                up = !up
            }, 500)

            setSirenActive(true)
            // toast.success('🚨 Siren Active! Tap again to stop.', { duration: 2000 })

            // 🔥 SYNC WHATSAPP OPEN for Primary Contact (Bypass Bloacker)
            // 🔥 SYNC WHATSAPP OPEN for All Contacts (Sequential)
            if (emergencyContacts.length > 0 && qrDetails && geoData) {
                emergencyContacts.forEach((contact, index) => {
                    const cleanPhone = contact.phone.replace(/\D/g, '');
                    const sirenMsg = `🚨 *SIREN ALARM ACTIVATED* 🚨\n\nName: *${qrDetails.full_name}*\n\n🆘 *URGENT HELP NEEDED (Bachao!)*\nI have activated the remote siren. Please help!\n\n📍 *Live Location:* https://www.google.com/maps?q=${geoData.lat},${geoData.lng}\n\n_Sent via Safety QR Secure Dispatch._`
                    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(sirenMsg)}`;

                    setTimeout(() => {
                        if (index > 0) toast(`Alerting Siren to ${contact.name}...`);
                        window.open(waUrl, '_blank');
                    }, index * 2000);
                });
            }

            // Force Priority means it will call contacts immediately
            triggerToolAutoAlert('SIREN ALARM', true)
        } catch (e) {
            toast.error('Browser blocked audio. Tap screen first.')
        }
    }

    const stopSiren = () => {
        if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current)
        if (sirenRef.current) {
            sirenRef.current.osc.stop()
            sirenRef.current.ctx.close()
            sirenRef.current = null
        }
        setSirenActive(false)
    }

    const toggleSiren = () => sirenActive ? stopSiren() : startSiren()

    // --- AUDIO EVIDENCE ---
    const startAudioEvidence = async (qrId: string, alertId?: string) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

            // Cross-browser MIME type support
            let mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/mp4';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/aac';
                    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = ''; // Let browser decide
                }
            }

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
            audioChunksRef.current = []
            recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
            recorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop())

                // 1. Log the tool alert (SKIP WhatsApp initially to combine)
                const result = await triggerToolAutoAlert('AUDIO EVIDENCE', false, true)
                const logAlertId = result?.id;
                const capturedPhotos = result?.photos || [];
                const firstPhoto = (capturedPhotos.length > 0) ? capturedPhotos[0] : null

                const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' })
                const extension = mimeType.includes('mp4') ? 'mp4' : (mimeType.includes('aac') ? 'aac' : 'webm');
                const path = logAlertId
                    ? `emergencies/${qrId}/${logAlertId}/audio_${Date.now()}.${extension}`
                    : `emergencies/${qrId}/audio_${Date.now()}.${extension}`

                await supabase.storage.from('emergency-evidence').upload(path, blob)
                const { data: { publicUrl } } = supabase.storage.from('emergency-evidence').getPublicUrl(path)

                toast.success('Audio evidence synced to dashboard!')
                setIsRecordingAudio(false)

                // 🔥 WhatsApp Redirection for Audio + PHOTOS (Combined!)
                if (emergencyContacts.length > 0 && qrDetails && geoData) {
                    const alertMsg = `🆘 *URGENT AUDIO/EVIDENCE LOGGED* 🆘\n\nI have recorded an audio log and captured live photos for safety.\n\n🎙️ *AUDIO:* ${publicUrl}${firstPhoto ? `\n📸 *PHOTO:* ${firstPhoto}` : ''}\n\n📍 *GPS LOCATION:* https://www.google.com/maps?q=${geoData.lat},${geoData.lng}\n\n_Sent via Q-Raksha Secure Dispatch_`

                    emergencyContacts.forEach((contact, index) => {
                        const primaryPhone = contact.phone.replace(/\D/g, '')
                        const waUrl = `https://wa.me/${primaryPhone}?text=${encodeURIComponent(alertMsg)}`

                        setTimeout(() => {
                            toast(`Syncing Evidence with ${contact.name}...`);
                            window.open(waUrl, '_blank')
                        }, index * 2000)
                    });
                }
            }
            recorder.start()
            audioRecorderRef.current = recorder
            setIsRecordingAudio(true)
            // Auto-stop after 60s
            setTimeout(() => { if (audioRecorderRef.current?.state === 'recording') audioRecorderRef.current.stop() }, 60000)
            toast.success('🎙️ Recording audio evidence...')
        } catch (e) {
            toast.error('Microphone access denied.')
        }
    }

    // --- VIDEO EVIDENCE ---
    const startVideoEvidence = async (qrId: string) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: true
            })

            // Cross-browser MIME type check
            let mimeType = 'video/webm;codecs=vp8,opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/mp4';
                if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';
            }

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
            videoEvidenceChunksRef.current = []
            recorder.ondataavailable = (e) => { if (e.data.size > 0) videoEvidenceChunksRef.current.push(e.data) }
            recorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop())

                const tId = toast.loading('Syncing video evidence...')
                try {
                    // 1. Log the tool alert (SKIP WhatsApp initially)
                    const result = await triggerToolAutoAlert('VIDEO EVIDENCE', false, true)
                    const logAlertId = result?.id;
                    const capturedPhotos = result?.photos || [];
                    const firstPhoto = (capturedPhotos.length > 0) ? capturedPhotos[0] : null

                    const blob = new Blob(videoEvidenceChunksRef.current, { type: mimeType || 'video/webm' })
                    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
                    const path = logAlertId
                        ? `emergencies/${qrId}/${logAlertId}/video_${Date.now()}.${extension}`
                        : `emergencies/${qrId}/video_${Date.now()}.${extension}`

                    await supabase.storage.from('emergency-evidence').upload(path, blob)
                    const { data: { publicUrl } } = supabase.storage.from('emergency-evidence').getPublicUrl(path)

                    setLastCapturedVideo(publicUrl)
                    toast.dismiss(tId)

                    // 🔥 WhatsApp BLAST (Combined Message)
                    if (emergencyContacts.length > 0 && qrDetails && geoData) {
                        const alertMsg = `🆘 *URGENT VIDEO/EVIDENCE* 🆘\n\nI have recorded a video incident and captured live photos.\n\n🎥 *VIDEO:* ${publicUrl}${firstPhoto ? `\n📸 *PHOTO:* ${firstPhoto}` : ''}\n\n📍 *GPS LOCATION:* https://www.google.com/maps?q=${geoData.lat},${geoData.lng}\n\n_Sent via Q-Raksha Secure Dispatch_`

                        emergencyContacts.forEach((contact, index) => {
                            const primaryPhone = contact.phone.replace(/\D/g, '')
                            const waUrl = `https://wa.me/${primaryPhone}?text=${encodeURIComponent(alertMsg)}`

                            setTimeout(() => {
                                toast(`Syncing Video with ${contact.name}...`);
                                window.open(waUrl, '_blank')
                            }, index * 2500)
                        });
                    } else {
                        toast.success('Video evidence synced to dashboard!')
                    }
                } catch (err) {
                    toast.dismiss(tId)
                    toast.error('Video upload failed')
                }
                setIsRecordingVideo(false)
            }
            recorder.start()
            videoEvidenceRecorderRef.current = recorder
            setIsRecordingVideo(true)

            // Auto-stop after 20s (keep it small for mobile uploads)
            setTimeout(() => {
                if (videoEvidenceRecorderRef.current?.state === 'recording') {
                    stopVideoEvidence()
                }
            }, 20000)

            toast.success('🎥 Recording video evidence...', { icon: '🔴' })
        } catch (e) {
            toast.error('Camera/Mic access denied.')
        }
    }

    const stopVideoEvidence = () => {
        if (videoEvidenceRecorderRef.current?.state === 'recording') {
            videoEvidenceRecorderRef.current.stop()
        }
    }

    const stopAudioEvidence = () => {
        setIsRecordingAudio(false) // Instant visual stop
        if (audioRecorderRef.current?.state === 'recording') {
            audioRecorderRef.current.stop()
        }
    }

    // --- CRASH DETECTION ---
    const enableCrashDetection = () => {
        if (typeof DeviceMotionEvent === 'undefined') {
            toast.error('Crash detection not supported on this device.')
            return
        }

        const CRASH_THRESHOLD = 45 // m/s² — increased to avoid false positives during manual handling
        let lastAlert = 0

        const onMotion = (e: DeviceMotionEvent) => {
            // ignore if we are already in middle of sending an alert
            if (sendingAlert) return;

            const acc = e.accelerationIncludingGravity
            if (!acc) return
            const total = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2)
            if (total > CRASH_THRESHOLD && Date.now() - lastAlert > 10000) {
                lastAlert = Date.now();
                setCrashDetected(true);
                toast.error('🚨 CRASH DETECTED! Sending SOS...', { duration: 5000 });

                // Trigger SOS - This will handle evidence capture and dispatch calls/emails
                handleEmergencyAlert('CRASH DETECTED');
                setTimeout(() => setCrashDetected(false), 8000);
            }
        }

        window.addEventListener('devicemotion', onMotion)
        setCrashDetectionEnabled(true)
            // triggerToolAutoAlert('CRASH DETECTION ENABLED', false, true);
            // Return cleanup — store globally for disable
            ; (window as any).__crashCleanup = () => window.removeEventListener('devicemotion', onMotion)
    }

    const disableCrashDetection = () => {
        ; (window as any).__crashCleanup?.()
        setCrashDetectionEnabled(false)
        // toast.success('Crash detection disabled')
    }

    // --- EXTRA SAFETY FEATURES ---

    // 🕒 SHIELD TIMER (AUTO-SOS)
    const toggleShieldTimer = (secs: number = 300) => {
        if (timerActive) {
            if (shieldTimerRef.current) clearInterval(shieldTimerRef.current)
            setTimerActive(false)
            setTimeLeft(300)
            // toast.success('🛡️ Safety Timer Deactivated')
        } else {
            setTimerActive(true)
            setTimeLeft(secs)
            // toast.success(`🛡️ Safety Mode Active for ${secs/60}m`)

            shieldTimerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(shieldTimerRef.current)
                        setTimerActive(false)
                        handleEmergencyAlert('AUTO SOS: TIMER EXPIRED')
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }
    }

    // 🔦 FLASHLIGHT SOS (VISUAL ALARM)
    const toggleFlashlightSOS = async () => {
        if (flashActive) {
            if (flashIntervalRef.current) clearInterval(flashIntervalRef.current)
            setFlashActive(false)
            // Restore stream
            try {
                const stream = manualStreamRef.current
                if (stream) {
                    const track = stream.getVideoTracks()[0]
                    if ((track as any).applyConstraints) await (track as any).applyConstraints({ advanced: [{ torch: false }] })
                }
            } catch (e) { }
        } else {
            setFlashActive(true)
            toast.success('🔦 Visual SOS Signal Active')

            let on = false
            flashIntervalRef.current = setInterval(async () => {
                on = !on
                try {
                    const stream = manualStreamRef.current || (await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }))
                    const track = stream.getVideoTracks()[0]
                    if ((track as any).applyConstraints) {
                        await (track as any).applyConstraints({ advanced: [{ torch: on }] })
                    }
                } catch (e) { }
            }, 150) // Fast strobe
        }
    }

    // 📞 FAKE CALL (SAFE EXIT)
    const startFakeCall = (delaySecs: number = 10) => {
        setFakeCallTimer(delaySecs)
        setShowFakeCall(true)
        setIsFakeCalling(false)

        const itv = setInterval(() => {
            setFakeCallTimer(prev => {
                if (prev <= 1) {
                    clearInterval(itv)
                    setIsFakeCalling(true)
                    // Play ringtone sound
                    const audio = new Audio('https://www.soundboard.com/handler/Downloadaudio.ashx?id=233405')
                    audio.play().catch(() => { })
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        fakeCallIntervalRef.current = itv
    }

    // --- LIVE CAMERA MODAL FUNCTIONS ---
    const openCamera = async (mode: 'photo' | 'video' = 'photo', facing: 'environment' | 'user' = 'environment') => {
        manualStreamRef.current?.getTracks().forEach(t => t.stop())
        setCapturedPreview(null)
        setVideoBlob(null)
        setVideoTimer(0)
        setCameraMode(mode)

        // 🚀 PROACTIVE CAPTURE: Start background evidence early while user is framing
        if (qrCode && !prefetchEvidencePromise.current) {
            console.log("[PREFETCH] Starting background capture during camera framing...");
            prefetchEvidencePromise.current = captureAndUploadEvidence(qrCode.id);
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: mode === 'video'
            })
            manualStreamRef.current = stream
            setCameraFacing(facing)
            setShowCameraModal(true)
            setTimeout(() => {
                if (manualVideoRef.current) {
                    manualVideoRef.current.srcObject = stream
                    manualVideoRef.current.play()
                }
            }, 100)
        } catch (e: any) {
            toast.error('Camera/Mic access denied. Please check settings.')
        }
    }

    const closeCamera = () => {
        manualStreamRef.current?.getTracks().forEach(t => t.stop())
        manualStreamRef.current = null
        setCapturedPreview(null)
        setVideoBlob(null)
        setIsRecordingVideo(false)
        if (timerRef.current) clearInterval(timerRef.current)
        setShowCameraModal(false)
    }

    const flipCamera = () => {
        if (isRecordingVideo) return
        openCamera(cameraMode, cameraFacing === 'environment' ? 'user' : 'environment')
    }

    const capturePhoto = () => {
        if (!manualVideoRef.current || !manualCanvasRef.current) return
        const video = manualVideoRef.current
        const canvas = manualCanvasRef.current
        canvas.width = video.videoWidth || 1280
        canvas.height = video.videoHeight || 720
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        if (cameraFacing === 'user') {
            ctx.translate(canvas.width, 0)
            ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5)
        setCapturedPreview(dataUrl)
        manualStreamRef.current?.getTracks().forEach(t => t.enabled = false)
    }

    const retakePhoto = () => {
        setCapturedPreview(null)
        setVideoBlob(null)
        setVideoTimer(0)
        manualStreamRef.current?.getTracks().forEach(t => t.enabled = true)
    }

    const startManualVideo = () => {
        if (!manualStreamRef.current) return

        let mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/mp4';
            if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';
        }

        const recorder = new MediaRecorder(manualStreamRef.current, {
            mimeType: mimeType || undefined,
            videoBitsPerSecond: 1200000 // 1.2 Mbps for faster uploads
        })
        videoEvidenceChunksRef.current = []
        recorder.ondataavailable = (e) => { if (e.data.size > 0) videoEvidenceChunksRef.current.push(e.data) }
        recorder.onstop = () => {
            const blob = new Blob(videoEvidenceChunksRef.current, { type: mimeType || 'video/webm' })
            setVideoBlob(blob)
            setCapturedPreview(URL.createObjectURL(blob))
            if (timerRef.current) clearInterval(timerRef.current)
        }

        recorder.start()
        videoEvidenceRecorderRef.current = recorder
        setIsRecordingVideo(true)
        setVideoTimer(0)

        timerRef.current = setInterval(() => {
            setVideoTimer(prev => {
                if (prev >= 20) {
                    stopManualVideo()
                    return prev
                }
                return prev + 1
            })
        }, 1000)
    }

    const stopManualVideo = () => {
        if (videoEvidenceRecorderRef.current?.state === 'recording') {
            videoEvidenceRecorderRef.current.stop()
        }
        setIsRecordingVideo(false)
    }

    const confirmAndUpload = async () => {
        if (!capturedPreview || !qrCode) return
        setIsUploadingPhoto(true)
        const tId = toast.loading(cameraMode === 'video' ? 'Syncing video to dashboard...' : 'Syncing photo to dashboard...')
        try {
            // 1. Log the tool alert (SKIP WhatsApp initially)
            const result = await triggerToolAutoAlert(cameraMode === 'video' ? 'MANUAL VIDEO' : 'MANUAL PHOTO', false, true)
            const logAlertId = result?.id;
            const capturedPhotos = result?.photos || [];

            const res = await fetch(capturedPreview)
            const blob = await res.blob()

            const path = logAlertId
                ? `emergencies/${qrCode.id}/${logAlertId}/${cameraMode}_${Date.now()}.${cameraMode === 'video' ? 'webm' : 'jpg'}`
                : `emergencies/${qrCode.id}/${cameraMode}_${Date.now()}.${cameraMode === 'video' ? 'webm' : 'jpg'}`

            const { error } = await supabase.storage.from('emergency-evidence').upload(path, blob, { upsert: true })
            if (error) throw error

            const { data: { publicUrl } } = supabase.storage.from('emergency-evidence').getPublicUrl(path)

            if (cameraMode === 'photo') setLastCapturedPhoto(publicUrl)
            else setLastCapturedVideo(publicUrl)

            // 🚀 CRITICAL: Update the Alert record with the MANUAL evidence + background photos
            if (logAlertId) {
                const evidenceList = cameraMode === 'video' ? capturedPhotos : [publicUrl, ...capturedPhotos];
                await fetch('/api/emergency/trigger', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        alert_id: logAlertId,
                        evidence_photos: evidenceList,
                        evidence_video: cameraMode === 'video' ? publicUrl : null,
                        lat: geoData?.lat || 0,
                        lng: geoData?.lng || 0,
                        status: 'active'
                    })
                }).catch(e => console.error("Alert Sync Update Failed:", e));
            }

            toast.dismiss(tId)

            // 🔥 WHATSAPP BLAST for Evidence (Combined!)
            if (emergencyContacts.length > 0 && qrDetails && geoData) {
                const evidenceType = cameraMode === 'video' ? 'VIDEO' : 'IMAGE';
                const evidenceIcon = cameraMode === 'video' ? '🎥' : '📸';
                const evidencePhotos = cameraMode === 'photo' ? [publicUrl, ...capturedPhotos] : capturedPhotos;
                const firstDisplayPhoto = evidencePhotos.length > 0 ? evidencePhotos[0] : null;

                const alertMsg = `🆘 *${evidenceType} EVIDENCE LOGGED* 🆘

Name: *${qrDetails.full_name}* is in trouble!

${evidenceIcon} *${evidenceType} LINK:* ${publicUrl}
${cameraMode === 'photo' ? '' : (firstDisplayPhoto ? `\n📸 AUTO PHOTO: ${firstDisplayPhoto}` : '')}

📍 GPS LOCATION: https://www.google.com/maps?q=${geoData.lat},${geoData.lng}

_Sent via Q-Raksha Secure Dispatch_`
                const primaryPhone = emergencyContacts[0].phone.replace(/\D/g, '')
                const waUrl = `https://wa.me/${primaryPhone}?text=${encodeURIComponent(alertMsg)}`

                toast.success(`${evidenceType} synced! Finalizing alert...`, {
                    duration: 4000,
                    icon: '💬'
                })
                setTimeout(() => window.open(waUrl, '_blank'), 500)
            } else {
                toast.success(`${cameraMode === 'video' ? 'Video' : 'Photo'} evidence synced to dashboard!`)
            }

            closeCamera()
        } catch (err: any) {
            toast.dismiss(tId)
            toast.error('Upload failed: ' + (err.message || 'Unknown error'))
        } finally {
            setIsUploadingPhoto(false)
        }
    }


    // --- LIVE TRACKING FUNCTIONS ---
    const startLiveTracking = async () => {
        if (!qrCode) return
        if (!navigator.geolocation) { toast.error('GPS not supported on this device'); return }

        const tId = toast.loading('Calibrating Live GPS Lock...')
        try {
            // 1. Force a FRESH high-accuracy lock before starting
            const loc = await fetchgeoData()
            if (!loc) throw new Error('Could not get GPS lock')

            // Trigger Auto-Alert on Start
            triggerToolAutoAlert('LIVE TRACKING STARTED', false, true);
            // 1. Create Session
            const initialPt = { lat: loc.lat, lng: loc.lng, ts: Date.now() }
            const { data: session, error } = await supabase
                .from('live_tracking_sessions')
                .insert({
                    qr_id: qrCode.id,
                    lat: loc.lat,
                    lng: loc.lng,
                    speed: 0,
                    accuracy: loc.accuracy ? Math.round(loc.accuracy) : null,
                    route_points: [initialPt]
                })
                .select('id')
                .single()
            if (error) throw error

            setTrackingSessionId(session.id)
            routePointsRef.current = [initialPt]

            // 2. Start Map Tracking Watch
            const watchId = navigator.geolocation.watchPosition(
                async (pos) => {
                    const { latitude: lat, longitude: lng, speed, accuracy } = pos.coords
                    const pt = { lat, lng, ts: Date.now() }
                    routePointsRef.current = [...routePointsRef.current.slice(-99), pt]
                    await supabase.from('live_tracking_sessions').update({
                        lat, lng,
                        speed: speed !== null ? Math.round(speed * 3.6) : null,
                        accuracy: accuracy ? Math.round(accuracy) : null,
                        route_points: routePointsRef.current,
                        updated_at: new Date().toISOString()
                    }).eq('id', session.id)
                },
                (err) => toast.error('GPS Sync: ' + err.message),
                { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
            )
            trackingWatchRef.current = watchId
            setIsTracking(true)

            // 3. Blast Alerts to Emergency Contacts
            const trackLink = `${window.location.origin}/track/${session.id}`
            const mapLink = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
            const displayAddress = await getAddressFromCoordinates(loc.lat, loc.lng)

            if (emergencyContacts.length > 0) {
                const finalAlertMsg = `[ EMERGENCY: LIVE TRACKING ALERT ]\n\n*${qrDetails?.full_name || 'Emergency Scan'}* is broadcasting their Premium live location.\n\n> PREMIUM TRACKING PORTAL:\n${trackLink}\n\n> DIRECT GOOGLE MAPS LINK:\n${mapLink}\n\n> LAST SCANNED LOCATION:\n${displayAddress}\n\n> REGISTERED ADDRESS:\n${qrDetails?.home_address || 'Not Provided'}\n\n_Sent via Safety QR Premium Tracker_`

                toast.success('Opening WhatsApp Blast...')

                emergencyContacts.forEach((contact, index) => {
                    const cleanPhone = contact.phone.replace(/\D/g, '')
                    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalAlertMsg)}`
                    setTimeout(() => {
                        toast(`Sharing live track with ${contact.name}...`, { icon: '📲' });
                        const link = document.createElement('a')
                        link.href = waUrl
                        link.target = '_blank'
                        link.rel = 'noopener noreferrer'
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                    }, index * 1500)
                })
            }

            toast.dismiss(tId)
            toast.success('🟢 Live tracking active & alerts sent!')
            // triggerToolAutoAlert('LIVE TRACKING SHARED', false, true)
        } catch (err: any) {
            toast.dismiss(tId)
            toast.error('Failed to start tracking: ' + err.message)
        }
    }

    const stopLiveTracking = async () => {
        if (trackingWatchRef.current !== null) {
            navigator.geolocation.clearWatch(trackingWatchRef.current)
            trackingWatchRef.current = null
        }
        if (trackingSessionId) {
            await supabase.from('live_tracking_sessions').update({ is_active: false }).eq('id', trackingSessionId)
        }
        routePointsRef.current = []
        setIsTracking(false)
        setTrackingSessionId(null)
        toast.success('Location sharing stopped')
    }

    const copyTrackLink = () => {
        if (!trackingSessionId) return
        const url = `${window.location.origin}/track/${trackingSessionId}`
        navigator.clipboard.writeText(url)
        setTrackingCopied(true)
        setTimeout(() => setTrackingCopied(false), 2500)
        toast.success('📍 Tracking link copied!')
    }


    // --- RENDER PREP ---
    if (showLocationHelp) {
        const isInsecure = window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'

        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-sm animate-in fade-in zoom-in duration-300" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <div className="w-full max-w-sm bg-white rounded-3xl p-8 space-y-6 shadow-2xl border border-white/20">
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600 mb-4 border-4 border-red-100">
                            <MapPin className="w-8 h-8 animate-bounce" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Location Access Required</h2>
                        <div className="space-y-1">
                            <p className="text-red-600 text-[13px] font-bold uppercase tracking-widest">GPS चालू करना जरूरी है</p>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Emergency में आपकी सही जगह जानने के लिए GPS चाहिए</p>
                        </div>
                    </div>

                    <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100 space-y-5 shadow-inner">
                        {!isInsecure ? (
                            <div className="space-y-5">
                                <div className="flex gap-4 items-start">
                                    <span className="shrink-0 w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shadow-lg">1</span>
                                    <div className="space-y-0.5">
                                        <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">Phone का GPS बटन ON करें</p>
                                        <p className="text-[9px] text-slate-400 font-bold tracking-wide">Turn ON your Phone GPS</p>
                                    </div>
                                </div>

                                {/* <div className="flex gap-4 items-start">
                                    <span className="shrink-0 w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-lg">2</span>
                                    <div className="space-y-0.5">
                                        <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">ऊपर Lock 🔒 आइकॉन दबाएं</p>
                                        <p className="text-[9px] text-slate-400 font-bold tracking-wide">Tap the 'Lock' icon at top</p>
                                    </div>
                                </div> */}

                                <div className="flex gap-4 items-start">
                                    <span className="shrink-0 w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-lg">3</span>
                                    <div className="space-y-0.5">
                                        <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">Location को Allow करें</p>
                                        <p className="text-[9px] text-slate-400 font-bold tracking-wide">Change Location to 'Allow'</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start">
                                    <span className="shrink-0 w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-lg">4</span>
                                    <div className="space-y-0.5">
                                        <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">Page को Refresh करें</p>
                                        <p className="text-[9px] text-slate-400 font-bold tracking-wide">Refresh this page</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                                <p className="text-[11px] font-bold text-red-700 leading-relaxed italic text-center">
                                    Mobile browsers strictly block GPS on insecure connections (HTTP). <br /><br /> Access via a secure <strong>HTTPS</strong> link is mandatory.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-3 pt-2">
                        <button
                            onClick={async () => {
                                setShowLocationHelp(false)
                                try {
                                    const loc = await fetchgeoData()
                                    if (loc) {
                                        setGeoData({ lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy })
                                        toast.success('GPS Connected!')
                                    } else {
                                        setShowLocationHelp(true)
                                        toast.error('Could not get lock. Verify GPS is ON.')
                                    }
                                } catch (e: any) {
                                    setShowLocationHelp(true)
                                    toast.error('Permission Denied.')
                                }
                            }}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                        >
                            {isInsecure ? "I Understand" : "ON Kar Diya - Try Again"}
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600"
                        >
                            Page Refresh Karein
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (showSetupModal) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
                <div className="w-full max-w-sm bg-white rounded-3xl p-8 space-y-6 shadow-2xl border border-white/20">
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-4 animate-bounce">
                            <Phone className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">One-Time Setup</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">
                            Enter your number ONCE to enable <br /> <span className="text-blue-600">Secure Private Calling</span>
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 border-r border-slate-200 pr-3 ">+91</span>
                            <input
                                type="tel"
                                autoFocus
                                placeholder="Your Mobile Number"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-20 pr-4 font-bold text-lg outline-none text-gray-700 focus:border-blue-500 focus:bg-white transition-all tracking-widest"
                                value={userPhone}
                                onChange={(e) => setUserPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            />
                        </div>
                        <p className="text-[10px] text-center text-slate-400 font-medium italic">
                            Your number remains private and is only used to connect the call.
                        </p>
                    </div>

                    <div className="grid gap-3">
                        <button
                            onClick={saveAndCall}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg hover:bg-black active:scale-95 transition-all"
                        >
                            Save & Call
                        </button>
                        <button
                            onClick={() => setShowSetupModal(false)}
                            className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-red-500 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // --- RENDER PREP ---

    // --- DATA GROUPING LOGIC ---
    const add = qrDetails?.additional_data || {}

    // --- RECOVERY LOGIC (Deep Deep Search) ---
    const findValue = (keywords: string[]) => {
        const kwClean = keywords.map(kw => kw.toLowerCase().replace(/[^a-z0-9]/g, ''))

        // 1. Search top-level keys
        const entries = Object.entries(add)
        for (const [key, val] of entries) {
            const k = key.toLowerCase().replace(/[^a-z0-9]/g, '')
            if (kwClean.every(kw => k.includes(kw))) return val
        }

        // 2. Search nested custom_fields
        const customFields = add?.custom_fields || []
        for (const field of customFields) {
            const l = (field.label || '').toLowerCase().replace(/[^a-z0-9]/g, '')
            if (kwClean.every(kw => l.includes(kw))) return field.value
        }

        return null
    }

    const regNo = add?.vehicle_no || add?.plate_no || add?.registration_no || findValue(['registration', 'plate']) || findValue(['plate', 'number']) || findValue(['plate', 'no']) || findValue(['vehicle', 'no']) || findValue(['plate'])
    const ownerContactRaw = add?.owner_contact || add?.contact_number || findValue(['contact', 'number']) || findValue(['owner', 'number']) || findValue(['owner', 'contact'])
    const ownerContact = (ownerContactRaw && ownerContactRaw !== '+91') ? ownerContactRaw : (qrDetails?.phone && qrDetails?.phone !== '+91' ? qrDetails.phone : null)

    // --- DATA GROUPING LOGIC (Categorization) ---
    const groupedFields: Record<string, any[]> = {}
    const isVehicle = (qrCode?.category?.toLowerCase() || '').includes('vehicle')

    // Category: Address Details
    if ((isUnlocked || !add?.is_address_private) && qrDetails?.home_address) {
        const addrFields = [
            { label: 'Full Address', value: qrDetails.home_address, isLock: add?.is_address_private },
            { label: 'Landmark', value: add?.landmark },
            { label: 'City & State', value: `${add?.city || ''}, ${add?.state || ''}`.trim() },
            { label: 'Pincode', value: add?.pincode }
        ].filter(f => f.value && f.value !== '--');

        if (addrFields.length > 0) {
            groupedFields['Address Details'] = addrFields;
        }
    }

    if (isVehicle) {
        // Category: Owner Profile
        const ownerFields = [
            { label: 'Registered Owner', value: qrDetails?.full_name },
            { label: 'Contact Number', value: add?.owner_contact || add?.contact_number },
            { label: 'Emergency Email', value: add?.emergency_email }
        ].filter(f => f.value && f.value !== '--');

        if (ownerFields.length > 0) {
            groupedFields['Owner Profile'] = ownerFields;
        }

        // Category: Vehicle Specification
        const vehicleFields = [
            { label: 'Model & Make', value: add?.vehicle_model || add?.vehicle_make || findValue(['model']) },
            { label: 'Registration Plate No.', value: regNo },
            { label: 'Vehicle Color', value: add?.vehicle_color || findValue(['color']) },
            { label: 'Fuel Type', value: add?.fuel_type || findValue(['fuel']) || 'PETROL' },
            { label: 'Chassis (Last 4)', value: add?.chassis_no || findValue(['chassis']) },
            { label: 'Critical Notice', value: add?.critical_notice || findValue(['notice']) }
        ].filter(f => f.value && f.value !== '--');

        if (vehicleFields.length > 0) {
            groupedFields['Vehicle Specification'] = vehicleFields;
        }

        // Category: Insurance & Security
        const insuranceFields = [
            { label: 'Provider', value: add?.insurance_provider || findValue(['insurance', 'provider']) },
            { label: 'Policy Number', value: add?.policy_no || findValue(['policy']) },
            { label: 'Expiry Date', value: add?.insurance_expiry || findValue(['expiry']) },
            { label: 'PUC Date', value: add?.puc_date || findValue(['puc']) }
        ].filter(f => f.value && f.value !== '--');

        if (insuranceFields.length > 0) {
            groupedFields['Insurance & Security'] = insuranceFields;
        }
    } else {
        // Category: Personal Profile
        const personalFields = [
            { label: 'Gender', value: add?.gender },
            { label: 'Age', value: add?.age },
            { label: 'Occupation', value: add?.occupation },
            { label: 'School/Org', value: qrDetails?.school_name }
        ].filter(f => f.value && f.value !== '--');

        if (personalFields.length > 0) {
            groupedFields['Profile Details'] = personalFields;
        }
    }

    // Include dynamically added extra fields
    const customFields = add.custom_fields || []
    customFields.forEach((field: any) => {
        if (field.isPrivate && !isUnlocked) return;
        if (!field.value || field.value === '--') return;
        const targetGroup = isVehicle ? 'Additional Details' : 'Other Details';
        if (!groupedFields[targetGroup]) groupedFields[targetGroup] = [];
        groupedFields[targetGroup].push({ ...field, isLock: field.isPrivate });
    })

    const documents = add.documents || []
    const visibleDocs = documents // Show all docs, but lock private ones
    const hasHiddenItems = (customFields.some((f: any) => f.isPrivate) || documents.some((d: any) => d.isPrivate) || add.is_address_private) && !isUnlocked


    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-6">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-black rounded-full animate-spin shadow-lg" />
            <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Loading Profile...</span>
        </div>
    )

    if (!qrCode) return <div className="text-center p-10 font-bold text-slate-400">QR Not Found</div>

    // First scan - show setup form
    if (qrCode.status === 'generated' || isEditing) {
        return (
            <UnifiedSafetyForm
                qrId={qrCode.id}
                initialCategory={(qrCode.fixed_category && qrCode.fixed_category !== 'custom-category') ? qrCode.fixed_category : undefined}
                initialData={isEditing ? qrDetails : undefined}
                initialContacts={isEditing ? emergencyContacts : undefined}
                onSuccess={() => {
                    setIsEditing(false)
                    loadQRData()
                }}
            />
        )
    }

    if (qrCode.status === 'suspended' || qrCode.status === 'expired') {
        const isExpired = qrCode.status === 'expired';
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <div className="max-w-md w-full bg-white rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden relative">
                    {/* Top Decorative Header */}
                    <div className={`h-32 w-full ${isExpired ? 'bg-amber-500' : 'bg-red-600'} relative overflow-hidden`}>
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl">
                            {isExpired ? (
                                <ShieldAlert className="w-14 h-14 text-amber-500" />
                            ) : (
                                <AlertCircle className="w-14 h-14 text-red-600" />
                            )}
                        </div>
                    </div>

                    <div className="pt-20 pb-12 px-10 text-center space-y-8">
                        <div className="space-y-3">
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                                {isExpired ? 'Shield Protocol Deactivated' : 'Access Restricted'}
                            </h1>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed italic">
                                {isExpired
                                    ? 'Emergency data access has been paused because your safety plan has expired. Immediate renewal is required to restore protection.'
                                    : 'This security profile has been temporarily suspended by the system admin. Please contact support for assistance.'}
                            </p>
                        </div>

                        {isExpired ? (
                            <div className="space-y-4">
                                <Link
                                    href={`/renewal?qr_id=${qrCode.id}&qr_number=${encodeURIComponent(qrCode.qr_number || '')}`}
                                    className="w-full py-5 bg-red-600 hover:bg-[#1a1a1b] text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-2xl shadow-red-200 transition-all duration-500 flex items-center justify-center gap-3 active:scale-95 group"
                                >
                                    <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                                    Reactivate Shield Now
                                </Link>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Instant Activation • 24/7 Security
                                </p>
                            </div>
                        ) : (
                            <div className="py-4 px-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center gap-3">
                                <Lock className="w-4 h-4 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Identity Verification Required
                                </span>
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-50">
                            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.5em]">
                                Q-Raksha • Advanced Life Shield
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // --- CATEGORY THEME ---
    const getCategoryTheme = (cat: string) => {
        const c = (cat || '').toLowerCase()
        // Exact ID matches first
        if (c === 'missing-child') return { bg: '#FFF0F6', accent: '#E91E8C', label: '🧒 Child Safety', ring: '#F9A8D4' }
        if (c === 'women-safety') return { bg: '#FDF4FF', accent: '#A855F7', label: '🌸 Women Safety', ring: '#D8B4FE' }
        if (c === 'senior-citizen-lost') return { bg: '#FFF7ED', accent: '#F97316', label: '🧓 Senior Care', ring: '#FED7AA' }
        if (c === 'accident-emergency') return { bg: '#FFF1F2', accent: '#EF4444', label: '🚨 Accident / SOS', ring: '#FECACA' }
        if (c === 'emergency-medical') return { bg: '#FFF1F2', accent: '#F43F5E', label: '🏥 Medical ID', ring: '#FECDD3' }
        if (c === 'vehicle-safety') return { bg: '#EFF6FF', accent: '#3B82F6', label: '🚗 Vehicle Safety', ring: '#BFDBFE' }
        if (c === 'pet-recovery') return { bg: '#FEFCE8', accent: '#EAB308', label: '🐾 Pet Identity', ring: '#FDE68A' }
        if (c === 'custom-package') return { bg: '#F0F9FF', accent: '#0EA5E9', label: '📦 Asset Tracker', ring: '#BAE6FD' }
        // Fuzzy fallback
        if (c.includes('child') || c.includes('toddler') || c.includes('school') || c.includes('student'))
            return { bg: '#FFF0F6', accent: '#E91E8C', label: '🧒 Child Safety', ring: '#F9A8D4' }
        if (c.includes('women') || c.includes('woman') || c.includes('maternal') || c.includes('nanny'))
            return { bg: '#FDF4FF', accent: '#A855F7', label: '🌸 Women Safety', ring: '#D8B4FE' }
        if (c.includes('senior') || c.includes('elder') || c.includes('dementia'))
            return { bg: '#FFF7ED', accent: '#F97316', label: '🧓 Senior Care', ring: '#FED7AA' }
        if (c.includes('medical') || c.includes('health') || c.includes('blood') || c.includes('cardiac') || c.includes('diabetes') || c.includes('allergy'))
            return { bg: '#FFF1F2', accent: '#F43F5E', label: '🏥 Medical ID', ring: '#FECDD3' }
        if (c.includes('vehicle') || c.includes('truck') || c.includes('bike') || c.includes('scooter') || c.includes('taxi') || c.includes('bus'))
            return { bg: '#EFF6FF', accent: '#3B82F6', label: '🚗 Vehicle Safety', ring: '#BFDBFE' }
        if (c.includes('pet') || c.includes('dog') || c.includes('cat'))
            return { bg: '#FEFCE8', accent: '#EAB308', label: '🐾 Pet Identity', ring: '#FDE68A' }
        if (c.includes('tourist') || c.includes('travel') || c.includes('luggage'))
            return { bg: '#F0FDF4', accent: '#22C55E', label: '✈️ Travel Safety', ring: '#BBF7D0' }
        return { bg: '#F8FAFC', accent: '#475569', label: '🛡️ Safety Profile', ring: '#CBD5E1' }
    }

    return (
        <div className="min-h-screen font-sans pb-20 overflow-x-hidden selection:bg-red-100"
            style={{ background: '#F8FAFC', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
            <Toaster position="top-left" toastOptions={{ style: { background: '#FFF7ED', color: '#9A3412', border: '1px solid #FFEDD5', fontWeight: 'bold' } }} />

            {/* 🔴 TOP EMERGENCY BANNER */}
            <div className="bg-[#EF4444] px-4 py-3 flex items-center justify-between sticky top-0 z-[100] shadow-lg shadow-red-500/20">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center animate-pulse">
                        <Shield className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-white text-[11px] font-bold uppercase tracking-widest pt-0.5">Live Support Active</span>
                </div>
                <Link href="/login" className="bg-white/10 backdrop-blur-md border border-white/30 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/20 transition-all active:scale-95 shadow-inner">
                    Login Dashboard
                </Link>
            </div>

            <main className="max-w-md mx-auto px-5 pt-6 pb-24 space-y-6">

                {/* 👤 COMPACT PROFILE CARD */}
                <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-100 relative pt-20 pb-6 px-4">
                    {/* Top Badges */}
                    <div className="absolute top-6 left-6">
                        <div className="bg-[#0F172A] px-4 py-1.5 rounded-full flex items-center gap-2">
                            <span className="text-white text-[9px] font-bold uppercase tracking-[0.1em]">{qrCode?.category?.toUpperCase() || 'SAFETY'} SAFETY</span>
                        </div>
                    </div>
                    <button onClick={() => setShowEditAuthModal(true)} className="absolute top-6 right-6 w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-400 active:scale-90 transition-all">
                        <Edit2 className="w-5 h-5" />
                    </button>

                    {/* Profile Visual */}
                    <div className="flex flex-col items-center">
                        <div className="relative mb-4">
                            <div className="w-24 h-24 rounded-[2rem] border-[4px] border-white overflow-hidden shadow-2xl bg-slate-50 ring-1 ring-slate-100">
                                {qrDetails?.additional_data?.photo_url ? (
                                    <img src={qrDetails.additional_data.photo_url} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                                        <User className="w-12 h-12" />
                                    </div>
                                )}
                            </div>
                            {/* Verified Checkmark Badge */}
                            {/* <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-2xl border-4 border-white flex items-center justify-center shadow-lg shadow-emerald-200 animate-in zoom-in duration-700">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                            </div> */}
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900 leading-none mb-2 tracking-tighter uppercase">{qrDetails?.full_name || 'SAFETY USER'}</h1>

                        <div className="bg-[#ECFDF5] border border-[#D1FAE5] px-4 py-1.5 rounded-full flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                            <span className="text-[#059669] text-[10px] font-bold uppercase tracking-widest">Secure Profile</span>
                        </div>

                        {/* 📞 UNIFIED PRIMARY CALL BUTTON (UNIVERSAL LAYOUT) */}
                        {(() => {
                            const callNumber = ownerContact || (emergencyContacts.length > 0 ? emergencyContacts[0].phone : null);
                            if (!callNumber) return null;
                            return (
                                <div className="w-full flex flex-col items-center">
                                    <button
                                        onClick={() => handleSecureCall({ name: qrDetails?.full_name || 'Owner', phone: callNumber })}
                                        className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-4 rounded-3xl font-black text-lg shadow-xl shadow-emerald-200/50 transition-all active:scale-95 flex flex-col items-center justify-center gap-0"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Phone className="w-4 h-4 fill-current" />
                                            <span>{isVehicle ? 'Call Vehicle Owner' : 'Call Owner'}</span>
                                        </div>
                                    </button>
                                    <p className="mt-2.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest text-center leading-relaxed">
                                        {isVehicle ? (
                                            <>In case of Parking issue or any <br /> issue with the car</>
                                        ) : (
                                            <>Tap to instantly connect <br /> via Secure Gateway</>
                                        )}
                                    </p>
                                </div>
                            );
                        })()}

                        {/* Medical Alert Box */}
                        {qrDetails?.additional_data?.medicine_details && (
                            <div className="mt-5 w-full bg-red-50 border border-red-100 rounded-3xl p-5 flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm shadow-red-100">
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Critical Medical Warning</p>
                                    <p className="text-sm font-bold text-slate-900 leading-tight">{qrDetails?.additional_data?.medicine_details}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 🔓 UNLOCK PRIVATE DATA BAR */}
                {hasHiddenItems && !isUnlocked && (
                    <button onClick={() => setShowUnlockModal(true)} className="w-full bg-[#FFFBEB] border-2 border-[#FEF3C7] rounded-2xl py-4 px-6 flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-lg shadow-amber-200/20">
                        <Lock className="w-5 h-5 text-amber-500" />
                        <span className="text-amber-800 text-sm font-bold uppercase tracking-widest">Tap to Unlock Private Data</span>
                    </button>
                )}

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    👥 GUARDIAN NETWORK - घर वाले
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <div className="space-y-4">
                    <div className="flex flex-col items-center gap-1 pt-4 pb-2">
                        <h2 className="text-2xl font-black text-red-600 uppercase tracking-tight">In Case of Emergency</h2>
                        <div className="w-12 h-1 bg-red-100 rounded-full" />
                    </div>

                    <div className="flex items-center gap-3 px-1">
                        <Users className="w-4 h-4 text-slate-400" />
                        <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest pt-0.5">Guardian Network</h3>
                    </div>
                    {emergencyContacts.map((contact, idx) => (
                        <div key={contact.id} className="bg-white rounded-3xl p-4 flex items-center justify-between border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 font-bold text-lg border border-slate-100">
                                    {contact.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h5 className="text-[15px] font-bold text-slate-800 leading-tight">{contact.name}</h5>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{contact.relationship}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    triggerToolAutoAlert(`DIRECT CALL: ${contact.name}`);
                                    handleSecureCall({ name: contact.name, phone: contact.phone });
                                }}
                                className="bg-[#0F172A] px-6 py-3 rounded-2xl flex items-center gap-2 active:scale-90 transition-all shadow-xl shadow-slate-900/20"
                            >
                                <Phone className="w-4 h-4 text-white" />
                                <span className="text-white text-[11px] font-bold uppercase tracking-widest pt-0.5">Call</span>
                            </button>
                        </div>
                    ))}
                </div>







                {/* 📞 EMERGENCY HELPLINES (Big Buttons) */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-3 px-1">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest pt-0.5">Quick Helplines</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { num: '112', label: 'Safety', color: 'bg-[#DC2626]', icon: ShieldAlert },
                            { num: '108', label: 'Medical', color: 'bg-[#059669]', icon: Activity },
                            { num: '100', label: 'Police', color: 'bg-[#2563EB]', icon: Landmark }
                        ].map((h, i) => (
                            <button key={i} onClick={() => {
                                // Trace & capture evidence but SKIP WhatsApp
                                triggerToolAutoAlert(`HELPLINE: ${h.num} (${h.label})`, false, true, false);
                                window.location.href = `tel:${h.num}`;
                            }} className={`${h.color} rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-black/5 active:scale-95 transition-all cursor-pointer`}>
                                <h.icon className="w-4 h-4 text-white/50 mb-0.5" />
                                <span className="text-white text-2xl font-bold tracking-tight leading-none">{h.num}</span>
                                <span className="text-white/50 text-[7px] font-bold uppercase tracking-wider">{h.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 🔧 SAFETY TOOLKIT */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-3 px-1">
                        <Activity className="w-4 h-4 text-slate-400" />
                        <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest pt-0.5">Safety Toolkit</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Take Video', sub: 'Evidence Camera', icon: Video, action: () => { openCamera('video'); triggerToolAutoAlert('Take Video / Evidence Camera', true, false, false); }, color: 'text-blue-500', bg: 'bg-white' },
                            { label: 'Take Photo', sub: 'Snap Evidence', icon: Camera, action: () => { openCamera('photo'); triggerToolAutoAlert('Take Photo / Snap Evidence', true, false, false); }, color: 'text-purple-500', bg: 'bg-white' },
                            { label: isRecordingAudio ? 'Recording...' : 'Audio Rec', sub: 'Surrounding', icon: Volume2, action: () => { isRecordingAudio ? stopAudioEvidence() : (qrCode && startAudioEvidence(qrCode.id)); triggerToolAutoAlert('Audio Rec / Surrounding', true, false, false); }, color: isRecordingAudio ? 'text-red-500' : 'text-blue-400', bg: 'bg-white' },
                            { label: 'Notify Family', sub: 'AI Voice Call', icon: Phone, action: () => { triggerToolAutoAlert('Notify Family / AI Voice Call', true, false, false); toast.success('Calling Family...'); }, color: 'text-green-600', bg: 'bg-white' },
                        ].map((tool, i) => (
                            <button key={i} onClick={(e) => { e.preventDefault(); tool.action(); }}
                                className={`bg-white border border-slate-100 rounded-3xl p-3.5 flex items-center gap-3 transition-all active:scale-95 cursor-pointer hover:border-slate-300 ${tool.label === 'Recording...' ? 'ring-2 ring-red-100 border-red-200' : ''}`}>
                                <div className={`w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-all shrink-0 ${tool.color}`}>
                                    <tool.icon className="w-4.5 h-4.5 shadow-sm" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[12px] font-bold text-slate-900 leading-none mb-0.5">{tool.label}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{tool.sub}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 📍 LIVE LOCATION BAR */}
                <button
                    onClick={(e) => { e.preventDefault(); isTracking ? stopLiveTracking() : startLiveTracking(); }}
                    className="w-full bg-[#0F172A] rounded-[2rem] p-4 flex items-center justify-between border border-white/10 shadow-2xl relative overflow-hidden group active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-3.5 relative z-10 pr-2">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center animate-pulse transition-all ${isTracking ? 'bg-[#10B981]' : 'bg-[#10B981]'}`}>
                            {isTracking ? <div className="w-3 h-3 bg-white rounded-full" /> : <RefreshCcw className="w-5 h-5 text-white" />}
                        </div>
                        <div className="text-left">
                            <p className="text-white/40 text-[8px] font-bold uppercase tracking-[0.1em] mb-0.5">Tracking on Google Maps</p>
                            <h3 className="text-white text-[15px] font-extrabold uppercase tracking-tight leading-none">
                                {isTracking ? 'Tracking Active' : 'Send My Location Now'}
                            </h3>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 relative z-10 shrink-0" />
                    {isTracking && (
                        <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
                    )}
                </button>

                {/* 🚨 SOS TRIGGER BOTTOM BUTTON */}
                <div className="pt-2">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            if (qrCode && !prefetchEvidencePromise.current) {
                                prefetchEvidencePromise.current = captureAndUploadEvidence(qrCode.id, undefined);
                            }
                            handleEmergencyAlert('SOS TRIGGER', false, '', false, true);
                        }}
                        disabled={sendingAlert}
                        className="w-full bg-gradient-to-br from-[#DC2626] to-[#991B1B] rounded-[2.5rem] p-6 flex flex-col items-center justify-center gap-1 shadow-[0_20px_50px_rgba(220,38,38,0.3)] border-b-6 border-red-900 active:translate-y-1 active:border-b-0 transition-all relative overflow-hidden"
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                                <Shield className="w-7 h-7 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5">Tap for Help</p>
                                <h2 className="text-white text-3xl font-extrabold uppercase tracking-tighter leading-none">SOS Trigger</h2>
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />
                    </button>
                </div>

                {/* 🛰️ NEARBY ASSISTANCE */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-3 px-1">
                        <Navigation className="w-4 h-4 text-slate-400" />
                        <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest pt-0.5">Nearby Assistance</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Police Station', icon: Shield, q: 'police station near me', bg: 'bg-blue-50', color: 'text-blue-500' },
                            { label: 'Hospitals', icon: Activity, q: 'hospital near me', bg: 'bg-rose-50', color: 'text-rose-500' },
                            { label: 'Fire Service', icon: Flame, q: 'fire station near me', bg: 'bg-orange-50', color: 'text-orange-500' },
                            { label: 'Pharmacy', icon: Droplets, q: 'pharmacy near me', bg: 'bg-emerald-50', color: 'text-emerald-500' }
                        ].map((radar, i) => (
                            <button key={i} onClick={(e) => {
                                e.preventDefault();
                                // Trace & capture evidence but SKIP WhatsApp
                                triggerToolAutoAlert(`NEARBY: ${radar.label}`, false, true);
                                const loc = geoData?.lat ? `&at=${geoData.lat},${geoData.lng}` : '';
                                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(radar.q || '')}${loc}`, '_blank');
                            }} className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all shadow-sm cursor-pointer hover:border-slate-300">
                                <div className={`w-10 h-10 ${radar.bg} ${radar.color} rounded-xl flex items-center justify-center`}>
                                    <radar.icon className="w-5 h-5" />
                                </div>
                                <div className="text-center">
                                    <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-1">{radar.label}</p>
                                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Tap to Navigate</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 📁 DOCUMENTS */}
                {visibleDocs.length > 0 && (
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-3 px-1">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest pt-0.5">Secured Documentation</h3>
                        </div>
                        {visibleDocs.map((doc: any, idx: number) => (
                            <button
                                key={idx}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (!isUnlocked) {
                                        setPendingDocUrl(doc.url);
                                        setShowUnlockModal(true);
                                        return;
                                    }
                                    window.open(doc.url, '_blank');
                                }}
                                className="bg-[#0F172A] rounded-3xl p-5 flex items-center justify-between group transition-all active:scale-[0.98] border border-slate-800 shadow-2xl w-full cursor-pointer"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                                        <FileText className="w-7 h-7 text-white/50" />
                                    </div>
                                    <div className="text-left">
                                        <h5 className="text-white text-[15px] font-bold uppercase tracking-tight leading-none mb-2">{doc.label}</h5>
                                        <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{doc.fileName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {!isUnlocked && <Lock className="w-4 h-4 text-amber-500/50" />}
                                    <ExternalLink className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    🧠 CLEAN MINIMAL CATEGORICAL SECTIONS
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <div className="space-y-8 pt-8 pb-24">
                    {Object.entries(groupedFields).map(([groupName, fields]) => (
                        <div key={groupName} className="space-y-4">
                            {/* Simple Header */}
                            <div className="flex items-center gap-2 px-1">
                                <div className="w-1 h-3 bg-slate-900 rounded-full" />
                                <h3 className="text-[12px] font-extrabold text-slate-800 uppercase tracking-widest">{groupName}</h3>
                            </div>

                            {/* Clean Minimalist Card */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="divide-y divide-slate-50">
                                    {fields.map((field: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-5 hover:bg-slate-50/30 transition-colors">
                                            <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-4">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{field.label}</span>
                                                {field.isLock && isUnlocked && (
                                                    <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                                )}
                                            </div>
                                            <span className="text-[14px] font-bold text-slate-700 text-right max-w-[65%] break-words">
                                                {field.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </main>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        MODALS - Clean Light Theme
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

            {/* Fake Call Modal */}
            {showFakeCall && (
                <div className="fixed inset-0 z-[100000] flex flex-col items-center justify-between"
                    style={{ background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)' }}>
                    {!isFakeCalling ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                            <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-8 animate-pulse">
                                <Clock className="w-12 h-12 text-blue-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Safe Exit Ready</h2>
                            <p className="text-slate-400 text-sm mb-2">Fake call incoming in</p>
                            <p className="text-5xl font-bold text-white">{fakeCallTimer}s</p>
                            <button onClick={() => {
                                if (fakeCallIntervalRef.current) clearInterval(fakeCallIntervalRef.current);
                                setShowFakeCall(false);
                            }} className="mt-12 px-8 py-3 rounded-xl bg-white/10 border border-white/10 text-white font-semibold hover:bg-white/20 transition-all">
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center w-full max-w-sm h-full justify-between py-16 px-8">
                            <div className="flex flex-col items-center pt-12">
                                <div className="w-28 h-28 bg-slate-700 rounded-full flex items-center justify-center mb-6 ring-4 ring-white/10 animate-pulse">
                                    <User className="w-14 h-14 text-slate-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-1">{qrDetails?.additional_data?.emergency_contact_name || 'Home'}</h2>
                                <p className="text-emerald-400 text-sm font-medium animate-pulse">Incoming call...</p>
                            </div>
                            <div className="flex gap-12 pb-8">
                                <button onClick={() => setShowFakeCall(false)}
                                    className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 active:scale-90 transition-transform">
                                    <PhoneOff className="w-7 h-7 text-white" />
                                </button>
                                <button onClick={() => setShowFakeCall(false)}
                                    className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-90 transition-transform animate-bounce">
                                    <Phone className="w-7 h-7 text-white" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Unlock Modal */}
            {showUnlockModal && (
                <div className="fixed inset-0 z-[100001] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-8 space-y-6 shadow-2xl">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
                                <Lock className="w-8 h-8 text-amber-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-1">Unlock Private Data</h3>
                            <p className="text-slate-400 text-sm">Enter your 4-digit PIN</p>
                        </div>
                        <input type="tel" maxLength={4} value={pinInput} autoFocus
                            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-5 text-center text-3xl font-bold text-slate-800 tracking-[1rem] outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 transition-all"
                            placeholder="••••" />
                        <div className="space-y-4">
                            <button onClick={handleUnlock}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold active:scale-[0.98] transition-all shadow-lg hover:bg-black">
                                Unlock Data
                            </button>
                            <button onClick={() => handleForgotPin(false)}
                                className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-all border border-red-100">
                                Forgot PIN / एक्सेस खो गया?
                            </button>
                            <button onClick={() => setShowUnlockModal(false)}
                                className="w-full py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors text-[10px] uppercase tracking-widest">
                                Close Window
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Auth Modal */}
            {showEditAuthModal && (
                <div className="fixed inset-0 z-[100001] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-8 space-y-6 shadow-2xl">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
                                <Edit2 className="w-8 h-8 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-1">Owner Access</h3>
                            <p className="text-slate-400 text-sm">Enter PIN to edit profile</p>
                        </div>
                        <input type="tel" maxLength={4} value={pinInput} autoFocus
                            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-5 text-center text-3xl font-bold text-slate-800 tracking-[1rem] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                            placeholder="••••" />
                        <div className="space-y-4">
                            <button onClick={handleEditAuth}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold active:scale-[0.98] transition-all shadow-lg hover:bg-blue-700">
                                Authorize Edit
                            </button>
                            <button onClick={() => handleForgotPin(true)}
                                className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-all border border-red-100">
                                Forgot PIN / एक्सेस खो गया?
                            </button>
                            <button onClick={() => setShowEditAuthModal(false)}
                                className="w-full py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors text-[10px] uppercase tracking-widest">
                                Exit Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Forgot PIN / Security Questions Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-lg">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
                                <KeyRound className="w-8 h-8 text-amber-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-1">Verify Ownership</h3>
                            <p className="text-slate-400 text-xs uppercase font-bold tracking-widest">Answer security questions</p>
                        </div>

                        <div className="space-y-5 max-h-[40vh] overflow-y-auto px-1 py-1">
                            {securityQuestions.map((q) => (
                                <div key={q.id} className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{q.question}</label>
                                    <input
                                        type="text"
                                        placeholder="Type your answer..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-800 outline-none focus:border-amber-400 focus:bg-white transition-all shadow-sm"
                                        value={securityAnswers[q.id] || ''}
                                        onChange={(e) => setSecurityAnswers({ ...securityAnswers, [q.id]: e.target.value })}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 pt-2">
                            <button onClick={verifySecurityAnswers}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold active:scale-[0.98] transition-all shadow-lg hover:bg-black">
                                Verify & Access
                            </button>
                            <button onClick={() => setShowForgotModal(false)}
                                className="w-full py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors text-[10px] uppercase tracking-widest">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Incident Modal */}
            {showIncidentModal && (
                <div className="fixed inset-0 z-[1000000] flex flex-col justify-end bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-t-3xl p-6 w-full max-w-md mx-auto shadow-2xl">
                        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-slate-800 text-center mb-1">Emergency Type</h3>
                        <p className="text-slate-400 text-sm text-center mb-5">Select your emergency situation</p>

                        <textarea placeholder="Optional: Describe what happened..."
                            value={customIncidentMsg}
                            onChange={e => setCustomIncidentMsg(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 text-sm mb-5 outline-none focus:border-red-300 resize-none"
                            rows={2} />

                        <div className="space-y-2.5 max-h-[45vh] overflow-y-auto">
                            {getIncidents().map(inc => (
                                <button key={inc.id}
                                    onClick={async e => {
                                        e.preventDefault();
                                        await fetchgeoData().catch(() => geoData);
                                        setShowIncidentModal(false);
                                        // 🛑 CRITICAL: This is the MAIN SOS, so it gets both Recording and Real Call
                                        // Now it also handles WhatsApp opening AFTER evidence is captured
                                        handleEmergencyAlert(inc.label, false, customIncidentMsg, false, true);
                                    }}
                                    className={`w-full py-4 rounded-xl text-white font-bold text-sm active:scale-[0.98] transition-all shadow-md ${inc.color}`}>
                                    {inc.label}
                                </button>
                            ))}
                            <button onClick={() => setShowIncidentModal(false)}
                                className="w-full py-4 rounded-xl bg-slate-100 text-slate-500 font-semibold text-sm hover:bg-slate-200 transition-all mt-2">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Elements for Background Evidence Capture */}
            <div className="opacity-0 pointer-events-none fixed -z-10" aria-hidden="true">
                <video ref={videoRef} playsInline muted width={480} height={640} />
                <canvas ref={canvasRef} width={480} height={640} />
                <canvas ref={manualCanvasRef} width={1280} height={720} />
            </div>

            {/* Camera Modal */}
            {showCameraModal && (
                <div className="fixed inset-0 z-[1000001] bg-black flex flex-col">
                    <div className="absolute top-0 w-full p-5 flex justify-between z-10 safe-p-top">
                        <button onClick={closeCamera} className="w-11 h-11 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center">
                            <X className="w-5 h-5 text-white" />
                        </button>
                        <button onClick={flipCamera} className="w-11 h-11 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center">
                            <RefreshCcw className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    <div className="flex-1 relative flex items-center justify-center">
                        {capturedPreview ? (
                            cameraMode === 'video'
                                ? <video src={capturedPreview || undefined} controls autoPlay className="w-full h-full object-contain" />
                                : <img src={capturedPreview || undefined} className="w-full h-full object-contain" alt="Evidence" />
                        ) : (
                            <video ref={manualVideoRef} autoPlay playsInline muted
                                className="w-full h-full object-cover"
                                style={{ transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none' }} />
                        )}

                        {cameraMode === 'video' && isRecordingVideo && (
                            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500 px-5 py-2 rounded-full flex items-center gap-2 animate-pulse">
                                <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                <span className="text-white font-bold text-sm">REC • 00:{videoTimer < 10 ? `0${videoTimer}` : videoTimer}</span>
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-0 w-full p-8 flex flex-col items-center bg-gradient-to-t from-black to-transparent safe-p-bottom">
                        {capturedPreview ? (
                            <div className="flex gap-8">
                                <button onClick={retakePhoto} className="flex flex-col items-center gap-2">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                        <RefreshCcw className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-white/70 text-xs">Retake</span>
                                </button>
                                <button onClick={confirmAndUpload} disabled={isUploadingPhoto} className="flex flex-col items-center gap-2">
                                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                        {isUploadingPhoto ? <Loader2 className="w-7 h-7 text-white animate-spin" /> : <CheckCircle2 className="w-7 h-7 text-white" />}
                                    </div>
                                    <span className="text-white text-xs font-medium">{isUploadingPhoto ? 'Saving...' : 'Save'}</span>
                                </button>
                            </div>
                        ) : (
                            <button onClick={cameraMode === 'video' ? (isRecordingVideo ? stopManualVideo : startManualVideo) : capturePhoto}
                                className={`w-18 h-18 rounded-full border-4 border-white flex items-center justify-center transition-all active:scale-90 ${cameraMode === 'video' ? 'bg-red-500' : 'bg-white'
                                    }`}
                                style={{ width: '72px', height: '72px' }}>
                                {cameraMode === 'video' && isRecordingVideo ? (
                                    <div className="w-6 h-6 bg-white rounded-sm" />
                                ) : cameraMode === 'video' ? (
                                    <div className="w-14 h-14 bg-red-500 rounded-full" />
                                ) : (
                                    <div className="w-14 h-14 bg-white rounded-full" />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}
            {/* External UI Elements */}
        </div>
    )
}
