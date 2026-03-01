import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const cookieStore = await cookies();
        let accessToken = cookieStore.get('tiktok_access_token')?.value;

        if (!accessToken) {
            console.log('[TIKTOK_ANALYTICS] No cookie found, checking Supabase profiles...');
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            
            // Try to find the latest connected token if we don't have a specific user (for demo/agency flow)
            // In a production app, we would strictly filter by user.id
            const { data: latestProfiles } = await supabase
                .from('profiles')
                .select('tiktok_access_token, tiktok_token_expires_at')
                .not('tiktok_access_token', 'is', null)
                .order('tiktok_token_expires_at', { ascending: false })
                .limit(1);

            if (latestProfiles && latestProfiles.length > 0) {
                accessToken = latestProfiles[0].tiktok_access_token;
                console.log('[TIKTOK_ANALYTICS] Recovered token from latest profile');
            }
        }

        if (!accessToken) {
            return NextResponse.json({ error: 'TikTok not connected' }, { status: 401 });
        }

        // Fetch user info
        const userFields = 'follower_count,likes_count,video_count,display_name,avatar_url';
        const userUrl = `https://open.tiktokapis.com/v2/user/info/?fields=${userFields}`;

        const userResponse = await fetch(userUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const userJson = await userResponse.json();

        if (userJson.error) {
            console.error('[TIKTOK_API_ERROR]', userJson.error);
            // If token is invalid, we might want to inform the frontend to reconnect
            return NextResponse.json({ error: userJson.error.message || 'API Error' }, { status: 400 });
        }

        const userData = userJson.data?.user;

        // Fetch videos for view count
        const videoResponse = await fetch('https://open.tiktokapis.com/v2/video/list/?fields=view_count', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ max_count: 10 })
        });

        const videoJson = await videoResponse.json();
        
        let totalViews = 0;
        const videos = videoJson.data?.videos || [];
        if (videos.length > 0) {
            totalViews = videos.reduce((acc: number, v: any) => acc + (v.view_count || 0), 0);
        }

        return NextResponse.json({
            followers: userData?.follower_count || 0,
            likes: userData?.likes_count || 0,
            videos: userData?.video_count || 0,
            views: totalViews,
            display_name: userData?.display_name || 'Automazioni AI',
            avatar: userData?.avatar_url
        });

    } catch (error: any) {
        console.error('[TIKTOK_ANALYTICS_EXCEPTION]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
