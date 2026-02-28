"use client"

import { useState, useEffect } from 'react';
import { useVideoStore } from '@/lib/store/video-store';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Scissors, Type, Wand2, Music, Save, Play, Image as ImageIcon, Loader2 } from 'lucide-react';
import { MusicSelector, Track } from '@/components/MusicSelector';
import { toast } from 'sonner';

export default function VideoTimelineEditor() {
    const { projectManifest, fullPlan, applyPartialEdit } = useVideoStore();

    // Fallbacks or initial states
    const edl = fullPlan?.editor_edl;

    const [duration, setDuration] = useState([edl?.timeline?.duration_sec || 15]);
    const [activeFilter, setActiveFilter] = useState(edl?.filters?.[0]?.name || 'clean');
    const [overlayText, setOverlayText] = useState(edl?.text_overlays?.[0]?.text || '');

    const [editPrompt, setEditPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
        if (fullPlan?.editor_edl) {
            const e = fullPlan.editor_edl;
            if (e.timeline?.duration_sec) setDuration([e.timeline.duration_sec]);
            if (e.filters?.[0]?.name) setActiveFilter(e.filters[0].name);
            if (e.text_overlays?.[0]?.text) setOverlayText(e.text_overlays[0].text);
        }
    }, [fullPlan]);

    const handleAiEdit = async () => {
        if (!editPrompt.trim() || !fullPlan) return;
        setIsEditing(true);

        try {
            const res = await fetch('/api/agent/create-video-edit-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lang: 'it',
                    workspace_id: 'temp_ws',
                    existing_video_project: fullPlan.video_project,
                    existing_script: fullPlan.script,
                    existing_storyboard: fullPlan.storyboard,
                    current_editor_edl: fullPlan.editor_edl,
                    current_copy: fullPlan.copy,
                    edit_request: {
                        change_filters: true,
                        new_filter_style: editPrompt.includes('filter') ? 'vibrant' : '', // Simplified logic for demo
                        improve_quality: true,
                        change_subtitles: true,
                        subtitle_mode: 'word',
                        change_music: true,
                        music_mood: editPrompt,
                        change_caption: true,
                        new_cta: 'Link in Bio!',
                        regenerate_cover: true,
                        cover_style: 'bold'
                    },
                    capabilities: {
                        has_safe_music_library: false,
                        supports_platform_music: true
                    }
                    // safeMode: true
                })
            });

            const data = await res.json();
            if (data.updated_editor_edl) {
                applyPartialEdit(data);
                setEditPrompt('');
            }
        } catch (error) {
            console.error("Edit error", error);
        } finally {
            setIsEditing(false);
        }
    };

    const handleTikTokPublish = async () => {
        if (!fullPlan) return;
        setIsPublishing(true);
        try {
            // Prefer the generated/rendered media URL first. 
            // If it's a direct upload (no render), fallback to the original uploaded URL in the EDL or manifest.
            const targetMediaUrl = fullPlan.publish_jobs?.[0]?.media_url
                || fullPlan.video_project?.original_video_url
                || '';

            if (!targetMediaUrl || targetMediaUrl.includes('example.com')) {
                toast.error("Nessun video valido trovato per la pubblicazione.");
                setIsPublishing(false);
                return;
            }

            const res = await fetch('/api/agent/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: 'tiktok',
                    workspace_id: fullPlan.video_project.workspace_id,
                    lang: 'it',
                    post: {
                        content_type: 'reel',
                        caption: fullPlan.copy?.caption || "",
                        hashtags: fullPlan.copy?.hashtags || [],
                        media_urls: [targetMediaUrl],
                        audio_url: fullPlan.editor_edl?.audio?.url
                    }
                })
            });
            const data = await res.json();
            if (data.success || data.simulated) {
                toast.success(`Post pubblicato su TikTok! ${data.simulated ? '(SIMULATO)' : ''}`);
            } else {
                toast.error(`Errore: ${data.error}`);
            }
        } catch (e) {
            toast.error("Errore di connessione durante la pubblicazione.");
        } finally {
            setIsPublishing(false);
        }
    };

    const handleMusicSelect = (track: Track | null) => {
        if (!fullPlan) return;
        applyPartialEdit({
            updated_editor_edl: {
                ...fullPlan.editor_edl,
                audio: {
                    ...fullPlan.editor_edl?.audio,
                    music_enabled: !!track,
                    music_mode: track ? 'safe_library' : 'no_music',
                    url: track?.previewUrl
                }
            }
        });
    };

    if (!projectManifest) {
        return (
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl flex items-center justify-center min-h-[500px]">
                <p className="text-white/40 text-sm text-center">
                    Initiate a Video Project on the left to activate the Editor.
                </p>
            </div>
        );
    }

    return (
        <div id="video-editor" className="bg-white/5 border border-white/10 p-6 rounded-xl flex flex-col min-h-[600px] animate-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-purple-400" />
                    Timeline Editor
                </h3>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-white/10 text-white hover:bg-white/5" onClick={handleTikTokPublish} disabled={isPublishing}>
                        {isPublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Music className="w-4 h-4 mr-2" />}
                        Pubblica su TikTok
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Save className="w-4 h-4 mr-2" /> Save EDL
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 gap-6">
                {/* PREVIEW WINDOW */}
                <div className="w-1/2 flex flex-col gap-4">
                    <div className="aspect-[9/16] bg-black rounded-lg border border-white/20 relative overflow-hidden flex items-center justify-center group">
                        <ImageIcon className="w-12 h-12 text-white/20" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                        {/* Overlay Simulation */}
                        {overlayText && (
                            <div className="absolute inset-x-0 bottom-24 text-center">
                                <span className="bg-black/50 text-white font-bold text-2xl px-4 py-2 rounded-lg border border-white/10 backdrop-blur-sm">
                                    {overlayText}
                                </span>
                            </div>
                        )}

                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                            <Button size="icon" variant="ghost" className="w-16 h-16 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:scale-110 transition-all">
                                <Play className="w-8 h-8 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
                {/* CONTROLS */}
                <div className="w-1/2 flex flex-col">
                    <Tabs defaultValue="ai_edit" className="w-full">
                        <div className="w-full overflow-x-auto pb-2 -mb-2 custom-scrollbar">
                            <TabsList className="inline-flex min-w-max h-auto bg-black/40 p-1 rounded-lg mb-4 text-xs gap-1">
                                <TabsTrigger value="ai_edit" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 px-3 py-2"><Wand2 className="w-3 h-3 mr-1" />AI Edit</TabsTrigger>
                                <TabsTrigger value="trim" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 px-3 py-2"><Scissors className="w-3 h-3 mr-1" />Trim</TabsTrigger>
                                <TabsTrigger value="filters" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 px-3 py-2"><Wand2 className="w-3 h-3 mr-1" />Filters</TabsTrigger>
                                <TabsTrigger value="text" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 px-3 py-2"><Type className="w-3 h-3 mr-1" />Text</TabsTrigger>
                                <TabsTrigger value="audio" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 px-3 py-2"><Music className="w-3 h-3 mr-1" />Audio</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 bg-black/30 rounded-lg border border-white/10 p-4">
                            <TabsContent value="ai_edit" className="space-y-4 mt-0">
                                <label className="text-sm font-medium text-white/80 block">AI Edit Assistant</label>
                                <p className="text-xs text-white/50 mb-2">Describe what you want to change (e.g., "Change the music to be more epic and use a vibrant filter"). The AI will selectively update the timeline without regenerating everything.</p>
                                <div className="space-y-3">
                                    <textarea
                                        value={editPrompt}
                                        onChange={(e) => setEditPrompt(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-md p-3 text-sm text-white resize-none min-h-[100px]"
                                        placeholder="Type your edit request here..."
                                    />
                                    <Button
                                        onClick={handleAiEdit}
                                        disabled={isEditing || !editPrompt.trim()}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        {isEditing ? 'Applying AI Edit...' : 'Apply AI Edit Magic ✨'}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="trim" className="space-y-6 mt-0">
                                <div>
                                    <label className="text-sm font-medium text-white/80 block mb-3">Duration (Seconds)</label>
                                    <Slider
                                        defaultValue={[15]}
                                        max={60}
                                        min={3}
                                        step={1}
                                        value={duration}
                                        onValueChange={setDuration}
                                        className="py-4"
                                    />
                                    <div className="flex justify-between text-xs text-white/40 mt-1">
                                        <span>0:00</span>
                                        <span className="text-blue-400 font-mono">0:{duration[0].toString().padStart(2, '0')}</span>
                                        <span>1:00</span>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="filters" className="space-y-4 mt-0">
                                <label className="text-sm font-medium text-white/80 block">Color Grading</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['clean', 'warm', 'cool', 'vibrant', 'bw'].map(f => (
                                        <Button
                                            key={f}
                                            variant={activeFilter === f ? 'default' : 'outline'}
                                            className={activeFilter === f ? 'bg-blue-600' : 'border-white/10 hover:bg-white/5'}
                                            onClick={() => setActiveFilter(f)}
                                        >
                                            {f.toUpperCase()}
                                        </Button>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="text" className="space-y-4 mt-0">
                                <label className="text-sm font-medium text-white/80 block">Overlay Text (Burn-in)</label>
                                <Input
                                    className="bg-black/50 border-white/10"
                                    placeholder="Type your text..."
                                    value={overlayText}
                                    onChange={(e) => setOverlayText(e.target.value)}
                                />
                                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mt-4">
                                    <p className="text-xs text-yellow-500">
                                        Note: Text is automatically positioned in the <strong>Safe Zone</strong> to avoid UI overlap on TikTok/Reels.
                                    </p>
                                </div>
                            </TabsContent>

                            <TabsContent value="audio" className="space-y-4 mt-0">
                                <MusicSelector
                                    onSelect={handleMusicSelect}
                                    selectedTrackId={fullPlan?.editor_edl?.audio?.url}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
