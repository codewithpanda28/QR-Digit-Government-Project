import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
        const category = searchParams.get('category') || 'custom'
        const product = searchParams.get('product') || 'Safety Tag'

        if (!order_id) {
            return NextResponse.redirect(new URL('/shop?error=missing_order_id', req.url))
        }

        const isDev = process.env.NODE_ENV === 'development'
        const isDebug = searchParams.get('debug_test') === 'true'
        const host = req.headers.get('host') || ''
        const isLocal = host.includes('localhost') || host.includes('127.0.0.1')

        let orderStatus = 'FAILED';

        if (isDebug && (isDev || isLocal)) {
            console.log('Payment Bypass: Debug test mode active on local/dev environment')
            orderStatus = 'PAID';
        } else {
            // Verify payment with Cashfree
            console.log(`Verifying payment for order: ${order_id}`)
            const res = await fetch(`${CASHFREE_BASE_URL}/orders/${order_id}`, {
                headers: {
                    'x-api-version': '2023-08-01',
                    'x-client-id': CASHFREE_APP_ID,
                    'x-client-secret': CASHFREE_SECRET_KEY
                }
            })
            const orderData = await res.json()
            console.log(`Cashfree Response for ${order_id}:`, orderData)
            
            if (res.ok && orderData.order_status === 'PAID') {
                orderStatus = 'PAID';
            } else {
                orderStatus = orderData.order_status || 'FAILED';
            }
        }

        if (orderStatus !== 'PAID') {
            await supabaseAdmin
                .from('qr_purchase_orders')
                .update({ status: orderStatus })
                .eq('order_id', order_id)

            return NextResponse.redirect(
                new URL(`/shop?error=payment_failed&order_id=${order_id}&status=${orderStatus}`, req.url)
            )
        }

        // Payment successful - Generate QR code
        
        // 1. Fetch latest sequence
        const { data: latest } = await supabaseAdmin
            .from('qr_codes')
            .select('sequence_number')
            .order('sequence_number', { ascending: false })
            .limit(1)
            .maybeSingle()
        
        const nextSequence = (latest?.sequence_number || 0) + 1
        const randomId = Math.random().toString(36).substring(2, 8).toUpperCase()
        const qrNumber = `shop-product/${randomId}`
        const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://thinkaiq.com').replace(/\/$/, '')
        
        // Map category properly (Matching actions.ts logic)
        const mappedCategory = 
                    category.toLowerCase().includes('child') ? 'child-safety' : 
                    category.toLowerCase().includes('vehicle') ? 'vehicle-safety' : 
                    category.toLowerCase().includes('women') ? 'women-safety' : 
                    category.toLowerCase().includes('medical') || category.toLowerCase().includes('elder') ? 'elderly-safety' : 
                    category.toLowerCase().includes('school') || category.toLowerCase().includes('student') ? 'school-safety' : 'child-safety';

        // Set expiry: 1 year from now
        const expiryDate = new Date()
        expiryDate.setFullYear(expiryDate.getFullYear() + 1)

        const { data: qr, error: qrError } = await supabaseAdmin
            .from('qr_codes')
            .insert({
                qr_number: qrNumber,
                category: mappedCategory,
                status: 'generated',
                subscription_end: expiryDate.toISOString(),
                sequence_number: nextSequence,
                full_url: `${baseUrl}/${qrNumber}`,
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (qrError) {
            console.error('QR generation error:', qrError)
            return NextResponse.redirect(new URL(`/shop?error=qr_gen_failed&msg=${encodeURIComponent(qrError.message)}`, req.url))
        }

        // Update purchase order (using maybeSingle or equivalent to avoid crash if table missing, though we should encourage SQL run)
        try {
            await supabaseAdmin
                .from('qr_purchase_orders')
                .update({
                    status: 'SUCCESS',
                    paid_at: new Date().toISOString(),
                    qr_id: qr.id
                })
                .eq('order_id', order_id)
        } catch (e) {
            console.warn('Could not update purchase order table - is it created?')
        }

        // Redirect to instant page with results
        const successUrl = new URL('/shop/instant', req.url)
        successUrl.searchParams.set('category', category)
        successUrl.searchParams.set('product', product)
        successUrl.searchParams.set('qr_number', qr.qr_number)
        successUrl.searchParams.set('qr_url', qr.full_url)
        successUrl.searchParams.set('success', 'true')
        
        return NextResponse.redirect(successUrl)

    } catch (err: any) {
        console.error('Verify purchase error:', err)
        return NextResponse.redirect(new URL(`/shop?error=server_error&msg=${encodeURIComponent(err.message)}`, req.url))
    }
}
