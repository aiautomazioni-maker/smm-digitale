import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/mock-db';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    const users = getAllUsers();
    // In a real app we'd get the current user session, but for now we use the main test user
    const user = users.find(u => u.email === "testuser@example.com");
    const userCredits = user ? user.credits || 0 : 0;

    let instagramFollowers = 0;
    let tiktokFollowers = 0;

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // 1. Fetch Instagram Data
        const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
        const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;

        if (FB_ACCESS_TOKEN && INSTAGRAM_ACCOUNT_ID) {
            const igRes = await fetch(`https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}?fields=followers_count&access_token=${FB_ACCESS_TOKEN}`);
            const igData = await igRes.json();
            instagramFollowers = igData.followers_count || 0;
        }

        // 2. Fetch TikTok Data (Latest profile with token)
        const { data: profiles } = await supabase
            .from('profiles')
            .select('tiktok_access_token')
            .not('tiktok_access_token', 'is', null)
            .order('tiktok_token_expires_at', { ascending: false })
            .limit(1);

        if (profiles && profiles.length > 0) {
            const token = profiles[0].tiktok_access_token;
            const ttRes = await fetch(`https://open.tiktokapis.com/v2/user/info/?fields=follower_count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const ttData = await ttRes.json();
            tiktokFollowers = ttData.data?.user?.follower_count || 0;
        }

    } catch (e) {
        console.error("Dashboard stats aggregation error", e);
    }

    const chartData = [
        { name: "Lun", instagram: 0, facebook: 0, tiktok: 0, impressions: 0 },
        { name: "Mar", instagram: 0, facebook: 0, tiktok: 0, impressions: 0 },
        { name: "Mer", instagram: 0, facebook: 0, tiktok: 0, impressions: 0 },
        { name: "Gio", instagram: 0, facebook: 0, tiktok: 0, impressions: 0 },
        { name: "Ven", instagram: 0, facebook: 0, tiktok: 0, impressions: 0 },
        { name: "Sab", instagram: 0, facebook: 0, tiktok: 0, impressions: 0 },
        { name: "Dom", instagram: 0, facebook: 0, tiktok: 0, impressions: 0 },
    ];

    const stats = {
        followers: instagramFollowers + tiktokFollowers,
        engagement_rate: (instagramFollowers + tiktokFollowers) > 0 ? "Calcolato" : "N/A",
        posts_active: 0,
        credits: userCredits,
        source: "Real-time Meta/TikTok API"
    };

    const recent_activity: any[] = [];
    const upcoming_posts: any[] = [];

    return NextResponse.json({
        chartData,
        stats,
        recent_activity,
        upcoming_posts
    });
}

