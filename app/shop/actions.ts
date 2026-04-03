'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || 'placeholder', {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

export async function publicInstantGenerate(categoryName: string) {
    try {
        if (!supabaseServiceKey) throw new Error('Service configuration error')

        // 1. Generate unique random ID
        const randomId = Math.random().toString(36).substring(2, 8).toUpperCase()
        const qrNumber = `shop-product/${randomId}`
        
        // 2. Fetch latest sequence
        const { data: latest } = await supabaseAdmin
            .from('qr_codes')
            .select('sequence_number')
            .order('sequence_number', { ascending: false })
            .limit(1)
            .maybeSingle()
        
        const nextSequence = (latest?.sequence_number || 0) + 1
        const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://thinkaiq.com').replace(/\/$/, '')
        
        // 3. Create real DB record
        const { data, error } = await supabaseAdmin
            .from('qr_codes')
            .insert({
                qr_number: qrNumber,
                category: 
                    categoryName.toLowerCase().includes('child') || categoryName.toLowerCase().includes('recovery') ? 'child-safety' : 
                    categoryName.toLowerCase().includes('vehicle') || categoryName.toLowerCase().includes('parking') || categoryName.toLowerCase().includes('transport') ? 'vehicle-safety' : 
                    categoryName.toLowerCase().includes('women') || categoryName.toLowerCase().includes('security') ? 'women-safety' : 
                    categoryName.toLowerCase().includes('senior') || categoryName.toLowerCase().includes('elder') || categoryName.toLowerCase().includes('medical') ? 'elderly-safety' : 
                    categoryName.toLowerCase().includes('school') || categoryName.toLowerCase().includes('student') || categoryName.toLowerCase().includes('campus') ? 'school-safety' : 'child-safety',
                status: 'generated',
                sequence_number: nextSequence,
                full_url: `${baseUrl}/shop-product/${randomId}`,
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) throw error

        return { success: true, data }
    } catch (error: any) {
        console.error('Instant Generate Error:', error)
        return { success: false, error: error.message }
    }
}
