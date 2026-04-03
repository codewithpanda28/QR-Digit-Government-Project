'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Upload, Plus, X, User, HeartPulse, Stethoscope, Home, Phone, Pill } from 'lucide-react'

interface ElderlySafetyFormProps {
    qrId: string
    onSuccess: () => void
}

interface EmergencyContact {
    name: string
    relationship: string
    phone: string
    priority: number
}

export default function ElderlySafetyForm({ qrId, onSuccess }: ElderlySafetyFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: '',
        age: '',
        blood_group: '',
        medical_conditions: '',
        regular_medications: '',
        doctor_name: '',
        doctor_phone: '+91',
        home_address: '',
        photo_url: '',
        email: '',
    })

    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
        { name: '', relationship: 'Son/Daughter', phone: '+91', priority: 1 },
        { name: '', relationship: 'Caregiver', phone: '+91', priority: 2 },
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
            const fileName = `elderly-${qrId}-${Date.now()}.${fileExt}`
            const filePath = `qr-photos/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('safety-assets')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('safety-assets')
                .getPublicUrl(filePath)

            setFormData({ ...formData, photo_url: publicUrl })
            toast.success('Photo uploaded')
        } catch (error) {
            console.error('Error uploading photo:', error)
            toast.error('Failed to upload photo')
        } finally {
            setUploadingPhoto(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.full_name || !formData.age || !formData.home_address) {
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
            const { error: detailsError } = await supabase
                .from('qr_details')
                .insert({
                    qr_id: qrId,
                    category: 'elderly-safety',
                    full_name: formData.full_name,
                    age: parseInt(formData.age),
                    home_address: formData.home_address,
                    blood_group: formData.blood_group,
                    medical_conditions: formData.medical_conditions,
                    additional_data: {
                        regular_medications: formData.regular_medications,
                        doctor_name: formData.doctor_name,
                        doctor_phone: formData.doctor_phone,
                        photo_url: formData.photo_url,
                        email: formData.email
                    },
                    photo_url: formData.photo_url
                })

            if (detailsError) throw detailsError

            const { error: contactsError } = await supabase
                .from('emergency_contacts')
                .insert(
                    validContacts.map(contact => ({
                        qr_id: qrId,
                        ...contact,
                    }))
                )

            if (contactsError) throw contactsError

            const { error: updateError } = await supabase
                .from('qr_codes')
                .update({
                    status: 'activated',
                    activated_by: qrId,
                    subscription_start: new Date().toISOString(),
                })
                .eq('id', qrId)

            if (updateError) throw updateError

            toast.success('Senior Safety Shield Activated!')
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
            {/* Personal Details */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                    <User className="w-5 h-5 text-amber-500" />
                    Senior Citizen Information
                </h2>

                <div className="flex flex-col items-center mb-8 relative z-10">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-800 bg-zinc-950 flex items-center justify-center mb-4 group-hover:border-amber-500 transition-colors">
                            {formData.photo_url ? (
                                <img
                                    src={formData.photo_url}
                                    alt="Senior Citizen"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-12 h-12 text-zinc-700" />
                            )}
                        </div>
                        <label className="absolute bottom-4 right-0 bg-amber-600 text-white p-2 rounded-full cursor-pointer hover:bg-amber-500 transition-colors shadow-lg">
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
                </div>

                <div className="grid md:grid-cols-2 gap-4 relative z-10">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Full Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-zinc-700"
                            placeholder="Full Name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Age <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-zinc-700"
                            placeholder="Age"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Blood Group</label>
                        <select
                            name="blood_group"
                            value={formData.blood_group}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all"
                        >
                            <option value="">Select Group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Contact Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-zinc-700"
                            placeholder="For alerts"
                        />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <Home className="w-3 h-3" />
                            Home Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="home_address"
                            value={formData.home_address}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-zinc-700 min-h-[80px]"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Medical Details */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-red-500" />
                    Medical Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Medical Conditions</label>
                        <textarea
                            name="medical_conditions"
                            value={formData.medical_conditions}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-all placeholder:text-zinc-700 min-h-[80px]"
                            placeholder="e.g. Diabetes, Hypertension, Alzheimer's"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <Pill className="w-3 h-3" />
                            Regular Medications
                        </label>
                        <textarea
                            name="regular_medications"
                            value={formData.regular_medications}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-all placeholder:text-zinc-700 min-h-[60px]"
                            placeholder="Medicines taken daily"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <Stethoscope className="w-3 h-3" />
                            Doctor's Name
                        </label>
                        <input
                            type="text"
                            name="doctor_name"
                            value={formData.doctor_name}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-all placeholder:text-zinc-700"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            Doctor's Phone
                        </label>
                        <input
                            type="tel"
                            name="doctor_phone"
                            value={formData.doctor_phone}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-all placeholder:text-zinc-700"
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
                className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl text-white font-bold text-xl shadow-lg shadow-amber-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Activating Senior Shield...' : 'Activate QR Code'}
            </button>
        </form>
    )
}
