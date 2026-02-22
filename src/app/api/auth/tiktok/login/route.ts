import { NextResponse } from 'next/server';

export async function GET() {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI;

    if (!clientKey || !redirectUri) {
        return NextResponse.json({ error: 'TikTok configuration missing' }, { status: 500 });
    }

    // TikTok OAuth 2.0 endpoint
    const baseUrl = 'https://www.tiktok.com/v2/auth/authorize/';

    // Scopes needed for our application:
    // user.info.basic: Basic profile info
    // video.upload: Required for Video Kit
    // video.publish: Required for Direct Post
    const scope = 'user.info.basic,video.upload,video.publish';

    // CSRF Protection
    const state = Math.random().toString(36).substring(7);

    const params = new URLSearchParams({
        client_key: clientKey,
        scope: scope,
        response_type: 'code',
        redirect_uri: redirectUri,
        state: state,
    });

    const authUrl = `${baseUrl}?${params.toString()}`;

    // Redirect the user to TikTok
    return NextResponse.redirect(authUrl);
}
