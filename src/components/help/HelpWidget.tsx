"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
    MessageCircle, X, Search, Send, LifeBuoy, Mail, MessageSquare, ChevronRight, Bot, Loader2, AlertCircle, CheckIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HELP_CONFIG, FAQS } from "@/lib/help-data";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

type Tab = "faq" | "chat" | "ticket";

export function HelpWidget() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("faq");
    const [searchQuery, setSearchQuery] = useState("");

    // Session State (Counters for Escalation)
    const [sessionStats, setSessionStats] = useState({
        faqOpened: 0,
        chatMessages: 0,
        userSaysNotResolved: false
    });
    const [showEscalationBanner, setShowEscalationBanner] = useState(false);

    // Chat State
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string, steps?: string[] }[]>([
        { role: 'assistant', content: "Ciao! Sono il tuo assistente AI. Come posso aiutarti oggi?" }
    ]);
    const [chatInput, setChatInput] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Ticket State
    const [ticketCategory, setTicketCategory] = useState<string>("");
    // ticketSubject state removed, replaced by category + message parsing logic in backend or just implicit
    const [ticketMessage, setTicketMessage] = useState("");
    const [ticketConsent, setTicketConsent] = useState(false);
    const [isTicketSending, setIsTicketSending] = useState(false);
    const [ticketSuccessId, setTicketSuccessId] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages, activeTab]);

    // Escalation Login
    useEffect(() => {
        if (sessionStats.userSaysNotResolved ||
            sessionStats.faqOpened >= 2 ||
            sessionStats.chatMessages >= 3) {
            setShowEscalationBanner(true);
        }
    }, [sessionStats]);

    if (!HELP_CONFIG.enabled) return null;

    const filteredFaqs = FAQS.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleFaqClick = () => {
        setSessionStats(prev => ({ ...prev, faqOpened: prev.faqOpened + 1 }));
    };

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = chatInput;
        setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setChatInput("");
        setIsChatLoading(true);

        // Update stats
        setSessionStats(prev => ({ ...prev, chatMessages: prev.chatMessages + 1 }));

        try {
            // Mock Context Data
            const contextData = {
                current_page: pathname,
                last_error: null, // Could hook into a global error store
                platform_connections: { instagram: true, facebook: false },
                recent_actions: ["login", "view_dashboard"]
            };

            const response = await fetch('/api/help/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    context: contextData,
                    session: {
                        faq_opened_count: sessionStats.faqOpened,
                        ai_messages_count: sessionStats.chatMessages + 1,
                        user_says_not_resolved: sessionStats.userSaysNotResolved
                    }
                })
            });

            const data = await response.json();

            // Check for AI-suggested escalation
            if (data.escalation?.should_offer_email) {
                setSessionStats(prev => ({ ...prev, userSaysNotResolved: true }));
            }

            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: data.ai_reply.message,
                steps: data.ai_reply.steps
            }]);

        } catch (error) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: "Scusa, ho avuto un problema. Riprova più tardi." }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleTicketSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticketMessage.trim() || !ticketCategory || !ticketConsent) return;

        setIsTicketSending(true);
        try {
            // Anti-Duplicate (Frontend)
            const lastSubmit = sessionStorage.getItem("last_ticket_ts");
            if (lastSubmit && Date.now() - parseInt(lastSubmit) < 60000) { // 1 minute cooldown
                toast.error("Hai inviato un ticket poco fa. Attendi qualche istante.");
                setIsTicketSending(false);
                return;
            }

            // Context Gathering
            const chatSummary = chatMessages
                .map(m => `[${m.role.toUpperCase()}] ${m.content}`)
                .join('\n')
                .slice(0, 1000);

            // Mock Auto-Log Data (Pro SaaS)
            const autoLogData = {
                app_version: "1.0.0",
                current_page: pathname,
                last_errors: [
                    { "code": "PUBLISH_FAILED", "message": "Instagram publish failed" },
                    { "code": "TOKEN_EXPIRED", "message": "Reauth required" }
                ],
                social_status: [
                    { "platform": "instagram", "status": "needs_reauth" },
                    { "platform": "facebook", "status": "connected" }
                ],
                last_job: {
                    "type": "publish",
                    "status": "failed",
                    "timestamp_iso": new Date().toISOString()
                },
                plan: "pro"
            };

            const payload = {
                lang: "it",
                workspace_id: "ws_demo_123",
                workspace_name: "Demo Workspace",
                user_email: "testuser@example.com",
                user_name: "Mario Rossi",
                current_page: pathname,
                last_error: null,
                message: ticketMessage,
                category: ticketCategory,
                consent: ticketConsent,
                attachments: [],
                ai_conversation_summary: chatMessages.length > 1 ? chatSummary : "Nessuna chat precedente",
                support_email: HELP_CONFIG.support_email,
                now_iso: new Date().toISOString(),
                auto_log: autoLogData // Injecting Pro Data
            };

            const response = await fetch('/api/help/ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.user_confirmation) {
                // Parse ticket ID from confirmation or just rely on backend response structure
                // Use regex to extract ticket ID from message if not provided explicitly in dedicated field
                // But for now, user requested a specific "ticket.id" in one payload and "user_confirmation" in another.
                // We will unify by using data.ticket.id if available.

                // Assuming data.ticket available from strict response
                const tktId = data.ticket?.id || "TKT-???";

                setTicketSuccessId(tktId);
                toast.success("Ticket creato con successo!");

                // Anti-Duplicate Storage
                sessionStorage.setItem("last_ticket_ts", Date.now().toString());

                // Reset Fields
                setTicketCategory("");
                setTicketMessage("");
                setTicketConsent(false);
            } else if (data.errors) {
                toast.error(`Errore validazione: ${data.errors[0]?.message}`);
            } else {
                toast.error("Errore nell'invio del ticket.");
            }
        } catch (error) {
            toast.error("Errore di connessione.");
        } finally {
            setIsTicketSending(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 hidden lg:flex flex-col items-end">
            {/* Widget Main Panel */}
            <div
                className={cn(
                    "bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl mb-4 transition-all duration-300 overflow-hidden flex flex-col",
                    isOpen ? "w-[380px] h-[600px] opacity-100 scale-100" : "w-0 h-0 opacity-0 scale-90 translate-y-10"
                )}
            >
                {/* Header */}
                <div className="bg-instagram-gradient p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-2 text-white">
                        <LifeBuoy className="w-5 h-5" />
                        <span className="font-bold">Centro Aiuto</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20 h-8 w-8 rounded-full"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Escalation Banner */}
                {showEscalationBanner && activeTab !== 'ticket' && (
                    <div className="bg-orange-500/20 border-b border-orange-500/30 p-2 px-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center text-xs text-orange-200">
                            <AlertCircle className="w-3 h-3 mr-2" />
                            Non hai risolto?
                        </div>
                        <Button
                            variant="link"
                            size="sm"
                            className="text-orange-400 h-auto p-0 text-xs font-bold"
                            onClick={() => setActiveTab("ticket")}
                        >
                            Contatta Supporto
                        </Button>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-white/10 shrink-0">
                    <button
                        onClick={() => setActiveTab("faq")}
                        className={cn("flex-1 py-3 text-sm font-medium transition-colors border-b-2", activeTab === "faq" ? "border-pink-500 text-white" : "border-transparent text-muted-foreground hover:text-white")}
                    >
                        FAQ
                    </button>
                    <button
                        onClick={() => setActiveTab("chat")}
                        className={cn("flex-1 py-3 text-sm font-medium transition-colors border-b-2", activeTab === "chat" ? "border-pink-500 text-white" : "border-transparent text-muted-foreground hover:text-white")}
                    >
                        AI Chat
                    </button>
                    <button
                        onClick={() => setActiveTab("ticket")}
                        className={cn("flex-1 py-3 text-sm font-medium transition-colors border-b-2", activeTab === "ticket" ? "border-pink-500 text-white" : "border-transparent text-muted-foreground hover:text-white")}
                    >
                        Supporto
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative bg-black/50">

                    {/* FAQ TAB */}
                    {activeTab === "faq" && (
                        <div className="h-full flex flex-col p-4">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cerca risposte..."
                                    className="pl-9 bg-white/5 border-white/10 focus:border-pink-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <ScrollArea className="flex-1 pr-4">
                                <div className="space-y-3">
                                    {filteredFaqs.map(faq => (
                                        <div key={faq.id} onClick={handleFaqClick} className="bg-white/5 rounded-lg p-3 border border-white/5 hover:border-pink-500/30 transition-colors cursor-pointer">
                                            <h4 className="font-bold text-sm text-white mb-1">{faq.question}</h4>
                                            <p className="text-xs text-muted-foreground">{faq.answer}</p>
                                            <div className="mt-2 flex items-center">
                                                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-gray-400">{faq.category}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredFaqs.length === 0 && (
                                        <div className="text-center text-muted-foreground py-10">
                                            <p>Nessun risultato trovato.</p>
                                            <Button variant="link" onClick={() => setActiveTab("chat")} className="text-pink-500">Chiedi all'AI</Button>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {/* CHAT TAB */}
                    {activeTab === "chat" && (
                        <div className="h-full flex flex-col">
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4">
                                    {chatMessages.map((msg, i) => (
                                        <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                                            <div className={cn(
                                                "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                                                msg.role === 'user'
                                                    ? "bg-instagram-gradient text-white rounded-br-none"
                                                    : "bg-white/10 text-gray-200 rounded-bl-none"
                                            )}>
                                                {msg.content}
                                            </div>
                                            {msg.steps && msg.steps.length > 0 && (
                                                <div className="mt-2 ml-2 bg-white/5 p-3 rounded-lg border border-white/10 max-w-[85%] text-xs text-gray-300">
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        {msg.steps.map((step, idx) => (
                                                            <li key={idx}>{step}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isChatLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white/10 rounded-2xl rounded-bl-none px-4 py-2 flex items-center">
                                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                            </ScrollArea>
                            <form onSubmit={handleChatSubmit} className="p-3 border-t border-white/10 bg-black/40 flex items-center gap-2">
                                <Input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Scrivi un messaggio..."
                                    className="bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-muted-foreground"
                                    autoFocus
                                />
                                <Button size="icon" type="submit" disabled={!chatInput.trim() || isChatLoading} className="bg-white/10 hover:bg-white/20 text-pink-500 rounded-full h-8 w-8">
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    )}

                    {/* TICKET TAB */}
                    {activeTab === "ticket" && (
                        <div className="h-full p-6 flex flex-col">
                            {ticketSuccessId ? (
                                <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in spin-in-1">
                                    <div className="h-16 w-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4 border border-green-500/50">
                                        <CheckIcon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Richiesta inviata!</h3>
                                    <p className="text-sm text-gray-400 mb-6">
                                        Ti risponderemo via email il prima possibile.<br />
                                        <span className="text-xs opacity-70">Codice richiesta:</span> <span className="font-mono text-green-400">{ticketSuccessId}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground mb-8">
                                        Ti risponderemo via email il prima possibile.
                                    </p>
                                    <Button
                                        onClick={() => {
                                            setTicketSuccessId(null);
                                            setIsOpen(false);
                                            setActiveTab("faq");
                                        }}
                                        variant="outline"
                                        className="border-white/10 text-white hover:bg-white/10"
                                    >
                                        Torna alla dashboard
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="text-center mb-4 shrink-0">
                                        <h3 className="text-lg font-bold text-white">Contatta il Supporto</h3>
                                        <p className="text-xs text-muted-foreground">Compila il form per aprire un ticket.</p>
                                    </div>
                                    <form onSubmit={handleTicketSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">

                                        {/* Category Select */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-gray-400">Categoria</label>
                                            <Select value={ticketCategory} onValueChange={setTicketCategory}>
                                                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white h-9">
                                                    <SelectValue placeholder="Seleziona..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="account">Account</SelectItem>
                                                    <SelectItem value="social">Social</SelectItem>
                                                    <SelectItem value="publishing">Pubblicazione</SelectItem>
                                                    <SelectItem value="ai_generation">AI Studio</SelectItem>
                                                    <SelectItem value="billing">Pagamenti</SelectItem>
                                                    <SelectItem value="technical">Tecnico</SelectItem>
                                                    <SelectItem value="other">Altro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Message Textarea */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between">
                                                <label className="text-xs font-medium text-gray-400">Messaggio</label>
                                                <span className={cn("text-[10px]", ticketMessage.length < 30 ? "text-red-400" : "text-gray-500")}>
                                                    {ticketMessage.length}/2000
                                                </span>
                                            </div>
                                            <Textarea
                                                value={ticketMessage}
                                                onChange={(e) => setTicketMessage(e.target.value)}
                                                placeholder="Descrivi il problema in dettaglio (min 30 caratteri)..."
                                                className="bg-white/5 border-white/10 focus:border-pink-500 text-white min-h-[140px] text-sm resize-none"
                                            />
                                        </div>

                                        {/* Consent Checkbox */}
                                        <div className="flex items-start space-x-2 pt-2">
                                            <Checkbox
                                                id="consent"
                                                checked={ticketConsent}
                                                onCheckedChange={(c) => setTicketConsent(c === true)}
                                                className="border-white/30 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500 mt-0.5"
                                            />
                                            <label
                                                htmlFor="consent"
                                                className="text-[11px] text-gray-400 leading-tight cursor-pointer select-none"
                                            >
                                                Acconsento all'invio di queste informazioni (inclusi log e screenshot) al team di supporto.
                                            </label>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full bg-instagram-gradient text-white font-bold h-10 mt-2"
                                            disabled={isTicketSending || ticketMessage.length < 30 || !ticketCategory || !ticketConsent}
                                        >
                                            {isTicketSending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invia Richiesta"}
                                        </Button>
                                    </form>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Toggle Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-14 h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110",
                    isOpen ? "bg-white text-black rotate-45" : "bg-instagram-gradient text-white"
                )}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </Button>
        </div>
    );
}
