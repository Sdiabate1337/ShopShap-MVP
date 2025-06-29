require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// ⚠️ Mets ta clé service_role ici juste pour ce test !
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkenVveWZwdW1pZ3R4Y3dxdW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODk2NTAsImV4cCI6MjA2NjM2NTY1MH0.EFb_8pchcWddRRzy3V9hG7PhMgHXHRpHpBVDut0AAzc';
const supabase = createClient(supabaseUrl, supabaseServiceKey);
async function listFiles() {
  const { data, error } = await supabase
    .storage
    .from('shop-photos')
    .list('products');
  console.log(data, error);
}
listFiles();