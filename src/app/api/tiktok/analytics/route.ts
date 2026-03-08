import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Tries to refresh the TikTok access token using the stored refresh token.
 * Returns the new access token if successful, null otherwise.
 */
async function tryRefreshToken(supabase: any, refreshToken: string, profileId?: string): Promise<string | null> {
    const clientKey = process.env.TIKTOK_CLIENT_KEY!;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;

    console.log('[TIKTOK] Attempting token refresh...');

    try {
        const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_key: clientKey,
                client_secret: clientSecret,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }),
        });

        const data = await response.json();

        if (data.error || !data.access_token) {
            console.error('[TIKTOK] Token refresh failed:', data.error, data.error_description);
            return null;
        }

        const newAccessToken = data.access_token;
        const newRefreshToken = data.refresh_token || refreshToken;
        const expiresIn = data.expires_in || 86400;
        const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

        console.log('[TIKTOK] Token refreshed successfully, expires:', expiresAt);

        // Update in Supabase
        if (profileId) {
            await supabase.from('profiles').update({
                tiktok_access_token: newAccessToken,
                tiktok_refresh_token: newRefreshToken,
                tiktok_token_expires_at: expiresAt,
            }).eq('user_id', profileId);
            console.log('[TIKTOK] Updated token in Supabase for profile:', profileId);
        } else {
            // Update latest profile if we don't know which user
            await supabase.from('profiles')
                .update({
                    tiktok_access_token: newAccessToken,
                    tiktok_refresh_token: newRefreshToken,
                    tiktok_token_expires_at: expiresAt,
                })
                .not('tiktok_refresh_token', 'is', null)
                .order('tiktok_token_expires_at', { ascending: false })
                .limit(1);
        }

        return newAccessToken;
    } catch (e) {
        console.error('[TIKTOK] Token refresh exception:', e);
        return null;
    }
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        let accessToken = null;
        try {
            accessToken = cookieStore.get('tiktok_access_token')?.value;
        } catch (e) {
            // Ignore cookie parsing error
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        let profileId: string | undefined;
        let refreshToken: string | undefined;

        if (!accessToken) {
            console.log('[TIKTOK_ANALYTICS] No cookie found, checking Supabase...');

            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, tiktok_access_token, tiktok_refresh_token, tiktok_token_expires_at')
                .not('tiktok_access_token', 'is', null)
                .order('tiktok_token_expires_at', { ascending: false })
                .limit(1);

            if (profiles && profiles.length > 0) {
                const profile = profiles[0];
                profileId = profile.user_id;
                refreshToken = profile.tiktok_refresh_token;

                // Check if token is expired
                const expiresAt = profile.tiktok_token_expires_at ? new Date(profile.tiktok_token_expires_at) : null;
                const isExpired = expiresAt ? expiresAt < new Date() : false;

                if (isExpired && refreshToken) {
                    console.log('[TIKTOK_ANALYTICS] Token expired, attempting refresh...');
                    const newToken = await tryRefreshToken(supabase, refreshToken, profileId);
                    if (newToken) {
                        accessToken = newToken;
                        console.log('[TIKTOK_ANALYTICS] Using refreshed token.');
                    } else {
                        console.log('[TIKTOK_ANALYTICS] Refresh failed, returning error.');
                        return NextResponse.json({ error: 'TikTok token expired. Please reconnect.', needsReconnect: true }, { status: 401 });
                    }
                } else if (!isExpired) {
                    accessToken = profile.tiktok_access_token;
                    console.log('[TIKTOK_ANALYTICS] Using valid token from Supabase.');
                } else {
                    return NextResponse.json({ error: 'TikTok not connected', needsReconnect: true }, { status: 401 });
                }
            }
        }

        if (!accessToken) {
            return NextResponse.json({ error: 'TikTok not connected', needsReconnect: true }, { status: 401 });
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
            // Token may be invalid, try to refresh once more if we have a refresh token
            if (refreshToken) {
                console.log('[TIKTOK] API error, attempting emergency refresh...');
                const newToken = await tryRefreshToken(supabase, refreshToken, profileId);
                if (newToken) {
                    return NextResponse.redirect(new URL('/api/tiktok/analytics', process.env.VERCEL_URL || 'http://localhost:3000'));
                }
            }
            return NextResponse.json({
                error: userJson.error.message || 'TikTok API Error',
                needsReconnect: true,
                code: userJson.error.code
            }, { status: 400 });
        }

        const userData = userJson.data?.user;

        // Fetch videos for content display
        const videoResponse = await fetch('https://open.tiktokapis.com/v2/video/list/?fields=view_count,cover_image_url,title,id,share_url', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ max_count: 12 })
        });

        const videoJson = await videoResponse.json();

        let totalViews = 0;
        const videos = (videoJson.data?.videos || []).map((v: any) => ({
            id: v.id,
            image: v.cover_image_url,
            caption: v.title || "",
            likes: 0,
            comments: 0,
            views: v.view_count,
            permalink: v.share_url
        }));

        if (videoJson.data?.videos?.length > 0) {
            totalViews = videoJson.data.videos.reduce((acc: number, v: any) => acc + (v.view_count || 0), 0);
        }

        return NextResponse.json({
            followers: userData?.follower_count || 0,
            likes: userData?.likes_count || 0,
            videos_count: userData?.video_count || 0,
            views: totalViews,
            display_name: userData?.display_name || 'Automazioni AI',
            avatar: userData?.avatar_url,
            posts: videos,
            tokenStatus: 'valid'
        });

    } catch (error: any) {
        console.error('[TIKTOK_ANALYTICS_EXCEPTION]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
