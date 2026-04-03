import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const CASHFREE_APP_ID = (process.env.CASHFREE_APP_ID || '').trim()
const CASHFREE_SECRET_KEY = (process.env.CASHFREE_SECRET_KEY || '').trim()
const CASHFREE_ENV = (process.env.NEXT_PUBLIC_CASHFREE_ENV || 'sandbox').trim().toLowerCase()
const CASHFREE_BASE_URL = CASHFREE_ENV === 'production' 
    ? 'https://api.cashfree.com/pg' 
    : 'https://sandbox.cashfree.com/pg'

// Pricing plans per day count
const RENEWAL_PLANS: Record<number, number> = {
    7: 49,
    15: 89,
    30: 149,
    60: 249,
    90: 349,
    180: 599,
    365: 999
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { qr_id, days, customer_name, customer_email, customer_phone } = body

        if (!qr_id || !days || !customer_name || !customer_email || !customer_phone) {
            return NextResponse.json(
                { error: 'Zaroori fields missing: qr_id, days, customer_name, customer_email, customer_phone' },
                { status: 400 }
            )
        }

        let amount = 0;
        const d = Number(days);

        // Standardized Premium Pricing Logic (Matched with Frontend)
        if (d % 365 === 0 && d > 0) {
            // It's a multiple of years (e.g. 1 year, 2 years, etc.)
            const years = d / 365;
            amount = years * 299; // Standard ₹299/year
        } else if (d === 180) {
            amount = 199; // 6 Months (Optional Tier)
        } else if (d === 30) {
            amount = 49;  // 1 Month (Optional Tier)
        } else if (d > 0) {
            // Fallback: ~₹0.82 per day based on ₹299/year, minimum ₹49
            amount = Math.max(Math.ceil(d * 0.82), 49);
        } else {
            return NextResponse.json(
                { error: `Invalid duration.` },
                { status: 400 }
            )
        }

        // Verify QR exists
        const { data: qr, error: qrError } = await supabaseAdmin
            .from('qr_codes')
            .select('id, qr_number, subscription_end')
            .eq('id', qr_id)
            .single()

        if (qrError || !qr) {
            return NextResponse.json({ error: 'QR code not found' }, { status: 404 })
        }

        // Generate unique order ID
        const orderId = `QR_RENEW_${qr.qr_number}_${Date.now()}`
        const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')

        // Create Cashfree order
        const orderPayload = {
            order_id: orderId,
            order_amount: amount,
            order_currency: 'INR',
            customer_details: {
                customer_id: `CUST_${Date.now()}`,
                customer_name,
                customer_email,
                customer_phone
            },
            order_meta: {
                return_url: `${baseUrl}/api/cashfree/verify?order_id={order_id}&qr_id=${qr_id}&days=${days}`,
                notify_url: `${baseUrl}/api/cashfree/webhook`
            },
            order_note: `QR Renewal for ${qr.qr_number} - ${days} days`
        }

        if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
            console.error('CRITICAL: Cashfree Credentials missing in environment variables');
            return NextResponse.json(
                { error: 'Payment gateway configuration missing. Please check server environment variables.' },
                { status: 500 }
            );
        }

        const cashfreeRes = await fetch(`${CASHFREE_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'x-api-version': '2023-08-01',
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY
            },
            body: JSON.stringify(orderPayload)
        })

        const cashfreeData = await cashfreeRes.json()
        console.log('Cashfree Renewal Response:', JSON.stringify(cashfreeData))

        if (!cashfreeRes.ok) {
            console.error('Cashfree Order Creation Failed:', {
                status: cashfreeRes.status,
                data: cashfreeData,
                env: CASHFREE_ENV
            })
            
            const errorMsg = cashfreeRes.status === 401 
                ? 'Cashfree Authentication Failed: Check if you are using Production keys with NEXT_PUBLIC_CASHFREE_ENV=production'
                : (cashfreeData.message || 'Payment Order Failed');

            return NextResponse.json(
                { error: errorMsg },
                { status: cashfreeRes.status }
            )
        }

        if (!cashfreeData.payment_session_id) {
            console.error('CRITICAL: Cashfree Renewal Created but NO Session ID returned', cashfreeData);
            return NextResponse.json(
                { error: 'Payment gateway failed to provide a session. Check your Cashfree account status.' },
                { status: 422 }
            );
        }

        // Store pending order in Supabase
        await supabaseAdmin.from('qr_renewal_orders').insert({
            order_id: orderId,
            qr_id,
            days,
            amount,
            status: 'PENDING',
            customer_name,
            customer_email,
            customer_phone,
            cashfree_order_id: cashfreeData.cf_order_id,
            payment_session_id: cashfreeData.payment_session_id
        })

        return NextResponse.json({
            success: true,
            order_id: orderId,
            payment_session_id: cashfreeData.payment_session_id,
            amount,
            days,
            qr_number: qr.qr_number
        })
    } catch (err: any) {
        console.error('Create order error:', err)
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
    }
}
