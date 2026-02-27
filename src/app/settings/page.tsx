"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { checkTikTokConnection } from "./actions";
import { useTranslation } from "@/context/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Share2, Wand2, Bell, Save, CheckCircle2, Globe, Link as LinkIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";

function SettingsPageContent() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    // Form states (mocked for UI)
    const [profile, setProfile] = useState({ name: "Test User", email: "testuser@example.com" });
    const [aiPrefs, setAiPrefs] = useState({ tone: "friendly", length: "medium", creativity: "0.8" });
    const [notifications, setNotifications] = useState({ emailPosts: true, weeklyReport: true, creditAlerts: false });
    const [isTikTokConnected, setIsTikTokConnected] = useState(false);

    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const checkConnection = async () => {
            const connected = await checkTikTokConnection();
            setIsTikTokConnected(connected);
        };
        checkConnection();

        if (searchParams.get('tiktok') === 'success') {
            setIsTikTokConnected(true);
            toast.success("TikTok collegato con successo!");
            // Remove param from URL
            router.replace('/settings');
        }
    }, [searchParams, router]);

    const handleConnectTikTok = () => {
        setLoading(true);
        // Redirect to our internal login bridge
        window.location.href = '/api/auth/tiktok/login';
    };

    const handleSave = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.success("Impostazioni salvate con successo!");
        }, 1000);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("Impostazioni")}</h1>
                <p className="text-muted-foreground">Gestisci il tuo account e personalizza l'esperienza dell'IA.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full sm:w-[600px] grid-cols-4 bg-white/5 border border-white/10">
                    <TabsTrigger value="profile"><User className="w-4 h-4 mr-2 hidden sm:block" /> Profilo</TabsTrigger>
                    <TabsTrigger value="social"><Share2 className="w-4 h-4 mr-2 hidden sm:block" /> Social</TabsTrigger>
                    <TabsTrigger value="ai"><Wand2 className="w-4 h-4 mr-2 hidden sm:block" /> Preferenze AI</TabsTrigger>
                    <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2 hidden sm:block" /> Notifiche</TabsTrigger>
                </TabsList>

                {/* PROFILO */}
                <TabsContent value="profile" className="space-y-6">
                    <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle>Profilo Account</CardTitle>
                            <CardDescription>Aggiorna le tue informazioni personali associate all'account.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <Input id="name" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Indirizzo Email</Label>
                                <Input id="email" type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} className="bg-white/5 border-white/10" disabled />
                                <p className="text-xs text-muted-foreground mt-1">L'indirizzo email non può essere modificato qui. Contatta il supporto.</p>
                            </div>
                            <div className="pt-4 border-t border-white/10">
                                <h3 className="font-medium mb-4">Password</h3>
                                <Button variant="outline" className="border-white/10">Richiedi reset password</Button>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-white/10 pt-6">
                            <Button onClick={handleSave} disabled={loading} className="bg-instagram-gradient">
                                <Save className="w-4 h-4 mr-2" /> Salva Modifiche
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* SOCIAL INTEGRATIONS */}
                <TabsContent value="social" className="space-y-6">
                    <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle>Integrazioni Social</CardTitle>
                            <CardDescription>Collega i tuoi account per la pubblicazione automatica e l'analisi dei dati.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {[
                                { name: 'Instagram', connected: true, accountName: '@caffeartisan' },
                                { name: 'Facebook', connected: false, accountName: null },
                                { name: 'LinkedIn', connected: true, accountName: 'Caffè Artisan Srl' },
                                { name: 'TikTok', connected: isTikTokConnected, accountName: isTikTokConnected ? '@testcreator' : null }
                            ].map(social => (
                                <div key={social.name} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                            <Globe className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{social.name}</p>
                                            {social.connected ? (
                                                <div className="flex items-center text-xs text-green-400 mt-1">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Connesso come {social.accountName}
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                                    <AlertCircle className="w-3 h-3 mr-1" /> Non connesso
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant={social.connected ? "outline" : "default"}
                                        size="sm"
                                        className={social.connected ? "border-white/10" : "bg-white text-black hover:bg-white/90"}
                                        onClick={() => {
                                            if (social.name === 'TikTok' && !social.connected) {
                                                handleConnectTikTok();
                                            } else if (!social.connected) {
                                                handleSave();
                                            }
                                        }}
                                    >
                                        {social.connected ? "Disconnetti" : <><LinkIcon className="w-4 h-4 mr-2" /> Connetti</>}
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* AI PREFERENCES */}
                <TabsContent value="ai" className="space-y-6">
                    <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle>Preferenze Intelligenza Artificiale</CardTitle>
                            <CardDescription>Imposta le direttive base per la generazione di contenuti e immagini.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="space-y-2">
                                <Label>Tono di Voce Predefinito</Label>
                                <Select value={aiPrefs.tone} onValueChange={v => setAiPrefs({ ...aiPrefs, tone: v })}>
                                    <SelectTrigger className="bg-white/5 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="friendly">Amichevole e Informale</SelectItem>
                                        <SelectItem value="professional">Professionale / Corporate</SelectItem>
                                        <SelectItem value="ironic">Ironico e Divertente</SelectItem>
                                        <SelectItem value="luxury">Lusso ed Esclusivo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Lunghezza Predefinita Caption</Label>
                                <Select value={aiPrefs.length} onValueChange={v => setAiPrefs({ ...aiPrefs, length: v })}>
                                    <SelectTrigger className="bg-white/5 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="short">Corta (1-2 paragrafi)</SelectItem>
                                        <SelectItem value="medium">Media (Ideale per Instagram)</SelectItem>
                                        <SelectItem value="long">Lunga (Mini-blog / LinkedIn)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Livello di Creatività AI (Temperatura)</Label>
                                <Select value={aiPrefs.creativity} onValueChange={v => setAiPrefs({ ...aiPrefs, creativity: v })}>
                                    <SelectTrigger className="bg-white/5 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0.4">Bassa (Fattuale, precisa)</SelectItem>
                                        <SelectItem value="0.8">Bilanciata (Consigliata)</SelectItem>
                                        <SelectItem value="1.2">Alta (Più originale e rischiosa)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-2">Valori più alti produrranno testi più creativi ma potenzialmente meno coerenti con il tuo brand kit.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-white/10 pt-6">
                            <Button onClick={handleSave} disabled={loading} className="bg-instagram-gradient">
                                <Save className="w-4 h-4 mr-2" /> Salva Modifiche
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* NOTIFICATIONS */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle>Preferenze Notifiche</CardTitle>
                            <CardDescription>Gestisci quando e come desideri essere contattato.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="emailPosts" className="flex flex-col space-y-1">
                                    <span>Conferma Pubblicazione</span>
                                    <span className="font-normal text-xs text-muted-foreground">Ricevi un'email quando un post programmato viene pubblicato.</span>
                                </Label>
                                <Switch id="emailPosts" checked={notifications.emailPosts} onCheckedChange={v => setNotifications({ ...notifications, emailPosts: v })} />
                            </div>
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="weeklyReport" className="flex flex-col space-y-1">
                                    <span>Report Settimanale</span>
                                    <span className="font-normal text-xs text-muted-foreground">Ricevi un riepilogo delle performance dei tuoi post ogni lunedì.</span>
                                </Label>
                                <Switch id="weeklyReport" checked={notifications.weeklyReport} onCheckedChange={v => setNotifications({ ...notifications, weeklyReport: v })} />
                            </div>
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="creditAlerts" className="flex flex-col space-y-1">
                                    <span>Avviso Crediti in Esaurimento</span>
                                    <span className="font-normal text-xs text-muted-foreground">Ricevi un avviso quando i tuoi crediti mensili scendono sotto il 20%.</span>
                                </Label>
                                <Switch id="creditAlerts" checked={notifications.creditAlerts} onCheckedChange={v => setNotifications({ ...notifications, creditAlerts: v })} />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-white/10 pt-6">
                            <Button onClick={handleSave} disabled={loading} className="bg-instagram-gradient">
                                <Save className="w-4 h-4 mr-2" /> Salva Modifiche
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black text-white">Caricamento impostazioni...</div>}>
            <SettingsPageContent />
        </Suspense>
    );
}
