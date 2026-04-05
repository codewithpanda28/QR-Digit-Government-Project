import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, qr_id, days } = body

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return NextResponse.json({ error: 'Missing payment signature details' }, { status: 400 });
        }

        const secret = process.env.RAZORPAY_SECRET_KEY || '';
        const generated_signature = crypto.createHmac('sha256', secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            await supabaseAdmin.from('qr_renewal_orders').update({ status: 'FAILED' }).eq('cashfree_order_id', razorpay_order_id)
            return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
        }

        const daysInt = parseInt(days)
        const { data: qr } = await supabaseAdmin
            .from('qr_codes')
            .select('subscription_end')
            .eq('id', qr_id)
            .single()

        // Calculate new expiry: if already expired, start from now; else extend from current expiry
        const baseDate = qr?.subscription_end && new Date(qr.subscription_end) > new Date()
            ? new Date(qr.subscription_end)
            : new Date()

        const newExpiry = new Date(baseDate.getTime() + daysInt * 24 * 60 * 60 * 1000)

        // Update QR subscription
        const { error: updateError } = await supabaseAdmin
            .from('qr_codes')
            .update({
                subscription_end: newExpiry.toISOString(),
                status: 'activated'
            })
            .eq('id', qr_id)

        if (updateError) {
            console.error('QR update error:', updateError)
        }

        // Update renewal order status
        await supabaseAdmin
            .from('qr_renewal_orders')
            .update({
                status: 'SUCCESS',
                paid_at: new Date().toISOString(),
                new_expiry: newExpiry.toISOString()
            })
            .eq('cashfree_order_id', razorpay_order_id)

        return NextResponse.json({
            success: true,
            days: daysInt,
            expiry: newExpiry.toISOString()
        });
    } catch (err: any) {
        console.error('Verify renewal error:', err)
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}
