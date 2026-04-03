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

const CATEGORY_PRICES: Record<string, number> = {
    'vehicle': 499,
    'family': 599,
    'medical': 699,
    'assets': 299
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { 
            category, product_name, customer_name, customer_email, customer_phone,
            delivery_address, delivery_city, delivery_state, delivery_pincode, quantity
        } = body

        if (!category || !product_name || !customer_name || !customer_email || !customer_phone) {
            return NextResponse.json(
                { error: 'Zaroori fields missing: name, email, phone, category, product' },
                { status: 400 }
            )
        }

        if (!delivery_address || !delivery_city || !delivery_state || !delivery_pincode) {
            return NextResponse.json(
                { error: 'Delivery address poori tarah se fill karein' },
                { status: 400 }
            )
        }

        const qty = parseInt(quantity) || 1
        const unitPrice = CATEGORY_PRICES[category.toLowerCase()] || 499
        const amount = unitPrice * qty

        const orderId = `QR_BUY_${category.toUpperCase()}_${Date.now()}`

        const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
        
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
                return_url: `${baseUrl}/api/cashfree/purchase/verify?order_id={order_id}&category=${category}&product=${encodeURIComponent(product_name)}`,
                notify_url: `${baseUrl}/api/cashfree/webhook`
            },
            order_note: `Q-Raksha QR: ${product_name} x${qty} | ${delivery_city}, ${delivery_state}`
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
        console.log('Cashfree Response:', JSON.stringify(cashfreeData))

        if (!cashfreeRes.ok) {
            console.error('Cashfree API Auth/Business Error:', cashfreeData)
            const errorMsg = cashfreeRes.status === 401 
                ? 'Cashfree Authentication Failed: Check if you are using Production keys with NEXT_PUBLIC_CASHFREE_ENV=production'
                : (cashfreeData.message || 'Payment order create nahi hua');
                
            return NextResponse.json(
                { error: errorMsg },
                { status: cashfreeRes.status }
            )
        }

        if (!cashfreeData.payment_session_id) {
            console.error('CRITICAL: Cashfree Order Created but NO Session ID returned', cashfreeData);
            return NextResponse.json(
                { error: 'Payment gateway failed to provide a session. Check your Cashfree account status.' },
                { status: 422 }
            );
        }

        // Save full order with delivery details to Supabase
        const { error: dbError } = await supabaseAdmin.from('qr_purchase_orders').insert({
            order_id: orderId,
            category,
            product_name,
            amount,
            quantity: qty,
            status: 'PENDING',
            customer_name,
            customer_email,
            customer_phone,
            delivery_address,
            delivery_city,
            delivery_state,
            delivery_pincode,
            cashfree_order_id: cashfreeData.cf_order_id,
            payment_session_id: cashfreeData.payment_session_id
        })

        if (dbError) {
            console.error('Supabase Error (non-fatal):', dbError)
        }

        return NextResponse.json({
            success: true,
            order_id: orderId,
            payment_session_id: cashfreeData.payment_session_id,
            amount,
            category,
            product_name
        })
    } catch (err: any) {
        console.error('Purchase order error:', err)
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}
