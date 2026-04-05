import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, category, product } = body

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return NextResponse.json({ error: 'Missing payment signature details' }, { status: 400 });
        }

        const secret = process.env.RAZORPAY_SECRET_KEY || '';
        const generated_signature = crypto.createHmac('sha256', secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            await supabaseAdmin.from('qr_purchase_orders').update({ status: 'FAILED' }).eq('cashfree_order_id', razorpay_order_id)
            return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
        }

        // Signature is valid -> Generate QR
        const { data: latest } = await supabaseAdmin
            .from('qr_codes')
            .select('sequence_number')
            .order('sequence_number', { ascending: false })
            .limit(1)
            .maybeSingle()
        
        const nextSequence = (latest?.sequence_number || 0) + 1
        const randomId = Math.random().toString(36).substring(2, 8).toUpperCase()
        const qrNumber = `shop-product/${randomId}`
        const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.qrdigit.com').replace(/\/$/, '')
        
        let mappedCategory = 'child-safety';
        if (category) {
            const lowerCat = category.toLowerCase();
            if (lowerCat.includes('child')) mappedCategory = 'child-safety';
            else if (lowerCat.includes('vehicle')) mappedCategory = 'vehicle-safety';
            else if (lowerCat.includes('women')) mappedCategory = 'women-safety';
            else if (lowerCat.includes('medical') || lowerCat.includes('elder')) mappedCategory = 'elderly-safety';
            else if (lowerCat.includes('school') || lowerCat.includes('student')) mappedCategory = 'school-safety';
        }

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
            console.error('QR creation error inside razorpay webhook:', qrError);
            throw new Error(qrError.message);
        }

        await supabaseAdmin
            .from('qr_purchase_orders')
            .update({
                status: 'SUCCESS',
                paid_at: new Date().toISOString(),
                qr_id: qr.id
            })
            .eq('cashfree_order_id', razorpay_order_id);

        return NextResponse.json({
            success: true,
            qr_number: qr.qr_number,
            qr_url: qr.full_url
        });
    } catch (err: any) {
        console.error('Verify purchase error:', err)
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
}
