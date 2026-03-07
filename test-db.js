const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTikTokPublish() {
  console.log("Fetching profiles from Supabase...");
  // I need to see the column names in profiles
  const { data: cols, error: colError } = await supabase.rpc('get_table_columns_by_name', { table_name: 'profiles' }).select().limit(1).catch(() => ({}));
  
  const { data: profiles, error } = await supabase.from('profiles').select().limit(5);
  console.log("Sample Profile keys:", profiles && profiles.length > 0 ? Object.keys(profiles[0]) : "No profiles", error);

  // If there's no tiktok_access_token in profiles, we might need to check how it's stored.
}

testTikTokPublish();
