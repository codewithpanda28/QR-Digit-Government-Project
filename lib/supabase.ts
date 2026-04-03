import { createClient } from '@supabase/supabase-js'

// Validate and provide fallback for Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MTYyNDAwMDAsImV4cCI6MTkzMTgxNjAwMH0.placeholder'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check if using placeholder values
const isPlaceholder = supabaseUrl === 'https://placeholder.supabase.co' ||
    supabaseUrl.includes('your_supabase_url_here') ||
    supabaseAnonKey.includes('your_supabase_anon_key_here')

if (isPlaceholder && typeof window !== 'undefined') {
    console.warn('⚠️ Supabase credentials not configured. Please update .env.local with your actual Supabase URL and API key.')
}

// Regular client for normal operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client with service role key for admin operations (createUser, etc.)
// Only create if service key is available
export const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null // Return null if service key not available

// Helper to check if admin client is available
export const isAdminClientAvailable = !!supabaseAdmin

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = !isPlaceholder

// Database types
export type UserRole = 'super_admin' | 'sub_admin' | 'customer'

export type QRCategory =
    | 'child-safety'
    | 'women-safety'
    | 'elderly-safety'
    | 'school-safety'
    | 'vehicle-safety'
    | 'tourist-safety'
    | 'temple-event'
    | 'mela-safety'
    | 'event-safety'

export type QRStatus = 'generated' | 'activated' | 'expired' | 'suspended' | 'inactive'

export type ScanType = 'view' | 'emergency' | 'update'

export interface User {
    id: string
    email: string
    name: string
    role: UserRole
    phone?: string
    created_by?: string
    qr_quota: number
    commission_rate: number
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface QRCode {
    id: string
    qr_number: string
    category: QRCategory
    sequence_number: number
    full_url: string
    status: QRStatus
    generated_by: string
    activated_by?: string
    subscription_start?: string
    subscription_end?: string
    subscription_period?: string
    scan_count: number
    last_scanned_at?: string
    last_scanned_location?: string
    fixed_category?: string
    created_at: string
    updated_at: string
}

export interface QRDetails {
    id: string
    qr_id: string
    category: QRCategory
    full_name?: string
    age?: number
    blood_group?: string
    photo_url?: string
    home_address?: string

    // Child Safety
    father_name?: string
    mother_name?: string
    medical_conditions?: string

    // Women Safety
    office_address?: string
    college_address?: string

    // Elderly Safety
    caretaker_name?: string
    caretaker_number?: string
    current_medications?: string
    doctor_name?: string
    doctor_contact?: string

    // School Safety
    student_name?: string
    class_section?: string
    roll_number?: string
    school_name?: string
    parent_names?: string

    // Vehicle Safety
    owner_name?: string
    vehicle_number?: string
    vehicle_model?: string
    vehicle_color?: string
    insurance_details?: string
    owner_mobile?: string

    // Tourist Safety
    nationality?: string
    passport_number?: string
    hotel_name?: string
    hotel_address?: string
    local_contact?: string
    embassy_contact?: string
    home_country_contact?: string

    // Temple/Event Safety
    person_name?: string
    group_leader_name?: string
    group_leader_contact?: string
    meeting_point?: string

    additional_data?: any
    phone?: string
    created_at: string
    updated_at: string
}

export interface EmergencyContact {
    id: string
    qr_id: string
    name: string
    relationship?: string
    phone: string
    priority: number
    created_at: string
}

export interface ScanLog {
    id: string
    qr_id: string
    scan_type: ScanType
    latitude?: number
    longitude?: number
    location_address?: string
    ip_address?: string
    user_agent?: string
    scanned_at: string
}

export interface EmergencyAlert {
    id: string
    qr_id: string
    latitude?: number
    longitude?: number
    location_address?: string
    google_maps_link?: string
    sms_sent_to: string[]
    sms_status: string
    alert_time: string
    resolved: boolean
    resolved_at?: string
}

export interface NearbyService {
    id: string
    service_type: 'police_station' | 'hospital'
    name: string
    address?: string
    phone?: string
    latitude?: number
    longitude?: number
    city?: string
    state?: string
}

export interface Subscription {
    id: string
    qr_id: string
    user_id: string
    plan_name: string
    plan_price: number
    start_date: string
    end_date: string
    is_active: boolean
    payment_status: string
    payment_id?: string
    created_at: string
}
