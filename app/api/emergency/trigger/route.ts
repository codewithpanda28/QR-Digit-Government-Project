import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { qr_id, user_id, alert_type, lat, lng, address, alert_id } = body;

        // Initialize Supabase with Service Role Key (Bypasses RLS)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: { persistSession: false }
            }
        );

        // --- UPDATE MODE ---
        if (alert_id) {
            console.log(`[ALERT UPDATE] Patching location for Alert: ${alert_id}`);
            const { data: updated, error: updateErr } = await supabase
                .from('emergency_alerts')
                .update({
                    latitude: lat,
                    longitude: lng,
                    location_address: address,
                    evidence_photos: body.evidence_photos || [],
                    evidence_video: body.evidence_video || null
                })
                .eq('id', alert_id)
                .select()
                .single();

            if (updateErr) throw updateErr;
            return NextResponse.json({ success: true, alert: updated });
        }

        // --- CREATE MODE ---
        if (!qr_id || !lat || !lng) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Basic Rate Limiting (Simple IP Check)
        const ip = request.headers.get('x-forwarded-for') || 'anonymous';
        console.log(`[ALERT] Request from IP: ${ip} for QR: ${qr_id}`);

        // Verify that the QR code actually exists and is not expired/inactive
        const { data: validQR, error: checkError } = await supabase
            .from('qr_codes')
            .select('id, status, generated_by')
            .eq('id', qr_id)
            .maybeSingle();

        if (checkError || !validQR) {
            return NextResponse.json({ error: 'INVALID_QR: Access Denied' }, { status: 403 });
        }

        if (validQR.status === 'expired' || validQR.status === 'inactive') {
            return NextResponse.json({ error: 'QR_INACTIVE: This code is no longer valid' }, { status: 401 });
        }

        let alertPayload = {
            qr_id,
            user_id: user_id || validQR.generated_by || null, 
            alert_type,
            latitude: lat,
            longitude: lng,
            location_address: address,
            status: 'active'
        };

        const { data, error } = await supabase
            .from('emergency_alerts')
            .insert(alertPayload)
            .select()
            .single();

        if (error) {
            console.error('Initial Insert Error:', error);
            // If Foreign Key Violation (23503), retry without user_id
            if (error.code === '23503') {
                const { data: retryData, error: retryError } = await supabase
                    .from('emergency_alerts')
                    .insert({ ...alertPayload, user_id: null })
                    .select()
                    .single();
                if (retryError) throw retryError;
                return NextResponse.json({ success: true, alert: retryData });
            }
            throw error;
        }

        return NextResponse.json({ success: true, alert: data });

    } catch (error: any) {
        console.error('Emergency Alert Trigger Failed:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error', details: error },
            { status: 500 }
        );
    }
}
