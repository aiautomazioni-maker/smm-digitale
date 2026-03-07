import { NextResponse } from 'next/server';

export async function GET() {
    const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
    const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;

    if (!FB_ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
        return NextResponse.json({ error: "Instagram credentials not configured" }, { status: 500 });
    }

    try {
        // 1. Fetch Profile Info
        const profileUrl = `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}?fields=followers_count,media_count,profile_picture_url,username,name,biography&access_token=${FB_ACCESS_TOKEN}`;
        const profileRes = await fetch(profileUrl, { cache: 'no-store' });
        const profileData = await profileRes.json();

        if (profileData.error) {
            throw new Error(profileData.error.message);
        }

        // 2. Fetch Media (Posts) with nested comments
        const mediaUrl = `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,comments{text,username,timestamp}&access_token=${FB_ACCESS_TOKEN}&limit=12`;
        const mediaRes = await fetch(mediaUrl, { cache: 'no-store' });
        const mediaData = await mediaRes.json();

        // 3. Format response for the frontend
        return NextResponse.json({
            profile: {
                username: profileData.username,
                name: profileData.name,
                followers: profileData.followers_count,
                media_count: profileData.media_count,
                profile_picture: profileData.profile_picture_url,
                biography: profileData.biography
            },
            posts: (mediaData.data || []).map((m: any) => ({
                id: m.id,
                image: m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url,
                caption: m.caption,
                likes: m.like_count || 0,
                comments: m.comments_count || 0,
                commentList: (m.comments?.data || []).map((c: any) => ({
                    user: c.username,
                    text: c.text,
                    time: new Date(c.timestamp).toLocaleString('it-IT', { day: '2-digit', month: 'short' })
                })),
                timestamp: m.timestamp,
                permalink: m.permalink
            }))
        });

    } catch (err: any) {
        console.error("Instagram API Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
