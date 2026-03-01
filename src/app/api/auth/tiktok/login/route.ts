import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function GET(req: Request) {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;
    const redirectUri = `${origin}/api/auth/tiktok/callback`;

    if (!clientKey) {
        return NextResponse.json({ error: 'TikTok configuration missing' }, { status: 500 });
    }

    // TikTok OAuth 2.0 endpoint
    const baseUrl = 'https://www.tiktok.com/v2/auth/authorize/';

    // user.info.basic: Basic profile info
    // video.upload: Required for Video Kit
    // video.publish: Required for Direct Post
    // user.info.stats: Required for Analytics (Followers, Likes)
    // video.list: Required for Video Analytics
    const scope = 'user.info.basic,video.upload,video.publish,user.info.stats,video.list';

    // CSRF Protection
    const state = Math.random().toString(36).substring(7);

    // PKCE implementation
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    // Store the verifier in a cookie to use later in the callback
    const cookieStore = await cookies();
    cookieStore.set('tiktok_code_verifier', codeVerifier, {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 600, // 10 minutes is enough for login
        path: '/',
    });

    const params = new URLSearchParams({
        client_key: clientKey,
        scope: scope,
        response_type: 'code',
        redirect_uri: redirectUri,
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    });

    const authUrl = `${baseUrl}?${params.toString()}`;

    // Redirect the user to TikTok
    return NextResponse.redirect(authUrl);
}
