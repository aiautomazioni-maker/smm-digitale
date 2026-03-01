import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const cookieStore = await cookies();
        let accessToken = cookieStore.get('tiktok_access_token')?.value;

        if (!accessToken) {
            console.log('[TIKTOK_DEBUG] No cookie token, checking Supabase...');
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            
            const supabaseAuthToken = cookieStore.get('sb-access-token')?.value
                || cookieStore.get('supabase-auth-token')?.value;

            console.log('[TIKTOK_DEBUG] Supabase Token present:', !!supabaseAuthToken);

            if (supabaseAuthToken) {
                const { data: { user }, error: authErr } = await supabase.auth.getUser(supabaseAuthToken);
                if (authErr) console.error('[TIKTOK_DEBUG] Auth Error:', authErr);
                if (user) {
                    console.log('[TIKTOK_DEBUG] Found user:', user.id);
                    const { data: profile, error: profileErr } = await supabase
                        .from('profiles')
                        .select('tiktok_access_token')
                        .eq('id', user.id)
                        .single();
                    
                    if (profileErr) console.error('[TIKTOK_DEBUG] Profile Error:', profileErr);
                    if (profile?.tiktok_access_token) {
                        console.log('[TIKTOK_DEBUG] Token found in Supabase');
                        accessToken = profile.tiktok_access_token;
                    } else {
                        console.log('[TIKTOK_DEBUG] No token in profile');
                    }
                } else {
                    console.log('[TIKTOK_DEBUG] User not found in session');
                }
            }
        }

        if (!accessToken) {
            console.log('[TIKTOK_DEBUG] Access Token missing everywhere');
            return NextResponse.json({ error: 'TikTok not connected' }, { status: 401 });
        }
        console.log('[TIKTOK_DEBUG] Fetching TikTok info with token...');

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
