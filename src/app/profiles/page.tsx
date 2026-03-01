"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Heart, MessageCircle, MoreHorizontal, Send, PlayCircle, Loader2, Sparkles, Wand2, Settings2, Image as ImageIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/context/LanguageContext";
import { toast } from "sonner";
import { createRepurposePlan, RepurposePlanResponse } from "@/lib/story-engine";

// Mock Profiles Data
const PROFILES = [
    {
        id: "tiktok",
        name: "Automazioni AI",
        handle: "@automazioniai",
        platform: "TikTok",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=200",
        stats: {
            followers: "0",
            likes: "0",
            posts: "0",
            engagement: "0%"
        },
        posts: []
    },
    {
        id: "ig-main",
        name: "Automazioni AI",
        handle: "@automazioniai",
        platform: "Instagram",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=200",
        stats: {
            followers: "15.7K",
            following: "890",
            posts: "156",
            engagement: "5.2%"
        },
        posts: [
            { id: 1, image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e", likes: 450, comments: 24, commentList: [{ user: "ai_enthusiast", text: "Questa automazione è geniale!", time: "2h" }, { user: "business_pro", text: "Ottimo workflow 🚀", time: "5h" }] },
            { id: 2, image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5", likes: 320, comments: 15, commentList: [{ user: "growth_hacker", text: "Software rivoluzionario 💎", time: "1g" }] },
            { id: 3, image: "https://images.unsplash.com/photo-1518770660439-4636190af475", likes: 510, comments: 42, commentList: [{ user: "dev_master", text: "Integrazione perfetta", time: "2g" }] },
            { id: 4, image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b", likes: 215, comments: 18, commentList: [] },
            { id: 5, image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1", likes: 180, comments: 8, commentList: [] },
            { id: 6, image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa", likes: 640, comments: 75, commentList: [] },
        ]
    }
];

import { useEffect } from "react";

export default function ProfilesPage() {
    const { t } = useTranslation();
    const [selectedProfileId, setSelectedProfileId] = useState("tiktok");
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [tiktokInfo, setTiktokInfo] = useState<any>(null);

    // Repurpose Flow States
    const [repurposeMode, setRepurposeMode] = useState<"disabled" | "config" | "loading" | "preview">("disabled");
    const [repurposePlan, setRepurposePlan] = useState<RepurposePlanResponse | null>(null);
    const [rfCount, setRfCount] = useState([3]);
    const [rPreset, setRPreset] = useState("modern");
    const [rCtaType, setRCtaType] = useState("link");
    const [rCtaValue, setRCtaValue] = useState("");

    useEffect(() => {
        async function fetchTikTok() {
            try {
                const res = await fetch('/api/tiktok/analytics');
                if (res.ok) {
                    const data = await res.json();
                    setTiktokInfo(data);
                }
            } catch (err) {
                console.error("Failed to load TikTok profile", err);
            }
        }
        fetchTikTok();
    }, []);

    let profile: any = PROFILES.find(p => p.id === selectedProfileId) || PROFILES[0];

    // Merge real TikTok data if available
    if (selectedProfileId === 'tiktok' && tiktokInfo) {
        profile = {
            ...profile,
            name: tiktokInfo.display_name || profile.name,
            image: tiktokInfo.avatar || profile.image,
            stats: {
                ...profile.stats,
                followers: tiktokInfo.followers >= 1000 ? `${(tiktokInfo.followers / 1000).toFixed(1)}K` : tiktokInfo.followers.toString(),
                likes: tiktokInfo.likes >= 1000 ? `${(tiktokInfo.likes / 1000).toFixed(1)}K` : tiktokInfo.likes.toString(),
                posts: tiktokInfo.videos.toString()
            }
        };
    }

    const resetRepurpose = () => {
        setRepurposeMode("disabled");
        setRepurposePlan(null);
    };

    const handleGenerateRepurpose = () => {
        setRepurposeMode("loading");

        // Simula caricamento API 1.5s
        setTimeout(() => {
            const plan = createRepurposePlan(
                { content_type: "post", caption: "Mock caption", media_urls: [selectedPost?.image || ""] },
                { frames_count: rfCount[0], layout_preset: rPreset as any, cta_type: rCtaType as any, cta_value: rCtaValue, tone: "engaging" },
                { can_publish_story: true, supports_link_sticker: true, supports_interactive_stickers: true }
            );
            setRepurposePlan(plan);
            setRepurposeMode("preview");
            toast.success("Piano Storie generato con successo!");
        }, 1500);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("profiles.title")}</h1>
                    <p className="text-muted-foreground">{t("profiles.subtitle")}</p>
                </div>
                <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder={t("profiles.select")} />
                    </SelectTrigger>
                    <SelectContent>
                        {PROFILES.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.platform}: {p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Profile Header (Instagram Style) */}
            <Card className="bg-card/50 backdrop-blur border-white/10">
                <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
                        {/* Avatar */}
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                                <Avatar className="w-full h-full border-4 border-background">
                                    <AvatarImage src={profile.image} alt={profile.name} className="object-cover" />
                                    <AvatarFallback>{profile.name[0]}</AvatarFallback>
                                </Avatar>
                            </div>
                        </div>

                        {/* Info & Stats */}
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div className="flex flex-col md:flex-row items-center gap-4">
                                <h2 className="text-2xl font-bold">{profile.handle}</h2>
                                <div className="flex gap-2">
                                    <Button variant="secondary" size="sm">{t("profiles.edit")}</Button>
                                    <Button variant="ghost" size="icon"><MoreHorizontal className="w-5 h-5" /></Button>
                                </div>
                            </div>

                            <div className="flex justify-center md:justify-start gap-8 text-sm md:text-base">
                                <div className="text-center md:text-left">
                                    <span className="font-bold block text-lg">{profile.stats.posts}</span> {t("profiles.posts")}
                                </div>
                                <div className="text-center md:text-left">
                                    <span className="font-bold block text-lg">{profile.stats.followers}</span> {t("profiles.followers")}
                                </div>
                                <div className="text-center md:text-left">
                                    <span className="font-bold block text-lg">{profile.stats.following || profile.stats.likes}</span> {profile.platform === 'Instagram' ? t("profiles.following") : t("profiles.likes")}
                                </div>
                            </div>

                            <div className="max-w-md">
                                <p className="font-semibold">{profile.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    🤖 AI Automation Agency <br />
                                    🌐 Scaliamo il tuo business con l'Intelligenza Artificiale <br />
                                    👇 Prenota una consulenza gratuita
                                </p>
                                <a href="https://automazioniai.com" className="text-blue-400 text-sm hover:underline">automazioniai.com</a>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Analytics & Content Tabs */}
            <Tabs defaultValue="posts" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mx-auto md:mx-0">
                    <TabsTrigger value="posts">{t("profiles.tab.feed")}</TabsTrigger>
                    <TabsTrigger value="insights">{t("profiles.tab.insights")}</TabsTrigger>
                </TabsList>

                <TabsContent value="posts">
                    {profile.posts.length > 0 ? (
                        <div className="grid grid-cols-3 gap-1 md:gap-4">
                            {profile.posts.map((post: any) => (
                                <Dialog
                                    key={post.id}
                                    open={selectedPost?.id === post.id}
                                    onOpenChange={(open) => {
                                        if (!open) { setRepurposeMode("disabled"); setSelectedPost(null); }
                                    }}
                                >
                                    <DialogTrigger asChild>
                                        <motion.div
                                            onClick={() => setSelectedPost(post)}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="aspect-square relative group cursor-pointer overflow-hidden rounded-md bg-muted"
                                        >
                                            <img src={post.image} alt="Post" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold">
                                                <div className="flex items-center gap-1"><Heart className="w-5 h-5 fill-white" /> {post.likes}</div>
                                                <div className="flex items-center gap-1"><MessageCircle className="w-5 h-5 fill-white" /> {post.comments}</div>
                                            </div>
                                        </motion.div>
                                    </DialogTrigger>
                                    {selectedPost?.id === post.id && (
                                        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-white/10 flex flex-col md:flex-row h-[80vh] md:h-[600px]">
                                            <DialogTitle className="sr-only">Dettagli Post</DialogTitle>
                                            <DialogDescription className="sr-only">Visualizza dettagli e trasforma il post in storie</DialogDescription>

                                            {/* Immagine */}
                                            <div className="w-full md:w-3/5 bg-black flex items-center justify-center relative border-r border-white/10">
                                                <img src={post.image} alt="Post Detail" className="w-full h-full object-contain" />
                                            </div>

                                            {/* Pannello Lato Destro dinamico in base allo stato Repurpose */}
                                            <div className="w-full md:w-2/5 flex flex-col bg-background/50 h-full relative">

                                                {/* STATO 1: DETTAGLI STANDARD */}
                                                {repurposeMode === "disabled" && (
                                                    <>
                                                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="w-8 h-8"><AvatarImage src={profile.image} /><AvatarFallback>{profile.name[0]}</AvatarFallback></Avatar>
                                                                <span className="font-semibold text-sm">{profile.handle}</span>
                                                            </div>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="bg-black/90 border-white/10">
                                                                    <DropdownMenuItem className="cursor-pointer text-purple-400 focus:text-purple-300 font-bold" onClick={() => setRepurposeMode("config")}>
                                                                        <Wand2 className="w-4 h-4 mr-2" /> 🪄 Trasforma in Storie
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>

                                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                                            {(post.commentList && post.commentList.length > 0) ? post.commentList.map((c: any, i: number) => (
                                                                <div key={i} className="flex gap-3 text-sm">
                                                                    <Avatar className="w-8 h-8"><AvatarFallback>{c.user[0].toUpperCase()}</AvatarFallback></Avatar>
                                                                    <div>
                                                                        <span className="font-semibold mr-2">{c.user}</span>
                                                                        <span>{c.text}</span>
                                                                        <p className="text-[10px] text-muted-foreground mt-1">{c.time}</p>
                                                                    </div>
                                                                </div>
                                                            )) : (
                                                                <p className="text-sm text-muted-foreground text-center py-10">Nessun commento disponibile o simulazione dati limitata.</p>
                                                            )}
                                                        </div>

                                                        <div className="p-4 border-t border-white/10">
                                                            <div className="flex items-center gap-4 mb-3">
                                                                <Heart className="w-6 h-6 hover:text-red-500 cursor-pointer transition-colors" />
                                                                <MessageCircle className="w-6 h-6 hover:text-blue-500 cursor-pointer transition-colors" />
                                                            </div>
                                                            <p className="font-semibold text-sm mb-4">{post.likes} Mi piace</p>
                                                            <div className="flex items-center justify-between mt-2">
                                                                <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20" onClick={() => setRepurposeMode("config")}>
                                                                    <Wand2 className="w-4 h-4 mr-2" /> Trasforma in Storie (AI)
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {/* STATO 2: CONFIGURAZIONE REPURPOSE */}
                                                {repurposeMode === "config" && (
                                                    <div className="flex flex-col h-full bg-gradient-to-b from-purple-900/20 to-black/90">
                                                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Wand2 className="w-5 h-5 text-purple-400" />
                                                                <span className="font-bold text-sm">Repurpose Config</span>
                                                            </div>
                                                            <Button variant="ghost" size="sm" onClick={resetRepurpose}>Annulla</Button>
                                                        </div>

                                                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                                            <div className="space-y-4">
                                                                <label className="text-sm font-semibold flex items-center justify-between">
                                                                    Numero di Frame (Storie)
                                                                    <span className="text-purple-400 font-bold">{rfCount[0]}</span>
                                                                </label>
                                                                <Slider max={5} min={2} step={1} value={rfCount} onValueChange={setRfCount} className="py-2" />
                                                            </div>

                                                            <div className="space-y-2">
                                                                <label className="text-sm font-semibold">Stile Grafico (Preset)</label>
                                                                <Select value={rPreset} onValueChange={setRPreset}>
                                                                    <SelectTrigger className="bg-white/5 border-white/10">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="bg-black border-white/10">
                                                                        <SelectItem value="minimal">Minimal (Pulito, molto spazio)</SelectItem>
                                                                        <SelectItem value="modern">Modern (Testi accentati, badge)</SelectItem>
                                                                        <SelectItem value="bold">Bold (Forte contrasto, testi grandi)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <label className="text-sm font-semibold">Call to Action (Ultimo frame)</label>
                                                                <Select value={rCtaType} onValueChange={setRCtaType}>
                                                                    <SelectTrigger className="bg-white/5 border-white/10">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="bg-black border-white/10">
                                                                        <SelectItem value="link">Link Sticker (URL)</SelectItem>
                                                                        <SelectItem value="poll">Sondaggio (A/B)</SelectItem>
                                                                        <SelectItem value="question">Domanda aperta (Sticker)</SelectItem>
                                                                        <SelectItem value="none">Nessuna CTA (Solo visuale)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            {rCtaType !== "none" && (
                                                                <div className="space-y-2">
                                                                    <label className="text-sm font-semibold">Valore CTA</label>
                                                                    <Input
                                                                        placeholder={rCtaType === 'link' ? "https://tuosito.com/..." : "Scrivi la tua domanda..."}
                                                                        value={rCtaValue}
                                                                        onChange={e => setRCtaValue(e.target.value)}
                                                                        className="bg-white/5 border-white/10"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="p-4 border-t border-white/10 bg-black/50">
                                                            <Button onClick={handleGenerateRepurpose} className="w-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20 py-6 text-lg">
                                                                <Sparkles className="w-5 h-5 mr-2" /> Genera Pipeline
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* STATO 3: CARICAMENTO */}
                                                {repurposeMode === "loading" && (
                                                    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-purple-900/10 to-transparent p-6 text-center space-y-4">
                                                        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                                                        <h3 className="font-bold text-lg">Generazione AI in corso...</h3>
                                                        <p className="text-sm text-muted-foreground">Antigravity engine sta mappando l'immagine, validando le safe area e calcolando i job grafici.</p>
                                                    </div>
                                                )}

                                                {/* STATO 4: ANTEPRIMA PIANO */}
                                                {repurposeMode === "preview" && repurposePlan && (
                                                    <div className="flex flex-col h-full">
                                                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-green-900/20">
                                                            <div className="flex items-center gap-2">
                                                                <Settings2 className="w-5 h-5 text-green-400" />
                                                                <span className="font-bold text-sm">Pipeline Pronta ({repurposePlan.repurpose_plan.frames.length} Frame)</span>
                                                            </div>
                                                            <Button variant="ghost" size="sm" onClick={() => setRepurposeMode("config")}>Modifica</Button>
                                                        </div>

                                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                                            {repurposePlan.warnings.length > 0 && (
                                                                <div className="bg-yellow-900/30 border border-yellow-500/30 p-3 rounded-lg text-xs text-yellow-200">
                                                                    <strong className="block mb-1">⚠️ Avvisi:</strong>
                                                                    <ul className="list-disc pl-4">
                                                                        {repurposePlan.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                                                    </ul>
                                                                </div>
                                                            )}

                                                            <div className="space-y-4">
                                                                {repurposePlan.repurpose_plan.frames.map((frame, i) => (
                                                                    <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                                                                        <div className="flex justify-between items-center mb-2">
                                                                            <span className="font-bold text-sm text-purple-300">Frame {frame.frame_index}</span>
                                                                            <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-muted-foreground">{frame.crop_strategy}</span>
                                                                        </div>
                                                                        {frame.overlay_plan.map((o, idx) => (
                                                                            <div key={idx} className="flex gap-2 items-start bg-black/30 p-2 rounded border border-white/5">
                                                                                <ImageIcon className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                                                                                <div className="text-xs">
                                                                                    <span className="text-gray-400 block mb-0.5">Testo H1 ({o.position_zone} / {o.alignment})</span>
                                                                                    <span className="font-semibold italic">"{o.text}"</span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        {frame.stickers_plan.length > 0 && (
                                                                            <div className="mt-2 text-xs bg-blue-900/20 border border-blue-500/20 p-2 rounded text-blue-200">
                                                                                🎨 Applicato <strong>Sticker {frame.stickers_plan[0].type}</strong>: {frame.stickers_plan[0].value || frame.stickers_plan[0].fallback}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="p-4 border-t border-white/10 bg-black/50 space-y-2">
                                                            <Button onClick={() => { toast.success("Job messi in coda per il rendering grafico!"); resetRepurpose(); }} className="w-full bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20">
                                                                <PlayCircle className="w-4 h-4 mr-2" /> Invia a Render Engine
                                                            </Button>
                                                            <div className="text-center text-[10px] text-muted-foreground pt-1">Generate le JSON specs per i rendering logici.</div>
                                                        </div>
                                                    </div>
                                                )}

                                            </div>
                                        </DialogContent>
                                    )}
                                </Dialog>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-muted-foreground">
                            {t("profiles.no_posts")}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="insights">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">{t("profiles.reach")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">+24.5%</div>
                                <p className="text-xs text-muted-foreground">{t("profiles.reach_desc")}</p>
                                <div className="h-[100px] w-full mt-4 bg-gradient-to-t from-emerald-500/20 to-transparent rounded-lg flex items-end justify-between px-2 pb-2">
                                    {[40, 60, 45, 70, 85, 65, 90].map((h, i) => (
                                        <div key={i} className="w-2 bg-emerald-500 rounded-t" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">{t("profiles.interactions")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">1,240</div>
                                <p className="text-xs text-muted-foreground">{t("profiles.interactions_desc")}</p>
                                <div className="h-[100px] w-full mt-4 bg-gradient-to-t from-blue-500/20 to-transparent rounded-lg flex items-end justify-between px-2 pb-2">
                                    {[30, 45, 35, 50, 60, 40, 75].map((h, i) => (
                                        <div key={i} className="w-2 bg-blue-500 rounded-t" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">{t("profiles.audience")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Milano</div>
                                <p className="text-xs text-muted-foreground">{t("profiles.audience_desc")}</p>
                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-xs"><span>{t("profiles.women")}</span> <span>65%</span></div>
                                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden"><div className="bg-pink-500 h-full w-[65%]" /></div>
                                    <div className="flex justify-between text-xs"><span>{t("profiles.men")}</span> <span>35%</span></div>
                                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden"><div className="bg-blue-500 h-full w-[35%]" /></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
