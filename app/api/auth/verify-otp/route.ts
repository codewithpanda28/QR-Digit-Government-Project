import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin for sensitive operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { email, code } = await request.json();
        
        if (!email || !code) {
            return NextResponse.json({ error: 'Email and code required' }, { status: 400 });
        }

        // 1. Verify our custom OTP from 'otp_system' table
        const { data: record, error: dbError } = await supabaseAdmin
            .from('otp_system')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('otp', code)
            .maybeSingle();

        if (dbError || !record) {
            console.error("Verification failed:", dbError || "No record found");
            return NextResponse.json({ error: 'Invalid or expired code. Please try again.' }, { status: 401 });
        }

        // 2. Check expiry
        const expiresAt = new Date(record.expires_at).getTime();
        if (expiresAt < Date.now()) {
            return NextResponse.json({ error: 'Verification code expired.' }, { status: 401 });
        }

        // 3. User is verified! Now generate a Supabase Login Link (Admin bypass)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const redirectUrl = `${appUrl.endsWith('/') ? appUrl : appUrl + '/'}login`;

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email.toLowerCase(),
            options: { redirectTo: redirectUrl }
        });

        if (linkError) {
            console.error("Link generation failed, attempting auto-signup:", linkError);
            
            // If user doesn't exist, create them first
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email.toLowerCase(),
                email_confirm: true
            });

            if (createError) throw createError;

            // Generate link for newly created user
            const { data: retryData, error: retryError } = await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email: email.toLowerCase(),
                options: { redirectTo: redirectUrl }
            });

            if (retryError) throw retryError;
            
            return NextResponse.json({ 
                success: true, 
                login_link: retryData.properties.action_link 
            });
        }

        // 4. Clean up the OTP record after successful use
        await supabaseAdmin.from('otp_system').delete().eq('email', email.toLowerCase());

        return NextResponse.json({ 
            success: true, 
            login_link: linkData.properties.action_link 
        });

    } catch (error: any) {
        console.error('Verify OTP error:', error);
        return NextResponse.json({ error: 'Internal security error during verification' }, { status: 500 });
    }
}
