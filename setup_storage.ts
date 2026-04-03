import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function setup() {
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

    const buckets = ['emergency-evidence', 'safety-assets']

    console.log('--- Storage Setup ---')

    for (const bucketName of buckets) {
        console.log(`Checking bucket: ${bucketName}...`)
        const { data, error } = await supabase.storage.getBucket(bucketName)

        if (error && error.message.includes('not found')) {
            console.log(`Creating bucket: ${bucketName}...`)
            const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
                public: true
            })
            if (createError) {
                console.error(`❌ Failed to create ${bucketName}:`, createError.message)
                console.log(`👉 Please create "${bucketName}" manually in Supabase Dashboard with PUBLIC access.`)
            } else {
                console.log(`✅ Successfully created ${bucketName}`)
            }
        } else if (error) {
            console.error(`❌ Error checking ${bucketName}:`, error.message)
        } else {
            console.log(`✅ Bucket ${bucketName} already exists.`)
        }
    }
}

setup()
