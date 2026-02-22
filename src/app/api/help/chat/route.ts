import { NextResponse } from 'next/server';
import { FAQS } from '@/lib/help-data';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message, context, session } = body;

        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // MOCK AI LOGIC (Replacing LLM for this demo)
        // In real world, we would send the User's prompt + System Prompt to OpenAI/Gemini/Anthropic

        const msg = message.toLowerCase();
        let intent = "other";
        let replyMessage = "Puoi spiegare meglio?";
        let steps: string[] = [];
        let shouldEscalate = false;

        // --- Mock Intent Recognition & Logic ---

        if (msg.includes("non riesco") || msg.includes("errore") || msg.includes("problema")) {
            intent = "bug";
            replyMessage = "Mi dispiace per il problema. Prova questi passaggi per risolvere.";
            steps = ["Ricarica la pagina", "Controlla la tua connessione", "Svuota la cache del browser"];
            shouldEscalate = true; // Technical issues often need support
        } else if (msg.includes("post") || msg.includes("pubblic")) {
            intent = "publishing";
            replyMessage = "Per pubblicare un post, segui questa procedura guidata.";
            steps = [
                "Clicca su 'Nuovo Post' nel menu laterale",
                "Scegli il formato (Post, Reel, o Story)",
                "Usa il Prompt Builder per generare il contenuto",
                "Controlla l'anteprima e clicca su 'Pianifica'"
            ];
        } else if (msg.includes("prezz") || msg.includes("cost") || msg.includes("credit")) {
            intent = "billing";
            replyMessage = "I nostri piani sono flessibili. Ecco come funzionano i crediti.";
            steps = [
                "Ogni immagine standard costa 1 crd",
                "I video costano 10 crd",
                "I crediti non scadono se hai un abbonamento attivo"
            ];
        } else {
            replyMessage = "Capisco. Ecco alcune informazioni che potrebbero aiutarti.";
            steps = ["Consulta le FAQ nel tab a fianco", "Prova a riformulare la domanda"];
        }

        // --- Logic for Escalation ---
        // Rule: Escalation if user says not resolved OR (faq >= 2 AND chat >= 2) OR technical bug
        if (session.user_says_not_resolved || (session.faq_opened_count >= 2 && session.ai_messages_count >= 2) || intent === "bug") {
            shouldEscalate = true;
        }

        // --- Construct JSON Output (Strict Protocol) ---
        const responsePayload = {
            intent: intent,
            suggested_faq: FAQS.slice(0, 2), // Mock: return first 2 FAQs
            ai_reply: {
                message: replyMessage,
                steps: steps,
                asked_info: []
            },
            escalation: {
                should_offer_email: shouldEscalate,
                email_draft: shouldEscalate ? {
                    to: "support@smmdigitale.it",
                    subject: `Problema ${intent} - ${context?.workspace_name || 'User'}`,
                    body_text: `L'utente ha segnalato: "${message}"\nPagina: ${context?.current_page}\nErrori recenti: ${context?.last_error || 'Nessuno'}`
                } : null
            }
        };

        return NextResponse.json(responsePayload);

    } catch (error) {
        console.error("AI Chat Error:", error);
        return NextResponse.json({
            ai_reply: {
                message: "Errore di sistema. Riprova più tardi.",
                steps: []
            },
            escalation: { should_offer_email: true }
        }, { status: 500 });
    }
}
