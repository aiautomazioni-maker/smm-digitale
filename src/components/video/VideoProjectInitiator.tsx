"use client"

import { useState } from 'react';
import { useVideoStore } from '@/lib/store/video-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Video, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, PlayCircle, Layers, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

const mockExampleVideos = [
    { id: 1, title: 'Viral Hook Template', url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=700&fit=crop' },
    { id: 2, title: 'Educational POV', url: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=700&fit=crop' },
    { id: 3, title: 'Product Showcase', url: 'https://images.unsplash.com/photo-1611162618071-b39a2bc900ce?w=400&h=700&fit=crop' }
];

export default function VideoProjectInitiator() {
    const [industry, setIndustry] = useState('Beauty');
    const [contentType, setContentType] = useState('Educativo');
    const [goal, setGoal] = useState('Awareness');
    const [targetAudience, setTargetAudience] = useState('');
    const [keyTopic, setKeyTopic] = useState('');
    const [offer, setOffer] = useState('');

    const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [mode, setMode] = useState<'generate' | 'upload'>('generate');
    const { isInitializing, setInitializing, missingInfo, warnings, projectManifest } = useVideoStore();


    // Step 1: Upload video to Supabase Storage & get a public URL
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            toast.error('Carica solo file video (mp4, mov, etc.)');
            return;
        }

        const MAX_SIZE_MB = 50;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            toast.error(`Il video supera i ${MAX_SIZE_MB}MB. Usa un video più corto o comprimi il file.`);
            return;
        }

        setIsUploading(true);
        setUploadedFileName(file.name);

        try {
            // Upload through server-side API (uses service_role key, bypasses RLS)
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/storage/upload-video', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                console.error("Server upload error:", data.error);
            // Fallback to local blob URL
                const blobUrl = URL.createObjectURL(file);
                setUploadedVideoUrl(blobUrl);
                toast.warning('Upload cloud fallito. Video caricato localmente. Alcune funzionalità AI potrebbero essere limitate.');
                return;
            }

            setUploadedVideoUrl(data.url);
            toast.success('Video caricato su cloud con successo!');
        } catch (err) {
            console.error("Upload error:", err);
            const blobUrl = URL.createObjectURL(file);
            setUploadedVideoUrl(blobUrl);
            toast.warning('Upload cloud fallito. Video caricato localmente.');
        } finally {
            setIsUploading(false);
        }
    };

    // Step 2: Call the AI plan API with the real URL
    const handleCreateProject = async () => {
        if (mode === 'generate' && !keyTopic.trim()) {
            toast.error('Inserisci almeno il Key Topic (Argomento Principale).');
            return;
        }
        if (mode === 'upload' && !uploadedVideoUrl) {
            toast.error('Prima carica un video.');
            return;
        }

        setInitializing(true);

        try {
            const res = await fetch('/api/agent/create-full-video-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lang: 'it',
                    workspace_id: 'temp_ws',
                    brand_kit: { brandName: 'BrandTemp' },
                    user_request: mode === 'generate' ? keyTopic : `Analizza ed ottimizza questo video per Reels/TikTok: ${uploadedFileName || 'video caricato'}`,
                    advanced_config: {
                        industry,
                        content_type: contentType,
                        goal,
                        target_audience: targetAudience,
                        topic: keyTopic,
                        offer: offer
                    },
                    targets: ['instagram_reels', 'tiktok'],
                    source: {
                        mode: mode === 'generate' ? 'ai_generate' : 'edit_upload',
                        media_url: mode === 'upload' ? uploadedVideoUrl : null,
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

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: 'Errore sconosciuto dal server.' }));
                toast.error(`Errore API: ${errData.error}`);
                return;
            }

            const data = await res.json();

            if (data.video_project) {
                useVideoStore.getState().setFullPlan(data, data.warnings);

                // Show warning if it was a fallback demo
                if (data.warnings?.some((w: string) => w.includes('OPENAI_API_ERROR'))) {
                    toast.warning('AI non disponibile. Caricato un progetto di esempio. Puoi iniziare a editare!');
                } else {
                    toast.success('Progetto Video creato con successo!');
                }

                // Scroll to editor
                setTimeout(() => {
                    document.getElementById('video-editor')?.scrollIntoView({ behavior: 'smooth' });
                }, 300);
            } else {
                toast.error(data.error || 'Risposta inattesa dal server. Riprova.');
            }
        } catch (error) {
            console.error("Initiation error", error);
            toast.error('Errore di connessione. Controlla la rete e riprova.');
        } finally {
            setInitializing(false);
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

                {/* Warnings Block */}
                {warnings && warnings.length > 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-orange-400" />
                            <h4 className="text-sm font-semibold text-orange-400">Avvisi</h4>
                        </div>
                        <ul className="list-disc list-inside text-sm text-orange-400/80">
                            {warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                        </ul>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full" onClick={() => useVideoStore.getState().clearProject()}>
                        Start Over
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                        onClick={() => {
                            document.getElementById('video-editor')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        Proceed to Editor ↓
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
                        <p className="text-white/60 text-sm mb-4">
                            Imposta la strategia del tuo video. L'AI creerà uno script altamente ottimizzato per la retention su TikTok.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-white/60 block mb-1">1️⃣ Settore</label>
                                <select
                                    value={industry}
                                    onChange={e => setIndustry(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option>Beauty</option>
                                    <option>Fitness</option>
                                    <option>Real Estate</option>
                                    <option>E-commerce</option>
                                    <option>Ristorazione</option>
                                    <option>Personal brand</option>
                                    <option>Agenzia marketing</option>
                                    <option>Crypto</option>
                                    <option>Tech</option>
                                    <option>Coaching</option>
                                    <option>Altro</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-white/60 block mb-1">2️⃣ Tipo Contenuto</label>
                                <select
                                    value={contentType}
                                    onChange={e => setContentType(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option>Educativo</option>
                                    <option>Intrattenimento</option>
                                    <option>Storytelling</option>
                                    <option>Vendita diretta</option>
                                    <option>Trend adaptation</option>
                                    <option>Testimonianza</option>
                                    <option>Dietro le quinte</option>
                                    <option>Tutorial</option>
                                    <option>Problema → Soluzione</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-white/60 block mb-1">3️⃣ Obiettivo Marketing</label>
                                <select
                                    value={goal}
                                    onChange={e => setGoal(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option>Lead generation</option>
                                    <option>Vendita prodotto</option>
                                    <option>Awareness</option>
                                    <option>Engagement</option>
                                    <option>Follower growth</option>
                                </select>
                            </div>

                            <div className="col-span-2 mt-2">
                                <label className="text-xs text-white/60 block mb-1">Target Audience</label>
                                <input
                                    type="text"
                                    value={targetAudience}
                                    onChange={e => setTargetAudience(e.target.value)}
                                    placeholder="Es. Giovani professionisti 25-35 anni, appassionati di fitness..."
                                    className="w-full bg-black/40 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="text-xs text-white/60 block mb-1">Key Topic (Argomento Principale) *</label>
                                <textarea
                                    value={keyTopic}
                                    onChange={e => setKeyTopic(e.target.value)}
                                    placeholder="Es. Come aumentare la massa muscolare senza pesi..."
                                    className="w-full bg-black/40 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none h-20"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="text-xs text-white/60 block mb-1">Offerta / CTA Specifica (Opzionale)</label>
                                <input
                                    type="text"
                                    value={offer}
                                    onChange={e => setOffer(e.target.value)}
                                    placeholder="Es. 20% di sconto col codice TIKTOK20, link in bio"
                                    className="w-full bg-black/40 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleCreateProject}
                            disabled={isInitializing || !keyTopic.trim()}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
                        >
                            {isInitializing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generazione Strategica in corso...</> : "Genera Strategia Video ✨"}
                        </Button>
                    </TabsContent>


                    <TabsContent value="upload" className="space-y-4">
                        <p className="text-white/60 text-sm">
                            Carica un video grezzo. L'AI lo analizzerà per tagliare i silenzi, aggiungere sottotitoli e ottimizzarlo.
                        </p>

                        {/* Upload Area */}
                        <div className="border-2 border-dashed border-white/20 rounded-xl p-8 hover:bg-white/5 transition-colors text-center relative cursor-pointer">
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept="video/*"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                            {isUploading ? (
                                <div className="text-blue-400 font-bold flex flex-col items-center gap-2">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <span>Caricamento in corso...</span>
                                </div>
                            ) : uploadedVideoUrl ? (
                                <div className="text-green-400 font-bold flex flex-col items-center gap-2">
                                        <CheckCircle2 className="w-8 h-8" />
                                        <span>{uploadedFileName || 'Video caricato!'}</span>
                                        <span className="text-xs text-white/40 font-normal">(clicca per cambiare)</span>
                                </div>
                            ) : (
                                <div className="text-white/60 flex flex-col items-center gap-2 pointer-events-none">
                                            <Upload className="w-8 h-8" />
                                            <span>Clicca o trascina qui per caricare</span>
                                            <span className="text-xs text-white/40">MP4, MOV, AVI supportati</span>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleCreateProject}
                            disabled={isInitializing || !uploadedVideoUrl || isUploading}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {isInitializing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analisi AI in corso...</> : "Analizza ed Edita col Magic AI ✨"}
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
