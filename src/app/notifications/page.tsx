"use client";

import { useTranslation } from "@/context/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Repeat, Share2, Info, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Dati mockati
const socialNotifications = [
    { id: 1, type: "social", subType: "like", icon: Heart, color: "text-red-500", title: "Automazioni AI", desc: "A Marco Rossi e altri 45 piace il tuo nuovo video tutorial sull'AI.", time: "10m fa", unread: true },
    { id: 2, type: "social", subType: "comment", icon: MessageCircle, color: "text-blue-500", title: "Nuovo Commento", desc: "Giulia Bianchi ha commentato: 'Software incredibile, mi ha dimezzato i tempi di editing!'", time: "2h fa", unread: true },
    { id: 3, type: "social", subType: "repost", icon: Repeat, color: "text-green-500", title: "Condivisione", desc: "Il tuo ultimo carosello è stato condiviso da @ai.business.growth", time: "5h fa", unread: false },
    { id: 4, type: "social", subType: "dm", icon: Share2, color: "text-purple-500", title: "Messaggio Diretto", desc: "Hai ricevuto una richiesta di consulenza da Luca Verdi.", time: "1g fa", unread: false },
];

const systemNotifications = [
    { id: 1, type: "system", icon: AlertTriangle, color: "text-amber-500", title: "Crediti in esaurimento", desc: "Attenzione: hai consumato l'80% dei tuoi crediti AI mensili. Considera di fare un upgrade al piano superiore per non interrompere la generazione automatica dei post.", time: "1h fa", unread: true },
    { id: 2, type: "system", icon: CheckCircle2, color: "text-emerald-500", title: "Pagamento Ricevuto", desc: "Il tuo rinnovo mensile al piano Professional è andato a buon fine. Ricevuta inviata per email.", time: "2g fa", unread: false },
    { id: 3, type: "system", icon: Info, color: "text-blue-500", title: "Aggiornamento Piattaforma v2.4", desc: "Abbiamo introdotto nuove funzionalità nel Brand Kit AI e migliorato la generazione delle Caption. Entra subito per provarle!", time: "5g fa", unread: false },
    { id: 4, type: "system", icon: ShieldAlert, color: "text-red-500", title: "Token TikTok Scaduto", desc: "Il token di accesso al profilo 'Automazioni AI' è scaduto. Ricollegalo per continuare a pubblicare via AI.", time: "1 sett fa", unread: false },
];

export default function NotificationsPage() {
    const { t } = useTranslation();

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("nav.notifications")}</h1>
                <p className="text-muted-foreground">Resta aggiornato sulle ultime interazioni e sui messaggi di sistema.</p>
            </div>

            <Tabs defaultValue="social" className="space-y-6">
                <TabsList className="grid w-full sm:w-[400px] grid-cols-2 bg-white/5 border border-white/10">
                    <TabsTrigger value="social">Notifiche Social (4)</TabsTrigger>
                    <TabsTrigger value="system">Notifiche di Sistema (1)</TabsTrigger>
                </TabsList>

                {/* SOCIAL NOTIFICATIONS */}
                <TabsContent value="social">
                    <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                        <CardContent className="p-0 divide-y divide-white/10">
                            {socialNotifications.map((notif) => {
                                const Icon = notif.icon;
                                return (
                                    <div key={notif.id} className={`p-4 flex gap-4 items-start transition-colors hover:bg-white/5 ${notif.unread ? "bg-white/[0.02]" : ""}`}>
                                        <div className={`mt-1 p-2 rounded-full bg-white/5 ${notif.color}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className={`font-medium ${notif.unread ? "text-white" : "text-foreground"}`}>{notif.title}</h3>
                                                <span className="text-xs text-muted-foreground">{notif.time}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{notif.desc}</p>
                                        </div>
                                        {notif.unread && (
                                            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SYSTEM NOTIFICATIONS */}
                <TabsContent value="system">
                    <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                        <CardContent className="p-0 divide-y divide-white/10">
                            {systemNotifications.map((notif) => {
                                const Icon = notif.icon;
                                return (
                                    <div key={notif.id} className={`p-4 flex gap-4 items-start transition-colors hover:bg-white/5 ${notif.unread ? "bg-white/[0.02]" : ""}`}>
                                        <div className={`mt-1 p-2 rounded-full bg-white/5 ${notif.color}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className={`font-medium ${notif.unread ? "text-white" : "text-foreground"}`}>{notif.title}</h3>
                                                <span className="text-xs text-muted-foreground">{notif.time}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{notif.desc}</p>

                                            {/* Action buttons per tipologie specifiche */}
                                            {notif.id === 1 && (
                                                <Link href="/pricing" className="inline-block mt-2">
                                                    <Button size="sm" className="bg-instagram-gradient">Esegui Upgrade</Button>
                                                </Link>
                                            )}
                                            {notif.id === 4 && (
                                                <Link href="/settings" className="inline-block mt-2">
                                                    <Button size="sm" variant="outline" className="border-white/10">Vai a Impostazioni Social</Button>
                                                </Link>
                                            )}
                                        </div>
                                        {notif.unread && (
                                            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
