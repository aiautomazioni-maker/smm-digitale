const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTikTokPublish() {
  console.log("Fetching token from Supabase...");
  const { data: profiles, error } = await supabase.from('profiles').select('tiktok_access_token').not('tiktok_access_token', 'is', null).limit(1);
  
  if (error || !profiles || profiles.length === 0) {
      console.error("No TikTok token found in db", error);
      return;
  }
  
  const TIKTOK_ACCESS_TOKEN = profiles[0].tiktok_access_token;
  console.log("Found TikTok Token:", TIKTOK_ACCESS_TOKEN.substring(0, 10) + "...");

  const videoPath = '/Users/gillesvalenti/Desktop/ScreenRecording_02-27-2026 23-21-35_1.MP4';
  const videoSize = fs.statSync(videoPath).size;
  console.log(`Video size: ${videoSize} bytes`);

  const payload = {
      post_info: {
          title: "Test Video from SMM Digitale",
          privacy_level: "MUTUAL_FOLLOW_FRIENDS"
      },
      source_info: {
          source: "FILE_UPLOAD",
          video_size: videoSize,
          chunk_size: videoSize,
          total_chunk_count: 1
      }
  };

  console.log("Sending payload:", JSON.stringify(payload, null, 2));

  const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
          'Authorization': `Bearer ${TIKTOK_ACCESS_TOKEN}`,
          'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify(payload)
  });

  const initData = await initRes.json();
  console.log("TikTok Init Response:");
  console.log(JSON.stringify(initData, null, 2));
}

testTikTokPublish();
