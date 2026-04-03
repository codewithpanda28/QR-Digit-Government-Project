import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY!
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID!
const CASHFREE_BASE_URL = 'https://api.cashfree.com/pg'

export async function POST(req: NextRequest) {
    try {
        const body = await req.text()
        const signature = req.headers.get('x-webhook-signature')
        const timestamp = req.headers.get('x-webhook-timestamp')

        // Verify webhook signature
        if (signature && timestamp) {
            const signedPayload = `${timestamp}${body}`
            const expectedSig = crypto
                .createHmac('sha256', CASHFREE_SECRET_KEY)
                .update(signedPayload)
                .digest('base64')

            if (signature !== expectedSig) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
            }
        }

        const event = JSON.parse(body)
        const { type, data } = event

        if (type === 'PAYMENT_SUCCESS_WEBHOOK' || type === 'ORDER_PAID') {
            const orderId = data?.order?.order_id
            if (!orderId) return NextResponse.json({ received: true })

            // Get our order record
            const { data: renewalOrder } = await supabaseAdmin
                .from('qr_renewal_orders')
                .select('*')
                .eq('order_id', orderId)
                .single()

            if (!renewalOrder || renewalOrder.status === 'SUCCESS') {
                return NextResponse.json({ received: true })
            }

            // Get QR current expiry
            const { data: qr } = await supabaseAdmin
                .from('qr_codes')
                .select('subscription_end')
                .eq('id', renewalOrder.qr_id)
                .single()

            const baseDate = qr?.subscription_end && new Date(qr.subscription_end) > new Date()
                ? new Date(qr.subscription_end)
                : new Date()

            const newExpiry = new Date(
                baseDate.getTime() + renewalOrder.days * 24 * 60 * 60 * 1000
            )

            // Update QR
            await supabaseAdmin
                .from('qr_codes')
                .update({
                    subscription_end: newExpiry.toISOString(),
                    status: 'activated'
                })
                .eq('id', renewalOrder.qr_id)

            // Update order
            await supabaseAdmin
                .from('qr_renewal_orders')
                .update({
                    status: 'SUCCESS',
                    paid_at: new Date().toISOString(),
                    new_expiry: newExpiry.toISOString()
                })
                .eq('order_id', orderId)
        }

        return NextResponse.json({ received: true })
    } catch (err: any) {
        console.error('Webhook error:', err)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
}
