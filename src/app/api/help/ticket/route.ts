import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// --- WORKFLOW HELPERS ---

function validateSupportForm(body: any) {
    const { message, consent } = body;
    const errors = [];
    if (!message || message.length < 30) {
        errors.push({ field: "message", message: "Il messaggio deve essere di almeno 30 caratteri" });
    }
    if (consent !== true) {
        errors.push({ field: "consent", message: "Devi autorizzare l’invio dei dati al supporto." });
    }
    return errors;
}

function determineSmartPriority(message: string, autoLog: any): "low" | "medium" | "high" {
    // 1. Check Auto-Log for Critical Failures
    if (autoLog) {
        if (autoLog.last_job?.status === 'failed') return "high";
        if (autoLog.social_status?.some((s: any) => s.status === 'needs_reauth')) return "high";
    }

    // 2. Keyword Search
    const highKeywords = ["failed", "error", "500", "publish", "oauth", "token", "blocked", "crash"];
    const mediumKeywords = ["non funziona", "problema", "non riesco", "bug", "lento"];
    const text = message.toLowerCase();

    if (highKeywords.some(kw => text.includes(kw))) return "high";
    if (mediumKeywords.some(kw => text.includes(kw))) return "medium";
    return "low";
}

interface SLAResult {
    sla_hours: number;
    response_deadline_iso: string;
    human_eta: string;
}

function calculateSLA(priority: string, plan: string = "start"): SLAResult {
    let hours = 48; // Default Low default

    if (priority === "low") hours = 24; // Prompt said Low=24h
    if (priority === "medium") hours = 12;
    if (priority === "high") {
        hours = 4;
        if (plan?.toLowerCase() === 'pro' || plan?.toLowerCase() === 'empire') {
            hours = 2;
        }
    }

    const now = new Date();
    const deadline = new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();

    return {
        sla_hours: hours,
        response_deadline_iso: deadline,
        human_eta: `entro ${hours} ore`
    };
}

function determineStatus(priority: string): string {
    return priority === "high" ? "investigating" : "open";
}


interface TicketCheckResult {
    is_duplicate: boolean;
    existing_ticket_id: string | null;
    action: "merge" | "create_new";
    merge_note: string | null;
}

function checkDuplicateAdvanced(userEmail: string, newMessage: string, category: string): TicketCheckResult {
    const logPath = path.join(process.cwd(), 'tickets_db.log');
    if (!fs.existsSync(logPath)) {
        return { is_duplicate: false, existing_ticket_id: null, action: "create_new", merge_note: null };
    }

    try {
        const data = fs.readFileSync(logPath, 'utf8');
        const lines = data.split('\n').filter(Boolean).reverse();
        const now = Date.now();

        for (const line of lines) {
            let isoDate, ticketId, email, oldSummary;

            // Try JSON format first
            try {
                if (line.trim().startsWith('{')) {
                    const jsonLog = JSON.parse(line);
                    isoDate = jsonLog.created_at_iso;
                    ticketId = jsonLog.id;
                    email = jsonLog.user_email;
                    oldSummary = jsonLog.summary;
                } else {
                    // Fallback to old format
                    const match = line.match(/^\[(.*?)\]\[(.*?)\]\[(.*?)\] (.*?): (.*)$/);
                    if (match) {
                        isoDate = match[1];
                        ticketId = match[2];
                        email = match[4].trim(); // regex group 4 is email
                        oldSummary = match[5];
                    }
                }
            } catch (e) { console.error("Log parse error", e); continue; }

            if (!isoDate || !ticketId || !email || !oldSummary) continue;

            // 1. Check Time Window (< 10 minutes)
            const ts = new Date(isoDate).getTime();
            if (now - ts > 10 * 60 * 1000) break; // Optimization

            // 2. Check User matches
            if (email.trim() === userEmail) {
                // 3. Check Message Similarity
                const cleanNew = newMessage.toLowerCase().trim();
                const cleanOld = oldSummary.toLowerCase().trim();

                if (cleanNew.includes(cleanOld) || cleanOld.includes(cleanNew) || (cleanNew.substring(0, 20) === cleanOld.substring(0, 20))) {
                    return {
                        is_duplicate: true,
                        existing_ticket_id: ticketId,
                        action: "merge",
                        merge_note: "Utente ha reinviato una richiesta molto simile in meno di 10 minuti. Unione automatica."
                    };
                }
            }
        }
    } catch (e) {
        console.error("Advanced Duplicate check error", e);
    }

    return { is_duplicate: false, existing_ticket_id: null, action: "create_new", merge_note: null };
}

