"use client"

import { useState } from 'react';
import { useVideoStore } from '@/lib/store/video-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Video, AlertCircle } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, PlayCircle, Layers, Sparkles } from 'lucide-react';

const mockExampleVideos = [
    { id: 1, title: 'Viral Hook Template', url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=700&fit=crop' },
    { id: 2, title: 'Educational POV', url: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=700&fit=crop' },
    { id: 3, title: 'Product Showcase', url: 'https://images.unsplash.com/photo-1611162618071-b39a2bc900ce?w=400&h=700&fit=crop' }
];

export default function VideoProjectInitiator() {
    const [prompt, setPrompt] = useState('');
    const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
    const [mode, setMode] = useState<'generate' | 'upload'>('generate');
    const { isInitializing, setInitializing, setProjectManifest, missingInfo, warnings, projectManifest } = useVideoStore();

    const handleCreateProject = async () => {
        if (mode === 'generate' && !prompt.trim()) return;
        if (mode === 'upload' && !uploadedVideo) return;

        setInitializing(true);

        try {
            const res = await fetch('/api/agent/create-full-video-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lang: 'it',
                    workspace_id: 'temp_ws',
                    brand_kit: { brandName: 'BrandTemp' },
                    user_request: mode === 'generate' ? prompt : 'Migliora questo video caricato col brand kit',
                    targets: ['instagram_reels', 'tiktok'],
                    source: {
                        mode: mode === 'generate' ? 'ai_generate' : 'upload',
                        media_url: uploadedVideo
                    },
                    preferences: {
                        default_duration_sec: 15,
                        want_music: true,
                        subtitle_mode: 'word'
                    },
                    capabilities: {
                        instagram_reels: { can_publish: true, supports_cover: true },
                        tiktok: { can_publish: true, supports_cover: false },
                        supports_platform_music: true,
                        has_safe_music_library: false
                    }
                })
            });

            const data = await res.json();

            if (data.video_project) {
                useVideoStore.getState().setFullPlan(data, data.warnings);
            }
        } catch (error) {
            console.error("Initiation error", error);
        } finally {
            setInitializing(false);
        }
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedVideo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    if (projectManifest) {
        return (
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-3 mb-4">
                    <Video className="text-blue-400" />
                    <h3 className="text-xl font-bold text-white">Project: {projectManifest.project_title}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-black/30 p-4 rounded-lg">
                        <p className="text-xs text-white/50 mb-1">Concept</p>
                        <p className="text-sm text-white/90">{projectManifest.concept}</p>
                    </div>
                    <div className="bg-black/30 p-4 rounded-lg">
                        <p className="text-xs text-white/50 mb-1">Specs Guidelines</p>
                        <p className="text-sm text-white/90 font-mono">
                            {projectManifest.specs.aspect_ratio} • {projectManifest.specs.duration_sec} sec
                        </p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {projectManifest.style_keywords.map((kw: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">#{kw}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Missing Info Warning Block */}
                {missingInfo && missingInfo.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                            <h4 className="text-sm font-semibold text-yellow-500">Missing Information</h4>
                        </div>
                        <ul className="list-disc list-inside text-sm text-yellow-500/80">
                            {missingInfo.map((info: string, i: number) => <li key={i}>{info}</li>)}
                        </ul>
                    </div>
                )}

                <div className="flex gap-4">
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full" onClick={() => useVideoStore.getState().clearProject()}>
                        Start Over
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                        Proceed to Editor
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl relative overflow-hidden group">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Video className="w-5 h-5 text-blue-400" /> Nuovo Progetto Video
                </h3>

                <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-black/40 mb-6">
                        <TabsTrigger value="generate" className="data-[state=active]:bg-blue-600">
                            <Sparkles className="w-4 h-4 mr-2" /> AI Generator
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="data-[state=active]:bg-purple-600">
                            <Upload className="w-4 h-4 mr-2" /> Carica Video
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="generate" className="space-y-4">
                        <p className="text-white/60 text-sm">
                            Descrivi il video che vuoi generare. L'AI strutturerà un progetto tecnico per Reels/TikTok rispettando i limiti 9:16.
                        </p>
                        <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Es. Promuovi la mia nuova tazza artigianale con un tono energetico..."
                            className="bg-black/40 border-white/10 resize-none text-white placeholder:text-white/40 min-h-[100px]"
                            disabled={isInitializing}
                        />
                        <Button
                            onClick={handleCreateProject}
                            disabled={isInitializing || prompt.length < 5}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isInitializing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Genera Progetto Video ✨"}
                        </Button>
                    </TabsContent>

                    <TabsContent value="upload" className="space-y-4">
                        <p className="text-white/60 text-sm">
                            Carica un video grezzo. L'AI lo analizzerà per tagliare i silenzi, aggiungere sottotitoli e ottimizzarlo.
                        </p>
                        <div className="border-2 border-dashed border-white/20 rounded-xl p-8 hover:bg-white/5 transition-colors text-center relative cursor-pointer">
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="video/*" onChange={handleUpload} />
                            {uploadedVideo ? (
                                <div className="text-green-400 font-bold flex flex-col items-center gap-2">
                                    <Video className="w-8 h-8" /> Video caricato in memoria! (clicca per cambiare)
                                </div>
                            ) : (
                                <div className="text-white/60 flex flex-col items-center gap-2 pointer-events-none">
                                    <Upload className="w-8 h-8" /> Clicca o trascina qui per caricare
                                </div>
                            )}
                        </div>
                        <Button
                            onClick={handleCreateProject}
                            disabled={isInitializing || !uploadedVideo}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {isInitializing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Analizza ed Edita col Magic AI ✨"}
                        </Button>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Example Videos Carousel for the specific Industry */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-4 h-4 text-pink-400" /> Trend del tuo Settore (Marketing)
                    </h4>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {mockExampleVideos.map(video => (
                        <div key={video.id} className="min-w-[140px] w-[140px] aspect-[9/16] bg-black rounded-lg overflow-hidden relative group cursor-pointer border border-white/10 focus-within:border-white/30 hover:border-white/30 transition-all shadow-xl">
                            <img src={video.url} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60 group-hover:opacity-100" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                <PlayCircle className="w-10 h-10 text-white" />
                            </div>
                            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black to-transparent">
                                <p className="text-[10px] text-white font-bold leading-tight">{video.title}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
