import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;

        if (!FB_ACCESS_TOKEN) {
            return NextResponse.json({ error: "Missing API credentials" }, { status: 500 });
        }

        const body = await request.json();
        const { commentId, message } = body;

        if (!commentId || !message) {
            return NextResponse.json({ error: "Missing commentId or message" }, { status: 400 });
        }

        // Reply to a comment: POST /comment_id/replies?message=...
        const url = `https://graph.facebook.com/v19.0/${commentId}/replies`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                access_token: FB_ACCESS_TOKEN,
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Instagram Reply Comment Error:", data.error);
            return NextResponse.json({ error: data.error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, id: data.id });

    } catch (error) {
        console.error("Failed to reply to Instagram comment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
