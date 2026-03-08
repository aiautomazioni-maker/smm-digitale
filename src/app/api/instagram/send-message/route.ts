import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { recipientId, message, mediaUrl, mediaType } = await request.json();
        const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
        const FB_PAGE_ID = process.env.FB_PAGE_ID;

        console.log(`[SEND_MESSAGE] Attempting to send to ${recipientId}. Message: "${message}", Media: ${mediaUrl || 'None'}`);

        if (!FB_ACCESS_TOKEN || !FB_PAGE_ID) {
            return NextResponse.json({ error: "Missing API credentials" }, { status: 500 });
        }

        if (!recipientId || (!message && !mediaUrl)) {
            return NextResponse.json({ error: "Missing recipientId, message or mediaUrl" }, { status: 400 });
        }

        // Send Instagram DM via Page Messages API
        const url = `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/messages`;

        let messagePayload: any = {};
        if (mediaUrl) {
            messagePayload = {
                attachment: {
                    type: mediaType || 'image',
                    payload: {
                        url: mediaUrl,
                        is_selectable: true
                    }
                }
            };
        } else {
            messagePayload = { text: message };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: messagePayload,
                messaging_type: 'RESPONSE',
                access_token: FB_ACCESS_TOKEN,
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Instagram Send Message Error:", JSON.stringify(data.error));
            return NextResponse.json({ 
                error: data.error.message, 
                code: data.error.code,
                details: data.error 
            }, { status: 400 });
        }

        return NextResponse.json({ success: true, messageId: data.message_id });

    } catch (error) {
        console.error("Failed to send Instagram message:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
