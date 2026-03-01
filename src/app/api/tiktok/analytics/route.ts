import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const cookieStore = await cookies();
        let accessToken = cookieStore.get('tiktok_access_token')?.value;

        if (!accessToken) {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            
            const supabaseAuthToken = cookieStore.get('sb-access-token')?.value
                || cookieStore.get('supabase-auth-token')?.value;

            if (supabaseAuthToken) {
                const { data: { user } } = await supabase.auth.getUser(supabaseAuthToken);
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('tiktok_access_token')
                        .eq('id', user.id)
                        .single();
                    
                    if (profile?.tiktok_access_token) {
                        accessToken = profile.tiktok_access_token;
                    }
                }
            }
        }

        if (!accessToken) {
            return NextResponse.json({ error: 'TikTok not connected' }, { status: 401 });
        }

        const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=follower_count,likes_count,video_count,display_name,avatar_url', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const userData = await userResponse.json();

        if (userData.error) {
            return NextResponse.json({ error: userData.error }, { status: 400 });
        }

        const videoResponse = await fetch('https://open.tiktokapis.com/v2/video/list/?fields=view_count', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ max_count: 10 })
        });

        const videoData = await videoResponse.json();
        
        let totalViews = 0;
        if (videoData.data?.videos) {
            totalViews = videoData.data.videos.reduce((acc: number, v: any) => acc + (v.view_count || 0), 0);
        }

        return NextResponse.json({
            followers: userData.data?.user?.follower_count || 0,
            likes: userData.data?.user?.likes_count || 0,
            videos: userData.data?.user?.video_count || 0,
            views: totalViews,
            display_name: userData.data?.user?.display_name,
            avatar: userData.data?.user?.avatar_url
        });

    } catch (error: any) {
        console.error('[TIKTOK_ANALYTICS_ERROR]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
