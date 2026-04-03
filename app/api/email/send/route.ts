import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { to, subject, message, qr_id, evidenceImage } = body;

        if (!to || !message || !qr_id) {
            return NextResponse.json({ error: 'Missing required fields: to, message, qr_id' }, { status: 400 });
        }

        // SECURITY: Verify the email matches the registered emergency email for this QR
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        // Fetch QR details AND the owner's email from profiles/users
        const { data: qr, error: qrErr } = await supabase
            .from('qr_codes')
            .select('generated_by')
            .eq('id', qr_id)
            .single();

        if (qrErr || !qr) {
            console.error(`EMAIL_FORBIDDEN: QR code ${qr_id} not found or error:`, qrErr);
            return NextResponse.json({ error: 'INVALID_QR: Identity not verified' }, { status: 403 });
        }

        const { data: details } = await supabase
            .from('qr_details')
            .select('additional_data')
            .eq('qr_id', qr_id)
            .single();

        const registeredEmail = details?.additional_data?.emergency_email;
        const systemLogEmail = 'xjony83@gmail.com'; // Admin log
        
        // Also allow the owner's own email
        let ownerEmail = '';
        if (qr.generated_by) {
            try {
                const { data: userData } = await supabase.auth.admin.getUserById(qr.generated_by);
                ownerEmail = userData.user?.email || '';
            } catch (authErr) {
                console.warn(`Could not fetch owner email for ${qr.generated_by}:`, authErr);
            }
        }

        // Only allow sending to internal audit email OR the registered emergency email OR the owner
        const isAuthorized = to === systemLogEmail || (registeredEmail && to === registeredEmail) || (ownerEmail && to === ownerEmail);

        if (!isAuthorized) {
            console.error(`SECURITY: Unrecognized recipient ${to} for QR ${qr_id}. Authorized: [${systemLogEmail}, ${registeredEmail || 'N/A'}, ${ownerEmail || 'N/A'}]`);
            return NextResponse.json({ error: 'FORBIDDEN: Recipient email is not authorized' }, { status: 403 });
        }

        // --- REAL EMAIL INTEGRATION USING NODEMAILER ---
        // Using credentials from .env.local
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        const mailOptions = {
            from: `"${process.env.SMTP_FROM_NAME || 'Safety QR'}" <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject,
            text: message,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #1a1a1a; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <h1 style="color: #dc2626; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.025em;">🚨 EMERGENCY ALERT</h1>
                        <p style="color: #64748b; font-size: 14px; margin-top: 8px; font-weight: 500;">thinkTrust™ Safety Response Network</p>
                    </div>
                    
                    <div style="background: #fef2f2; border-left: 5px solid #dc2626; padding: 20px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <p style="margin: 0; color: #991b1b; font-weight: 700; font-size: 14px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Alert Details:</p>
                        <pre style="white-space: pre-wrap; font-family: inherit; font-size: 16px; line-height: 1.6; margin: 0; color: #1e293b;">${message}</pre>
                    </div>

                    ${evidenceImage ? `
                    <div style="margin-bottom: 25px;">
                        <p style="margin: 0; color: #475569; font-weight: 700; font-size: 14px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Evidence Photo (Background):</p>
                        <div style="border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
                            <img src="${evidenceImage}" alt="SOS Evidence" style="width: 100%; height: auto; display: block;" />
                        </div>
                        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 8px;">Captured instantly during SOS activation</p>
                    </div>
                    ` : ''}
                    
                    <div style="font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 25px; margin-top: 10px;">
                        <p style="margin-bottom: 8px;">This is a high-priority automated broadcast from the Safety QR platform.</p>
                        <p style="margin: 0;">© ${new Date().getFullYear()} ThinkAIQ Safety Systems • Secured by thinkTrust™</p>
                    </div>
                </div>
            `
        };

        // Send actual email
        console.log(`🚀 Attempting to send real email to: ${to}`);
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.messageId);

        return NextResponse.json({
            success: true,
            message: 'Real email dispatched successfully',
            messageId: info.messageId
        });

    } catch (error: any) {
        console.error('❌ Error sending real email:', error);
        return NextResponse.json({
            error: 'Failed to send email',
            details: error.message
        }, { status: 500 });
    }
}
