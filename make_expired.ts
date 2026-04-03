import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Fetch at least one QR code to make it expired
  const { data: qrs, error: fetchError } = await supabase
    .from('qr_codes')
    .select('id, qr_number, subscription_end')
    .limit(1);

  if (fetchError || !qrs || qrs.length === 0) {
    console.error('No QR codes found or error:', fetchError);
    return;
  }

  const qrToUpdate = qrs[0];

  // Set expiry to 2 days ago
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 2);

  const { error } = await supabase
    .from('qr_codes')
    .update({ subscription_end: yesterday.toISOString() })
    .eq('id', qrToUpdate.id);

  if (error) {
    console.error('Error updating:', error.message);
  } else {
    console.log(`\n================================`);
    console.log(`✅ SUCCESS! Made QR code EXPIRED`);
    console.log(`================================`);
    console.log(`QR ID: ${qrToUpdate.id}`);
    console.log(`QR Number: ${qrToUpdate.qr_number}`);
    console.log(`Old Expiry: ${qrToUpdate.subscription_end || 'Permanent'}`);
    console.log(`New Expiry: ${yesterday.toISOString()} (Expired)\n`);
    console.log(`Now go to the Expiry page on the Admin Dashboard and you will see it under "Expired".`);
  }
}

main();
