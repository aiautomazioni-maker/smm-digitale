import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { recipientId, message } = await req.json();
        const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
        const FB_PAGE_ID = process.env.FB_PAGE_ID;

        console.log(`[FB_SEND_MESSAGE] Sending to ${recipientId}: "${message}"`);

        if (!FB_ACCESS_TOKEN || !FB_PAGE_ID) {
            return NextResponse.json({ error: "Missing Facebook credentials" }, { status: 500 });
        }

        if (!recipientId || !message) {
            return NextResponse.json({ error: "Missing recipientId or message" }, { status: 400 });
        }

        // Facebook Messenger Send API
        const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${FB_ACCESS_TOKEN}`;
        const payload = {
            recipient: { id: recipientId },
            message: { text: message },
            messaging_type: "RESPONSE"
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.error) {
            console.error("[FB_SEND_MESSAGE_ERROR]", data.error);
            return NextResponse.json({ error: data.error.message, code: data.error.code }, { status: 400 });
        }

        return NextResponse.json({ success: true, messageId: data.message_id });

    } catch (error: any) {
        console.error("[FB_SEND_MESSAGE_EXCEPTION]", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
