"use client";

import { useEffect, useState, use } from "react";
import {
    ChevronLeft,
    Calendar,
    Mail,
    Building,
    Tag,
    AlertCircle,
    CheckCircle2,
    MessageSquare,
    FileText,
    Activity,
    Save,
    History,
    Sparkles,
    Send,
    Eye
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { SUPPORT_MACROS, SupportMacro } from "@/lib/support-macros";
import { generateSupportEmail } from "@/lib/support-email-generator";
import { generateSupportBrief, SupportAgentBrief } from "@/lib/support-brief-agent";
import { Input } from "@/components/ui/input";

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [newNote, setNewNote] = useState("");
    const [noteType, setNoteType] = useState<"internal" | "public">("internal");
    const [status, setStatus] = useState("");
    const [aiBrief, setAiBrief] = useState<SupportAgentBrief | null>(null);

    // Reply State
    const [replyGoal, setReplyGoal] = useState("");
    const [replyPoints, setReplyPoints] = useState<string[]>([]);
    const [replyAsks, setReplyAsks] = useState<string[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    const fetchTicket = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/tickets");
            const data = await res.json();
            const found = data.tickets.find((t: any) => t.id.trim() === id.trim());
            if (found) {
                setTicket(found);
                setStatus(found.status);
                // Generate AI Briefing
                const brief = generateSupportBrief(found);
                setAiBrief(brief);
            }
        } catch (error) {
            console.error("Failed to fetch ticket", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicket();
    }, [id]);

    const handleApplyMacro = (macro: SupportMacro) => {
        setReplyGoal(macro.title);
        setReplyPoints(macro.message_points);
        setReplyAsks(macro.asks);
        toast.info(`Macro "${macro.title}" applicata`);
    };

    const handleUpdate = async () => {
        setUpdating(true);
        try {
            const res = await fetch("/api/admin/tickets", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id,
                    status,
                    note: newNote.trim() || undefined,
                    note_type: noteType,
                    author: "admin@smm.it" // Simulation
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Ticket aggiornato correttamente");
                setNewNote("");
                fetchTicket();
            } else {
                toast.error("Errore durante l'aggiornamento");
            }
        } catch (error) {
            toast.error("Errore di rete");
        } finally {
            setUpdating(false);
        }
    };

    const compiledEmail = ticket ? generateSupportEmail({
        lang: "it",
        ticket: {
            id: ticket.id,
            workspace_name: ticket.workspace_name || "Workspace",
            category: ticket.category || "General",
            summary: ticket.summary || ""
        },
        customer: {
            email: ticket.user_email || "",
            name: "Cliente" // Could potentially use a real name if available in debug_context
        },
        agent_input: {
            goal: replyGoal,
            message_points: replyPoints,
            asks: replyAsks
        }
    }) : null;

    if (loading) return <div className="p-20 text-center italic text-muted-foreground animate-pulse">Caricamento dettagli ticket...</div>;
    if (!ticket) return <div className="p-20 text-center underline"><Link href="/admin/support">Ticket non trovato. Torna alla lista.</Link></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ChevronLeft className="h-4 w-4 mr-2" /> Indietro
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">Supporto #{ticket.id}</h1>
                        <Badge variant={ticket.is_sla_breached ? "destructive" : "secondary"}>
                            {ticket.is_sla_breached ? "SLA Scaduta" : "In Tempo"}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">Creato il {format(new Date(ticket.created_at_iso), "PPPPp", { locale: it })}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Details & Reply */}
                <div className="lg:col-span-2 space-y-6">
                    {/* AI BRIEFING CARD */}
                    {aiBrief && (
                        <Card className="border-yellow-500/30 bg-yellow-500/5">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2 text-yellow-600">
                                    <Sparkles className="h-4 w-4" /> AI Support Brief & Suggestions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="text-sm font-medium">
                                    <Badge variant="outline" className={`mr-2 ${aiBrief.sentiment === 'urgent' ? 'bg-red-500 text-white border-none' : ''}`}>
                                        {aiBrief.sentiment}
                                    </Badge>
                                    {aiBrief.summary}
                                </div>
                                <div className="space-y-1">
                                    {aiBrief.suggested_actions.map((act, i) => (
                                        <div key={i} className="text-xs flex items-center gap-2 text-muted-foreground">
                                            <CheckCircle2 className="h-3 w-3 text-green-500" /> {act}
                                        </div>
                                    ))}
                                </div>
                                {aiBrief.suggested_macro_id && (
                                    <div className="p-2 bg-yellow-500/10 rounded-md border border-yellow-500/20 text-[10px] text-yellow-700 font-bold">
                                        💡 SUGGERIMENTO: Usa la macro per
                                        {SUPPORT_MACROS.find(m => m.id === aiBrief.suggested_macro_id)?.title}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-primary">
                                <FileText className="h-5 w-5" /> Messaggio Utente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-muted/30 p-4 rounded-lg border italic whitespace-pre-wrap text-sm leading-relaxed">
                                {ticket.summary}
                            </div>
                            <Separator />
                            <div>
                                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Descrizione Completa</h4>
                                <pre className="text-xs bg-muted/20 p-4 rounded border font-sans whitespace-pre-wrap">
                                    {ticket.full_description}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>

                    {/* REPLY COMPOSER */}
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Send className="h-5 w-5 text-primary" /> Risposta al Cliente
                            </CardTitle>
                            <CardDescription>Genera una risposta formale basata sulle istruzioni o macro.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Obiettivo / Firma</label>
                                <Input
                                    placeholder="Es: Ricollegamento Instagram..."
                                    className="bg-background"
                                    value={replyGoal}
                                    onChange={(e) => setReplyGoal(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Passaggi da fare (uno per riga)</label>
                                    <Textarea
                                        className="text-xs min-h-[100px] bg-background"
                                        placeholder="1. Vai su...\n2. Clicca..."
                                        value={replyPoints.join('\n')}
                                        onChange={(e) => setReplyPoints(e.target.value.split('\n'))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Richieste info (uno per riga)</label>
                                    <Textarea
                                        className="text-xs min-h-[100px] bg-background"
                                        placeholder="Puoi inviarci lo screenshot?"
                                        value={replyAsks.join('\n')}
                                        onChange={(e) => setReplyAsks(e.target.value.split('\n'))}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-background p-4 rounded-lg border">
                                <div className="flex items-center gap-2 text-sm">
                                    <Eye className="h-4 w-4 text-primary" />
                                    <span>Anteprima Email</span>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                                    {showPreview ? "Nascondi" : "Mostra"}
                                </Button>
                            </div>

                            {showPreview && compiledEmail && (
                                <div className="bg-white text-black p-6 rounded-lg shadow-inner border font-sans text-sm whitespace-pre-wrap leading-relaxed">
                                    <div className="pb-4 mb-4 border-b border-gray-100 font-bold text-gray-500 text-xs">
                                        OGGETTO: {compiledEmail.email.subject}
                                    </div>
                                    {compiledEmail.email.body_text}
                                </div>
                            )}

                            <Button className="w-full bg-instagram-gradient text-white" disabled={!replyGoal || replyPoints.length === 0}>
                                <Send className="h-4 w-4 mr-2" /> Invia Risposta via Email
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="h-5 w-5" /> Debug Context (Auto-Log)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {ticket.debug_context?.auto_log_safe ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                        <div className="bg-muted/50 p-2 rounded">
                                            <span className="text-muted-foreground block mb-1">App Version</span>
                                            <span className="font-mono font-bold">{ticket.debug_context.auto_log_safe.app_version}</span>
                                        </div>
                                        <div className="bg-muted/50 p-2 rounded">
                                            <span className="text-muted-foreground block mb-1">Plan</span>
                                            <span className="font-mono font-bold">{ticket.debug_context.auto_log_safe.plan}</span>
                                        </div>
                                        <div className="bg-muted/50 p-2 rounded">
                                            <span className="text-muted-foreground block mb-1">Workspace ID</span>
                                            <span className="font-mono font-bold">{ticket.workspace_id || "N/A"}</span>
                                        </div>
                                    </div>

                                    <h4 className="text-xs font-bold uppercase text-muted-foreground mt-4">Statistiche Social</h4>
                                    <div className="bg-black/90 text-green-400 p-4 rounded-lg font-mono text-[10px] overflow-x-auto">
                                        {JSON.stringify(ticket.debug_context.auto_log_safe.social_status || {}, null, 2)}
                                    </div>

                                    <h4 className="text-xs font-bold uppercase text-muted-foreground mt-4">Ultimi Errori</h4>
                                    <div className="bg-red-500/10 text-red-600 p-4 rounded-lg font-mono text-[10px] border border-red-500/20">
                                        {JSON.stringify(ticket.debug_context.auto_log_safe.last_errors || [], null, 2)}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Nessun log tecnico disponibile.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Actions & Metadata */}
                <div className="space-y-6">
                    {/* MACROS CARD */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-yellow-500" /> Macro & Risposte
                            </CardTitle>
                            <CardDescription>Usa queste macro per velocizzare la risposta.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {SUPPORT_MACROS.map(macro => (
                                <Button
                                    key={macro.id}
                                    variant="outline"
                                    className="w-full justify-start text-xs h-auto py-3 px-4 text-left block overflow-hidden"
                                    onClick={() => handleApplyMacro(macro)}
                                >
                                    <span className="font-bold block text-primary truncate">{macro.title}</span>
                                    <span className="text-[10px] opacity-70 block truncate capitalize">{macro.category}</span>
                                </Button>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" /> Gestione Stato
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium">Cambia Stato</label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleziona stato" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">Aperto</SelectItem>
                                        <SelectItem value="in_progress">In Lavoro</SelectItem>
                                        <SelectItem value="waiting_user">In Attesa Utente</SelectItem>
                                        <SelectItem value="resolved">Risolto</SelectItem>
                                        <SelectItem value="closed">Chiuso</SelectItem>
                                        <SelectItem value="investigating">Analisi Urgente</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-medium flex items-center gap-1.5">
                                        <MessageSquare className="h-3.5 w-3.5" /> Note
                                    </label>
                                    <div className="flex gap-1">
                                        <Button
                                            variant={noteType === 'internal' ? 'default' : 'outline'}
                                            size="xs"
                                            className="text-[10px] h-6"
                                            onClick={() => setNoteType('internal')}
                                        >
                                            Interna
                                        </Button>
                                        <Button
                                            variant={noteType === 'public' ? 'default' : 'outline'}
                                            size="xs"
                                            className="text-[10px] h-6 px-2"
                                            onClick={() => setNoteType('public')}
                                        >
                                            Pubblica
                                        </Button>
                                    </div>
                                </div>
                                <Textarea
                                    placeholder={noteType === 'internal' ? "Nota visibile solo al team..." : "Nota visibile anche all'utente..."}
                                    className="text-xs resize-none"
                                    rows={4}
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                />
                            </div>

                            <Button className="w-full" onClick={handleUpdate} disabled={updating}>
                                <Save className="h-4 w-4 mr-2" /> {updating ? "Salvataggio..." : "Salva Modifiche"}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Mail className="h-5 w-5" /> Info Contatto
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3">
                            <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-xs">{ticket.workspace_name || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs text-primary underline">{ticket.user_email}</span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Priorità:</span>
                                <Badge variant="outline" className="uppercase font-bold tracking-widest text-[10px]">{ticket.priority}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">SLA Deadline:</span>
                                <span className={ticket.is_sla_breached ? "text-red-500 font-bold" : ""}>
                                    {ticket.response_deadline_iso ? format(new Date(ticket.response_deadline_iso), "dd MMM HH:mm", { locale: it }) : "-"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Internal Notes History */}
                    {ticket.notes && ticket.notes.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <History className="h-5 w-5" /> Cronologia Note
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {ticket.notes.map((n: any, i: number) => (
                                    <div key={i} className={`text-xs p-3 rounded border-l-4 ${n.type === 'public' ? 'border-green-400 bg-green-50/50' : 'border-primary/40 bg-muted/20'}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-[10px] uppercase opacity-70">
                                                {n.type === 'public' ? '📢 Pubblica' : '🔒 Interna'}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground">{n.author}</span>
                                        </div>
                                        <p className="mb-1 italic">{n.text}</p>
                                        <span className="text-[10px] text-muted-foreground opacity-70">
                                            {format(new Date(n.created_at), "dd MMM HH:mm", { locale: it })}
                                        </span>
                                    </div>
                                )).reverse()}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
