require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase.storage.createBucket('video-uploads', {
    public: true,
    fileSizeLimit: 104857600, // 100MB
    allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/x-m4v', 'video/*']
  });
  
  if (error) {
    if (error.message.includes('already exists')) {
        console.log("Bucket already exists. Updating it to be public...");
        await supabase.storage.updateBucket('video-uploads', { public: true });
        console.log("Bucket updated to public.");
    } else {
        console.error("Error creating bucket:", error);
    }
  } else {
    console.log("Bucket created successfully:", data);
  }
}

main();
