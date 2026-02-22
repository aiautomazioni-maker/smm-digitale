export interface SupportAgentBrief {
    summary: string;
    sentiment: "positive" | "neutral" | "frustrated" | "urgent";
    suggested_actions: string[];
    suggested_macro_id?: string;
}

export function generateSupportBrief(ticket: any): SupportAgentBrief {
    const description = ticket.full_description?.toLowerCase() || "";
    const summary = ticket.summary?.toLowerCase() || "";
    const combined = `${summary} ${description}`;

    const brief: SupportAgentBrief = {
        summary: "",
        sentiment: "neutral",
        suggested_actions: [],
    };

    // 1. Sentiment & Summary Analysis
    if (combined.includes("urgente") || combined.includes("subito") || combined.includes("bloccat")) {
        brief.sentiment = "urgent";
        brief.summary = "L'utente segnala un blocco operativo che richiede attenzione immediata.";
    } else if (combined.includes("grazie") || combined.includes("ottimo")) {
        brief.sentiment = "positive";
        brief.summary = "Feedback positivo/richiesta di cortesia.";
    } else if (combined.includes("non funziona") || combined.includes("errore") || combined.includes("bug")) {
        brief.sentiment = "frustrated";
        brief.summary = "Possibile bug tecnico o errore di sistema segnalato.";
    } else {
        brief.summary = "Richiesta di informazioni generale.";
    }

    // 2. Technical Suggestions based on Debug Context
    const autoLog = ticket.debug_context?.auto_log_safe;
    if (autoLog) {
        if (autoLog.last_errors?.length > 0) {
            brief.suggested_actions.push("Controlla i log tecnici: sono presenti errori recenti.");
        }

        // Suggest Macros
        if (combined.includes("instagram") || combined.includes("facebook")) {
            brief.suggested_macro_id = "macro_001"; // Ricollega Instagram
            brief.suggested_actions.push("Suggerisci ricollegamento account social via OAuth.");
        } else if (combined.includes("immagine") || combined.includes("video") || combined.includes("formato")) {
            brief.suggested_macro_id = "macro_002"; // Controllo formato media
            brief.suggested_actions.push("Verifica dimensioni e formato del file caricato dall'utente.");
        }
    }

    if (brief.suggested_actions.length === 0) {
        brief.suggested_actions.push("Contatta l'utente per maggiori dettagli.");
    }

    return brief;
}
