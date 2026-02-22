"use client"

import { useState, useEffect } from 'react';
import { useVideoStore } from '@/lib/store/video-store';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

export default function CoverSelector() {
    const { projectManifest, fullPlan } = useVideoStore();
    const [covers, setCovers] = useState<any[]>(fullPlan?.cover_options || []);
    const [selectedCover, setSelectedCover] = useState<number | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Sync state if fullPlan changes
    useEffect(() => {
        if (fullPlan?.cover_options) {
            setCovers(fullPlan.cover_options);
        }
    }, [fullPlan]);

    const generateCovers = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch('/api/agent/generate-cover-options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lang: 'it',
                    video_project: projectManifest,
                    cover_style: 'clean',
                    // safeMode: true
                })
            });
            const data = await res.json();
            if (data.cover_options) setCovers(data.cover_options);
        } catch (error) {
            console.error("Cover generation error", error);
        } finally {
            setIsGenerating(false);
        }
    };

    if (!projectManifest) return null;

    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-xl animate-in fade-in duration-500 mt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-orange-400" />
                    Cover Selector (Thumbnail)
                </h3>
                {covers.length === 0 && (
                    <Button onClick={generateCovers} disabled={isGenerating} size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                        {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        Generate 4 Options
                    </Button>
                )}
            </div>

            {covers.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    {covers.map((c, i) => (
                        <div
                            key={i}
                            onClick={() => setSelectedCover(i)}
                            className={`relative aspect-[9/16] bg-black/40 border-2 rounded-xl cursor-pointer hover:scale-105 transition-all
                                ${selectedCover === i ? 'border-orange-500 shadow-lg shadow-orange-500/20' : 'border-white/10'}
                            `}
                        >
                            {/* Simulate the Cover Graphic based on the Prompt */}
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                <p className="text-white/50 text-xs text-center italic leading-tight">Prompt: {c.prompt_en}</p>
                            </div>

                            {/* Center Safe Zone Visualizer */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-2/5 border border-dashed border-white/40 flex items-center justify-center bg-black/20 pointer-events-none">
                                <span className="text-white/80 font-bold text-center text-sm px-2 backdrop-blur-sm bg-black/50 py-1 rounded">
                                    {c.hook_text}
                                </span>
                            </div>

                            {selectedCover === i && (
                                <div className="absolute -top-3 -right-3 bg-black rounded-full text-orange-500">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
