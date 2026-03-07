const fs = require('fs');

const path = './src/app/api/agent/publish/route.ts';
let content = fs.readFileSync(path, 'utf8');

const startIdx = content.indexOf('            // CASE 2: STORY (Correct Meta 2-step flow for Photo, or Video flow)');
const endIdx = content.indexOf('            // CASE 3: STANDARD POST (Existing logic)');

if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
    console.error("Could not find start or end markers.");
    process.exit(1);
}

const before = content.substring(0, startIdx);
const after = content.substring(endIdx);

const newLogic = `            // CASE 2: STORY (Correct Meta 2-step flow for Photo, or Video flow)
            if (contentType === 'story') {
                const storyUrl = payload.media_urls[0];
                const caption = payload.caption_final?.trim();
                const audioUrl = payload.audio_url;

                console.log("[PUBLISH] Handling Story upload (Photo or Video)...");

                let mediaBuffer: Buffer;
                let isVideo = false;

                try {
                    const mediaRes = await fetch(storyUrl);
                    if (!mediaRes.ok) throw new Error(\`Fetch failed for story media: \${storyUrl}\`);
                    mediaBuffer = Buffer.from(await mediaRes.arrayBuffer());

                    // If audioUrl exists, it means we want a Video Story generated
                    if (audioUrl) {
                        isVideo = true;
                        if (caption) {
                            console.log("[PUBLISH] Burning text onto base image...");
                            const { burnTextOnImage } = require('@/lib/media-processor');
                            mediaBuffer = await burnTextOnImage(mediaBuffer, caption);
                        }
                        console.log("[PUBLISH] Generating MP4 with FFmpeg...");
                        const { generateVideoStory } = require('@/lib/media-processor');
                        mediaBuffer = await generateVideoStory(mediaBuffer, audioUrl);
                    } else if (caption) {
                        // Just an image but we want to burn text
                        console.log("[PUBLISH] Burning text onto Story image...");
                        const { burnTextOnImage } = require('@/lib/media-processor');
                        mediaBuffer = await burnTextOnImage(mediaBuffer, caption);
                    }
                } catch (e: any) {
                    console.error("[PUBLISH] Story media generation error:", e);
                    return NextResponse.json({ error: \`Story generation failed: \${e.message}\` }, { status: 500 });
                }

                if (platform === 'instagram') {
                    const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;
                    if (!INSTAGRAM_ACCOUNT_ID) {
                        return NextResponse.json({ error: "Missing INSTAGRAM_ACCOUNT_ID in env" }, { status: 500 });
                    }

                    console.log("[PUBLISH] Uploading generated Story media to Supabase for public URL...");
                    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
                    const fileName = \`temp-story-\${Date.now()}.\${isVideo ? 'mp4' : 'jpg'}\`;
                    
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('video-uploads')
                        .upload(fileName, mediaBuffer, { contentType: isVideo ? 'video/mp4' : 'image/jpeg' });

                    if (uploadError) {
                        return NextResponse.json({ error: \`Supabase Upload Error: \${uploadError.message}\` }, { status: 500 });
                    }

                    const { data: { publicUrl } } = supabase.storage.from('video-uploads').getPublicUrl(fileName);

                    console.log("[PUBLISH] Creating IG Story Container...");
                    const containerRes = await fetch(\`https://graph.facebook.com/v19.0/\${INSTAGRAM_ACCOUNT_ID}/media\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            [isVideo ? 'video_url' : 'image_url']: publicUrl,
                            media_type: 'STORIES',
                            access_token: FB_ACCESS_TOKEN
                        })
                    });
                    const containerData = await containerRes.json();

                    if (containerData.error || !containerData.id) {
                        console.error("IG Story Container Error:", containerData.error);
                        return NextResponse.json({ error: containerData.error?.message || "Failed to create IG story container" }, { status: 400 });
                    }

                    console.log(\`[PUBLISH] Publishing IG Story Container (\${containerData.id})...\`);
                    let publishRes = await fetch(\`https://graph.facebook.com/v19.0/\${INSTAGRAM_ACCOUNT_ID}/media_publish\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ creation_id: containerData.id, access_token: FB_ACCESS_TOKEN })
                    });
                    let publishData = await publishRes.json();

                    // If it's a video, Facebook needs time to process it before publishing.
                    // We try a few times before giving up.
                    if (isVideo && publishData.error && publishData.error.code === 9007) {
                        console.log("IG Story video still processing, waiting and retrying...");
                        for(let i = 0; i < 3; i++) {
                            await new Promise(resolve => setTimeout(resolve, 5000));
                            publishRes = await fetch(\`https://graph.facebook.com/v19.0/\${INSTAGRAM_ACCOUNT_ID}/media_publish\`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ creation_id: containerData.id, access_token: FB_ACCESS_TOKEN })
                            });
                            publishData = await publishRes.json();
                            if (!publishData.error) break;
                        }
                    }

                    if (publishData.error) {
                        console.error("IG Story Publish Error:", publishData.error);
                        return NextResponse.json({ error: publishData.error.message }, { status: 400 });
                    }

                    // Clean up temp file
                    await supabase.storage.from('video-uploads').remove([fileName]);

                    return NextResponse.json({ success: true, storyId: publishData.id, normalized_payload: payload });
                } else {
                    // FACEBOOK STORY FLOW
                    if (isVideo) {
                        const fileSize = mediaBuffer.length;
                        const startForm = new FormData();
                        startForm.append('access_token', FB_ACCESS_TOKEN);
                        startForm.append('upload_phase', 'start');
                        startForm.append('file_size', fileSize.toString());

                        const startRes = await fetch(\`https://graph.facebook.com/v19.0/\${FB_PAGE_ID}/video_stories\`, { method: 'POST', body: startForm });
                        const startData = await startRes.json();

                        if (startData.error || !startData.video_id) {
                            throw new Error(\`Start phase failed: \${startData.error?.message}\`);
                        }

                        const uploadHeaders = { 'Authorization': \`OAuth \${FB_ACCESS_TOKEN}\`, 'offset': '0', 'file_size': fileSize.toString() };
                        const transferRes = await fetch(startData.upload_url, { method: 'POST', headers: uploadHeaders, body: mediaBuffer });
                        if (!transferRes.ok) throw new Error(\`Upload phase failed: \${await transferRes.text()}\`);

                        const finishForm = new FormData();
                        finishForm.append('access_token', FB_ACCESS_TOKEN);
                        finishForm.append('upload_phase', 'finish');
                        finishForm.append('video_id', startData.video_id);

                        const finishRes = await fetch(\`https://graph.facebook.com/v19.0/\${FB_PAGE_ID}/video_stories\`, { method: 'POST', body: finishForm });
                        const finishData = await finishRes.json();
                        if (finishData.error && finishData.error.code !== 100) {
                            throw new Error(\`Finish phase failed: \${finishData.error?.message}\`);
                        }
                        return NextResponse.json({ success: true, storyId: startData.video_id, normalized_payload: payload });
                    } else {
                        // PHOTO STORY
                        const uploadFormData = new FormData();
                        uploadFormData.append('access_token', FB_ACCESS_TOKEN);
                        uploadFormData.append('published', 'false');
                        const blob = new Blob([mediaBuffer], { type: 'image/jpeg' });
                        uploadFormData.append('source', blob, 'story.jpg');

                        const uploadRes = await fetch(\`https://graph.facebook.com/v19.0/\${FB_PAGE_ID}/photos\`, { method: 'POST', body: uploadFormData });
                        const uploadData = await uploadRes.json();

                        if (uploadData.error || !uploadData.id) {
                            return NextResponse.json({ error: \`Story upload failed: \${uploadData.error?.message}\` }, { status: 400 });
                        }

                        const storyPublishRes = await fetch(\`https://graph.facebook.com/v19.0/\${FB_PAGE_ID}/photo_stories?photo_id=\${uploadData.id}&access_token=\${FB_ACCESS_TOKEN}\`, { method: 'POST' });
                        const storyData = await storyPublishRes.json();

                        if (storyData.error) {
                            return NextResponse.json({ error: \`Story publishing failed: \${storyData.error.message}\` }, { status: 400 });
                        }
                        return NextResponse.json({ success: true, storyId: storyData.id, normalized_payload: payload });
                    }
                }
            }

`;

fs.writeFileSync(path, before + newLogic + after);
console.log("Updated publish/route.ts");