function buildTicketAndEmails(body: any, ticketId: string) {
    const {
        workspace_id, workspace_name, user_email, user_name,
        current_page, last_error, message, category, attachments,
        ai_conversation_summary, support_email, now_iso,
        auto_log
    } = body;

    const priority = determineSmartPriority(message, auto_log);
    const userPlan = body.plan || auto_log?.plan || "start";
    const slaDetails = calculateSLA(priority, userPlan); // Returns SLAResult
    const status = determineStatus(priority);

    const summary = message.length > 117 ? message.substring(0, 117) + "..." : message;


    const debug_context = {
        auto_log_safe: auto_log || null,
        missing_fields: []
    };

    const fullDescription = `
[Account] ${workspace_name}, ${user_email}
[Contesto] ${current_page}, ${last_error || "Nessuno"}
[Messaggio utente] ${message}
[Allegati] ${attachments?.length ? attachments.join(", ") : "Nessuno"}
[AI Summary] ${ai_conversation_summary || "N/A"}
[Auto-log] Version: ${auto_log?.app_version}, Plan: ${auto_log?.plan}. See debug_context for full details.
[SLA] Priority: ${priority}, Deadline: ${slaDetails.response_deadline_iso}
    `.trim();

    const supportEmailObj = {
        to: support_email,
        subject: `Richiesta supporto - ${workspace_name} - ${category} - ${priority}`,
        body_text: fullDescription
    };

    const userEmailObj = {
        to: user_email,
        subject: `Conferma ricezione ticket #${ticketId}`,
        body_text: `
Ciao ${user_name?.split(' ')[0] || 'Cliente'},

Abbiamo ricevuto la tua richiesta.
Codice richiesta: ${ticketId}

SLA Prevista: ${slaDetails.human_eta}
Scadenza risposta: ${slaDetails.response_deadline_iso}

Il nostro team ti risponderà al più presto.
        `.trim()
    };

    const ticketObj = {
        id: ticketId,
        priority,
        sla_hours: slaDetails.sla_hours,
        response_deadline_iso: slaDetails.response_deadline_iso,
        human_eta: slaDetails.human_eta,
        category,
        summary,
        full_description: fullDescription,
        status: status,
        created_at_iso: now_iso,
        workspace_name, // DATA FOR ADMIN
        user_email,     // DATA FOR ADMIN
        attachments: attachments || [],
        debug_context // Added field
    };

    return { ticketObj, supportEmailObj, userEmailObj };
}



function dbCreateSupportTicket(ticketObj: any, userEmail: string) {
    // Simulate DB Insert
    const logPath = path.join(process.cwd(), 'tickets_db.log');
    // Save as JSON Line
    const logEntry = JSON.stringify(ticketObj) + "\n";
    try {
        fs.appendFileSync(logPath, logEntry);
        return true;
    } catch (e) {
        console.error("DB Error", e);
        return false;
    }
}

function sendEmails(supportEmail: any, userEmail: any) {
    // Simulate Sending
    console.log(`\n-- - [MOCK EMAIL SERVICE]-- -\nSENDING TO SUPPORT: ${supportEmail.to} \nSUBJECT: ${supportEmail.subject} \n`);
    console.log(`SENDING TO USER: ${userEmail.to} \nSUBJECT: ${userEmail.subject} \n----------------------------\n`);
}

// --- MAIN ROUTE ---

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. ValidateSupportForm (5A)
        const errors = validateSupportForm(body);
        if (errors.length > 0) {
            return NextResponse.json({ is_valid: false, errors }, { status: 400 });
        }

        // 2. Anti-Duplicate Check (Backend)
        const dupResult = checkDuplicateAdvanced(body.user_email, body.message, body.category);

        if (dupResult.is_duplicate && dupResult.action === 'merge') {
            // Log the merge action
            const logPath = path.join(process.cwd(), 'tickets_db.log');
            const mergeEntry = `[${new Date().toISOString()}][MERGE][${dupResult.existing_ticket_id}]Note: ${dupResult.merge_note} \n`;
            fs.appendFileSync(logPath, mergeEntry);

            const uiResponse = {
                status: "info",
                title: "Ticket Aggiornato",
                message: `Abbiamo unito questa richiesta al ticket #${dupResult.existing_ticket_id}. ETA: entro 4 ore.`,
                primary_cta: { label: "Torna alla dashboard", route: "/dashboard" },
                secondary_cta: null
            };

            return NextResponse.json({
                success: true,
                ticket: { id: dupResult.existing_ticket_id, status: "merged" },
                ui: uiResponse,
                user_confirmation: { // Keep for backward compatibility if needed, else remove
                    title: uiResponse.title,
                    message: uiResponse.message
                }
            });
        }

        // 3. BuildTicketAndSupportEmail (5B)
        // Generate ID first as it's needed for the builder
        const ticketId = `tkt_${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;
        const { ticketObj, supportEmailObj, userEmailObj } = buildTicketAndEmails(body, ticketId);

        // 3. DB: Create SupportTicket
        dbCreateSupportTicket(ticketObj, body.user_email);

        // 4. Send Email to Support (and User)
        sendEmails(supportEmailObj, userEmailObj);

        // 5. UI Success State (5C)
        const uiResponse = {
            status: "success",
            title: "Richiesta inviata",
            message: `Ticket #${ticketId.trim()} creato con successo. Risposta prevista: ${ticketObj.human_eta}.`,
            primary_cta: { label: "Torna alla dashboard", route: "/dashboard" },
            secondary_cta: null // Route /support/tickets/[id] does not exist yet
        };

        return NextResponse.json({
            ticket: ticketObj,
            ui: uiResponse,
            email_to_support: supportEmailObj,
            email_to_user: userEmailObj,
            user_confirmation: {
                title: uiResponse.title,
                message: uiResponse.message
            }
        });

    } catch (error) {
        console.error("Ticket API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
