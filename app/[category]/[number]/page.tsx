'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase, QRCode, QRDetails, EmergencyContact } from '@/lib/supabase'
import { getCurrentLocation, getAddressFromCoordinates, createGoogleMapsLink } from '@/lib/location-utils'
import { sendEmergencySMS, createWhatsAppLink, createPhoneCallLink } from '@/lib/sms-utils'
import { Shield, Phone, MessageCircle, MapPin, AlertCircle, Edit, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import UnifiedSafetyForm from '@/components/forms/UnifiedSafetyForm'

export default function ScanPage() {
    const params = useParams()
    const category = params.category as string
    const number = params.number as string

    const [qrCode, setQrCode] = useState<QRCode | null>(null)
    const [qrDetails, setQrDetails] = useState<QRDetails | null>(null)
    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
    const [loading, setLoading] = useState(true)
    const [showEmergencyContacts, setShowEmergencyContacts] = useState(false)
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [sendingAlert, setSendingAlert] = useState(false)

    useEffect(() => {
        // Skip loading for admin routes
        if (category === 'admin') {
            setLoading(false)
            return
        }

        loadQRData()
        logScan()
        detectLocation()
    }, [category, number])

    async function loadQRData() {
        try {
            const qrNumber = `${category}/${number}`

            // Fetch QR code
            const { data: qr, error: qrError } = await supabase
                .from('qr_codes')
                .select('*')
                .eq('qr_number', qrNumber)
                .single()

            if (qrError) throw qrError

            setQrCode(qr)

            // If activated, fetch details
            if (qr.status === 'activated') {
                const { data: details } = await supabase
                    .from('qr_details')
                    .select('*')
                    .eq('qr_id', qr.id)
                    .single()

                const { data: contacts } = await supabase
                    .from('emergency_contacts')
                    .select('*')
                    .eq('qr_id', qr.id)
                    .order('priority', { ascending: true })

                setQrDetails(details)
                setEmergencyContacts(contacts || [])
            }
        } catch (error: any) {
            console.error('Error loading QR data:', error)

            // Check if it's a Supabase configuration issue
            if (error?.message?.includes('fetch') || error?.code === 'PGRST301') {
                toast.error('Database not configured yet. Please set up Supabase credentials.')
            } else {
                toast.error('QR code not found')
            }
        } finally {
            setLoading(false)
        }
    }

    async function logScan() {
        try {
            const qrNumber = `${category}/${number}`

            const { data: qr } = await supabase
                .from('qr_codes')
                .select('id')
                .eq('qr_number', qrNumber)
                .single()

            if (!qr) return

            const location = await getCurrentLocation()
            const address = location
                ? await getAddressFromCoordinates(location.lat, location.lng)
                : undefined

            await supabase.from('scan_logs').insert({
                qr_id: qr.id,
                scan_type: 'view',
                latitude: location?.lat,
                longitude: location?.lng,
                location_address: address,
                user_agent: navigator.userAgent,
            })

            // Increment scan count
            await supabase
                .from('qr_codes')
                .update({ scan_count: (qrCode?.scan_count || 0) + 1 })
                .eq('id', qr.id)
        } catch (error) {
            console.error('Error logging scan:', error)
        }
    }

    async function detectLocation() {
        const location = await getCurrentLocation()
        if (location) {
            setCurrentLocation({ lat: location.lat, lng: location.lng })
        }
    }

    async function handleEmergencyAlert() {
        if (!qrCode || !qrDetails || emergencyContacts.length === 0) {
            toast.error('Emergency contacts not configured')
            return
        }

        setSendingAlert(true)

        try {
            const location = await getCurrentLocation()
            if (!location) {
                toast.error('Unable to get current location')
                setSendingAlert(false)
                return
            }

            const address = await getAddressFromCoordinates(location.lat, location.lng)
            const googleMapsLink = createGoogleMapsLink(location.lat, location.lng)

            // Send SMS to all emergency contacts
            const contactNumbers = emergencyContacts.map(c => c.phone)
            const personName = qrDetails.full_name || qrDetails.student_name || qrDetails.owner_name || 'Person'

            const result = await sendEmergencySMS(
                contactNumbers,
                personName,
                location,
                address
            )

            // Log emergency alert
            await supabase.from('emergency_alerts').insert({
                qr_id: qrCode.id,
                latitude: location.lat,
                longitude: location.lng,
                location_address: address,
                google_maps_link: googleMapsLink,
                sms_sent_to: contactNumbers,
                sms_status: result.success ? 'sent' : 'failed',
            })

            if (result.success) {
                toast.success('Emergency alert sent to all contacts!')
                setShowEmergencyContacts(true)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error('Error sending emergency alert:', error)
            toast.error('Failed to send emergency alert')
        } finally {
            setSendingAlert(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-900 text-lg">Loading QR data...</p>
                </div>
            </div>
        )
    }

    if (!qrCode) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="max-w-2xl text-center bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                    <AlertCircle className="w-20 h-20 text-orange-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Demo Mode</h1>
                    <p className="text-gray-700 mb-6 text-lg">
                        This is a demo QR code URL. To activate QR code scanning:
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6 text-left">
                        <h3 className="font-bold text-blue-900 mb-3 flex items-center">
                            <Shield className="w-5 h-5 mr-2" />
                            Setup Instructions:
                        </h3>
                        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                            <li>Set up your Supabase account at <a href="https://supabase.com" target="_blank" className="underline font-semibold">supabase.com</a></li>
                            <li>Update your <code className="bg-blue-100 px-2 py-1 rounded">.env.local</code> file with Supabase credentials</li>
                            <li>Run the database schema from <code className="bg-blue-100 px-2 py-1 rounded">DATABASE_SCHEMA.md</code></li>
                            <li>Generate QR codes from the admin panel</li>
                        </ol>
                    </div>
                    <Link
                        href="/"
                        className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full hover:shadow-lg transition-all"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        )
    }

    // First scan - show setup form
    if (qrCode.status === 'generated') {
        return (
            <UnifiedSafetyForm 
                qrId={qrCode.id} 
                initialCategory={qrCode.category} 
                onSuccess={loadQRData} 
            />
        )
    }

    // Subsequent scans - show data and emergency button
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            <div className="max-w-4xl mx-auto py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <Shield className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Safety Information</h1>
                    <p className="text-gray-700">QR Code: {qrCode.qr_number}</p>
                    <p className="text-sm text-gray-600 mt-2">Total Scans: {qrCode.scan_count}</p>
                </div>

                {/* Emergency Button */}
                <div className="mb-8">
                    <button
                        onClick={handleEmergencyAlert}
                        disabled={sendingAlert}
                        className="w-full py-6 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl text-white font-bold text-2xl hover:shadow-2xl hover:shadow-red-500/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                    >
                        {sendingAlert ? (
                            <>
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Sending Alert...</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-8 h-8" />
                                <span>EMERGENCY ALERT</span>
                            </>
                        )}
                    </button>
                    <p className="text-center text-sm text-gray-600 mt-2">
                        Press to send your location to all emergency contacts
                    </p>
                </div>

                {/* Emergency Contacts Modal */}
                {showEmergencyContacts && (
                    <div className="mb-8 p-6 bg-white rounded-2xl border border-gray-200 shadow-lg">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Emergency Contacts</h3>
                        <div className="space-y-3">
                            {emergencyContacts.map((contact) => (
                                <div key={contact.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-semibold text-gray-900">{contact.name}</p>
                                        <p className="text-sm text-gray-600">{contact.relationship}</p>
                                        <p className="text-sm text-gray-700">{contact.phone}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <a
                                            href={createPhoneCallLink(contact.phone)}
                                            className="p-3 bg-green-600 rounded-full hover:bg-green-700 transition"
                                        >
                                            <Phone className="w-5 h-5 text-white" />
                                        </a>
                                        <a
                                            href={createWhatsAppLink(contact.phone)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 bg-green-500 rounded-full hover:bg-green-600 transition"
                                        >
                                            <MessageCircle className="w-5 h-5 text-white" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowEmergencyContacts(false)}
                            className="mt-4 w-full py-2 bg-gray-100 rounded-lg text-gray-900 hover:bg-gray-200 transition"
                        >
                            Close
                        </button>
                    </div>
                )}

                {/* Details Card */}
                {qrDetails && (
                    <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-lg mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>

                        {qrDetails.photo_url && (
                            <div className="mb-6">
                                <img
                                    src={qrDetails.photo_url}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-purple-600"
                                />
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-4">
                            {Object.entries(qrDetails).map(([key, value]) => {
                                if (!value || key === 'id' || key === 'qr_id' || key === 'category' || key === 'created_at' || key === 'updated_at' || key === 'additional_data' || key === 'photo_url') return null

                                return (
                                    <div key={key} className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600 mb-1">
                                            {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                        </p>
                                        <p className="text-gray-900 font-semibold">{value}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Current Location */}
                {currentLocation && (
                    <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg mb-6">
                        <div className="flex items-center space-x-3 mb-3">
                            <MapPin className="w-6 h-6 text-purple-600" />
                            <h3 className="text-xl font-bold text-gray-900">Current Scan Location</h3>
                        </div>
                        <a
                            href={createGoogleMapsLink(currentLocation.lat, currentLocation.lng)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-700 underline"
                        >
                            View on Google Maps
                        </a>
                    </div>
                )}

                {/* Update Data Button */}
                <button
                    className="w-full py-3 bg-white rounded-xl text-gray-900 font-semibold border-2 border-purple-600 hover:bg-purple-50 transition flex items-center justify-center space-x-2"
                >
                    <Edit className="w-5 h-5" />
                    <span>Update My Data</span>
                </button>

                {/* Footer */}
                <div className="mt-8 text-center text-gray-600 text-sm">
                    <p>Powered by <span className="text-purple-600 font-semibold">ThinkAIQ.com</span></p>
                </div>
            </div>
        </div>
    )
}
