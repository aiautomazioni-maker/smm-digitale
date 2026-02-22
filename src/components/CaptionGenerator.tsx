"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Copy, Check, AlertTriangle, ShieldAlert } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BrandKit } from "@/types/brand";
import { ImageAnalysis } from "@/lib/caption-optimizer";
import { toast } from "sonner";

interface CaptionGeneratorProps {
    initialCaption: string;
    onCaptionChange: (caption: string) => void;
    brandKit?: BrandKit;
    imageAnalysis?: ImageAnalysis | null;
}

export function CaptionGenerator({ initialCaption, onCaptionChange, brandKit, imageAnalysis }: CaptionGeneratorProps) {
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Generator State
    const [style, setStyle] = useState("friendly"); // Default to match API expectation if needed, or mapped
    const [cta, setCta] = useState("dm");
    const [sector, setSector] = useState("general");
    const [city, setCity] = useState("");
    const [isEnglish, setIsEnglish] = useState(false);

    // Geocoding State
    const [postalCode, setPostalCode] = useState<string | null>(null);
    const [isFetchingCap, setIsFetchingCap] = useState(false);

    // Fetch CAP when city changes
    useEffect(() => {
        if (!city || city.trim().length < 3) {
            setPostalCode(null);
            return;
        }

        const fetchCap = async () => {
            setIsFetchingCap(true);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)},Italy&format=json&addressdetails=1`);
                const data = await res.json();
                if (data && data.length > 0 && data[0].address && data[0].address.postcode) {
                    setPostalCode(data[0].address.postcode);
                } else {
                    setPostalCode("N/A");
                }
            } catch (e) {
                console.error("Geocoding error:", e);
                setPostalCode("Errore");
            } finally {
                setIsFetchingCap(false);
            }
        };

        const timeoutId = setTimeout(fetchCap, 800);
        return () => clearTimeout(timeoutId);
    }, [city]);

    // Validation State (Simplified for now as we trust the API optimized output more, but keeping alert UI)
    const [warnings, setWarnings] = useState<string[]>([]);

    const generateMagicCaption = async () => {
        if (!brandKit) {
            toast.error("Brand Kit mancante. Impossibile generare caption personalizzata.");
            return;
        }

        setLoading(true);
        setWarnings([]);

        try {
            const response = await fetch('/api/agent/generate-caption', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brandKit,
                    imageAnalysis,
                    platform: "instagram",
                    length: "medium",
                    lang: isEnglish ? "en" : "it",
                    contentBrief: {
                        content_type: "post",
                        pillar: sector, // Mapping sector to pillar for now
                        idea: "Auto-generated from UI controls",
                        hook: style, // Using style as hook/tone hint
                        cta: cta,
                        must_include: city ? [city] : []
                    }
                })
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error);
            if (data.copy) {
                const fullCaption = `${data.copy.caption}\n\n${data.copy.cta}\n\n${data.copy.hashtags.join(" ")}`;
                onCaptionChange(fullCaption);
                setWarnings(data.warnings || []);
                toast.success("Caption generata con successo!");
            }

        } catch (error) {
            console.error("Caption generation failed", error);
            toast.error("Errore nella generazione della caption.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(initialCaption);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.info("Copiato negli appunti");
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" /> Caption AI
                </label>
                <div className="flex items-center gap-2">
                    <span className={`text-xs ${!isEnglish ? "text-white font-bold" : "text-gray-500"}`}>IT</span>
                    <Switch checked={isEnglish} onCheckedChange={setIsEnglish} className="scale-75" />
                    <span className={`text-xs ${isEnglish ? "text-white font-bold" : "text-gray-500"}`}>EN</span>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Stile</Label>
                    <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="profesional">Professionale</SelectItem>
                            <SelectItem value="friendly">Amichevole</SelectItem>
                            <SelectItem value="funny">Ironico</SelectItem>
                            <SelectItem value="inspirational">Ispirazionale</SelectItem>
                            <SelectItem value="sales">Vendita / Promo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">CTA</Label>
                    <Select value={cta} onValueChange={setCta}>
                        <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="dm">📩 Invia DM</SelectItem>
                            <SelectItem value="link">🔗 Link in Bio</SelectItem>
                            <SelectItem value="comment">💬 Commenta</SelectItem>
                            <SelectItem value="save">💾 Salva il post</SelectItem>
                            <SelectItem value="share">✈️ Condividi</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Pillar / Tema</Label>
                    <Select value={sector} onValueChange={setSector}>
                        <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="general">Generico</SelectItem>
                            <SelectItem value="education">Valore / Tips</SelectItem>
                            <SelectItem value="entertainment">Intrattenimento</SelectItem>
                            <SelectItem value="community">Community</SelectItem>
                            <SelectItem value="promo">Promozionale</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1 relative">
                    <Label className="text-[10px] uppercase text-muted-foreground">Città / Local</Label>
                    <div className="relative">
                        <Input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="h-8 text-xs bg-white/5 border-white/10 pr-16"
                            placeholder="es. Milano"
                        />
                        {city.trim().length > 2 && (
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded font-mono border border-purple-500/30">
                                {isFetchingCap ? "Cerco..." : `CAP: ${postalCode || '?'}`}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Generate Button */}
            <Button
                variant="outline"
                className="w-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-white/10 hover:bg-white/5 group"
                onClick={generateMagicCaption}
                disabled={loading}
            >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2 group-hover:text-pink-400 transition-colors" />}
                Genera Caption Ottimizzata
            </Button>

            {/* Editor Area */}
            <div className="relative">
                <Textarea
                    value={initialCaption}
                    onChange={(e) => onCaptionChange(e.target.value)}
                    className={`bg-black/50 border-white/10 min-h-[120px] focus-visible:ring-primary font-light text-sm p-4 ${warnings.length > 0 ? "border-yellow-500/50" : ""}`}
                    placeholder="Il testo generato apparirà qui..."
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-white bg-black/20 backdrop-blur"
                    onClick={handleCopy}
                >
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
            </div>

            {/* Warnings Display */}
            {warnings.length > 0 && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    {warnings.map((warn, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{warn}</span>
                        </div>
                    ))}
                </div>
            )}
            {/* Tags Suggestion (Static for now, could be dynamic from API result too) */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['#Viral', '#Trend', '#New', '#FYP'].map(tag => (
                    <span
                        key={tag}
                        className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-muted-foreground cursor-pointer hover:bg-white/10 hover:text-white transition-colors"
                        onClick={() => onCaptionChange(initialCaption ? `${initialCaption} ${tag}` : tag)}
                    >
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
}
