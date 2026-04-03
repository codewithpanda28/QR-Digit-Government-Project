'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentLocation, getAddressFromCoordinates } from '@/lib/location-utils'
import toast from 'react-hot-toast'
import { Upload, Plus, X, User, Heart, Home, Phone, School } from 'lucide-react'

interface ChildSafetyFormProps {
    qrId: string
    onSuccess: () => void
}

interface EmergencyContact {
    name: string
    relationship: string
    phone: string
    priority: number
}

export default function ChildSafetyForm({ qrId, onSuccess }: ChildSafetyFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: '',
        age: '',
        father_name: '',
        mother_name: '',
        home_address: '',
        blood_group: '',
        medical_conditions: '',
        school_name: '',
        class_details: '',
        photo_url: '',
        email: '',
    })

    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
        { name: '', relationship: 'Father', phone: '+91', priority: 1 },
        { name: '', relationship: 'Mother', phone: '+91', priority: 2 },
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
        if (emergencyContacts.length <= 2) {
            toast.error('At least 2 emergency contacts required')
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
            toast.error('Failed to upload photo. Please try again.')
        } finally {
            setUploadingPhoto(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!formData.full_name || !formData.age || !formData.father_name || !formData.mother_name) {
            toast.error('Please fill all required fields')
            return
        }

        const validContacts = emergencyContacts.filter(c => c.name && c.phone)
        if (validContacts.length < 2) {
            toast.error('At least 2 emergency contacts required')
            return
        }

        setLoading(true)

        try {
            // Get current location
            const location = await getCurrentLocation()
            const address = location
                ? await getAddressFromCoordinates(location.lat, location.lng)
                : formData.home_address

            // Insert QR details
            const { error: detailsError } = await supabase
                .from('qr_details')
                .insert({
                    qr_id: qrId,
                    category: 'child-safety',
                    full_name: formData.full_name,
                    age: parseInt(formData.age),
                    father_name: formData.father_name,
                    mother_name: formData.mother_name,
                    home_address: formData.home_address,
                    blood_group: formData.blood_group,
                    medical_conditions: formData.medical_conditions,
                    // SAFE MODE: Store extra fields ONLY in additional_data to prevent "Column does not exist" errors
                    additional_data: {
                        school_name: formData.school_name,
                        class_details: formData.class_details,
                        photo_url: formData.photo_url,
                        email: formData.email
                    }
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

            // Update QR status to activated
            const { error: updateError } = await supabase
                .from('qr_codes')
                .update({
                    status: 'activated',
                    activated_by: qrId, // Ideally this should be auth user ID if logged in, but for public scan it might be null or handled differently. Using qrId as placeholder if auth not required for activation.
                    subscription_start: new Date().toISOString().split('T')[0],
                })
                .eq('id', qrId)

            if (updateError) throw updateError

            toast.success('QR Code activated successfully!')
            onSuccess()
        } catch (error) {
            console.error('Error activating QR:', JSON.stringify(error, null, 2))
            toast.error('Failed to activate QR code. Please check your data.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Child Info Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-500" />
                    Child Information
                </h2>

                {/* Photo Upload */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-800 bg-zinc-950 flex items-center justify-center mb-4 group-hover:border-purple-500 transition-colors">
                            {formData.photo_url ? (
                                <img
                                    src={formData.photo_url}
                                    alt="Child"
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

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Full Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-700"
                            placeholder="Child's Full Name"
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
                            max="18"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Father's Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="father_name"
                            value={formData.father_name}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-700"
                            placeholder="Father's Name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Mother's Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="mother_name"
                            value={formData.mother_name}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-700"
                            placeholder="Mother's Name"
                            required
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

            {/* School Info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <School className="w-5 h-5 text-blue-500" />
                    School Details
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">School Name</label>
                        <input
                            type="text"
                            name="school_name"
                            value={formData.school_name}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-700"
                            placeholder="School Name"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Class / Section</label>
                        <input
                            type="text"
                            name="class_details"
                            value={formData.class_details}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-700"
                            placeholder="e.g. 5th Grade - B"
                        />
                    </div>
                </div>
            </div>

            {/* Medical Info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Medical Information
                </h2>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Medical Conditions / Allergies</label>
                    <textarea
                        name="medical_conditions"
                        value={formData.medical_conditions}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-all placeholder:text-zinc-700 min-h-[80px]"
                        placeholder="Any medical conditions, allergies, or regular medications..."
                    />
                </div>
            </div>

            {/* Emergency Contacts */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Phone className="w-5 h-5 text-green-500" />
                        Emergency Contacts
                    </h2>
                    <button
                        type="button"
                        onClick={addEmergencyContact}
                        className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-zinc-700 transition flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" />
                        Add Contact
                    </button>
                </div>

                <div className="space-y-4">
                    {emergencyContacts.map((contact, index) => (
                        <div key={index} className="p-4 bg-black/20 rounded-xl border border-zinc-800 relative group hover:border-zinc-700 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Contact {index + 1}</span>
                                {emergencyContacts.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => removeEmergencyContact(index)}
                                        className="text-zinc-500 hover:text-red-400 transition-colors"
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
                                    className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-700 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
                                    placeholder="Name"
                                    required
                                />
                                <input
                                    type="text"
                                    value={contact.relationship}
                                    onChange={(e) => handleContactChange(index, 'relationship', e.target.value)}
                                    className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-700 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
                                    placeholder="Relationship"
                                />
                                <input
                                    type="tel"
                                    value={contact.phone}
                                    onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                                    className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-700 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
                                    placeholder="Phone Number"
                                    required
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-zinc-500 mt-4 italic">
                    * Minimum 2 emergency contacts required
                </p>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white font-bold text-lg shadow-lg shadow-purple-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? 'Activating QR Code...' : 'Activate QR Code'}
            </button>
        </form>
    )
}
