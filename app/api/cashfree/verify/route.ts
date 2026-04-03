import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const CASHFREE_APP_ID = (process.env.CASHFREE_APP_ID || '').trim()
const CASHFREE_SECRET_KEY = (process.env.CASHFREE_SECRET_KEY || '').trim()
const CASHFREE_ENV = process.env.NEXT_PUBLIC_CASHFREE_ENV || 'sandbox'
const CASHFREE_BASE_URL = CASHFREE_ENV === 'production' 
    ? 'https://api.cashfree.com/pg' 
    : 'https://sandbox.cashfree.com/pg'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const order_id = searchParams.get('order_id')
        const qr_id = searchParams.get('qr_id')
        const days = searchParams.get('days')

        if (!order_id || !qr_id || !days) {
            return NextResponse.redirect(
                new URL('/renewal/failed?reason=missing_params', req.url)
            )
        }

        const isDev = process.env.NODE_ENV === 'development'
        const isDebug = searchParams.get('debug_test') === 'true'

        let orderData: any = { order_status: 'PAID' };

        if (!isDev || !isDebug) {
            // Verify payment with Cashfree
            const res = await fetch(`${CASHFREE_BASE_URL}/orders/${order_id}`, {
                headers: {
                    'x-api-version': '2023-08-01',
                    'x-client-id': CASHFREE_APP_ID,
                    'x-client-secret': CASHFREE_SECRET_KEY
                }
            })
            orderData = await res.json()
            
            if (!res.ok || orderData.order_status !== 'PAID') {
                // Update order status to FAILED
                await supabaseAdmin
                    .from('qr_renewal_orders')
                    .update({ status: orderData.order_status || 'FAILED' })
                    .eq('order_id', order_id)

                return NextResponse.redirect(
                    new URL(`/renewal/failed?order_id=${order_id}&reason=${orderData.order_status}`, req.url)
                )
            }
        }

        // Payment successful - extend QR subscription
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
            return NextResponse.redirect(
                new URL(`/renewal/failed?order_id=${order_id}&reason=db_error`, req.url)
            )
        }

        // Update order status
        await supabaseAdmin
            .from('qr_renewal_orders')
            .update({
                status: 'SUCCESS',
                paid_at: new Date().toISOString(),
                new_expiry: newExpiry.toISOString()
            })
            .eq('order_id', order_id)

        return NextResponse.redirect(
            new URL(`/renewal/success?order_id=${order_id}&days=${daysInt}&expiry=${newExpiry.toISOString()}`, req.url)
        )
    } catch (err: any) {
        console.error('Verify error:', err)
        return NextResponse.redirect(
            new URL('/renewal/failed?reason=server_error', req.url)
        )
    }
}
