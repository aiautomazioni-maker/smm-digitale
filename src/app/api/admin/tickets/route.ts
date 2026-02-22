import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { normalizeTicketUpdate } from '@/lib/ticket-normalizer';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const filterStatus = searchParams.get('status');
    const filterPriority = searchParams.get('priority');
    const q = searchParams.get('q')?.toLowerCase();

    const logPath = path.join(process.cwd(), 'tickets_db.log');
    if (!fs.existsSync(logPath)) {
        return NextResponse.json({ tickets: [] });
    }

    try {
        const data = fs.readFileSync(logPath, 'utf8');
        const lines = data.split('\n').filter(Boolean).reverse();
        const now = new Date();

        const tickets = lines.map(line => {
            try {
                if (line.trim().startsWith('{')) {
                    const ticket = JSON.parse(line);
                    const deadline = new Date(ticket.response_deadline_iso);
                    ticket.is_sla_breached = now > deadline && ticket.status !== 'resolved' && ticket.status !== 'closed';
                    return ticket;
                }
            } catch (e) { console.error("Parse error", e); }
            return null;
        }).filter(Boolean).filter((t: any) => {
            // Apply Filters
            if (filterStatus && filterStatus !== 'all' && t.status !== filterStatus) return false;
            if (filterPriority && filterPriority !== 'all' && t.priority !== filterPriority) return false;
            if (q) {
                const searchContent = `${t.id} ${t.user_email} ${t.workspace_name} ${t.summary}`.toLowerCase();
                if (!searchContent.includes(q)) return false;
            }
            return true;
        });

        return NextResponse.json({ tickets });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, status: new_status_input, priority: new_priority_input, note, note_type, author } = body;
        const logPath = path.join(process.cwd(), 'tickets_db.log');

        if (!fs.existsSync(logPath)) return NextResponse.json({ error: "No tickets found" }, { status: 404 });

        const data = fs.readFileSync(logPath, 'utf8');
        const lines = data.split('\n').filter(Boolean);

        const currentTicketLine = lines.find(l => {
            if (!l.trim().startsWith('{')) return false;
            return JSON.parse(l).id.trim() === id.trim();
        });

        if (!currentTicketLine) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        const currentTicket = JSON.parse(currentTicketLine);

        const validation = normalizeTicketUpdate({
            current: {
                status: currentTicket.status,
                priority: currentTicket.priority,
                category: currentTicket.category
            },
            update: {
                new_status: new_status_input || currentTicket.status,
                new_priority: new_priority_input || currentTicket.priority,
                internal_note: note
            }
        });

        if (!validation.is_valid) {
            return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });
        }

        const updatedLines = lines.map(line => {
            if (line.trim().startsWith('{')) {
                const ticket = JSON.parse(line);
                if (ticket.id.trim() === id.trim()) {
                    ticket.status = validation.normalized.new_status;
                    ticket.priority = validation.normalized.new_priority;

                    if (validation.normalized.internal_note) {
                        if (!ticket.notes) ticket.notes = [];
                        ticket.notes.push({
                            id: `note_${Math.random().toString(36).substr(2, 9)}`,
                            text: validation.normalized.internal_note,
                            type: note_type || "internal",
                            author: author || "admin@smm.it",
                            created_at: new Date().toISOString()
                        });
                    }
                    return JSON.stringify(ticket);
                }
            }
            return line;
        });

        fs.writeFileSync(logPath, updatedLines.join('\n') + '\n');
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
