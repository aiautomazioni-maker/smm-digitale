"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles, Check, Copy, Palette, FileText, Target, Hash } from "lucide-react";
import { BrandInput, BrandKitResponse } from "@/types/brand";
import { generateBrandKit } from "@/lib/brand-service";
import { useTranslation } from "@/context/LanguageContext";

export default function BrandKitPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [brandKit, setBrandKit] = useState<BrandKitResponse | null>(null);
    const [activeTab, setActiveTab] = useState("input");

    const [input, setInput] = useState<BrandInput>({
        lang: "it",
        business_name: "",
        industry: "",
        city: "",
        website: "",
        instagram_handle: "",
        target_audience: "",
        offer: "",
        tone_preferences: "",
        competitors: [],
        notes: ""
    });

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const result = await generateBrandKit(input);
            setBrandKit(result);
            setActiveTab("result");
        } catch (error) {
            console.error("Failed to generate brand kit", error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Toast could act here
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
                    {t("brand_kit.title")}
                </h1>
                <p className="text-muted-foreground">
                    {t("brand_kit.subtitle")}
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full sm:w-[400px] grid-cols-2 bg-white/5 border border-white/10">
                    <TabsTrigger value="input">{t("brand_kit.tab.input")}</TabsTrigger>
                    <TabsTrigger value="result" disabled={!brandKit}>{t("brand_kit.tab.result")}</TabsTrigger>
                </TabsList>

                <TabsContent value="input" className="space-y-6">
                    <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle>{t("brand_kit.form.company")}</CardTitle>
                            <CardDescription>{t("brand_kit.form.company_desc")}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t("brand_kit.form.name")}</Label>
                                    <Input placeholder="Es. Pizzeria Bella Napoli" value={input.business_name} onChange={e => setInput({ ...input, business_name: e.target.value })} className="bg-white/5 border-white/10" />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("brand_kit.form.industry")}</Label>
                                    <Input placeholder="Es. Ristorazione / Food" value={input.industry} onChange={e => setInput({ ...input, industry: e.target.value })} className="bg-white/5 border-white/10" />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("brand_kit.form.city")}</Label>
                                    <Input placeholder="Es. Napoli" value={input.city} onChange={e => setInput({ ...input, city: e.target.value })} className="bg-white/5 border-white/10" />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("brand_kit.form.website")}</Label>
                                    <Input placeholder="www.example.com" value={input.website} onChange={e => setInput({ ...input, website: e.target.value })} className="bg-white/5 border-white/10" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>{t("brand_kit.form.target")}</Label>
                                <Textarea placeholder="Chi sono i tuoi clienti ideali? Es. Famiglie, professionisti in pausa pranzo..." value={input.target_audience} onChange={e => setInput({ ...input, target_audience: e.target.value })} className="bg-white/5 border-white/10" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t("brand_kit.form.tone")}</Label>
                                    <Select onValueChange={val => setInput({ ...input, tone_preferences: val })}>
                                        <SelectTrigger className="bg-white/5 border-white/10">
                                            <SelectValue placeholder="Seleziona..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Amichevole e Informale">🥰 Amichevole e Informale</SelectItem>
                                            <SelectItem value="Professionale e Autorevole">💼 Professionale e Autorevole</SelectItem>
                                            <SelectItem value="Lussuoso ed Esclusivo">💎 Lussuoso ed Esclusivo</SelectItem>
                                            <SelectItem value="Ironico e Divertente">🤪 Ironico e Divertente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("brand_kit.form.offer")}</Label>
                                    <Input placeholder="Es. Pizza verace a lunga lievitazione" value={input.offer} onChange={e => setInput({ ...input, offer: e.target.value })} className="bg-white/5 border-white/10" />
                                </div>
                            </div>

                            <Button onClick={handleGenerate} disabled={loading || !input.business_name} className="w-full bg-instagram-gradient hover:opacity-90 transition-opacity">
                                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("brand_kit.form.loading")}</> : <><Sparkles className="mr-2 h-4 w-4" /> {t("brand_kit.form.button")}</>}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="result" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {brandKit && (
                        <>
                            {/* Header Section */}
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                                <div>
                                    <h2 className="text-4xl font-black tracking-tight mb-2">{brandKit.brand_kit.brand_name}</h2>
                                    <p className="text-xl text-white/90 font-light italic">"{brandKit.brand_kit.tagline}"</p>
                                </div>
                                <Badge variant="outline" className="text-sm px-4 py-1 border-white/30 bg-white/10">Brand Book v1.0</Badge>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Identity & Voice */}
                                <div className="space-y-8 lg:col-span-1">
                                    <Card className="bg-black/40 border-white/10 h-full">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-pink-400"><FileText className="w-5 h-5" /> Identità Verbale</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div>
                                                <h4 className="text-xs uppercase text-muted-foreground font-bold mb-2">Tono di Voce</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {brandKit.brand_kit.tone_of_voice.map((tone, i) => (
                                                        <Badge key={i} variant="secondary" className="bg-white/10 hover:bg-white/20">{tone}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-xs uppercase text-muted-foreground font-bold mb-2">Regole di Scrittura</h4>
                                                <ul className="space-y-2 text-sm text-gray-300">
                                                    {brandKit.brand_kit.writing_rules.map((rule, i) => (
                                                        <li key={i} className="flex items-start gap-2">
                                                            <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                                                            <span>{rule}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="text-xs uppercase text-muted-foreground font-bold mb-2">Tossico (Do Not Say)</h4>
                                                <ul className="space-y-2 text-sm text-gray-400 italic">
                                                    {brandKit.brand_kit.do_not_say.map((nope, i) => (
                                                        <li key={i} className="flex items-start gap-2 decoration-red-500/50">
                                                            <span className="text-red-500 font-bold">×</span>
                                                            <span className="line-through">{nope}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Center/Right: Visuals & Personas */}
                                <div className="space-y-8 lg:col-span-2">
                                    {/* Visual Direction */}
                                    <Card className="bg-black/40 border-white/10">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-blue-400"><Palette className="w-5 h-5" /> Direzione Visiva</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {brandKit.brand_kit.visual_direction.color_palette.map((color, i) => (
                                                    <div key={i} className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-lg hover:scale-105 transition-transform" onClick={() => copyToClipboard(color.hex)}>
                                                        <div className="absolute inset-0" style={{ backgroundColor: color.hex }} />
                                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <p className="text-[10px] uppercase font-bold text-white truncate">{color.name}</p>
                                                            <p className="text-[10px] font-mono text-white/70">{color.hex}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div className="space-y-2">
                                                    <h4 className="font-medium text-white">Stile Foto</h4>
                                                    <p className="text-muted-foreground">{brandKit.brand_kit.visual_direction.photo_style.join(", ")}.</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="font-medium text-white">Composizione</h4>
                                                    <p className="text-muted-foreground">{brandKit.brand_kit.visual_direction.composition_rules.join(", ")}.</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Personas */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {brandKit.brand_kit.audience_personas.map((persona, i) => (
                                            <Card key={i} className="bg-black/40 border-white/10">
                                                <CardHeader className="pb-3">
                                                    <div className="flex justify-between items-start">
                                                        <CardTitle className="text-lg flex items-center gap-2"><Target className="w-4 h-4 text-purple-400" /> {persona.name}</CardTitle>
                                                        <Badge variant="outline">{persona.age_range}</Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="text-sm space-y-4">
                                                    <div>
                                                        <span className="text-green-400 font-bold block mb-1">Obiettivi</span>
                                                        <p className="text-muted-foreground">{persona.goals.join(", ")}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-red-400 font-bold block mb-1">Frustrazioni</span>
                                                        <p className="text-muted-foreground">{persona.pain_points.join(", ")}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    {/* Hashtags */}
                                    <Card className="bg-black/40 border-white/10">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-yellow-400"><Hash className="w-5 h-5" /> Hashtag Set</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-2">
                                                {brandKit.brand_kit.brand_hashtags.map((tag, i) => (
                                                    <span key={i} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 font-mono hover:text-white hover:bg-white/10 cursor-pointer transition-colors">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
