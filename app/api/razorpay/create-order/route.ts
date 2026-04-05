import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Razorpay from 'razorpay'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_SECRET_KEY || ''
});

const CATEGORY_PRICES: Record<string, number> = {
    'vehicle': 299,
    'family': 299,
    'medical': 299,
    'assets': 299,
    'pets': 299,
    'travel': 299,
    'home': 299
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
        const unitPrice = CATEGORY_PRICES[category.toLowerCase()] || 299
        const amount = unitPrice * qty

        const orderId = `QR_BUY_${category.toUpperCase()}_${Date.now()}`

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET_KEY) {
            console.error('CRITICAL: Razorpay Credentials missing in environment variables');
            return NextResponse.json(
                { error: 'Payment gateway configuration missing. Please check server environment variables.' },
                { status: 500 }
            );
        }

        const options = {
            amount: amount * 100,  
            currency: 'INR',
            receipt: orderId,
            notes: {
                category,
                product_name,
                customer_name,
                customer_email,
                customer_phone,
                delivery_address: `${delivery_address}, ${delivery_city}, ${delivery_state} - ${delivery_pincode}`,
            }
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Save order to Supabase
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
            cashfree_order_id: razorpayOrder.id, // Using the same column name to avoid DB schema changes
            payment_session_id: razorpayOrder.id
        })

        if (dbError) {
            console.error('Supabase Error (non-fatal):', dbError)
        }

        return NextResponse.json({
            success: true,
            order_id: razorpayOrder.id,
            internal_order_id: orderId,
            amount,
            currency: razorpayOrder.currency,
            customer_name,
            customer_email,
            customer_phone
        })
    } catch (err: any) {
        console.error('Purchase order error:', err)
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}
