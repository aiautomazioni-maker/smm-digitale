"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { NotificationBell } from "@/components/NotificationBell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Calendar as CalendarIcon, MessageCircle, Heart, Share2, MoreHorizontal, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EngagementChart } from "@/components/dashboard/EngagementChart";

// Mock Data
const RECENT_COMMENTS = [
    { id: 1, user: { name: "Marco B.", handle: "@marcob_digital", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d" }, text: "Quanto costa implementare un chatbot per il mio e-commerce?", time: "2h fa", postImg: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=100&q=80" },
    { id: 2, user: { name: "Sara Tech", handle: "@sara_tech", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d" }, text: "L'integrazione con WhatsApp è geniale! 🚀", time: "5h fa", postImg: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=100&q=80" },
    { id: 3, user: { name: "Luca Neri", handle: "@lneri88", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026034d" }, text: "Fate anche automazioni per lead generation su Facebook?", time: "1g fa", postImg: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=100&q=80" },
];

const RECENT_MESSAGES = [
    { id: 1, user: { name: "Tech Advisor Hub", platform: "instagram", avatar: "https://i.pravatar.cc/150?u=a04258a2462d826712d" }, text: "Ciao! Vorremmo capire meglio come funziona il vostro content engine per agenzie.", time: "10:42", unread: true },
    { id: 2, user: { name: "Giovanni Bianchi", platform: "facebook", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026714d" }, text: "Avete casistiche di successo su b2b?", time: "Ieri", unread: false },
    { id: 3, user: { name: "Elena Verdi", platform: "instagram", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026724d" }, text: "Grazie per la demo di ieri, molto utile.", time: "Lun", unread: false },
];

export default function DashboardPage() {
    const { t } = useTranslation();
    const [tiktokData, setTiktokData] = useState<{ followers: number, views: number, likes: number, display_name?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const res = await fetch('/api/tiktok/analytics');
                if (res.ok) {
                    const data = await res.json();
                    setTiktokData(data);
                }
            } catch (err) {
                console.error("Failed to fetch TikTok analytics", err);
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
                            {isLoading ? "..." : (tiktokData?.followers ? `${(tiktokData.followers / 1000).toFixed(1)}K` : "42.8K")}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {tiktokData?.followers ? "Dati reali TikTok" : "+8.1% dal mese scorso"}
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
                            {isLoading ? "..." : (tiktokData?.views ? `${(tiktokData.views / 1000).toFixed(1)}K` : "128.4K")}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {tiktokData?.views ? "Ultimi 10 video" : "+45% (Effetto virale 🚀)"}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lead Generati</CardTitle>
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+184</div>
                        <p className="text-xs text-muted-foreground">+22% rispetto a ieri</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Automazioni Attive</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">14</div>
                        <p className="text-xs text-muted-foreground">Bot e workflow in esecuzione</p>
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
                    <CardContent className="space-y-4">
                        {RECENT_COMMENTS.map((comment) => (
                            <div key={comment.id} className="flex items-start gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                <Avatar className="w-10 h-10 border border-white/10">
                                    <AvatarImage src={comment.user.avatar} />
                                    <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">{comment.user.name}</span>
                                            <span className="text-xs text-muted-foreground">{comment.user.handle}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground text-right">{comment.time}</span>
                                    </div>
                                    <p className="text-sm text-gray-300 line-clamp-2">{comment.text}</p>
                                </div>
                                <div className="w-12 h-12 rounded overflow-hidden shrink-0 border border-white/10">
                                    <img src={comment.postImg} alt="Post" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        ))}
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
                    <CardContent className="space-y-4">
                        {RECENT_MESSAGES.map((msg) => (
                            <div key={msg.id} className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${msg.unread ? 'bg-white/10 border border-white/5' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}>
                                <div className="relative">
                                    <Avatar className="w-10 h-10 border border-white/10">
                                        <AvatarImage src={msg.user.avatar} />
                                        <AvatarFallback>{msg.user.name[0]}</AvatarFallback>
                                    </Avatar>
                                    {msg.user.platform === 'instagram' && <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 border border-black flex items-center justify-center text-[8px] text-white">IG</div>}
                                    {msg.user.platform === 'facebook' && <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 border border-black flex items-center justify-center text-[8px] text-white">f</div>}
                                </div>
                                <div className="flex-1 space-y-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm truncate ${msg.unread ? 'font-bold text-white' : 'font-medium text-gray-200'}`}>{msg.user.name}</span>
                                        <span className={`text-xs ml-2 shrink-0 ${msg.unread ? 'text-blue-400 font-bold' : 'text-muted-foreground'}`}>{msg.time}</span>
                                    </div>
                                    <p className={`text-sm truncate ${msg.unread ? 'text-gray-100 font-medium' : 'text-gray-400'}`}>{msg.text}</p>
                                </div>
                                {msg.unread && (
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
