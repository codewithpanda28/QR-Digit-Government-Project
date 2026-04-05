import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Initialize Supabase Admin
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Custom OTP Store (Temporary for development, ideally use a DB table)
// For now, we will save OTPs in a dedicated 'otp_system' table in Supabase
// CREATE TABLE otp_system (email TEXT PRIMARY KEY, otp TEXT, expires_at TIMESTAMP WITH TIME ZONE);

export async function POST(request: Request) {
    try {
        const { email } = await request.json();
        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000).toISOString(); // 10 mins

        // 1. Save to Supabase (Bypass Rate Limits)
        const { error: dbError } = await supabase
            .from('otp_system')
            .upsert({ email: email.toLowerCase(), otp, expires_at: expiresAt });

        if (dbError) {
            console.error("OTP DB Error:", dbError);
            // If table doesn't exist, we can't save but we can still try to send
        }

        if (!process.env.GMAIL_APP_PASSWORD) {
            console.error("GMAIL_APP_PASSWORD is not set in environment variables.");
            return NextResponse.json({ 
                error: 'Server Config Error: GMAIL_APP_PASSWORD missing. Please set this in Vercel settings for unlimited OTP.',
            }, { status: 500 });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER || 'autheraai225@gmail.com', 
                pass: process.env.GMAIL_APP_PASSWORD 
            }
        });

        const mailOptions = {
            from: `"QR Digit Security" <${process.env.GMAIL_USER || 'autheraai225@gmail.com'}>`,
            to: email,
            subject: `🔐 Your QR Digit Access Code: ${otp}`,
            html: `
                <div style="font-family: sans-serif; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 20px;">
                    <h2 style="color: #dc2626; text-align: center;">QR DIGIT</h2>
                    <p style="text-align: center; color: #666;">Use the following code to access your profile:</p>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000;">
                        ${otp}
                    </div>
                    <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
                        This code expires in 10 minutes.<br>If you didn't request this, ignore this email.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, message: 'OTP sent via Gmail' });

    } catch (error: any) {
        console.error('Custom OTP Send Failed:', error);
        return NextResponse.json({ 
            error: 'Failed to send OTP', 
            details: error.message 
        }, { status: 500 });
    }
}
