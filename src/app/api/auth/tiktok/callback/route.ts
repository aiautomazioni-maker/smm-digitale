import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.json({ error: `TikTok Auth Error: ${error}` }, { status: 400 });
    }

    if (!code) {
        return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get('tiktok_code_verifier')?.value;

    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;
    const redirectUri = `${origin}/api/auth/tiktok/callback`;

    if (!codeVerifier) {
        return NextResponse.json({ error: 'Missing code verifier (PKCE)' }, { status: 400 });
    }

    try {
        // Exchange code for Access Token
        const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
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
            console.error('TikTok Token Exchange Error:', data.error);
            return NextResponse.json({ error: data.error_description || data.error }, { status: 400 });
        }

        // Successfully obtained the token
        const accessToken = data.access_token;
        const openId = data.open_id;

        // Store in a secure cookie instead of local fs, since Vercel is readonly
        const cookieStore = await cookies();
        cookieStore.set('tiktok_access_token', accessToken, {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 86400, // 24 hours
            path: '/',
        });

        // Redirect back to settings with a success message
        return NextResponse.redirect(new URL('/settings?tiktok=success', req.url));

    } catch (e: any) {
        console.error('TikTok Callback Exception:', e);
        return NextResponse.json({ error: 'Internal Server Error during token exchange' }, { status: 500 });
    }
}
