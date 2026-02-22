export type TicketStatus = "open" | "in_progress" | "waiting_user" | "resolved" | "closed" | "investigating";
export type TicketPriority = "low" | "medium" | "high";

export interface NormalizerInput {
    current: {
        status: string;
        priority: string;
        category: string;
    };
    update: {
        new_status: string;
        new_priority: string;
        internal_note?: string | null;
    };
}

export interface NormalizerError {
    field: string;
    message: string;
}

export interface NormalizerOutput {
    is_valid: boolean;
    errors: NormalizerError[];
    normalized: {
        new_status: TicketStatus;
        new_priority: TicketPriority;
        internal_note: string | null;
    };
}

export function normalizeTicketUpdate(input: NormalizerInput): NormalizerOutput {
    const errors: NormalizerError[] = [];
    const { current, update } = input;

    // 1. Validate Status
    const validStatuses: TicketStatus[] = ["open", "in_progress", "waiting_user", "resolved", "closed", "investigating"];
    let status: TicketStatus = update.new_status as TicketStatus;
    if (!validStatuses.includes(status)) {
        errors.push({ field: "new_status", message: `Status non valido. Valori ammessi: ${validStatuses.join(", ")}` });
        status = (current.status as TicketStatus) || "open";
    }

    // 2. Validate Priority
    const validPriorities: TicketPriority[] = ["low", "medium", "high"];
    let priority: TicketPriority = update.new_priority as TicketPriority;
    if (!validPriorities.includes(priority)) {
        errors.push({ field: "new_priority", message: "Priorità non valida. Valori ammessi: low, medium, high" });
        priority = (current.priority as TicketPriority) || "low";
    }

    // 3. Internal Note Rules
    const note = update.internal_note?.trim() || null;
    if (note && note.length > 1200) {
        errors.push({ field: "internal_note", message: "Nota troppo lunga (max 1200 caratteri)" });
    }

    // 4. Transition Rules
    if (current.status === "closed" && status === "open") {
        if (!note || !note.toLowerCase().includes("reopened")) {
            errors.push({
                field: "new_status",
                message: "Transizione closed -> open vietata a meno che la nota contenga 'reopened'"
            });
        }
    }

    // 5. Warnings (Non-blocking but noted)
    if ((status === "resolved" || status === "closed") && !note) {
        // Rule says "consigliata", so we don't block. 
        // If the user wants to see it in errors as a warning, we can add it, but normally errors implies invalid.
        // Given the prompt "se manca, non bloccare", we omit from errors but could add a warning field if needed.
    }

    return {
        is_valid: errors.length === 0,
        errors,
        normalized: {
            new_status: status,
            new_priority: priority,
            internal_note: note
        }
    };
}
