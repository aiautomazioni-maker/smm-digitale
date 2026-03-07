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


export default function DashboardPage() {
    const { t } = useTranslation();
    const [tiktokData, setTiktokData] = useState<{ followers: number, views: number, likes: number, videos: number, display_name?: string } | null>(null);
    const [dashboardStats, setDashboardStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const [ttRes, statsRes] = await Promise.all([
                    fetch('/api/tiktok/analytics'),
                    fetch('/api/dashboard/stats')
                ]);

                if (ttRes.ok) {
                    const data = await ttRes.json();
                    setTiktokData(data);
                }

                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setDashboardStats(data);
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
                    <CardContent className="space-y-4">
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-center">
                            <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                            <p>Nessun commento recente.</p>
                            <p className="text-xs mt-1">Le interazioni reali verranno visualizzate qui.</p>
                        </div>
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
                        <p className="text-sm text-muted-foreground text-center py-10">
                            Nessun messaggio diretto.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
