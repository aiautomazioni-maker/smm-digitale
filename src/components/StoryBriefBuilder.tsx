"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Sparkles, Target, MessageSquare, Gift, MousePointer2, Type } from "lucide-react";

interface StoryBriefBuilderProps {
    onGenerate: (brief: any) => void;
    loading?: boolean;
    initialValues?: any;
}

export function StoryBriefBuilder({ onGenerate, loading, initialValues }: StoryBriefBuilderProps) {
    const [goal, setGoal] = useState(initialValues?.goal || "Engagement");
    const [topic, setTopic] = useState(initialValues?.topic || "");
    const [offer, setOffer] = useState(initialValues?.offer || "");
    const [ctaType, setCtaType] = useState(initialValues?.cta_type || "none");
    const [ctaValue, setCtaValue] = useState(initialValues?.cta_value || "");
    const [tone, setTone] = useState(initialValues?.tone || "Professional");

    // SEQUENCE STATES
    const [isSequence, setIsSequence] = useState(initialValues?.is_sequence || false);
    const [framesCount, setFramesCount] = useState(initialValues?.frames_count || 3);
    const [funnelType, setFunnelType] = useState(initialValues?.funnel_type || "hook_value_cta");

    const handleGenerate = () => {
        onGenerate({
            goal,
            topic,
            offer,
            cta_type: ctaType,
            cta_value: ctaValue,
            tone,
            is_sequence: isSequence,
            frames_count: isSequence ? framesCount : 1,
            funnel_type: isSequence ? funnelType : null
        });
    };

    return (
        <Card className="p-6 bg-white/5 border-white/10 space-y-6">
            <div className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center gap-3">
                    <Target className="w-6 h-6 text-purple-400" />
                    <div>
                        <h4 className="font-bold text-sm">Sequenza Multi-story</h4>
                        <p className="text-xs text-muted-foreground">Crea un funnel di 3-5 storie consecutive.</p>
                    </div>
                </div>
                <Switch checked={isSequence} onCheckedChange={setIsSequence} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    {isSequence && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                            <Label className="flex items-center gap-2 text-pink-400 font-bold">Struttura Funnel</Label>
                            <Select value={funnelType} onValueChange={setFunnelType}>
                                <SelectTrigger className="bg-black/20">
                                    <SelectValue placeholder="Seleziona funnel..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hook_value_cta">Hook - Valore - CTA</SelectItem>
                                    <SelectItem value="problem_solution_cta">Problema - Soluzione - CTA</SelectItem>
                                    <SelectItem value="offer_socialproof_cta">Offerta - Social Proof - CTA</SelectItem>
                                    <SelectItem value="education_cta">Education - CTA</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Target className="w-4 h-4 text-purple-400" /> Obiettivo principale</Label>
                        <Select value={goal} onValueChange={setGoal}>
                            <SelectTrigger className="bg-black/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Engagement">Engagement</SelectItem>
                                <SelectItem value="Awareness">Brand Awareness</SelectItem>
                                <SelectItem value="Conversion">Conversione</SelectItem>
                                <SelectItem value="Educational">Educational</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Type className="w-4 h-4 text-blue-400" /> Tono di Voce</Label>
                        <Select value={tone} onValueChange={setTone}>
                            <SelectTrigger className="bg-black/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Professional">Professionale</SelectItem>
                                <SelectItem value="Friendly">Amichevole</SelectItem>
                                <SelectItem value="Urgent">Urgente / FOMO</SelectItem>
                                <SelectItem value="Inspirational">Ispirazionale</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isSequence && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 p-3 bg-white/5 rounded-md border border-white/10">
                            <Label className="flex items-center gap-2 text-yellow-500 font-bold">Numero di Frame: {framesCount}</Label>
                            <input
                                type="range" min="3" max="5" step="1"
                                value={framesCount}
                                onChange={(e) => setFramesCount(parseInt(e.target.value))}
                                className="w-full accent-yellow-500 mt-2"
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-green-400" /> Topic</Label>
                        <Input
                            placeholder="Es: Lancio della nuova collezione..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="bg-black/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Gift className="w-4 h-4 text-orange-400" /> Offerta</Label>
                        <Input
                            placeholder="Es: Sconto 20%"
                            value={offer}
                            onChange={(e) => setOffer(e.target.value)}
                            className="bg-black/20"
                        />
                    </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><MousePointer2 className="w-4 h-4 text-red-400" /> Call to Action</Label>
                        <Select value={ctaType} onValueChange={setCtaType}>
                            <SelectTrigger className="bg-black/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Nessuna</SelectItem>
                                <SelectItem value="link">Link Sticker</SelectItem>
                                <SelectItem value="dm">DM</SelectItem>
                                <SelectItem value="poll">Sondaggio</SelectItem>
                                <SelectItem value="quiz">Quiz</SelectItem>
                                <SelectItem value="question">Domanda</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {ctaType !== "none" && (
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">Valore CTA</Label>
                            <Input
                                placeholder="Inserisci link o testo..."
                                value={ctaValue}
                                onChange={(e) => setCtaValue(e.target.value)}
                                className="bg-black/20"
                            />
                        </div>
                    )}
                </div>
            </div>

            <Button
                onClick={handleGenerate}
                disabled={!topic || loading}
                className="w-full h-12 bg-instagram-gradient text-white shadow-lg"
            >
                {loading ? "Generazione..." : <><Sparkles className="w-4 h-4 mr-2" /> {isSequence ? 'Pianifica Sequenza' : 'Pianifica Storia'}</>}
            </Button>
        </Card>
    );
}
