import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function check() {
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!)
    console.log('--- System Health Check ---')

    // Check DB
    const { count, error: dbError } = await supabase.from('qr_codes').select('*', { count: 'exact', head: true })
    if (dbError) console.error('❌ DB Error:', dbError)
    else console.log('✅ DB Connection OK. Total QRs:', count)

    // Check Buckets
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets()
    if (storageError) {
        console.error('❌ Storage Error:', storageError.message || storageError)
    } else {
        if (!buckets || buckets.length === 0) {
            console.log('📦 Available Buckets: NONE (Zero buckets found on this project)')
        } else {
            console.log('📦 Available Buckets Found:')
            buckets.forEach(b => console.log(`   - ID: "${b.id}" (Name: ${b.name}, Public: ${b.public})`))
        }

        const hasEmergency = buckets?.some(b => b.id === 'emergency-evidence')
        const hasAssets = buckets?.some(b => b.id === 'safety-assets')

        if (hasEmergency) console.log('✅ "emergency-evidence" bucket exists.')
        else console.log('⚠️ "emergency-evidence" bucket MISSING.')

        if (hasAssets) console.log('✅ "safety-assets" bucket exists.')
        else console.log('⚠️ "safety-assets" bucket MISSING.')
    }
}
check()
