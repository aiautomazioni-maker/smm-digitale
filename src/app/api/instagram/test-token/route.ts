import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const token = process.env.FB_ACCESS_TOKEN;
        if (!token) return NextResponse.json({ error: "No token found in ENV" });

        // Chiediamo a Meta di dirci cos'è questo token
        const debugUrl = `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${token}`;
        const res = await fetch(debugUrl);
        const data = await res.json();

        // Chiediamo anche quali pagine vede questo token
        const accountsUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`;
        const accountsRes = await fetch(accountsUrl);
        const accountsData = await accountsRes.json();

        return NextResponse.json({
            token_debug: data.data,
            accessible_pages: accountsData.data || accountsData.error,
            env_page_id: process.env.FB_PAGE_ID,
            env_ig_id: process.env.INSTAGRAM_ACCOUNT_ID
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
