"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, DollarSign, BarChart3, TrendingUp, Target, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";


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
                        <div className="text-3xl font-bold">€0.00</div>
                        <Progress value={0} className="h-2 mt-3 bg-muted" />
                        <p className="text-xs text-muted-foreground mt-2">Nessuna spesa rilevata</p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                            Click Totali <BarChart3 className="w-4 h-4 text-blue-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            CPC Medio: €0.00
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
                        <div className="text-3xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground mt-1">Nessuna conversione di marketing</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="active" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="active">Campagne Attive</TabsTrigger>
                    <TabsTrigger value="completed">Completate</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                            <Megaphone className="w-12 h-12 text-muted-foreground/20 mb-4" />
                            <h3 className="text-lg font-semibold">Nessuna campagna attiva</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Collega il tuo Business Manager per visualizzare e gestire le sponsorizzate.
                            </p>
                            <Button variant="outline" size="sm">Collega Account Ads</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                    <div className="text-center py-20 text-muted-foreground">
                        <p>Non ci sono campagne completate registrate.</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

            </Tabs >
        </div >
    );
}
