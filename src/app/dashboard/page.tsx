"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { NotificationBell } from "@/components/NotificationBell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Calendar as CalendarIcon, MessageCircle, Heart, Share2, MoreHorizontal, MessageSquare, ArrowRight, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { EngagementChart } from "@/components/dashboard/EngagementChart";
import { toast } from "sonner";

function DashboardCommentItem({ comment }: { comment: any }) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReply = async () => {
        if (!replyText.trim()) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/instagram/reply-comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentId: comment.id, message: replyText })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Risposta inviata!");
                setReplyText("");
                setIsReplying(false);
            } else {
                toast.error("Errore: " + (data.error || "Impossibile rispondere"));
            }
        } catch (err) {
            toast.error("Errore di rete nell'invio della risposta");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback>{comment.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <p className="text-xs font-bold">{comment.username || "Utente"}</p>
                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="text-[10px] text-blue-400 hover:text-blue-300 font-bold"
                        >
                            {isReplying ? "Annulla" : "Rispondi"}
                        </button>
                    </div>
                    <p className="text-sm mt-0.5 text-white/90 truncate">{comment.text}</p>
                </div>
            </div>
            {isReplying && (
                <div className="flex gap-2 animate-in slide-in-from-top-1 px-1">
                    <Input
                        autoFocus
                        placeholder="Scrivi una risposta..."
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        className="h-8 bg-white/5 border-white/10 text-xs text-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                    />
                    <Button
                        size="sm"
                        className="h-8 bg-blue-600 hover:bg-blue-500 text-white shrink-0"
                        disabled={isSubmitting || !replyText.trim()}
                        onClick={handleReply}
                    >
                        {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    </Button>
                </div>
            )}
        </div>
    );
}


export default function DashboardPage() {
    const { t } = useTranslation();
    const [tiktokData, setTiktokData] = useState<{ followers: number, views: number, likes: number, videos: number, display_name?: string, recent_comments?: any[] } | null>(null);
    const [dashboardStats, setDashboardStats] = useState<any>(null);
    const [dashboardInbox, setDashboardInbox] = useState<any[]>([]); // New state for DMs
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const [ttRes, statsRes, igRes, inboxRes] = await Promise.all([
                    fetch('/api/tiktok/analytics'),
                    fetch('/api/dashboard/stats'),
                    fetch('/api/instagram/analytics'),
                    fetch('/api/instagram/inbox') // Fetch real DMs
                ]);

                if (ttRes.ok) {
                    const data = await ttRes.json();
                    setTiktokData(data); // Will hold TikTok specific stats
                }

                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setDashboardStats(data);
                }

                if (igRes.ok) {
                    const igData = await igRes.json();
                    if (igData.success || igData.recent_comments) {
                        setTiktokData(prev => ({
                            ...(prev || { followers: 0, views: 0, likes: 0, videos: 0 }),
                            recent_comments: igData.recent_comments || []
                        }));
                    }
                }

                if (inboxRes.ok) {
                    const inboxData = await inboxRes.json();
                    if (inboxData.success && inboxData.chats) {
                        setDashboardInbox(inboxData.chats.slice(0, 3)); // Store latest 3 chats
                    }
                }

            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAnalytics();
    }, []);


    return (
        <div className="space-y-8 pb-10 text-white">
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-3xl bg-instagram-gradient p-10 text-white shadow-2xl">
                <div className="relative z-10 space-y-4 max-w-2xl">
                    <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-md">
                        Bentornato, {tiktokData?.display_name || "Automazioni AI"}! 🚀
                    </h1>
                    <p className="text-xl font-medium text-white/90">
                        Il tuo assistente AI è pronto. Oggi è il giorno perfetto per lanciare il prossimo trend.
                    </p>
                    <div className="flex gap-4 pt-4">
                        <Link href="/new-post">
                            <button className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg flex items-center">
                                <Plus className="mr-2 w-5 h-5" /> Crea Subito
                            </button>
                        </Link>
                        <Link href="/calendar">
                            <button className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-6 py-3 rounded-full font-bold hover:bg-white/30 transition-all flex items-center">
                                <CalendarIcon className="mr-2 w-5 h-5" /> Vedi Calendario
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Abstract Shapes Decoration */}
                <div className="absolute -right-20 -top-40 w-96 h-96 bg-yellow-300 rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-pulse" />
                <div className="absolute -right-20 bottom-0 w-80 h-80 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-50" />
            </section>

            {/* Header (Stats Summary) */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Panoramica Canale</h1>
                    <p className="text-sm text-muted-foreground">Performance in tempo reale</p>
                </div>
                <div className="flex items-center gap-4">
                    <NotificationBell />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Follower Totali</CardTitle>
                        <Heart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? "..." : (dashboardStats?.stats?.followers >= 1000 ? `${(dashboardStats.stats.followers / 1000).toFixed(1)}K` : (dashboardStats?.stats?.followers || "0"))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {dashboardStats?.stats?.followers !== undefined ? "Dati aggregati reali" : "Social non connessi"}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">TikTok Views</CardTitle>
                        <Share2 className="h-4 w-4 text-pink-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? "..." : (tiktokData !== null ? (tiktokData.views >= 1000 ? `${(tiktokData.views / 1000).toFixed(1)}K` : tiktokData.views) : "N / A")}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {tiktokData !== null ? `Ultimi video: ${tiktokData.videos}` : "Configura account"}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Crediti Residui</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats?.stats?.credits || 0}</div>
                        <p className="text-xs text-muted-foreground">Disponibili per task AI</p>
                    </CardContent>
                </Card>
            </div>

            {/* Engagement Overview (Moved here for visibility) */}
            <div className="grid gap-6">
                <EngagementChart />
            </div>

            {/* WIDGETS GRIDS */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* WIDGET 1: Ultimi Commenti */}
                <Card className="bg-black/40 border-white/10 backdrop-blur-xl col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Ultimi Commenti</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">Interazioni recenti sui tuoi post</p>
                        </div>
                        <Link href="/profiles">
                            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                                Vedi tutti <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {isLoading ? (
                            <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : tiktokData?.recent_comments && tiktokData.recent_comments.length > 0 ? (
                            tiktokData.recent_comments.map((comment: any, idx: number) => (
                                <DashboardCommentItem key={idx} comment={comment} />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-center">
                                <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                                <p>Nessun commento recente.</p>
                                <p className="text-xs mt-1">Le interazioni reali verranno visualizzate qui.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* WIDGET 2: Ultimi Messaggi (Direct) */}
                <Card className="bg-black/40 border-white/10 backdrop-blur-xl col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Messaggi Diretti</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">Chat in attesa di risposta</p>
                        </div>
                        <Link href="/inbox">
                            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                                Apri Inbox <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {isLoading ? (
                            <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                        ) : dashboardInbox && dashboardInbox.length > 0 ? (
                            dashboardInbox.map((chat: any, idx: number) => (
                                <Link href="/inbox" key={idx}>
                                    <div className="flex gap-3 bg-white/5 p-3 rounded-lg border border-white/5 hover:bg-white/10 transition-colors cursor-pointer mb-3">
                                        <Avatar className="w-10 h-10 shrink-0 border border-white/10">
                                            <AvatarFallback>{chat.user.name[0]?.toUpperCase() || "U"}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-bold truncate pr-2">{chat.user.name}</p>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{chat.time}</span>
                                            </div>
                                            <p className="text-xs mt-0.5 text-muted-foreground truncate">{chat.lastMessage}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-center">
                                <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                                <p>Nessun messaggio diretto.</p>
                                <p className="text-xs mt-1">La tua casella è vuota.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
