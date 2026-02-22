"use client";
// Force rebuild for Vercel deployment verification

import { useState, useRef, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Wand2, Image as ImageIcon, Type, Sparkles, Camera, Upload, Sliders, Smartphone, LayoutGrid, MonitorPlay, Layers, ChevronLeft, Music, Check, Zap } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ImageEditor } from "@/components/ImageEditor";
import { PromptBuilder } from "@/components/PromptBuilder";
import { TemplateSelector } from "@/components/TemplateSelector";
import { VideoPreview } from "@/components/VideoPreview";
import { CaptionGenerator } from "@/components/CaptionGenerator";
import { StoryBriefBuilder } from "@/components/StoryBriefBuilder";
import { MusicSelector, Track } from "@/components/MusicSelector";
import { useSearchParams } from "next/navigation";
import { BrandKit } from "@/types/brand";
import { ImageAnalysis } from "@/lib/caption-optimizer";
import { useTranslation } from "@/context/LanguageContext";
import PostPredictiveScore from "@/components/PostPredictiveScore";

// --- TYPES & CONSTANTS ---
type Step = "format" | "mode" | "create" | "preview";
type Format = "post" | "carousel" | "story" | "reel";
type Mode = "generate" | "upload" | "template";

// MOCK BRAND KIT (In a real app, this comes from context/db)
const MOCK_BRAND_KIT: BrandKit = {
    brand_name: "SMM Digitale",
    tagline: "Marketing del futuro",
    tone_of_voice: ["Friendly", "Professional", "Innovative", "Smart"],
    writing_rules: ["Usa emoji moderate", "Sii conciso", "Focus sui risultati"],
    do_not_say: ["Economico", "Vecchio", "Lento", "Sconto"],
    value_props: ["Automazione AI", "Crescita rapida", "Risparmio di tempo"],
    audience_personas: [
        {
            name: "Marco Marketer",
            age_range: "25-40",
            goals: ["Scalare l'agenzia", "Risparmiare tempo"],
            pain_points: ["Troppo lavoro manuale", "Creatività bloccata"],
            objections: ["L'AI è impersonale"]
        }
    ],
    visual_direction: {
        style_keywords: ["Modern", "Tech", "Minimal"],
        color_palette: [
            { name: "Primary", hex: "#8b5cf6" },
            { name: "Secondary", hex: "#ec4899" }
        ],
        photo_style: ["High Contrast", "Neon"],
        video_style: ["Fast paced"],
        composition_rules: ["Centered"]
    },
    cta_preferences: ["Scrivici in DM", "Link in Bio", "Salva il post"],
    brand_hashtags: ["#smmdigitale", "#marketingai", "#growth"]
};

