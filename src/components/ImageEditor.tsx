"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, Type, Sliders, Crop, Move, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageEditorProps {
    isOpen: boolean;
    onClose: () => void;
    image: string;
    onSave: (newImage: string) => void;
}

const FONTS = [
    { name: "Arial", value: "Arial" },
    { name: "Times New Roman", value: "Times New Roman" },
    { name: "Courier New", value: "Courier New" },
    { name: "Georgia", value: "Georgia" },
    { name: "Verdana", value: "Verdana" },
    { name: "Impact", value: "Impact" },
    { name: "Comic Sans MS", value: "Comic Sans MS" },
];

import { MAGIC_FILTERS } from "@/lib/filters";

// Removed local FILTER_PRESETS in favor of imported MAGIC_FILTERS

export function ImageEditor({ isOpen, onClose, image, onSave }: ImageEditorProps) {
    const [filters, setFilters] = useState({ brightness: 100, contrast: 100, saturate: 100, sepia: 0, grayscale: 0, blur: 0, hueRotate: 0 });
    const [magicFilter, setMagicFilter] = useState("none");

    // Transform
    const [rotation, setRotation] = useState(0);
    const [scale, setScale] = useState(1);

    const [activeTab, setActiveTab] = useState("adjust");

    // Text Overlay - Now an Array for future multiple texts, but keeping single for now to simplify UI logic if needed, 
    // BUT user asked for "Move", so we need position state.
    const [textOp, setTextOp] = useState({
        text: "",
        x: 50, // Percentage 0-100
        y: 50, // Percentage 0-100
        color: "#ffffff",
        fontSize: 40,
        fontFamily: "Arial",
        isDragging: false
    });

    const previewRef = useRef<HTMLDivElement>(null);

    // Drag Logic
    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        setTextOp(prev => ({ ...prev, isDragging: true }));
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!textOp.isDragging || !previewRef.current) return;

        const rect = previewRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setTextOp(prev => ({ ...prev, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }));
    };



    // Global pointer up to catch loose drags
    useEffect(() => {
        const handleGlobalUp = () => setTextOp(prev => ({ ...prev, isDragging: false }));
        window.addEventListener('pointerup', handleGlobalUp);
        return () => window.removeEventListener('pointerup', handleGlobalUp);
    }, []);


    const handleSave = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = image;
        img.onload = () => {
            // Set canvas to natural image size
            canvas.width = img.width;
            canvas.height = img.height;

            if (!ctx) return;

            // 1. Background Filters
            ctx.filter = `
                brightness(${filters.brightness}%)
                contrast(${filters.contrast}%)
                saturate(${filters.saturate}%)
                sepia(${filters.sepia}%)
                grayscale(${filters.grayscale}%)
                blur(${filters.blur}px)
                hue-rotate(${filters.hueRotate}deg)
             `;

            // 2. Transform (Rotate/Scale from CENTER)
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(scale, scale);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);

            // 3. Draw Image
            ctx.drawImage(img, 0, 0);

            // 4. Text Overlay
            if (textOp.text) {
                // Reset transform/filter for text
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.filter = "none";

                // Calculate font size relative to image width (approx)
                // We use base fontSize state as "relative unit" roughly
                // Let's say fontSize 40 is 5% of width? 
                // Better: Just use a multiplier. 
                // To match preview: Preview is scaled. 
                // If preview text is 40px, and preview width is 800px.
                // We map that ratio.

                // Simplified approach: fontSize is relative to 800px width base.
                const scaleFactor = canvas.width / 800;
                const finalSize = textOp.fontSize * scaleFactor;

                ctx.font = `bold ${finalSize}px "${textOp.fontFamily}"`;
                ctx.fillStyle = textOp.color;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                // Shadow
                ctx.shadowColor = "rgba(0,0,0,0.8)";
                ctx.shadowBlur = 10 * scaleFactor;
                ctx.shadowOffsetX = 2 * scaleFactor;
                ctx.shadowOffsetY = 2 * scaleFactor;

                // Position
                const textX = (textOp.x / 100) * canvas.width;
                const textY = (textOp.y / 100) * canvas.height;

                ctx.fillText(textOp.text, textX, textY);
            }

            const newUrl = canvas.toDataURL("image/png");
            onSave(newUrl);
            onClose();
        };
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-0 gap-0">
                <div className="flex-1 flex overflow-hidden">
                    {/* Preview Area */}
                    <div
                        className="flex-1 bg-stone-950 flex items-center justify-center p-4 overflow-hidden relative select-none"
                        onPointerMove={handlePointerMove}
                    >
                        {/* Image Container */}
                        <div
                            ref={previewRef}
                            className="relative flex items-center justify-center max-h-full max-w-full shadow-2xl"
                        >
                            <img
                                src={image}
                                alt="Edit Preview"
                                className="max-h-full max-w-full object-contain pointer-events-none"
                                style={{
                                    filter: magicFilter !== 'none' ? magicFilter : `
                                        brightness(${filters.brightness}%)
                                        contrast(${filters.contrast}%)
                                        saturate(${filters.saturate}%)
                                        sepia(${filters.sepia}%)
                                        grayscale(${filters.grayscale}%)
                                        blur(${filters.blur}px)
                                        hue-rotate(${filters.hueRotate}deg)
                                    `,
                                    transform: `rotate(${rotation}deg) scale(${scale})`,
                                }}
                            />

                            {/* Draggable Text Layer */}
                            {textOp.text && (
                                <div
                                    className={cn(
                                        "absolute cursor-move select-none whitespace-nowrap px-4 py-2 border-2 border-transparent hover:border-white/50 rounded transition-colors",
                                        textOp.isDragging && "border-primary cursor-grabbing"
                                    )}
                                    style={{
                                        left: `${textOp.x}%`,
                                        top: `${textOp.y}%`,
                                        transform: 'translate(-50%, -50%)',
                                        color: textOp.color,
                                        fontSize: `${textOp.fontSize}px`,
                                        fontFamily: textOp.fontFamily,
                                        fontWeight: "bold",
                                        textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                                        lineHeight: 1
                                    }}
                                    onPointerDown={handlePointerDown}
                                >
                                    {textOp.text}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls Sidebar */}
                    <div className="w-96 border-l bg-background flex flex-col">
                        <div className="p-4 border-b">
                            <h2 className="font-bold text-lg">Editor Studio</h2>
                        </div>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                            <TabsList className="grid w-full grid-cols-5 p-2 h-auto">
                                <TabsTrigger value="magic" className="flex flex-col gap-1 py-2"><Sparkles className="w-4 h-4 text-purple-400" /><span className="text-[10px]">Magic</span></TabsTrigger>
                                <TabsTrigger value="adjust" className="flex flex-col gap-1 py-2"><Sliders className="w-4 h-4" /><span className="text-[10px]">Regola</span></TabsTrigger>
                                <TabsTrigger value="transform" className="flex flex-col gap-1 py-2"><Crop className="w-4 h-4" /><span className="text-[10px]">Formatta</span></TabsTrigger>
                                <TabsTrigger value="text" className="flex flex-col gap-1 py-2"><Type className="w-4 h-4" /><span className="text-[10px]">Testo</span></TabsTrigger>
                                {/* Presets removed in favor of Magic */}
                            </TabsList>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <TabsContent value="magic" className="mt-0 space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        {MAGIC_FILTERS.map(preset => (
                                            <Button
                                                key={preset.name}
                                                variant="outline"
                                                className={`h-24 flex flex-col gap-2 p-1 hover:border-primary hover:bg-primary/5 transition-all ${magicFilter === preset.filter ? 'border-primary bg-primary/10' : ''}`}
                                                onClick={() => {
                                                    setMagicFilter(preset.filter);
                                                    // Reset manual filters when applying magic
                                                    setFilters({ brightness: 100, contrast: 100, saturate: 100, sepia: 0, grayscale: 0, blur: 0, hueRotate: 0 });
                                                }}
                                            >
                                                <div className="w-full h-16 bg-muted rounded-sm overflow-hidden relative">
                                                    <img
                                                        src={image}
                                                        className="w-full h-full object-cover"
                                                        style={{ filter: preset.filter }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium">{preset.name}</span>
                                            </Button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center mt-2">
                                        I filtri Magic usano l&apos;AI per ottimizzare i colori (simulato).
                                    </p>
                                </TabsContent>

                                <TabsContent value="adjust" className="mt-0 space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs"><span>Luminosità</span><span>{filters.brightness}%</span></div>
                                            <Slider value={[filters.brightness]} min={0} max={200} step={1} onValueChange={([v]) => setFilters({ ...filters, brightness: v })} />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs"><span>Contrasto</span><span>{filters.contrast}%</span></div>
                                            <Slider value={[filters.contrast]} min={0} max={200} step={1} onValueChange={([v]) => setFilters({ ...filters, contrast: v })} />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs"><span>Saturazione</span><span>{filters.saturate}%</span></div>
                                            <Slider value={[filters.saturate]} min={0} max={200} step={1} onValueChange={([v]) => setFilters({ ...filters, saturate: v })} />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs"><span>Seppia</span><span>{filters.sepia}%</span></div>
                                            <Slider value={[filters.sepia]} min={0} max={100} step={1} onValueChange={([v]) => setFilters({ ...filters, sepia: v })} />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs"><span>Bianco/Nero</span><span>{filters.grayscale}%</span></div>
                                            <Slider value={[filters.grayscale]} min={0} max={100} step={1} onValueChange={([v]) => setFilters({ ...filters, grayscale: v })} />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs"><span>Sfocatura</span><span>{filters.blur}px</span></div>
                                            <Slider value={[filters.blur]} min={0} max={10} step={0.5} onValueChange={([v]) => setFilters({ ...filters, blur: v })} />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="transform" className="mt-0 space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Rotazione ({rotation}°)</Label>
                                            <Slider value={[rotation]} min={0} max={360} step={90} onValueChange={([v]) => setRotation(v)} />
                                            <div className="flex justify-end"><Button size="sm" variant="ghost" onClick={() => setRotation(rotation + 90)}><RotateCcw className="w-4 h-4 mr-2" /> Ruota +90°</Button></div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Zoom</Label>
                                            <Slider className="pt-2" value={[scale]} min={0.5} max={3} step={0.1} onValueChange={([v]) => setScale(v)} />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="text" className="mt-0 space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Testo</Label>
                                            <input
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={textOp.text}
                                                onChange={(e) => setTextOp({ ...textOp, text: e.target.value })}
                                                placeholder="Scrivi qui..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Font</Label>
                                                <Select value={textOp.fontFamily} onValueChange={(v) => setTextOp({ ...textOp, fontFamily: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {FONTS.map(f => <SelectItem key={f.value} value={f.value}><span style={{ fontFamily: f.value }}>{f.name}</span></SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Colore</Label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        className="h-10 w-10 p-1 rounded cursor-pointer border"
                                                        value={textOp.color}
                                                        onChange={(e) => setTextOp({ ...textOp, color: e.target.value })}
                                                    />
                                                    <span className="text-xs text-muted-foreground">{textOp.color}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs"><span>Dimensione</span><span>{textOp.fontSize}px</span></div>
                                            <Slider value={[textOp.fontSize]} min={10} max={200} step={5} onValueChange={([v]) => setTextOp({ ...textOp, fontSize: v })} />
                                        </div>

                                        <div className="bg-muted/30 p-4 rounded-lg text-xs text-muted-foreground">
                                            <p className="flex items-center gap-2"><Move className="w-3 h-3" /> Trascina il testo sull&apos;immagine per posizionarlo.</p>
                                        </div>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>

                        <div className="p-4 border-t bg-muted/20 flex gap-2 justify-end">
                            <Button variant="outline" onClick={onClose}>Annulla</Button>
                            <Button onClick={handleSave} className="bg-primary text-primary-foreground min-w-[120px]">Salva Modifiche</Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
