'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Upload, Plus, X, GraduationCap, School, Bus, User, Phone, Home } from 'lucide-react'

interface SchoolSafetyFormProps {
    qrId: string
    onSuccess: () => void
}

interface EmergencyContact {
    name: string
    relationship: string
    phone: string
    priority: number
}

export default function SchoolSafetyForm({ qrId, onSuccess }: SchoolSafetyFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        student_name: '',
        class_grade: '',
        roll_number: '',
        school_name: '',
        teacher_name: '',
        bus_number: '',
        blood_group: '',
        medical_conditions: '',
        father_name: '',
        mother_name: '',
        home_address: '',
        photo_url: '',
        email: '',
    })

    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
        { name: '', relationship: 'Father', phone: '+91', priority: 1 },
        { name: '', relationship: 'Mother', phone: '+91', priority: 2 },
        { name: '', relationship: 'School Transport', phone: '+91', priority: 3 },
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
            toast.error('Parents/Guardians contacts are crucial')
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
            const fileName = `student-${qrId}-${Date.now()}.${fileExt}`
            const filePath = `qr-photos/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('safety-assets')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('safety-assets')
                .getPublicUrl(filePath)

            setFormData({ ...formData, photo_url: publicUrl })
            toast.success('Student photo uploaded')
        } catch (error) {
            console.error('Error uploading photo:', error)
            toast.error('Failed to upload photo')
        } finally {
            setUploadingPhoto(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.student_name || !formData.school_name || !formData.home_address) {
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
            // Insert QR details
            const { error: detailsError } = await supabase
                .from('qr_details')
                .insert({
                    qr_id: qrId,
                    category: 'school-safety',
                    full_name: formData.student_name,
                    father_name: formData.father_name,
                    mother_name: formData.mother_name,
                    home_address: formData.home_address,
                    blood_group: formData.blood_group,
                    medical_conditions: formData.medical_conditions,
                    // Store school specific info in additional_data
                    additional_data: {
                        class_grade: formData.class_grade,
                        roll_number: formData.roll_number,
                        school_name: formData.school_name,
                        teacher_name: formData.teacher_name,
                        bus_number: formData.bus_number,
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

            toast.success('Student ID Activated Successfully!')
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
            {/* Student Details */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                    <GraduationCap className="w-5 h-5 text-yellow-500" />
                    Student Information
                </h2>

                <div className="flex flex-col items-center mb-8 relative z-10">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-800 bg-zinc-950 flex items-center justify-center mb-4 group-hover:border-yellow-500 transition-colors">
                            {formData.photo_url ? (
                                <img
                                    src={formData.photo_url}
                                    alt="Student"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-12 h-12 text-zinc-700" />
                            )}
                        </div>
                        <label className="absolute bottom-4 right-0 bg-yellow-600 text-white p-2 rounded-full cursor-pointer hover:bg-yellow-500 transition-colors shadow-lg">
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
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Student Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="student_name"
                            value={formData.student_name}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-700"
                            placeholder="Full Name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Class / Grade</label>
                        <input
                            type="text"
                            name="class_grade"
                            value={formData.class_grade}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-700"
                            placeholder="e.g. 10-A"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Roll Number</label>
                        <input
                            type="text"
                            name="roll_number"
                            value={formData.roll_number}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-700"
                            placeholder="Optional"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Blood Group</label>
                        <select
                            name="blood_group"
                            value={formData.blood_group}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all"
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
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-all placeholder:text-zinc-700"
                            placeholder="Parent's Email"
                        />
                    </div>
                </div>
            </div>

            {/* School & Transport */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <School className="w-5 h-5 text-blue-500" />
                    School Data
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">School Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="school_name"
                            value={formData.school_name}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-700"
                            placeholder="Full School Name"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Class Teacher</label>
                        <input
                            type="text"
                            name="teacher_name"
                            value={formData.teacher_name}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-700"
                            placeholder="Teacher's Name"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <Bus className="w-3 h-3" />
                            Bus / Transport No.
                        </label>
                        <input
                            type="text"
                            name="bus_number"
                            value={formData.bus_number}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-700"
                            placeholder="Route or Bus Number"
                        />
                    </div>
                </div>
            </div>

            {/* Family Details */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Home className="w-5 h-5 text-green-500" />
                    Family Details
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Father's Name</label>
                        <input
                            type="text"
                            name="father_name"
                            value={formData.father_name}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all placeholder:text-zinc-700"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Mother's Name</label>
                        <input
                            type="text"
                            name="mother_name"
                            value={formData.mother_name}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all placeholder:text-zinc-700"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Home Address <span className="text-red-500">*</span></label>
                        <textarea
                            name="home_address"
                            value={formData.home_address}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all placeholder:text-zinc-700 min-h-[80px]"
                            required
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
                                {emergencyContacts.length > 2 && (
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
                className="w-full py-4 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl text-white font-bold text-xl shadow-lg shadow-yellow-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Activating Student Shield...' : 'Activate QR Code'}
            </button>
        </form>
    )
}
