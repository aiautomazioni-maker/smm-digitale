import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { normalizePostPayload, PostInput } from '@/lib/post-normalizer';

export async function POST(req: Request) {
    try {
        const body: PostInput = await req.json();

        // 1. Normalize Payload
        const normalized = normalizePostPayload(body);

        // Log warnings but proceed
        if (normalized.warnings.length > 0) {
            console.warn("Publish Warnings:", normalized.warnings);
        }

        const { platform, workspace_id, post, schedule } = body;
        const payload = normalized.publish_payload;

        if (!payload.media_urls.length || !payload.platform) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // For this prototype, we'll use env vars or hardcode the n8n token if provided.
        // Ideally, this comes from the database (social_connections table).
        const FB_PAGE_ID = process.env.FB_PAGE_ID || "949712101556534";
        const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN; // User needs to provide this in .env.local

        if (!FB_ACCESS_TOKEN) {
            // Return the normalized payload to confirm it worked
            return NextResponse.json({
                simulated: true,
                message: "No FB Token provided. Simulation mode.",
                normalized_payload: payload,
                warnings: normalized.warnings
            });
        }

        if (platform === 'facebook' || platform === 'instagram') {
            const contentType = payload.content_type || 'post';
            console.log(`[PUBLISH] Format: ${contentType}, Platform: ${platform}`);

            // CASE 1: CAROUSEL (Multi-Photo)
            if (contentType === 'carousel' && payload.media_urls.length > 1) {
                console.log("[PUBLISH] Handling Carousel/Multi-photo upload...");
                const mediaIds: string[] = [];

                // Step 1: Upload each photo as unpublished
                for (const url of payload.media_urls) {
                    const uploadFormData = new FormData();
                    uploadFormData.append('access_token', FB_ACCESS_TOKEN);
                    uploadFormData.append('published', 'false');

                    try {
                        const imageRes = await fetch(url);
                        if (!imageRes.ok) throw new Error(`Fetch failed for ${url}`);
                        const blob = await imageRes.blob();
                        uploadFormData.append('source', blob, 'image.jpg');

                        const uploadRes = await fetch(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/photos`, {
                            method: 'POST',
                            body: uploadFormData
                        });
                        const uploadData = await uploadRes.json();
                        if (uploadData.id) {
                            mediaIds.push(uploadData.id);
                        } else {
                            console.error("[PUBLISH] Carousel partial upload fail:", uploadData.error);
                        }
                    } catch (err) {
                        console.error("[PUBLISH] Carousel media fetch/upload error:", err);
                    }
                }

                if (mediaIds.length === 0) {
                    return NextResponse.json({ error: "Failed to upload any media for carousel" }, { status: 400 });
                }

                // Step 2: Create the feed post with attached_media
                const feedFormData = new FormData();
                feedFormData.append('access_token', FB_ACCESS_TOKEN);
                feedFormData.append('message', payload.caption_final);

                mediaIds.forEach((id, index) => {
                    feedFormData.append(`attached_media[${index}]`, JSON.stringify({ media_fbid: id }));
                });

                const res = await fetch(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/feed`, {
                    method: 'POST',
                    body: feedFormData
                });
                const data = await res.json();

                if (data.error) {
                    console.error("FB Carousel Error:", data.error);
                    return NextResponse.json({ error: data.error.message }, { status: 400 });
                }
                return NextResponse.json({ success: true, postId: data.id, normalized_payload: payload });
            }

            // CASE 2: STORY (Correct Meta 2-step flow for Photo, or Video flow)
            if (contentType === 'story') {
                const storyUrl = payload.media_urls[0];
                const caption = payload.caption_final?.trim();
                const audioUrl = payload.audio_url;

                // --- VIDEO STORY PATH ---
                if (audioUrl) {
                    console.log("[PUBLISH] Handling Video Story upload (Music + Text)...");
                    let videoBuffer;
                    try {
                        const imgRes = await fetch(storyUrl);
                        if (!imgRes.ok) throw new Error(`Fetch failed for story media: ${storyUrl}`);
                        let imageBuffer = Buffer.from(await imgRes.arrayBuffer());

                        // 1. Burn text on image first
                        if (caption) {
                            console.log("[PUBLISH] Burning text onto Story image...");
                            const { burnTextOnImage } = require('@/lib/media-processor');
                            imageBuffer = await burnTextOnImage(imageBuffer, caption);
                        }

                        // 2. Generate Video with audio
                        console.log("[PUBLISH] Generating MP4 with FFmpeg...");
                        const { generateVideoStory } = require('@/lib/media-processor');
                        videoBuffer = await generateVideoStory(imageBuffer, audioUrl);

                    } catch (e: any) {
                        console.error("[PUBLISH] Video Story generation error:", e);
                        return NextResponse.json({ error: `Video Story generation failed: ${e.message}` }, { status: 500 });
                    }

                    // 3. Upload Video using Resumable Upload Protocol (required by /video_stories)
                    console.log("[PUBLISH] Starting Video Story Resumable Upload to Meta...");
                    const fileSize = videoBuffer.length;

                    // Step A: Start
                    const startForm = new FormData();
                    startForm.append('access_token', FB_ACCESS_TOKEN);
                    startForm.append('upload_phase', 'start');
                    startForm.append('file_size', fileSize.toString());

                    const startRes = await fetch(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/video_stories`, {
                        method: 'POST',
                        body: startForm
                    });
                    const startData = await startRes.json();

                    console.log("START DATA:", startData);

                    if (startData.error || !startData.video_id) {
                        throw new Error(`Start phase failed: ${startData.error?.message}`);
                    }

                    const videoId = startData.video_id;
                    const uploadUrl = startData.upload_url;


                    // Step B: Upload file to rupload.facebook.com
                    console.log(`[PUBLISH] Transferring video to rupload (size: ${fileSize})...`);
                    const uploadHeaders = {
                        'Authorization': `OAuth ${FB_ACCESS_TOKEN}`,
                        'offset': '0',
                        'file_size': fileSize.toString()
                    };

                    const transferRes = await fetch(uploadUrl, {
                        method: 'POST',
                        headers: uploadHeaders,
                        body: videoBuffer
                    });

                    const transferText = await transferRes.text();

                    if (!transferRes.ok) {
                        throw new Error(`Upload phase failed: ${transferText}`);
                    }

                    // Step C: Finish
                    console.log(`[PUBLISH] Finishing Video Story...`);
                    const finishForm = new FormData();
                    finishForm.append('access_token', FB_ACCESS_TOKEN);
                    finishForm.append('upload_phase', 'finish');
                    finishForm.append('video_id', videoId);

                    const finishRes = await fetch(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/video_stories`, {
                        method: 'POST',
                        body: finishForm
                    });
                    const finishData = await finishRes.json();

                    // Note: If finish fails because it's already "complete", we can ignore the error
                    if (finishData.error && finishData.error.code !== 100) {
                        // 100 usually means "already finished" or similar if rupload auto-finished
                        throw new Error(`Finish phase failed: ${finishData.error?.message}`);
                    }

                    console.log("[PUBLISH] Video Story published successfully!");
                    return NextResponse.json({ success: true, storyId: videoId, normalized_payload: payload });

                }

                // --- PHOTO STORY PATH ---
                console.log("[PUBLISH] Handling True Story upload...");

                // Ensure to add this import at the top of the file:
                // import { burnTextOnImage, generateVideoStory } from '@/lib/media-processor';

                // Step 1: Upload photo as unpublished
                const uploadFormData = new FormData();
                uploadFormData.append('access_token', FB_ACCESS_TOKEN);
                uploadFormData.append('published', 'false');

                try {
                    const imgRes = await fetch(storyUrl);
                    if (!imgRes.ok) throw new Error(`Fetch failed for story media: ${storyUrl}`);

                    let imageBuffer = Buffer.from(await imgRes.arrayBuffer());

                    // Burn text into the image if caption exists
                    const caption = payload.caption_final?.trim();
                    if (caption) {
                        console.log("[PUBLISH] Burning text onto Story image...");
                        // Use dynamic import to avoid breaking Edge runtime if this runs on Edge (though Next.js API routes are Node.js by default unless specified)
                        const { burnTextOnImage } = require('@/lib/media-processor');
                        imageBuffer = await burnTextOnImage(imageBuffer, caption);
                    }

                    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
                    uploadFormData.append('source', blob, 'story.jpg');
                } catch (e: any) {
                    console.error("[PUBLISH] Story media fetch/process error:", e);
                    uploadFormData.append('url', storyUrl);
                }

                console.log("[PUBLISH] Step 1: Uploading unpublished photo for Story...");
                const uploadRes = await fetch(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/photos`, {
                    method: 'POST',
                    body: uploadFormData
                });
                const uploadData = await uploadRes.json();

                if (uploadData.error || !uploadData.id) {
                    console.error("FB Story Step 1 Error:", uploadData.error);
                    return NextResponse.json({ error: `Story upload failed (Step 1): ${uploadData.error?.message || 'Unknown error'}` }, { status: 400 });
                }

                const photoId = uploadData.id;
                console.log("[PUBLISH] Step 2: Publishing photo_id to /photo_stories:", photoId);

                // Step 2: Publish photo_id to photo_stories
                const storyPublishRes = await fetch(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/photo_stories?photo_id=${photoId}&access_token=${FB_ACCESS_TOKEN}`, {
                    method: 'POST'
                });
                const storyData = await storyPublishRes.json();

                if (storyData.error) {
                    console.error("FB Story Step 2 Error:", storyData.error);

                    // Fallback attempt: some pages use a different structure or permissions might block photo_stories
                    // but the user specifically asked for STORIES, so we should fail if we can't do it right
                    // or explain why.
                    return NextResponse.json({ error: `Story publishing failed (Step 2): ${storyData.error.message}` }, { status: 400 });
                }

                return NextResponse.json({ success: true, storyId: storyData.id, normalized_payload: payload });
            }

            // CASE 3: STANDARD POST (Existing logic)
            const mediaUrl = payload.media_urls[0];
            const formData = new FormData();
            formData.append('access_token', FB_ACCESS_TOKEN);
            formData.append('caption', payload.caption_final);

            if (mediaUrl) {
                try {
                    const imageRes = await fetch(mediaUrl);
                    const blob = await imageRes.blob();
                    formData.append('source', blob, 'image.jpg');
                } catch (e) {
                    formData.append('url', mediaUrl);
                }
            }

            const res = await fetch(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/photos`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.error) {
                console.error("FB Standard Error:", data.error);
                return NextResponse.json({ error: data.error.message }, { status: 400 });
            }

            return NextResponse.json({ success: true, postId: data.id, normalized_payload: payload });
        }

        if (platform === 'tiktok') {
            const cookieStore = await cookies();
            const TIKTOK_ACCESS_TOKEN = cookieStore.get('tiktok_access_token')?.value || process.env.TIKTOK_ACCESS_TOKEN;
            if (!TIKTOK_ACCESS_TOKEN) {
                return NextResponse.json({
                    simulated: true,
                    message: "No TikTok Token provided. Simulation mode.",
                    normalized_payload: payload,
                    warnings: [...normalized.warnings, "Missing TIKTOK_ACCESS_TOKEN"]
                });
            }

            console.log(`[PUBLISH] Format: ${payload.content_type}, Platform: tiktok`);

            // TikTok Direct Post (Video)
            // For this prototype we prefer PULL_FROM_URL as it's cleaner for server-to-server with cloud images/videos
            const videoUrl = payload.media_urls[0];

            try {
                const ttRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${TIKTOK_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        post_info: {
                            title: payload.caption_final.substring(0, 2200), // TikTok title/caption limit
                            video_url: videoUrl
                        },
                        source_type: 'PULL_FROM_URL'
                    })
                });

                const ttData = await ttRes.json();

                if (ttData.error) {
                    console.error("TikTok Publish Error:", ttData.error);
                    return NextResponse.json({ error: ttData.error.message || "TikTok API Error" }, { status: 400 });
                }

                return NextResponse.json({
                    success: true,
                    publishId: ttData.data?.publish_id,
                    normalized_payload: payload
                });

            } catch (err: any) {
                console.error("TikTok Publish Exception:", err);
                return NextResponse.json({ error: `TikTok Request Failed: ${err.message}` }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Platform not supported yet' }, { status: 400 });

    } catch (error) {
        console.error('Error publishing:', error);
        return NextResponse.json({ error: 'Failed to publish' }, { status: 500 });
    }
}
