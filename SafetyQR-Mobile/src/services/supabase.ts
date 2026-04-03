import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zznzvwwtlnjnwqfhfzwc.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6bnp2d3d0bG5qbndxZmhmendjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzcyNzIsImV4cCI6MjA4Nzc1MzI3Mn0.hJz22SEm9AHEFfOWp2qhGn6xloVrkkVWIRigA3lH32Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Database types
export interface AppUser {
    id: string;
    qr_code_id?: string;
    phone_number: string;
    email?: string;
    full_name: string;
    date_of_birth?: string;
    gender?: string;
    profile_photo_url?: string;
    blood_group?: string;
    medical_conditions?: string;
    allergies?: string;
    medications?: string;
    device_id?: string;
    device_model?: string;
    os_version?: string;
    app_version?: string;
    fcm_token?: string;
    is_location_enabled: boolean;
    is_sos_enabled: boolean;
    is_tracking_paused: boolean;
    created_at: string;
    updated_at: string;
    last_active: string;
    last_location_update?: string;
}

export interface EmergencyContact {
    id: string;
    user_id: string;
    contact_name: string;
    contact_phone: string;
    contact_email?: string;
    relationship: string;
    is_primary: boolean;
    can_track_location: boolean;
    can_receive_alerts: boolean;
    can_view_history: boolean;
    can_request_checkin: boolean;
    linked_app_user_id?: string;
    notify_via_push: boolean;
    notify_via_sms: boolean;
    notify_via_email: boolean;
    notify_via_call: boolean;
    priority_order: number;
    is_verified: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface EmergencyAlert {
    id: string;
    user_id: string;
    qr_code_id?: string;
    alert_type: 'sos_manual' | 'sos_shake' | 'sos_voice' | 'fall_detection' | 'geofence_exit' | 'battery_critical' | 'auto';
    alert_severity: 'low' | 'medium' | 'high' | 'critical';
    latitude: number;
    longitude: number;
    location_address?: string;
    location_accuracy?: number;
    front_camera_image_url?: string;
    back_camera_image_url?: string;
    audio_recording_url?: string;
    audio_duration_seconds?: number;
    battery_level?: number;
    network_type?: string;
    device_info?: any;
    is_active: boolean;
    is_resolved: boolean;
    resolved_at?: string;
    resolved_by?: string;
    resolution_notes?: string;
    live_tracking_active: boolean;
    last_location_update?: string;
    tracking_duration_seconds?: number;
    notifications_sent_count: number;
    notified_contacts?: any;
    super_admin_notified: boolean;
    sub_admin_notified: boolean;
    police_notified: boolean;
    created_at: string;
    updated_at: string;
}

export interface LocationHistory {
    id: string;
    user_id: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
    location_source: 'gps' | 'network' | 'cell' | 'manual';
    battery_level?: number;
    is_charging: boolean;
    network_type?: string;
    location_address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    is_background_update: boolean;
    is_emergency_update: boolean;
    timestamp: string;
    created_at: string;
}

export interface Geofence {
    id: string;
    user_id: string;
    created_by: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
    center_latitude: number;
    center_longitude: number;
    radius_meters: number;
    notify_on_enter: boolean;
    notify_on_exit: boolean;
    auto_checkin_on_arrival: boolean;
    is_scheduled: boolean;
    active_days?: any;
    start_time?: string;
    end_time?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CheckIn {
    id: string;
    user_id: string;
    requested_by: string;
    checkin_type: 'manual_request' | 'scheduled' | 'geofence_arrival' | 'emergency_followup';
    request_message?: string;
    requested_at: string;
    expires_at?: string;
    status: 'pending' | 'confirmed' | 'missed' | 'expired';
    response_message?: string;
    response_photo_url?: string;
    latitude?: number;
    longitude?: number;
    location_address?: string;
    responded_at?: string;
    created_at: string;
}
