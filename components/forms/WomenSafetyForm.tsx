'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Upload, Plus, X, User, Home, Briefcase, GraduationCap, Heart, Phone } from 'lucide-react'

interface WomenSafetyFormProps {
    qrId: string
    onSuccess: () => void
}

interface EmergencyContact {
    name: string
    relationship: string
    phone: string
    priority: number
}

export default function WomenSafetyForm({ qrId, onSuccess }: WomenSafetyFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: '',
        age: '',
        email: '',
        home_address: '',
        office_address: '',
        college_address: '',
        blood_group: '',
        medical_conditions: '',
        photo_url: '',
    })

    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
        { name: '', relationship: 'Family', phone: '+91', priority: 1 },
        { name: '', relationship: 'Friend', phone: '+91', priority: 2 },
        { name: '', relationship: 'Colleague', phone: '+91', priority: 3 },
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
        if (emergencyContacts.length <= 3) {
            toast.error('At least 3 emergency contacts required')
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
            const fileName = `${qrId}-${Date.now()}.${fileExt}`
            const filePath = `qr-photos/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('safety-assets')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('safety-assets')
                .getPublicUrl(filePath)

            setFormData({ ...formData, photo_url: publicUrl })
            toast.success('Photo uploaded successfully')
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
        if (validContacts.length < 3) {
            toast.error('At least 3 emergency contacts required')
            return
        }

        setLoading(true)

        try {
            // Insert QR details
            const { error: detailsError } = await supabase
                .from('qr_details')
                .insert({
                    qr_id: qrId,
                    category: 'women-safety',
                    full_name: formData.full_name,
                    age: parseInt(formData.age),
                    home_address: formData.home_address,
                    blood_group: formData.blood_group,
                    medical_conditions: formData.medical_conditions,
                    // Use additional_data for specific fields
                    additional_data: {
                        office_address: formData.office_address,
                        college_address: formData.college_address,
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
                    activated_by: qrId, // Placeholder
                    subscription_start: new Date().toISOString(),
                })
                .eq('id', qrId)

            if (updateError) throw updateError

            toast.success('QR Code activated successfully!')
            onSuccess()
        } catch (error) {
            console.error('Error activating QR:', JSON.stringify(error, null, 2))
            toast.error('Failed to activate QR code. Please check data.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
            {/* Personal Details Section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                    <User className="w-5 h-5 text-purple-500" />
                    Personal Information
                </h2>

                <div className="flex flex-col items-center mb-8 relative z-10">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-800 bg-zinc-950 flex items-center justify-center mb-4 group-hover:border-purple-500 transition-colors">
                            {formData.photo_url ? (
                                <img
                                    src={formData.photo_url}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-12 h-12 text-zinc-700" />
                            )}
                        </div>
                        <label className="absolute bottom-4 right-0 bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-500 transition-colors shadow-lg">
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
                        {uploadingPhoto ? 'Uploading...' : 'Click to upload photo'}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 relative z-10">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Full Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-700"
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
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-700"
                            placeholder="Years"
                            required
                            min="1"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Blood Group</label>
                        <select
                            name="blood_group"
                            value={formData.blood_group}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all"
                        >
                            <option value="">Select Group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
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
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-700"
                            placeholder="For alerts & updates"
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
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-700 min-h-[80px]"
                            placeholder="Complete residential address"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Additional Details */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-500" />
                    Additional Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Office Address</label>
                        <textarea
                            name="office_address"
                            value={formData.office_address}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-700 min-h-[80px]"
                            placeholder="Office or workplace address"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">College/Institute</label>
                        <textarea
                            name="college_address"
                            value={formData.college_address}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-700 min-h-[80px]"
                            placeholder="College or Institute address"
                        />
                    </div>
                </div>
                <div className="space-y-2 mt-4">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <Heart className="w-3 h-3" />
                        Medical Conditions
                    </label>
                    <textarea
                        name="medical_conditions"
                        value={formData.medical_conditions}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-700 min-h-[80px]"
                        placeholder="Any allergies, medical conditions, or medications"
                    />
                </div>
            </div>

            {/* Emergency Contacts */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -ml-32 -mt-32 pointer-events-none"></div>

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
                                {emergencyContacts.length > 3 && (
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
                                    placeholder="Relationship"
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
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white font-bold text-xl shadow-lg shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Activating Safety Shield...' : 'Activate QR Code'}
            </button>
        </form>
    )
}
