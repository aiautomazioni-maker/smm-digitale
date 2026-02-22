"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, DollarSign, BarChart3, TrendingUp, Target, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

// Mock Data for Ads
const ACTIVE_ADS = [
    {
        id: 1,
        name: "Promo San Valentino - Instagram",
        platform: "Instagram",
        status: "active",
        budget: 150, // Total budget
        spent: 89.50, // Spent so far
        results: { clicks: 342, cpc: 0.26, reach: 12500 }
    },
    {
        id: 2,
        name: "Lead Gen - LinkedIn Webinar",
        platform: "LinkedIn",
        status: "active",
        budget: 500,
        spent: 120.00,
        results: { clicks: 45, cpc: 2.66, reach: 2100 }
    }
];

const COMPLETED_ADS = [
    {
        id: 3,
        name: "Saldi Invernali - Facebook",
        platform: "Facebook",
        status: "completed",
        budget: 300,
        spent: 300,
        results: { clicks: 850, cpc: 0.35, reach: 45000 }
    }
];

export default function AdsPage() {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Megaphone className="w-8 h-8 text-primary" /> Gestione Sponsorizzate
                    </h1>
                    <p className="text-muted-foreground">Monitora le tue campagne pubblicitarie e il budget.</p>
                </div>
                <Link href="/new-post">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                        <Plus className="w-4 h-4 mr-2" /> Nuova Campagna
                    </Button>
                </Link>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                            Budget Totale (Mensile) <DollarSign className="w-4 h-4 text-emerald-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">€1,250.00</div>
                        <Progress value={65} className="h-2 mt-3 bg-muted" />
                        <p className="text-xs text-muted-foreground mt-2">Spesi €812.50 (65%)</p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                            Click Totali <BarChart3 className="w-4 h-4 text-blue-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">4,120</div>
                        <p className="text-xs text-emerald-400 mt-1 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" /> CPC Medio: €0.42
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                            Conversioni <Target className="w-4 h-4 text-purple-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">145</div>
                        <p className="text-xs text-muted-foreground mt-1">Acquisti / Leads generati</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="active" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="active">Campagne Attive</TabsTrigger>
                    <TabsTrigger value="completed">Completate</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                    {ACTIVE_ADS.map((ad) => (
                        <motion.div
                            key={ad.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-bold">{ad.name}</h3>
                                                <Badge variant="outline" className={`
                                                    ${ad.platform === 'Instagram' ? 'bg-pink-500/10 text-pink-500 border-pink-500/20' :
                                                        ad.platform === 'Facebook' ? 'bg-blue-600/10 text-blue-600 border-blue-600/20' :
                                                            'bg-blue-700/10 text-blue-700 border-blue-700/20'}
                                                `}>
                                                    {ad.platform}
                                                </Badge>
                                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Attiva
                                                </Badge>
                                            </div>
                                            <div className="flex gap-6 text-sm text-muted-foreground">
                                                <span>Reach: <strong>{ad.results.reach.toLocaleString()}</strong></span>
                                                <span>Click: <strong>{ad.results.clicks}</strong></span>
                                                <span>CPC: <strong>€{ad.results.cpc}</strong></span>
                                            </div>
                                        </div>

                                        <div className="min-w-[200px] space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Spesi: €{ad.spent.toFixed(2)}</span>
                                                <span className="text-muted-foreground">Budget: €{ad.budget}</span>
                                            </div>
                                            <Progress value={(ad.spent / ad.budget) * 100} className="h-2" />
                                            <div className="flex justify-end">
                                                <Button variant="outline" size="sm">Gestisci</Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                    {COMPLETED_ADS.map((ad) => (
                        <Card key={ad.id} className="opacity-75">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-bold">{ad.name}</h3>
                                            <Badge variant="secondary">{ad.platform}</Badge>
                                            <Badge variant="secondary"><CheckCircle2 className="w-3 h-3 mr-1" /> Completata</Badge>
                                        </div>
                                        <div className="flex gap-6 text-sm text-muted-foreground">
                                            <span>Reach: <strong>{ad.results.reach.toLocaleString()}</strong></span>
                                            <span>Click: <strong>{ad.results.clicks}</strong></span>
                                            <span>CPC: <strong>€{ad.results.cpc}</strong></span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg">€{ad.spent.toFixed(2)}</p>
                                        <p className="text-sm text-muted-foreground">Budget speso</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    );
}
