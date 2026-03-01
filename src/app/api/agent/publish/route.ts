import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { normalizePostPayload, PostInput } from '@/lib/post-normalizer';
import { createClient } from '@supabase/supabase-js';

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
                console.log(`[PUBLISH] Handling Carousel/Multi-photo upload for ${platform}...`);
                const mediaIds: string[] = [];

                if (platform === 'instagram') {
                    const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;
                    if (!INSTAGRAM_ACCOUNT_ID) {
                        return NextResponse.json({ error: "Missing INSTAGRAM_ACCOUNT_ID in env" }, { status: 500 });
                    }

                    // Step 1: Create carousel items
                    for (const url of payload.media_urls) {
                        try {
                            const itemRes = await fetch(`https://graph.facebook.com/v19.0/${INSTAGRAM_ACCOUNT_ID}/media`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    image_url: url,
                                    is_carousel_item: true,
                                    access_token: FB_ACCESS_TOKEN
                                })
                            });
                            const itemData = await itemRes.json();
                            if (itemData.id) {
                                mediaIds.push(itemData.id);
                            } else {
                                console.error("[PUBLISH] Instagram Carousel item error:", itemData.error);
                            }
                        } catch (err) {
                            console.error("[PUBLISH] Instagram Carousel item fetch error:", err);
                        }
                    }

                    if (mediaIds.length === 0) {
                        return NextResponse.json({ error: "Failed to upload any media for Instagram carousel" }, { status: 400 });
                    }

                    // Step 2: Create Carousel Container
                    const containerRes = await fetch(`https://graph.facebook.com/v19.0/${INSTAGRAM_ACCOUNT_ID}/media`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            media_type: 'CAROUSEL',
                            children: mediaIds,
                            caption: payload.caption_final,
                            access_token: FB_ACCESS_TOKEN
                        })
                    });
                    const containerData = await containerRes.json();

                    if (containerData.error || !containerData.id) {
                        console.error("IG Carousel Container Error:", containerData.error);
                        return NextResponse.json({ error: containerData.error?.message || "Failed to create container" }, { status: 400 });
                    }

                    // Step 3: Publish Container
                    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${INSTAGRAM_ACCOUNT_ID}/media_publish`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            creation_id: containerData.id,
                            access_token: FB_ACCESS_TOKEN
                        })
                    });
                    const publishData = await publishRes.json();
                    if (publishData.error) {
                        console.error("IG Carousel Publish Error:", publishData.error);
                        return NextResponse.json({ error: publishData.error.message }, { status: 400 });
                    }

                    return NextResponse.json({ success: true, postId: publishData.id, normalized_payload: payload });

                } else {
                // FACEBOOK FLOW
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
                        return NextResponse.json({ error: "Failed to upload any media for FB carousel" }, { status: 400 });
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
            }

            // CASE 2: STORY (Correct Meta 2-step flow for Photo, or Video flow)
            if (contentType === 'story') {
                const storyUrl = payload.media_urls[0];
                const caption = payload.caption_final?.trim();
                const audioUrl = payload.audio_url;

                console.log("[PUBLISH] Handling Story upload (Photo or Video)...");

                let mediaBuffer: Buffer;
                let isVideo = false;

                try {
                    const mediaRes = await fetch(storyUrl);
                    if (!mediaRes.ok) throw new Error(`Fetch failed for story media: ${storyUrl}`);
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
                    return NextResponse.json({ error: `Story generation failed: ${e.message}` }, { status: 500 });
                }

                if (platform === 'instagram') {
                    const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;
                    if (!INSTAGRAM_ACCOUNT_ID) {
                        return NextResponse.json({ error: "Missing INSTAGRAM_ACCOUNT_ID in env" }, { status: 500 });
                    }

                    console.log("[PUBLISH] Uploading generated Story media to Supabase for public URL...");
                    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
                    const fileName = `temp-story-${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('video-uploads')
                        .upload(fileName, mediaBuffer, { contentType: isVideo ? 'video/mp4' : 'image/jpeg' });

                    if (uploadError) {
                        return NextResponse.json({ error: `Supabase Upload Error: ${uploadError.message}` }, { status: 500 });
                    }

                    const { data: { publicUrl } } = supabase.storage.from('video-uploads').getPublicUrl(fileName);

                    console.log("[PUBLISH] Creating IG Story Container...");
                    const containerRes = await fetch(`https://graph.facebook.com/v19.0/${INSTAGRAM_ACCOUNT_ID}/media`, {
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

                    console.log(`[PUBLISH] Publishing IG Story Container (${containerData.id})...`);
                    let publishRes = await fetch(`https://graph.facebook.com/v19.0/${INSTAGRAM_ACCOUNT_ID}/media_publish`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ creation_id: containerData.id, access_token: FB_ACCESS_TOKEN })
                    });
                    let publishData = await publishRes.json();

                    // If it's a video, Facebook needs time to process it before publishing.
                    // We try a few times before giving up.
                    if (isVideo && publishData.error && publishData.error.code === 9007) {
                        console.log("IG Story video still processing, waiting and retrying...");
                        for (let i = 0; i < 3; i++) {
                            await new Promise(resolve => setTimeout(resolve, 5000));
                            publishRes = await fetch(`https://graph.facebook.com/v19.0/${INSTAGRAM_ACCOUNT_ID}/media_publish`, {
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

                        const startRes = await fetch(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/video_stories`, { method: 'POST', body: startForm });
                        const startData = await startRes.json();

                        if (startData.error || !startData.video_id) {
                            throw new Error(`Start phase failed: ${startData.error?.message}`);
                        }

                        const uploadHeaders = { 'Authorization': `OAuth ${FB_ACCESS_TOKEN}`, 'offset': '0', 'file_size': fileSize.toString() };
                        const transferRes = await fetch(startData.upload_url, { method: 'POST', headers: uploadHeaders, body: mediaBuffer as any });
                        if (!transferRes.ok) throw new Error(`Upload phase failed: ${await transferRes.text()}`);

                        const finishForm = new FormData();
                        finishForm.append('access_token', FB_ACCESS_TOKEN);
                        finishForm.append('upload_phase', 'finish');
                        finishForm.append('video_id', startData.video_id);

                        const finishRes = await fetch(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/video_stories`, { method: 'POST', body: finishForm });
                        const finishData = await finishRes.json();
                        if (finishData.error && finishData.error.code !== 100) {
                            throw new Error(`Finish phase failed: ${finishData.error?.message}`);
                        }
                        return NextResponse.json({ success: true, storyId: startData.video_id, normalized_payload: payload });
                    } else {
                        // PHOTO STORY
                        const uploadFormData = new FormData();
                        uploadFormData.append('access_token', FB_ACCESS_TOKEN);
                        uploadFormData.append('published', 'false');
                        const blob = new Blob([new Uint8Array(mediaBuffer)], { type: 'image/jpeg' });
                        uploadFormData.append('source', blob, 'story.jpg');

                        const uploadRes = await fetch(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/photos`, { method: 'POST', body: uploadFormData });
                        const uploadData = await uploadRes.json();

                        if (uploadData.error || !uploadData.id) {
                            return NextResponse.json({ error: `Story upload failed: ${uploadData.error?.message}` }, { status: 400 });
                        }

                        const storyPublishRes = await fetch(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/photo_stories?photo_id=${uploadData.id}&access_token=${FB_ACCESS_TOKEN}`, { method: 'POST' });
                        const storyData = await storyPublishRes.json();

                        if (storyData.error) {
                            return NextResponse.json({ error: `Story publishing failed: ${storyData.error.message}` }, { status: 400 });
                        }
                        return NextResponse.json({ success: true, storyId: storyData.id, normalized_payload: payload });
                    }
                }
            }

            // CASE 3: STANDARD POST (Existing logic)
            const mediaUrl = payload.media_urls[0];

            if (platform === 'instagram') {
                const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;
                if (!INSTAGRAM_ACCOUNT_ID) {
                    return NextResponse.json({ error: "Missing INSTAGRAM_ACCOUNT_ID in env" }, { status: 500 });
                }

                // Step 1: Create media container
                const containerRes = await fetch(`https://graph.facebook.com/v19.0/${INSTAGRAM_ACCOUNT_ID}/media`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image_url: mediaUrl,
                        caption: payload.caption_final,
                        access_token: FB_ACCESS_TOKEN
                    })
                });
                const containerData = await containerRes.json();

                if (containerData.error || !containerData.id) {
                    console.error("IG Post Container Error:", containerData.error);
                    return NextResponse.json({ error: containerData.error?.message || "Failed to create IG post" }, { status: 400 });
                }

                // Step 2: Publish
                const publishRes = await fetch(`https://graph.facebook.com/v19.0/${INSTAGRAM_ACCOUNT_ID}/media_publish`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        creation_id: containerData.id,
                        access_token: FB_ACCESS_TOKEN
                    })
                });
                const publishData = await publishRes.json();

                if (publishData.error) {
                    console.error("IG Post Publish Error:", publishData.error);
                    return NextResponse.json({ error: publishData.error.message }, { status: 400 });
                }
                return NextResponse.json({ success: true, postId: publishData.id, normalized_payload: payload });

            } else {
                // FACEBOOK FLOW
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
        }

        if (platform === 'tiktok') {
            console.log("[PUBLISH] Handling TikTok Video upload...");
            const mediaUrl = payload.media_urls[0];

            // VALIDATION: TikTok requires an MP4 video URL
            if (!mediaUrl) {
                return NextResponse.json({ error: 'TikTok richiede un video (.mp4)' }, { status: 400 });
            }

            // Get the token: first from the httpOnly cookie (set by OAuth callback), then env fallback
            const cookieStore = await cookies();
            const TIKTOK_ACCESS_TOKEN = cookieStore.get('tiktok_access_token')?.value
                || process.env.TIKTOK_ACCESS_TOKEN;

            if (!TIKTOK_ACCESS_TOKEN) {
                return NextResponse.json({
                    error: 'TikTok non collegato. Vai in Impostazioni → Social → Connetti TikTok.',
                    code: 'TIKTOK_NOT_CONNECTED',
                    normalized_payload: payload,
                }, { status: 401 });
            }

            try {
                // Step 1: Download the video server-side
                console.log("[TIKTOK] Downloading video from:", mediaUrl);
                const videoRes = await fetch(mediaUrl);
                if (!videoRes.ok) throw new Error(`Failed to fetch video: ${videoRes.statusText}`);
                const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
                const videoSize = videoBuffer.length;
                console.log(`[TIKTOK] Video size: ${videoSize} bytes`);

                // Pre-Step 2: Query creator info to see what privacy_level is actually allowed for this user/app!
                console.log("[TIKTOK] Querying creator_info for allowed privacy options...");
                const creatorRes = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${TIKTOK_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json; charset=UTF-8'
                    }
                });
                const creatorData = await creatorRes.json();
                console.log("[TIKTOK] Creator Info:", JSON.stringify(creatorData));

                let allowedPrivacy = "SELF_ONLY";
                if (creatorData.data?.privacy_level_options?.length > 0) {
                    allowedPrivacy = creatorData.data.privacy_level_options[0]; // pick the most restrictive or whatever is first
                }

                // Step 2: Init the upload with FILE_UPLOAD (no domain verification needed)
                const CHUNK_SIZE = videoSize; // single chunk for simplicity
                const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${TIKTOK_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json; charset=UTF-8'
                    },
                    body: JSON.stringify({
                        post_info: {
                            title: payload.caption_final ? payload.caption_final.substring(0, 150) : "Video from SMM Digitale",
                            privacy_level: allowedPrivacy,
                            disable_duet: false,
                            disable_comment: false,
                            disable_stitch: false,
                        },
                        source_info: {
                            source: "FILE_UPLOAD",
                            video_size: videoSize,
                            chunk_size: CHUNK_SIZE,
                            total_chunk_count: 1
                        }
                    })
                });

                const initData = await initRes.json();
                console.log("[TIKTOK] Init response:", JSON.stringify(initData));

                if (initData.error || !initData.data?.upload_url) {
                    const errMsg = initData.error?.message || initData.data?.error?.message || "TikTok Init failed";
                    console.error("TikTok Init Error:", errMsg);
                    // Provide detailed debug for user
                    return NextResponse.json({ error: errMsg, debug_creator_info: creatorData }, { status: 400 });
                }

                const uploadUrl = initData.data.upload_url;
                const publishId = initData.data.publish_id;

                // Step 3: Upload the video bytes directly to TikTok
                console.log("[TIKTOK] Uploading video bytes to TikTok...");
                const uploadRes = await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'video/mp4',
                        'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}`,
                        'Content-Length': videoSize.toString()
                    },
                    body: videoBuffer as any
                });

                if (!uploadRes.ok) {
                    const errText = await uploadRes.text();
                    console.error("TikTok Upload Error:", errText);
                    return NextResponse.json({ error: `TikTok upload failed: ${errText}` }, { status: 400 });
                }

                console.log("[TIKTOK] Upload complete! publish_id:", publishId);
                return NextResponse.json({
                    success: true,
                    publish_id: publishId,
                    normalized_payload: payload
                });

            } catch (err: any) {
                console.error("TikTok Publish Catch:", err);
                return NextResponse.json({ error: `TikTok publish failed: ${err.message}` }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Platform not supported yet' }, { status: 400 });

    } catch (error) {
        console.error('Error publishing:', error);
        return NextResponse.json({ error: 'Failed to publish' }, { status: 500 });
    }
}
