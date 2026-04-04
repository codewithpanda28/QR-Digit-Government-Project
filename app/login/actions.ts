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

        // 1. Search ALL tags matching email
        console.log("Searching for tags matching email:", normalizedEmail);
        
        const { data: detailsList, error: detailsError } = await supabaseAdmin
            .from('qr_details')
            .select('qr_id')
            .filter('additional_data->>emergency_email', 'ilike', normalizedEmail);

        if (detailsError) {
            console.error("Email search database error:", detailsError);
        }

        if (detailsList && detailsList.length > 0) {
            const qrIds = detailsList.map(d => d.qr_id);
            console.log("Found matching tag IDs:", qrIds);
            
            // Fetch all FULL QR data
            const { data: linkedData, error: fetchError } = await supabaseAdmin
                .from('qr_codes')
                .select(`
                    *,
                    qr_details(*),
                    emergency_contacts(*),
                    emergency_alerts(*)
                `)
                .in('id', qrIds);

            if (fetchError) {
                console.error("Fetch full data error:", fetchError);
            }

            return { success: true, data: linkedData || [] };
        }

        return { success: true, data: [] };
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
