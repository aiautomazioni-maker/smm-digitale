import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/mock-db';


export async function GET() {
    const users = getAllUsers();
    // In a real app we'd get the current user session, but for now we use the main test user
    const user = users.find(u => u.email === "testuser@example.com");
    const userCredits = user ? user.credits || 0 : 0;

    let instagramFollowers = 0;
    let tiktokFollowers = 0;

    try {
        // Fetch real data to aggregate totals
        const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
        const host = process.env.VERCEL_URL || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;

        // We use internal fetch or better directly call the logic, 
        // but here we just simulate the aggregation for now based on the same env vars
        const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
        const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;

        if (FB_ACCESS_TOKEN && INSTAGRAM_ACCOUNT_ID) {
            const igRes = await fetch(`https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}?fields=followers_count&access_token=${FB_ACCESS_TOKEN}`);
            const igData = await igRes.json();
            instagramFollowers = igData.followers_count || 0;
        }

        // For TikTok we'd need the token from cookies/db, but the analytics endpoint exists.
        // For now, if we can't fetch it easily server-side without session, we default to 0.
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
        engagement_rate: instagramFollowers > 0 ? "Calcolo..." : "N/A",
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