function NewPostWizardContent() {
    const { t } = useTranslation();
    const searchParams = useSearchParams();

    // Initial state based on URL params
    const [step, setStep] = useState<Step>("format");
    const [format, setFormat] = useState<Format>(searchParams.get("type") as Format || "post");
    const [mode, setMode] = useState<Mode>(searchParams.get("prompt") ? "generate" : "generate");
    const [prompt, setPrompt] = useState({
        subject: searchParams.get("prompt") || "",
        environment: "",
        style: "",
        mood: "",
        lighting: ""
    });
    const [caption, setCaption] = useState(searchParams.get("caption") || "");

    // Analysis State for Uplad Flow
    const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null);

    // Auto-advance if params exist
    useEffect(() => {
        if (searchParams.get("type")) {
            if (searchParams.get("prompt")) {
                setStep("create");
            } else {
                setStep("mode");
            }
        }
    }, [searchParams]);

    // Result State
    const [loading, setLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<any>(null); // { caption, images: [], selectedImage }
    const [editorOpen, setEditorOpen] = useState(false);
    const [storyPlan, setStoryPlan] = useState<any>(null);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

    // Upload State
    const [uploadedImage, setUploadedImage] = useState<string>("");

    // Music State
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

    // Publishing State
    const [selectedPlatform, setSelectedPlatform] = useState<string>("facebook");
    const [isPublishing, setIsPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [publishedPostId, setPublishedPostId] = useState<string | null>(null);

    // --- HANDLERS ---

    const handleFormatSelect = (fmt: Format) => {
        setFormat(fmt);
        setStep("mode");
    };

    const handleModeSelect = (m: Mode) => {
        setMode(m);
        setStep("create");
    };

    const handleStoryGenerate = async (brief: any) => {
        setLoading(true);
        try {
            const apiEndpoint = brief.is_sequence ? '/api/agent/multi-story-plan' : '/api/agent/story-plan';
            const payload = {
                lang: "it",
                workspace_id: "demo_ws_123",
                brand_kit: MOCK_BRAND_KIT,
                ...(brief.is_sequence ? { sequence_settings: brief } : { story_brief: brief }),
                source: {
                    mode: uploadedImage ? 'edit_upload' : 'ai_generate',
                    uploaded_media_url: uploadedImage || null,
                    image_analysis: imageAnalysis
                },
                capabilities: {
                    can_publish_story: false,
                    supports_link_sticker: true,
                    supports_music: true,
                    supports_interactive_stickers: true,
                    supports_mentions: true,
                    supports_locations: true
                },
                schedule: { publish_at_iso: new Date().toISOString() }
            };

            const resPlan = await fetch(apiEndpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const plan = await resPlan.json();
            setStoryPlan(plan);

            const frames = plan.sequence_plan?.frames || [plan.story_plan];
            const processedFrames = [];

            for (const frame of frames) {
                let frameImage = uploadedImage;
                if (frame.creative?.asset_action === 'ai_generate') {
                    const resImg = await fetch('/api/agent/generate-image', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('supabase-auth-token') || '') },
                        body: JSON.stringify({
                            brandKit: MOCK_BRAND_KIT,
                            brief: { idea: frame.creative.prompt_en, content_type: "story" },
                            format: "story",
                            size: "1024x1792",
                            model: 'dall-e-3'
                        })
                    });
                    const imgData = await resImg.json();
                    if (imgData.imageUrl) frameImage = imgData.imageUrl;
                }
                processedFrames.push({
                    ...frame,
                    image: frameImage
                });
            }

            setGeneratedContent({
                caption: processedFrames[0].copy?.headline || "",
                frames: processedFrames,
                images: processedFrames.map(f => f.image),
                selectedImage: processedFrames[0].image
            });
            setCurrentFrameIndex(0);
            setStep("preview");

        } catch (e) {
            console.error(e);
            toast.error("Errore durante la creazione della Story.");
        } finally {
            setLoading(false);
        }
    };

    const handleRepurpose = async (sourcePost: any) => {
        setLoading(true);
        try {
            const res = await fetch('/api/agent/story-repurpose', {
                method: 'POST',
                body: JSON.stringify({
                    lang: "it",
                    workspace_id: "demo_ws_123",
                    brand_kit: MOCK_BRAND_KIT,
                    source_post: sourcePost,
                    repurpose_settings: {
                        frames_count: 3,
                        keep_original_visual_style: true,
                        cta_type: "link",
                        cta_value: "https://smmdigitale.ai",
                        tone: "Professional"
                    },
                    capabilities: {
                        can_publish_story: false,
                        supports_link_sticker: true,
                        supports_interactive_stickers: true
                    },
                    schedule: { publish_at_iso: new Date().toISOString() }
                })
            });
            const plan = await res.json();
            setStoryPlan(plan);

            const frames = plan.story_repurpose_plan.frames.map((f: any) => ({
                ...f,
                image: sourcePost.media_urls[f.source_media_index] || sourcePost.media_urls[0]
            }));

            setGeneratedContent({
                caption: sourcePost.caption,
                frames: frames,
                images: frames.map((f: any) => f.image),
                selectedImage: frames[0].image
            });
            setCurrentFrameIndex(0);
            setStep("preview");
        } catch (e) {
            console.error(e);
            toast.error("Errore durante il repurpose.");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (prompt: string, simplifiedSubject: string) => {
        if (format === 'story') {
            toast.error("Usa il pianificatore Story per questo formato.");
            return;
        }
        setLoading(true);
        try {
            // 1. Generate Caption (Parallel-ish or sequential)
            const resCaption = await fetch('/api/agent/generate-caption', {
                method: 'POST',
                body: JSON.stringify({
                    brandKit: MOCK_BRAND_KIT,
                    contentBrief: {
                        content_type: format,
                        idea: simplifiedSubject,
                        pillar: "General"
                    },
                    imageAnalysis: null, // No image analysis for generative flow yet (could imply from prompt)
                    platform: "instagram",
                    length: "medium",
                    lang: "it"
                })
            });
            const captionData = await resCaption.json();

            // 2. Generate Images (Request Variants)
            const variants = [];

            // Generate variant 1
            const resImg1 = await fetch('/api/agent/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (localStorage.getItem('supabase-auth-token') || '')
                },
                body: JSON.stringify({ prompt, style: 'vivid', userInstructions: simplifiedSubject, model: 'dall-e-3' })
            });
            const dataImg1 = await resImg1.json();
            if (dataImg1.imageUrl) variants.push(dataImg1.imageUrl);

            // Generate variant 2 (Simulated variation)
            if (format === 'carousel' || format === 'post') {
                const resImg2 = await fetch('/api/agent/generate-image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (localStorage.getItem('supabase-auth-token') || '')
                    },
                    body: JSON.stringify({ prompt: prompt + " different angle", style: 'vivid', userInstructions: simplifiedSubject, model: 'dall-e-3' })
                });
                const dataImg2 = await resImg2.json();
                if (dataImg2.imageUrl) variants.push(dataImg2.imageUrl);
            }

            // REEL LOGIC (MVP: Image + Pan/Zoom implied)
            // For now we just generate a vertical image. 
            // "Video" will be a preview effect in step 4.

            let fullCaptionText = "";
            if (captionData.copy) {
                fullCaptionText = `${captionData.copy.caption}\n\n${captionData.copy.cta}\n\n${captionData.copy.hashtags.join(" ")}`;
            }

            setGeneratedContent({
                caption: fullCaptionText,
                images: variants,
                selectedImage: variants[0]
            });
            setStep("preview");

        } catch (e) {
            console.error(e);
            toast.error("Errore durante la generazione.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLoading(true); // Reusing loading state

            // 1. Read file for display
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Image = reader.result as string;
                setUploadedImage(base64Image);

                try {
                    // Real analysis for story/enhanced flow
                    const res = await fetch('/api/agent/analyze-image', {
                        method: 'POST',
                        body: JSON.stringify({ imageUrl: base64Image })
                    });
                    const data = await res.json();

                    if (data.analysis?.image_analysis) {
                        const analysis = data.analysis.image_analysis;
                        setImageAnalysis(analysis);
                        setPrompt({
                            subject: analysis.summary || analysis.subject,
                            environment: analysis.setting || "",
                            style: "photorealistic",
                            mood: analysis.mood?.toLowerCase() || "professional",
                            lighting: ""
                        });
                        toast.success("Immagine analizzata con successo!");
                    }

                    setStep("create");
                } catch (error) {
                    console.error("Analysis failed", error);
                    toast.error("Impossibile analizzare l'immagine.");
                } finally {
                    setLoading(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePublishNow = async () => {
        setIsPublishing(true);
        try {
            const res = await fetch('/api/agent/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: selectedPlatform,
                    workspace_id: "demo_ws_123",
                    lang: "it",
                    post: {
                        content_type: format,
                        caption: generatedContent?.caption || "",
                        hashtags: [],
                        media_urls: [generatedContent?.selectedImage || generatedContent?.images?.[0] || '']
                    }
                })
            });
            const data = await res.json();
            if (data.success || data.simulated) {
                const isSimulated = data.simulated ? "(SIMULATO)" : "";
                toast.success(`Post pubblicato con successo su ${selectedPlatform}! ${isSimulated}`);
                setIsPublished(true);
                setPublishedPostId(data.postId || "mock-id-123");
            } else {
                toast.error("Errore di pubblicazione: " + data.error);
            }
        } catch (e) {
            console.error(e);
            toast.error("Errore di connessione durante la pubblicazione.");
        } finally {
            setIsPublishing(false);
        }
    };

    const handleSchedulePost = () => {
        toast.success("Post aggiunto al Calendario Editoriale! Reindirizzamento in corso...");
        setTimeout(() => {
            window.location.href = "/calendar";
        }, 1500);
    };

    // --- RENDERERS ---

    const renderFormatStep = () => (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="cursor-pointer hover:border-primary hover:bg-white/5 transition-all group" onClick={() => handleFormatSelect('post')}>
                <CardContent className="flex flex-col items-center justify-center h-48 gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-purple-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-8 h-8 text-purple-400" />
                    </div>
                    <span className="font-semibold text-lg">Post (1:1)</span>
                </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary hover:bg-white/5 transition-all group" onClick={() => handleFormatSelect('carousel')}>
                <CardContent className="flex flex-col items-center justify-center h-48 gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-pink-500/20 to-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Layers className="w-8 h-8 text-pink-400" />
                    </div>
                    <span className="font-semibold text-lg">Carousel</span>
                </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary hover:bg-white/5 transition-all group" onClick={() => handleFormatSelect('story')}>
                <CardContent className="flex flex-col items-center justify-center h-48 gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-yellow-500/20 to-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Smartphone className="w-8 h-8 text-orange-400" />
                    </div>
                    <span className="font-semibold text-lg">Story</span>
                </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary hover:bg-white/5 transition-all group" onClick={() => window.location.href = '/video'}>
                <CardContent className="flex flex-col items-center justify-center h-48 gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MonitorPlay className="w-8 h-8 text-cyan-400" />
                    </div>
                    <span className="font-semibold text-lg">Reel / TikTok</span>
                </CardContent>
            </Card>
        </div>
    );

    const renderModeStep = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="cursor-pointer hover:border-primary hover:bg-white/5 transition-all" onClick={() => handleModeSelect('generate')}>
                <CardContent className="flex flex-col items-center justify-center h-64 gap-4 text-center p-6">
                    <Wand2 className="w-12 h-12 text-instagram-gradient" />
                    <div>
                        <h3 className="font-bold text-xl mb-2">Genera da Zero</h3>
                        <p className="text-muted-foreground text-sm">Descrivi la tua idea e l'AI creerà testi e immagini (o video) per te.</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary hover:bg-white/5 transition-all" onClick={() => handleModeSelect('upload')}>
                <CardContent className="flex flex-col items-center justify-center h-64 gap-4 text-center p-6">
                    <Upload className="w-12 h-12 text-blue-400" />
                    <div>
                        <h3 className="font-bold text-xl mb-2">Carica & Migliora</h3>
                        <p className="text-muted-foreground text-sm">Hai già una foto o video? Usiamola come base e miglioriamola con l'AI.</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary hover:bg-white/5 transition-all" onClick={() => handleModeSelect('template')}>
                <CardContent className="flex flex-col items-center justify-center h-64 gap-4 text-center p-6">
                    <LayoutGrid className="w-12 h-12 text-pink-400" />
                    <div>
                        <h3 className="font-bold text-xl mb-2">Template</h3>
                        <p className="text-muted-foreground text-sm">Scegli tra modelli preimpostati per il tuo brand.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderCreateStep = () => {
        if (format === 'story') {
            return (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8">
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-lg border">
                        <Smartphone className="w-8 h-8 text-orange-400" />
                        <div>
                            <h3 className="font-bold">Instagram Story Mode</h3>
                            <p className="text-xs text-muted-foreground">L'AI creerà storie singole o sequenze funnel 9:16.</p>
                        </div>
                    </div>

                    <Tabs defaultValue="ai" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-black/40">
                            <TabsTrigger value="ai" className="data-[state=active]:bg-purple-600">Genera con AI</TabsTrigger>
                            <TabsTrigger value="repurpose" className="data-[state=active]:bg-purple-600">Repurpose Post</TabsTrigger>
                        </TabsList>
                        <TabsContent value="ai" className="mt-6">
                            <StoryBriefBuilder onGenerate={handleStoryGenerate} loading={loading} />
                        </TabsContent>
                        <TabsContent value="repurpose" className="mt-6">
                            <Card className="p-8 border-dashed flex flex-col items-center gap-4 text-center">
                                <Layers className="w-12 h-12 text-blue-400 opacity-50" />
                                <div>
                                    <h4 className="font-bold">Trasforma un Post in Story</h4>
                                    <p className="text-sm text-muted-foreground">Seleziona uno dei tuoi post recenti per adattarlo al formato 9:16.</p>
                                </div>
                                <Button variant="outline" onClick={() => handleRepurpose({
                                    content_type: "post",
                                    caption: "Ecco 3 motivi per usare l'AI nel marketing nel 2026. #marketingai #smm",
                                    media_urls: ["https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800"]
                                })}>
                                    Usa Post Recente (Demo)
                                </Button>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            );
        }
        if (mode === 'generate') {
            return (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                    <PromptBuilder onGenerate={handleGenerate} baseFormat={format} loading={loading} initialValues={prompt} />
                </div>
            );
        }
        if (mode === 'upload') {
            return (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-white/20 rounded-xl hover:bg-white/5 transition-colors cursor-pointer relative">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} accept="image/*,video/*" />
                    <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">Trascina o Clicca per Caricare</p>
                    <p className="text-sm text-muted-foreground">Supporta Immagini e Video</p>
                </div>
            );
        }
        if (mode === 'template') {
            return (
                <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                    <TemplateSelector onSelect={(url) => {
                        setGeneratedContent({
                            caption: "",
                            images: [url],
                            selectedImage: url
                        });
                        setStep("preview");
                    }} />
                </div>
            );
        }
        return <div>Mode not found</div>;
    };

    const renderPreviewStep = () => (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Editor/Tools */}
            <div className="space-y-6">
                {(format === 'story' || format === 'reel') && storyPlan && (
                    <Card className="bg-yellow-500/10 border-yellow-500/20">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-yellow-500 font-bold">
                                    <Sparkles className="w-5 h-5" /> {generatedContent.frames ? `Story Sequence (${generatedContent.frames.length} Frame)` : 'Story Plan AI'}
                                </div>
                                {generatedContent.frames && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="icon" variant="ghost"
                                            disabled={currentFrameIndex === 0}
                                            onClick={() => setCurrentFrameIndex(prev => prev - 1)}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <span className="text-xs font-mono">{currentFrameIndex + 1}/{generatedContent.frames.length}</span>
                                        <Button
                                            size="icon" variant="ghost"
                                            disabled={currentFrameIndex === generatedContent.frames.length - 1}
                                            onClick={() => setCurrentFrameIndex(prev => prev + 1)}
                                        >
                                            <ChevronLeft className="w-4 h-4 rotate-180" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {generatedContent.frames ? (
                                    <div className="p-3 bg-black/20 rounded-md animate-in fade-in duration-300">
                                        <Label className="text-[10px] uppercase opacity-60">Ruolo / Goal</Label>
                                        <p className="text-sm font-semibold capitalize text-yellow-400">{generatedContent.frames[currentFrameIndex].role || 'Repurpose'}</p>
                                        <Label className="text-[10px] uppercase opacity-60 mt-2 block">Headline overlay</Label>
                                        <p className="text-xs">{generatedContent.frames[currentFrameIndex].copy?.headline || generatedContent.frames[currentFrameIndex].overlays?.[0]?.text}</p>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-black/20 rounded-md">
                                        <Label className="text-[10px] uppercase opacity-60">Headline</Label>
                                        <p className="text-sm font-semibold">{storyPlan.story_plan?.copy?.headline || "Preview"}</p>
                                    </div>
                                )}

                                <div className="p-3 bg-black/20 rounded-md">
                                    <Label className="text-[10px] uppercase opacity-60">Stickers / CTA</Label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {(generatedContent.frames ? (generatedContent.frames[currentFrameIndex].stickers || []) : (storyPlan.story_plan?.stickers || [])).map((s: any, i: number) => (
                                            <Badge key={i} variant="secondary" className="text-[10px]">
                                                {s.type.toUpperCase()}: {s.value || s.question || s.fallback}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {(storyPlan.publish_plan?.requires_manual_publish || storyPlan.publish_payload?.requires_manual_publish) && (
                                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-2">
                                    <div className="text-blue-400 font-bold text-xs uppercase tracking-wider">Passaggi Manuali Richiesti</div>
                                    <ul className="text-xs space-y-1 list-disc pl-4 opacity-80">
                                        {(storyPlan.publish_plan?.manual_steps || storyPlan.publish_payload?.manual_steps || []).map((step: string, i: number) => (
                                            <li key={i}>{step}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6 space-y-4">
                        <CaptionGenerator
                            initialCaption={generatedContent?.caption || ""}
                            onCaptionChange={(newCaption) => setGeneratedContent({ ...generatedContent, caption: newCaption })}
                            brandKit={MOCK_BRAND_KIT}
                            imageAnalysis={imageAnalysis}
                        />
                    </CardContent>
                </Card>

                {/* Music Selector Component */}
                <MusicSelector
                    selectedTrackId={selectedTrack?.id}
                    onSelect={setSelectedTrack}
                />

                {/* Variants Grid */}
                {generatedContent?.images && generatedContent.images.length > 1 && (
                    <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-6">
                            <Label className="mb-4 block">Variantigenerate</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {generatedContent.images.map((img: string, i: number) => (
                                    <img
                                        key={i}
                                        src={img}
                                        className={`w-full aspect-square object-cover rounded cursor-pointer border-2 ${generatedContent.selectedImage === img ? 'border-primary' : 'border-transparent'}`}
                                        onClick={() => setGeneratedContent({ ...generatedContent, selectedImage: img })}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Post Predictive Score */}
                <PostPredictiveScore
                    postData={{
                        format: format,
                        caption: generatedContent?.caption,
                        image: generatedContent?.selectedImage
                    }}
                    brandKit={MOCK_BRAND_KIT}
                    onCaptionOptimized={(newCaption) => setGeneratedContent({ ...generatedContent, caption: newCaption })}
                />

                <Card className="bg-white/5 border-white/10 mt-4">
                    <CardContent className="p-4 flex flex-col gap-4">
                        <div className="space-y-2">
                            <Label>Destinazione (Pubblicazione Immediata)</Label>
                            <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 bg-black/40">
                                    <TabsTrigger value="facebook" className="data-[state=active]:bg-blue-600">Facebook Page</TabsTrigger>
                                    <TabsTrigger value="instagram" className="data-[state=active]:bg-pink-600">Instagram</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setEditorOpen(true)}>
                                <Sliders className="w-4 h-4 mr-2" /> Editor
                            </Button>
                            <Button variant="secondary" className="flex-1" onClick={handleSchedulePost}>
                                Pianifica nel Calendario
                            </Button>
                            <Button
                                className={`flex-1 ${selectedPlatform === 'facebook' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-pink-600 hover:bg-pink-700'}`}
                                onClick={handlePublishNow}
                                disabled={isPublishing}
                            >
                                {isPublishing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                Pubblica su {selectedPlatform === 'facebook' ? 'FB' : 'IG'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right: Phone Preview */}
            <div className="flex flex-col items-center">
                <div className="relative aspect-[9/16] bg-black rounded-[3rem] overflow-hidden border-[8px] border-zinc-800 shadow-2xl mx-auto max-w-[320px] w-full group">
                    <img
                        src={generatedContent.frames ? generatedContent.frames[currentFrameIndex].image : (generatedContent.selectedImage || generatedContent.images?.[0] || 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba')}
                        className="w-full h-full object-cover"
                        alt="Preview"
                    />

                    {/* Music Overlay (Visual only, simulates Instagram music tag) */}
                    {selectedTrack && (
                        <div className="absolute top-20 left-4 z-40 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                                <div className="w-5 h-5 bg-white text-black rounded-full flex items-center justify-center p-1">
                                    <Music className="w-3 h-3" />
                                </div>
                                <div className="text-[10px] leading-tight max-w-[120px]">
                                    <div className="font-bold text-white truncate">{selectedTrack.title}</div>
                                    <div className="text-white/60 truncate">{selectedTrack.artist}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Progress bars for Story Sequences */}
                    {generatedContent.frames && (
                        <div className="absolute top-4 left-4 right-4 flex gap-1 z-30">
                            {generatedContent.frames.map((_: any, i: number) => (
                                <div key={i} className={`h-1 flex-1 rounded-full ${i <= currentFrameIndex ? 'bg-white' : 'bg-white/30'}`} />
                            ))}
                        </div>
                    )}

                    <div className="absolute inset-0 p-8 flex flex-col pointer-events-none z-20">
                        {/* Safe Area Markers (Internal visualization) */}
                        <div className="h-[15%] border-b border-white/10 border-dashed" />

                        <div className="flex-1 flex flex-col justify-center gap-4 py-8">
                            {/* AI Overlays */}
                            {(generatedContent.frames ? (generatedContent.frames[currentFrameIndex].overlays || []) : (storyPlan?.story_plan?.creative?.overlays || [])).map((ov: any, idx: number) => (
                                <div key={idx} className={`p-4 bg-white text-black font-bold text-lg uppercase tracking-tighter self-start shadow-xl ${ov.position === 'center' ? 'mx-auto text-center' : ''}`}>
                                    {ov.text}
                                </div>
                            ))}

                            {!generatedContent.frames && format === 'story' && storyPlan?.story_plan?.copy?.headline && (
                                <div className="p-4 bg-white text-black font-bold text-lg uppercase tracking-tighter self-start shadow-xl">
                                    {storyPlan.story_plan.copy.headline}
                                </div>
                            )}
                        </div>

                        <div className="h-[15%] border-t border-white/10 border-dashed" />
                    </div>

                    {/* Navigation hit areas */}
                    {generatedContent.frames && (
                        <div className="absolute inset-0 flex z-40">
                            <div className="flex-1 cursor-pointer pointer-events-auto" onClick={() => currentFrameIndex > 0 && setCurrentFrameIndex(currentFrameIndex - 1)} />
                            <div className="flex-1 cursor-pointer pointer-events-auto" onClick={() => currentFrameIndex < generatedContent.frames.length - 1 && setCurrentFrameIndex(currentFrameIndex + 1)} />
                        </div>
                    )}

                    {/* Instagram UI components (MOCK) */}
                    <div className="absolute bottom-8 left-0 right-0 p-6 flex items-center justify-between z-30">
                        <div className="flex-1 h-10 border border-white/40 rounded-full flex items-center px-4 text-white text-xs">Invia un messaggio...</div>
                        <div className="flex gap-4 ml-4">
                            <ImageIcon className="w-5 h-5 text-white" />
                            <Smartphone className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground italic">Anteprima simulata di Instagram Story</p>
            </div>
        </div>
    );

    const renderSuccessStep = () => (
        <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in spin-in-2 duration-500">
            <div className="w-24 h-24 bg-green-500/20 text-green-500 flex items-center justify-center rounded-full mb-6">
                <Check className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Pubblicato con Successo!</h2>
            <p className="text-muted-foreground mb-8">Il tuo post è ora live su {selectedPlatform === 'facebook' ? 'Facebook' : 'Instagram'}.</p>

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden max-w-sm w-full shadow-2xl mb-8">
                <div className="p-4 flex items-center gap-3 border-b border-white/10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 flex items-center justify-center p-0.5">
                        <div className="w-full h-full bg-black rounded-full overflow-hidden">
                            <img src="https://ui-avatars.com/api/?name=SMM&background=random" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <div className="text-left leading-tight">
                        <div className="font-bold text-sm">smm.digitale</div>
                        <div className="text-xs text-muted-foreground">{selectedPlatform}</div>
                    </div>
                </div>
                <div className="relative aspect-square bg-black">
                    <img
                        src={generatedContent?.selectedImage || generatedContent?.images?.[0] || 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba'}
                        className="w-full h-full object-cover"
                        alt="Published"
                    />
                </div>
                <div className="p-4 text-left">
                    <p className="text-sm font-light whitespace-pre-wrap line-clamp-3">
                        <span className="font-bold mr-2">smm.digitale</span>
                        {generatedContent?.caption}
                    </p>
                </div>
            </div>

            <div className="flex gap-4">
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                    Torna alla Dashboard
                </Button>
                <Button className="bg-instagram-gradient" onClick={() => window.location.reload()}>
                    <Zap className="w-4 h-4 mr-2" /> Crea Un Altro Post
                </Button>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <Toaster />

            <div className="flex items-center gap-4">
                {step !== 'format' && !isPublished && (
                    <Button variant="ghost" size="icon" onClick={() => {
                        if (step === 'mode') setStep('format');
                        else if (step === 'create') setStep('mode');
                        else if (step === 'preview') setStep('create');
                    }}>
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                )}
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">{t("nav.new_post")}</h1>
                    <p className="text-muted-foreground">
                        {step === 'format' && 'Cosa vuoi creare oggi?'}
                        {step === 'mode' && 'Come vuoi crearlo?'}
                        {step === 'create' && 'Definisci il tuo contenuto'}
                        {step === 'preview' && 'Anteprima e Modifica'}
                    </p>
                </div>
            </div>

            {isPublished ? (
                renderSuccessStep()
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {step === 'format' && renderFormatStep()}
                        {step === 'mode' && renderModeStep()}
                        {step === 'create' && renderCreateStep()}
                        {step === 'preview' && renderPreviewStep()}
                    </motion.div>
                </AnimatePresence>
            )}

            <ImageEditor
                isOpen={editorOpen}
                onClose={() => setEditorOpen(false)}
                image={generatedContent?.selectedImage}
                onSave={(newImg) => setGeneratedContent({ ...generatedContent, selectedImage: newImg })}
            />
        </div>
    );
}

export default function NewPostWizard() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black text-white"><Loader2 className="w-8 h-8 animate-spin text-primary mr-2" /> Caricamento...</div>}>
            <NewPostWizardContent />
        </Suspense>
    );
}
