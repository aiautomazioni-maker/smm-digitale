import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/settings?tiktok=error&reason=' + error, req.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/settings?tiktok=error&reason=missing_code', req.url));
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get('tiktok_code_verifier')?.value;

    if (!codeVerifier) {
        return NextResponse.redirect(new URL('/settings?tiktok=error&reason=missing_verifier', req.url));
    }

    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;
    const redirectUri = `${origin}/api/auth/tiktok/callback`;

    try {
        // Exchange code for Access Token
        const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_key: clientKey!,
                client_secret: clientSecret!,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code_verifier: codeVerifier,
            }),
        });

        const data = await response.json();

        if (data.error) {
            console.error('TikTok Token Exchange Error:', data.error, data.error_description);
            return NextResponse.redirect(new URL(`/settings?tiktok=error&reason=${encodeURIComponent(data.error_description || data.error)}`, req.url));
        }

        const accessToken = data.access_token;
        const refreshToken = data.refresh_token;
        const openId = data.open_id;
        const expiresIn = data.expires_in || 86400;

        // 1. Store in a short-lived cookie for immediate use (backup)
        cookieStore.set('tiktok_access_token', accessToken, {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: expiresIn,
            path: '/',
        });

        // 2. IMPORTANT: Also persist to Supabase so it survives navigation and page reloads
        try {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            // Get the current Supabase session user from the auth cookie
            const supabaseAuthToken = cookieStore.get('sb-access-token')?.value
                || cookieStore.get('supabase-auth-token')?.value;

            if (supabaseAuthToken) {
                const { data: { user } } = await supabase.auth.getUser(supabaseAuthToken);
                if (user) {
                    await supabase.from('profiles').update({
                        tiktok_access_token: accessToken,
                        tiktok_refresh_token: refreshToken || null,
                        tiktok_open_id: openId,
                        tiktok_token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
                    }).eq('id', user.id);
                    console.log(`[TIKTOK] Token saved to Supabase for user: ${user.id}`);
                }
            } else {
                console.warn('[TIKTOK] No Supabase auth cookie found, token only in cookie.');
            }
        } catch (dbErr) {
            // Non-fatal: token is still in cookie, just won't persist across sessions
            console.error('[TIKTOK] Failed to save token to Supabase:', dbErr);
        }

        return NextResponse.redirect(new URL('/settings?tiktok=success', req.url));

    } catch (e: any) {
        console.error('TikTok Callback Exception:', e);
        return NextResponse.redirect(new URL('/settings?tiktok=error&reason=server_error', req.url));
    }
}
