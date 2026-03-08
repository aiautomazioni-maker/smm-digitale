import { NextResponse } from 'next/server';

export async function GET() {
    const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
    const FB_PAGE_ID = process.env.FB_PAGE_ID;

    if (!FB_ACCESS_TOKEN || !FB_PAGE_ID) {
        return NextResponse.json({ error: "Facebook Page credentials not configured" }, { status: 500 });
    }

    try {
        // 1. Fetch Page Info
        const pageUrl = `https://graph.facebook.com/v18.0/${FB_PAGE_ID}?fields=name,about,fan_count,followers_count,picture{url},username&access_token=${FB_ACCESS_TOKEN}`;
        const pageRes = await fetch(pageUrl, { cache: 'no-store' });
        const pageData = await pageRes.json();

        if (pageData.error) {
            throw new Error(pageData.error.message);
        }

        // 2. Fetch Page Feed (Posts)
        const feedUrl = `https://graph.facebook.com/v18.0/${FB_PAGE_ID}/feed?fields=id,message,created_time,full_picture,permalink_url,actions&access_token=${FB_ACCESS_TOKEN}&limit=12`;
        const feedRes = await fetch(feedUrl, { cache: 'no-store' });
        const feedData = await feedRes.json();

        const posts = (feedData.data || []).map((p: any) => ({
            id: p.id,
            image: p.full_picture || "",
            caption: p.message || "",
            likes: 0, // Individual post likes require separate endpoint or summary field
            comments: 0,
            timestamp: p.created_time,
            permalink: p.permalink_url
        }));

        return NextResponse.json({
            profile: {
                name: pageData.name,
                username: pageData.username || pageData.name,
                followers: pageData.followers_count || 0,
                fans: pageData.fan_count || 0,
                profile_picture: pageData.picture?.data?.url || "",
                about: pageData.about || ""
            },
            posts: posts
        });

    } catch (err: any) {
        console.error("Facebook API Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
