import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
        const FB_PAGE_ID = process.env.FB_PAGE_ID;

        if (!FB_ACCESS_TOKEN || !FB_PAGE_ID) {
            return NextResponse.json({ error: "Missing Facebook credentials" }, { status: 500 });
        }

        // Fetch Messenger conversations from Facebook Page
        const url = `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/conversations?platform=messenger&fields=id,updated_time,participants,messages{id,message,created_time,from}&access_token=${FB_ACCESS_TOKEN}&limit=20`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        let response;
        try {
            response = await fetch(url, { cache: 'no-store', signal: controller.signal });
        } catch (fetchErr: any) {
            clearTimeout(timeoutId);
            if (fetchErr.name === 'AbortError') {
                return NextResponse.json({ error: "Timeout nella richiesta a Facebook Messenger." }, { status: 504 });
            }
            throw fetchErr;
        }
        clearTimeout(timeoutId);

        const data = await response.json();

        if (data.error) {
            console.error("[FACEBOOK_INBOX_ERROR]", data.error);
            return NextResponse.json({ error: data.error.message, code: data.error.code }, { status: 400 });
        }

        // Format conversations in the same shape as Instagram inbox
        const formattedChats = (data.data || []).map((conv: any) => {
            // Find the participant that is NOT the page itself
            const participant = conv.participants?.data?.find((p: any) => p.id !== FB_PAGE_ID) 
                || { id: 'unknown', name: 'Utente Facebook' };

            const messages = (conv.messages?.data || []).reverse().map((msg: any) => ({
                id: msg.id,
                text: msg.message || "[Media/Contenuto]",
                time: new Date(msg.created_time).toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
                sender: msg.from?.id === FB_PAGE_ID ? "me" : "user"
            }));

            return {
                id: conv.id,
                recipientId: participant.id,
                user: {
                    id: participant.id,
                    name: participant.name || "Utente Facebook",
                    handle: participant.name || "",
                    avatar: `https://graph.facebook.com/${participant.id}/picture?type=square`,
                    platform: "facebook"
                },
                lastMessage: messages.length > 0 ? messages[messages.length - 1].text : "Nuova conversazione",
                time: new Date(conv.updated_time).toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit' }),
                unread: false,
                messages
            };
        });

        return NextResponse.json({ success: true, chats: formattedChats });

    } catch (error) {
        console.error("[FACEBOOK_INBOX_EXCEPTION]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
