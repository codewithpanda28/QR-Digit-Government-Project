const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('Attemping to update qr_purchase_orders status constraint...');
    const q = `
        ALTER TABLE public.qr_purchase_orders 
        DROP CONSTRAINT IF EXISTS qr_purchase_orders_status_check;
        
        ALTER TABLE public.qr_purchase_orders 
        ADD CONSTRAINT qr_purchase_orders_status_check 
        CHECK (status IN ('PENDING', 'PAID', 'SUCCESS', 'FAILED', 'USER_DROPPED', 'PROCESSING', 'SHIPPED', 'DELIVERED'));
    `;
    const { data, error } = await supabase.rpc('query', { query_text: q });
    if (error) {
        console.error('SQL Error:', error);
    } else {
        console.log('Successfully updated constraints.');
    }
}
run();
