"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Wand2, Briefcase, Camera, Palette, Zap } from "lucide-react";

interface PromptBuilderProps {
    onGenerate: (prompt: string, simplifiedPrompt: string) => void;
    baseFormat: string;
    loading?: boolean;
    initialValues?: {
        subject?: string;
        environment?: string;
        style?: string;
        mood?: string;
    };
}

export function PromptBuilder({ onGenerate, baseFormat, loading, initialValues }: PromptBuilderProps) {
    const [subject, setSubject] = useState(initialValues?.subject || "");
    const [environment, setEnvironment] = useState(initialValues?.environment || "");
    const [style, setStyle] = useState(initialValues?.style || "photorealistic");
    const [useBrandPalette, setUseBrandPalette] = useState(true);
    const [mood, setMood] = useState(initialValues?.mood || "professional");

    // Sync with props when they change

    useEffect(() => {
        if (initialValues) {
            setSubject(prev => initialValues.subject !== undefined && initialValues.subject !== prev ? initialValues.subject : prev);
            setEnvironment(prev => initialValues.environment !== undefined && initialValues.environment !== prev ? initialValues.environment : prev);
            setStyle(prev => initialValues.style !== undefined && initialValues.style !== prev ? initialValues.style : prev);
            setMood(prev => initialValues.mood !== undefined && initialValues.mood !== prev ? initialValues.mood : prev);
        }
    }, [initialValues]);

    const constructPrompt = () => {
        let prompt = `Subject: ${subject}. `;
        if (environment) prompt += `Environment: ${environment}. `;

        prompt += `Style: ${style}, high quality, detailed. `;
        prompt += `Mood: ${mood}. `;

        if (useBrandPalette) {
            prompt += `Color Palette: Use brand colors (Purple, Pink, Orange gradients) as accents or lighting. `;
        }

        if (baseFormat === 'story' || baseFormat === 'reel') {
            prompt += `Format: Vertical 9:16 composition. `;
        } else {
            prompt += `Format: Square 1:1 or 4:5 composition. `;
        }

        return prompt;
    };

    const handleGenerateClick = () => {
        if (!subject) return;
        const fullPrompt = constructPrompt();
        onGenerate(fullPrompt, subject); // Pass full prompt for AI, simple subject for display/history
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subject - The Core */}
                <div className="space-y-2 md:col-span-2">
                    <Label className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        Soggetto Principale
                    </Label>
                    <Input
                        placeholder="Es: Una tazzina di caffè fumante su una scrivania..."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="text-lg p-6 bg-white/5 border-white/10"
                    />
                </div>

                {/* Environment */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> Ambiente / Sfondo</Label>
                    <Select value={environment} onValueChange={setEnvironment}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue placeholder="Seleziona ambiente" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="studio">Studio Minimal (Sfondo Tinta Unita)</SelectItem>
                            <SelectItem value="office">Ufficio Moderno</SelectItem>
                            <SelectItem value="lifestyle_home">Casa / Lifestyle</SelectItem>
                            <SelectItem value="outdoor_urban">Città / Urban</SelectItem>
                            <SelectItem value="nature">Natura / Outdoor</SelectItem>
                            <SelectItem value="neon">Neon / Cyberpunk</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Style */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Camera className="w-4 h-4" /> Stile Visivo</Label>
                    <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="photorealistic">Fotorealistico</SelectItem>
                            <SelectItem value="cinematic">Cinematic (Luci drammatiche)</SelectItem>
                            <SelectItem value="3d_render">3D Render / Abstract</SelectItem>
                            <SelectItem value="flat_illustration">Illustrazione Flat</SelectItem>
                            <SelectItem value="sketch">Disegno / Sketch</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Mood */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Palette className="w-4 h-4" /> Mood</Label>
                    <Select value={mood} onValueChange={setMood}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="professional">Professionale & Pulito</SelectItem>
                            <SelectItem value="energetic">Energico & Vibrante</SelectItem>
                            <SelectItem value="calm">Calmo & Rilassante</SelectItem>
                            <SelectItem value="luxury">Luxury & Premium</SelectItem>
                            <SelectItem value="fun">Divertente & Giocoso</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Brand Checkbox */}
                <div className="flex items-center space-x-2 border border-white/10 p-3 rounded-md bg-white/5">
                    <Switch id="brand-colors" checked={useBrandPalette} onCheckedChange={setUseBrandPalette} />
                    <Label htmlFor="brand-colors" className="cursor-pointer">Usa Colori Brand (Viola/Rosa/Arancio)</Label>
                </div>
            </div>

            <Button
                onClick={handleGenerateClick}
                disabled={!subject || loading}
                className="w-full h-12 text-lg bg-instagram-gradient text-white shadow-lg hover:brightness-110 transition-all"
            >
                {loading ? (
                    <>Generazione in corso...</>
                ) : (
                    <><Wand2 className="w-5 h-5 mr-2" /> Genera Contenuto</>
                )}
            </Button>
        </div>
    );
}
