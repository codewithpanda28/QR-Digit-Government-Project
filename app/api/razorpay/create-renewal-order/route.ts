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

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { qr_id, days, customer_name, customer_email, customer_phone, custom_amount } = body

        if (!qr_id || !days || !customer_name || !customer_phone) {
            return NextResponse.json(
                { error: 'Important details are missing (QR ID, Days, Name or Phone)' },
                { status: 400 }
            )
        }

        let amount = custom_amount;
        if (!amount) {
             const basePrice = 299;
             const isCustom = days % 365 === 0 && days / 365 > 1; // Basic logic to re-calculate if not provided
             // If custom_amount isn't passed we assume flat 299 yearly
             amount = Math.floor(days / 365 || 1) * basePrice; 
        }

        const orderId = `QR_RNW_${Date.now()}`

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
                qr_id,
                days,
                customer_name,
                customer_email,
                customer_phone
            }
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Save order to Supabase
        const { error: dbError } = await supabaseAdmin.from('qr_renewal_orders').insert({
            order_id: orderId,
            qr_id,
            days_extended: days,
            amount: amount,
            status: 'PENDING',
            customer_name,
            customer_email,
            customer_phone,
            cashfree_order_id: razorpayOrder.id, // using same column name to avoid schema change
            payment_session_id: razorpayOrder.id
        })

        if (dbError) {
            console.error('Supabase Error on renewal record:', dbError)
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
        console.error('Renewal order creation error:', err)
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}
