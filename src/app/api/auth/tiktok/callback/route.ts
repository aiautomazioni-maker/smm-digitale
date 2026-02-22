import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
                redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
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

        // In a real app, save this to the database for the current workspace
        // For this prototype, we'll append it to .env.local to "simulate" persistence
        const envPath = '/Users/gillesvalenti/.gemini/antigravity/playground/celestial-oort/smm-digitale/.env.local';
        const envContent = `\nTIKTOK_ACCESS_TOKEN="${accessToken}"\nTIKTOK_OPEN_ID="${openId}"\n`;

        fs.appendFileSync(envPath, envContent);

        // Redirect back to settings with a success message
        return NextResponse.redirect(new URL('/settings?tiktok=success', req.url));

    } catch (e: any) {
        console.error('TikTok Callback Exception:', e);
        return NextResponse.json({ error: 'Internal Server Error during token exchange' }, { status: 500 });
    }
}
