'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || 'placeholder', {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function fetchAndLinkUserData(userId: string, email: string) {
    try {
        if (!supabaseServiceKey) throw new Error("Missing server configuration");

        const normalizedEmail = email?.toLowerCase().trim();
        let qrData = null;

        // 1. Search ONLY by email since linked_user_id column is missing in DB
        console.log("Searching for tag matching email:", normalizedEmail);
        
        // Search qr_details for the emergency_email inside additional_data JSONB
        const { data: details, error: detailsError } = await supabaseAdmin
            .from('qr_details')
            .select('qr_id')
            .filter('additional_data->>emergency_email', 'ilike', normalizedEmail)
            .limit(1)
            .maybeSingle();

        if (detailsError) {
            console.error("Email search database error:", detailsError);
        }

        if (details?.qr_id) {
            console.log("Found matching tag ID:", details.qr_id);
            
            // Fetch the full QR data
            const { data: linkedData, error: fetchError } = await supabaseAdmin
                .from('qr_codes')
                .select(`
                    *,
                    qr_details(*),
                    emergency_contacts(*),
                    emergency_alerts(*)
                `)
                .eq('id', details.qr_id)
                .maybeSingle();

            if (fetchError) {
                console.error("Fetch full data error:", fetchError);
            }

            qrData = linkedData;
        }

        return { success: true, data: qrData || null };
    } catch (e: any) {
        console.error("Action level error:", e);
        return { success: false, error: e.message };
    }
}

export async function toggleQRStatus(qrId: string, currentStatus: string) {
    try {
        if (!supabaseServiceKey) throw new Error("Missing server configuration");
        
        // Use database-valid status values
        const newStatus = currentStatus === 'activated' ? 'suspended' : 'activated';
        
        const { error } = await supabaseAdmin
            .from('qr_codes')
            .update({ status: newStatus })
            .eq('id', qrId);
            
        if (error) throw error;
        
        return { success: true, newStatus };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
