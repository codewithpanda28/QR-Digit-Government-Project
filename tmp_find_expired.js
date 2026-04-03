const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findExpired() {
    const { data, error } = await supabase
        .from('qr_codes')
        .select('id, qr_number, status, subscription_end')
        .or('status.eq.expired,subscription_end.lt.now()')
        .limit(5);

    if (error) {
        console.error(error);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

findExpired();
