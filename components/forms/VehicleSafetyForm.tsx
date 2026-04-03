'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Upload, Plus, X, Car, Shield, FileText, Phone, User } from 'lucide-react'

interface VehicleSafetyFormProps {
    qrId: string
    onSuccess: () => void
}

interface EmergencyContact {
    name: string
    relationship: string
    phone: string
    priority: number
}

export default function VehicleSafetyForm({ qrId, onSuccess }: VehicleSafetyFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        owner_name: '',
        vehicle_number: '',
        vehicle_model: '',
        vehicle_type: '',
        insurance_provider: '',
        policy_number: '',
        policy_expiry: '',
        photo_url: '',
        email: '',
        home_address: '', // Required by schema usually, serves as Owner Address
    })

    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
        { name: '', relationship: 'Family', phone: '+91', priority: 1 },
        { name: '', relationship: 'Friend', phone: '+91', priority: 2 },
    ])

    const [uploadingPhoto, setUploadingPhoto] = useState(false)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleContactChange = (index: number, field: string, value: string) => {
        const updated = [...emergencyContacts]
        updated[index] = { ...updated[index], [field]: value }
        setEmergencyContacts(updated)
    }

    const addEmergencyContact = () => {
        setEmergencyContacts([
            ...emergencyContacts,
            { name: '', relationship: '', phone: '+91', priority: emergencyContacts.length + 1 },
        ])
    }

    const removeEmergencyContact = (index: number) => {
        if (emergencyContacts.length <= 1) {
            toast.error('At least 1 emergency contact required')
            return
        }
        setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index))
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Photo size must be less than 5MB')
            return
        }

        setUploadingPhoto(true)

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `vehicle-${qrId}-${Date.now()}.${fileExt}`
            const filePath = `qr-photos/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('safety-assets')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('safety-assets')
                .getPublicUrl(filePath)

            setFormData({ ...formData, photo_url: publicUrl })
            toast.success('Vehicle photo uploaded')
        } catch (error) {
            console.error('Error uploading photo:', error)
            toast.error('Failed to upload photo')
        } finally {
            setUploadingPhoto(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.owner_name || !formData.vehicle_number || !formData.home_address) {
            toast.error('Please fill all required fields')
            return
        }

        const validContacts = emergencyContacts.filter(c => c.name && c.phone)
        if (validContacts.length < 1) {
            toast.error('At least 1 emergency contact required')
            return
        }

        setLoading(true)

        try {
            // Insert QR details
            const { error: detailsError } = await supabase
                .from('qr_details')
                .insert({
                    qr_id: qrId,
                    category: 'vehicle-safety',
                    full_name: formData.owner_name, // Mapping owner to full_name
                    home_address: formData.home_address,
                    // Store specific vehicle info in additional_data
                    additional_data: {
                        vehicle_number: formData.vehicle_number,
                        vehicle_model: formData.vehicle_model,
                        vehicle_type: formData.vehicle_type,
                        insurance_provider: formData.insurance_provider,
                        policy_number: formData.policy_number,
                        policy_expiry: formData.policy_expiry,
                        photo_url: formData.photo_url,
                        email: formData.email
                    },
                    photo_url: formData.photo_url
                })

            if (detailsError) throw detailsError

            // Insert emergency contacts
            const { error: contactsError } = await supabase
                .from('emergency_contacts')
                .insert(
                    validContacts.map(contact => ({
                        qr_id: qrId,
                        ...contact,
                    }))
                )

            if (contactsError) throw contactsError

            // Update QR status
            const { error: updateError } = await supabase
                .from('qr_codes')
                .update({
                    status: 'activated',
                    activated_by: qrId,
                    subscription_start: new Date().toISOString(),
                })
                .eq('id', qrId)

            if (updateError) throw updateError

            toast.success('Vehicle QR Activated Successfully!')
            onSuccess()
        } catch (error) {
            console.error('Error activating QR:', JSON.stringify(error, null, 2))
            toast.error('Failed to activate QR code.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
            {/* Owner & Vehicle Details */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                    <Car className="w-5 h-5 text-blue-500" />
                    Vehicle & Owner Information
                </h2>

                <div className="flex flex-col items-center mb-8 relative z-10">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-zinc-800 bg-zinc-950 flex items-center justify-center mb-4 group-hover:border-blue-500 transition-colors">
                            {formData.photo_url ? (
                                <img
                                    src={formData.photo_url}
                                    alt="Vehicle"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Car className="w-12 h-12 text-zinc-700" />
                            )}
                        </div>
                        <label className="absolute bottom-4 right-0 bg-blue-600 text-white p-2 rounded-xl cursor-pointer hover:bg-blue-500 transition-colors shadow-lg">
                            <Upload className="w-4 h-4" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="hidden"
                                disabled={uploadingPhoto}
                            />
                        </label>
                    </div>
                    <p className="text-xs text-zinc-500">
                        {uploadingPhoto ? 'Uploading...' : 'Upload Vehicle Photo'}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 relative z-10">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Owner Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="owner_name"
                            value={formData.owner_name}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-700"
                            placeholder="Registered Owner Name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Vehicle Number <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="vehicle_number"
                            value={formData.vehicle_number}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-700 uppercase"
                            placeholder="e.g. MH 02 AB 1234"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Vehicle Type</label>
                        <select
                            name="vehicle_type"
                            value={formData.vehicle_type}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                        >
                            <option value="">Select Type</option>
                            <option value="Two Wheeler">Two Wheeler</option>
                            <option value="Four Wheeler">Four Wheeler</option>
                            <option value="Commercial">Commercial</option>
                            <option value="EV">Electric Vehicle</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Model / Make</label>
                        <input
                            type="text"
                            name="vehicle_model"
                            value={formData.vehicle_model}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-700"
                            placeholder="e.g. Honda City"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Contact Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-700"
                            placeholder="For alerts & updates"
                        />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            Owner Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="home_address"
                            value={formData.home_address}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-700 min-h-[80px]"
                            placeholder="Complete residential address"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Insurance Details */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    Insurance Details (Optional)
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Provider</label>
                        <input
                            type="text"
                            name="insurance_provider"
                            value={formData.insurance_provider}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all placeholder:text-zinc-700"
                            placeholder="Insurance Company"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Policy Number</label>
                        <input
                            type="text"
                            name="policy_number"
                            value={formData.policy_number}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all placeholder:text-zinc-700"
                            placeholder="Policy No."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Expiry Date</label>
                        <input
                            type="date"
                            name="policy_expiry"
                            value={formData.policy_expiry}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all placeholder:text-zinc-700"
                        />
                    </div>
                </div>
            </div>

            {/* Emergency Contacts */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Phone className="w-5 h-5 text-red-500" />
                        Emergency Contacts
                    </h2>
                    <button
                        type="button"
                        onClick={addEmergencyContact}
                        className="px-4 py-2 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition flex items-center gap-2 text-sm font-semibold border border-zinc-700"
                    >
                        <Plus className="w-4 h-4" />
                        Add Contact
                    </button>
                </div>

                <div className="space-y-4 relative z-10">
                    {emergencyContacts.map((contact, index) => (
                        <div key={index} className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Contact {index + 1}</span>
                                {emergencyContacts.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeEmergencyContact(index)}
                                        className="text-zinc-600 hover:text-red-500 transition-colors p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="grid md:grid-cols-3 gap-3">
                                <input
                                    type="text"
                                    value={contact.name}
                                    onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                                    className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-700 focus:outline-none focus:border-red-500 transition-all"
                                    placeholder="Name"
                                    required
                                />
                                <input
                                    type="text"
                                    value={contact.relationship}
                                    onChange={(e) => handleContactChange(index, 'relationship', e.target.value)}
                                    className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-700 focus:outline-none focus:border-red-500 transition-all"
                                    placeholder="Relation"
                                />
                                <input
                                    type="tel"
                                    value={contact.phone}
                                    onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                                    className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-700 focus:outline-none focus:border-red-500 transition-all"
                                    placeholder="Phone Number"
                                    required
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white font-bold text-xl shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Activating Vehicle Shield...' : 'Activate QR Code'}
            </button>
        </form>
    )
}
