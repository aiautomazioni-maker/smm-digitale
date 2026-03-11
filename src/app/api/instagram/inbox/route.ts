import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
        const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;
        const FB_PAGE_ID = process.env.FB_PAGE_ID;

        if (!FB_ACCESS_TOKEN || !FB_PAGE_ID) {
            return NextResponse.json({ error: "Missing API credentials (FB_PAGE_ID or Token)" }, { status: 500 });
        }

        // Fetch Conversations from Instagram Graph API (using Page ID with platform=instagram)
        const url = `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/conversations?platform=instagram&fields=id,updated_time,participants,messages{id,message,created_time,from}&access_token=${FB_ACCESS_TOKEN}`;
        
        // Add a 10-second timeout to avoid hanging the server
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        let response;
        try {
            response = await fetch(url, {
                cache: 'no-store',
                signal: controller.signal
            });
        } catch (fetchErr: any) {
            clearTimeout(timeoutId);
            if (fetchErr.name === 'AbortError') {
                return NextResponse.json({ error: "La richiesta a Instagram ha scaduto il timeout (10s)." }, { status: 504 });
            }
            throw fetchErr;
        }
        clearTimeout(timeoutId);

        const data = await response.json();

        if (data.error) {
            console.error("Instagram Inbox API Error:", data.error);
            return NextResponse.json({ error: data.error.message, code: data.error.code }, { status: 400 });
        }

        // Transform Graph API data into our Chat interface format
        const formattedChats = (data.data || []).map((conv: any) => {
            const participant = conv.participants?.data?.find((p: any) => p.id !== INSTAGRAM_ACCOUNT_ID) || { id: "Unknown", username: "Instagram User" };

            const messages = (conv.messages?.data || []).reverse().map((msg: any) => ({
                id: msg.id,
                text: msg.message || "[Media/Rich Content]",
                time: new Date(msg.created_time).toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
                sender: msg.from?.id === INSTAGRAM_ACCOUNT_ID ? "me" : "user"
            }));

            return {
                id: conv.id,
                recipientId: participant.id,
                user: { 
                    id: participant.id,
                    name: participant.username || "Utente Instagram", 
                    handle: participant.username ? `@${participant.username}` : "", 
                    avatar: "https://ui-avatars.com/api/?name=User&background=random",
                    platform: "instagram" 
                },
                lastMessage: messages.length > 0 ? messages[messages.length - 1].text : "Nuova conversazione",
                time: new Date(conv.updated_time).toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit' }),
                unread: false,
                messages: messages
            };
        });

        return NextResponse.json({
            success: true,
            chats: formattedChats
        });

    } catch (error) {
        console.error("Failed to fetch Instagram Inbox:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
