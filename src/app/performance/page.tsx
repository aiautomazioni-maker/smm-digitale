"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Video, TrendingDown, ArrowRight, Loader2, PlayCircle, Eye, Heart, Sparkles, CheckCircle } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

const mockPastVideos = [
    {
        id: "vid_01",
        title: "Spring Collection Reveal",
        platform: "instagram_reels",
        metrics: { views: 45000, likes: 3200, retention_rate: 0.65 },
        status: "Good",
        publish_date: "2024-04-10"
    },
    {
        id: "vid_02",
        title: "How to style our handmade mugs",
        platform: "tiktok",
        metrics: { views: 1200, likes: 45, retention_rate: 0.12 },
        status: "Underperforming",
        publish_date: "2024-04-12",
        // Mock data to feed the analyzer
        metadata: {
            duration_sec: 45,
            hook_text: "Guarda queste tazze!",
            caption: "Ceramica fatta a mano per te #tazze #ceramica #fattoamano",
            retention_drop_sec: 2
        }
    }
];

export default function PerformanceDashboard() {
    const [selectedVideo, setSelectedVideo] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [cardData, setCardData] = useState<any>(null);

    const [isGeneratingV2, setIsGeneratingV2] = useState(false);
    const [v2Plan, setV2Plan] = useState<any>(null);

    const handleAnalyze = async (video: any) => {
        setSelectedVideo(video);
        setIsAnalyzing(true);
        setAnalysisData(null);
        setCardData(null);
        setV2Plan(null);

        try {
            // Call P1: Analyze Video Performance
            const p1Res = await fetch('/api/agent/analyze-video-performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: video.platform,
                    video_metadata: video.metadata,
                    performance_metrics: video.metrics
                })
            });
            const p1 = await p1Res.json();
            setAnalysisData(p1);

            // Call P4: Build Performance Card
            const topReason = p1.underperforming_reasons?.[0]?.issue || "Scarsa retention";
            const p4Res = await fetch('/api/agent/build-performance-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: video.platform,
                    metric_status: "BAD", // Mocked as bad for the demo
                    top_reason: topReason
                })
            });
            const p4 = await p4Res.json();
            setCardData(p4.dashboard_card);

        } catch (error) {
            console.error("Analysis failed", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCreateV2 = async () => {
        if (!analysisData) return;
        setIsGeneratingV2(true);
        try {
            // Call P3: Generate Optimized V2 Plan
            const p3Res = await fetch('/api/agent/generate-optimized-video-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    optimization_strategy: analysisData.optimization_strategy,
                    platform: selectedVideo.platform,
                    original_script: {
                        hook_text: selectedVideo.metadata.hook_text,
                        duration_sec: selectedVideo.metadata.duration_sec
                    }
                })
            });
            const p3 = await p3Res.json();
            setV2Plan(p3.v2_project_plan);
        } catch (error) {
            console.error("V2 generation failed", error);
        } finally {
            setIsGeneratingV2(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#0F0F13] text-white selection:bg-blue-500/30">
            <Sidebar />

            <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
                <main className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
                    <header className="flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
                                <BarChart className="w-8 h-8 text-blue-500" />
                                Video Analytics
                            </h1>
                            <p className="text-white/60 text-lg">
                                Track performance and use AI to automatically spin-off better V2 versions of failing content.
                            </p>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Video List */}
                        <div className="lg:col-span-1 space-y-4">
                            <h3 className="font-semibold text-white/80 uppercase tracking-widest text-xs mb-4">Published Videos</h3>

                            {mockPastVideos.map((video) => (
                                <Card
                                    key={video.id}
                                    className={`bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer ${selectedVideo?.id === video.id ? 'ring-2 ring-blue-500 bg-white/10' : ''}`}
                                    onClick={() => { if (video.status === 'Underperforming') handleAnalyze(video) }}
                                >
                                    <CardContent className="p-4 flex gap-4">
                                        <div className="w-16 h-24 bg-black/50 rounded flex items-center justify-center shrink-0">
                                            <PlayCircle className="w-6 h-6 text-white/30" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-sm line-clamp-2">{video.title}</h4>
                                            <div className="flex gap-3 text-xs text-white/50 mt-2">
                                                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {video.metrics.views}</span>
                                                <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {video.metrics.likes}</span>
                                            </div>
                                            {video.status === 'Underperforming' && (
                                                <div className="mt-3 px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded border border-red-500/20 inline-flex items-center gap-1">
                                                    <TrendingDown className="w-3 h-3" /> Needs Attention
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Analysis Panel */}
                        <div className="lg:col-span-2">
                            {!selectedVideo ? (
                                <div className="h-full min-h-[400px] border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-white/40">
                                    <BarChart className="w-12 h-12 mb-4 opacity-50" />
                                    <p>Select an underperforming video to analyze.</p>
                                </div>
                            ) : isAnalyzing ? (
                                <div className="h-full min-h-[400px] bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                                    <p className="text-white/70 animate-pulse">Running AI diagnostic on {selectedVideo.platform} algorithms...</p>
                                </div>
                            ) : analysisData && cardData && (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-8 space-y-8 animate-in slide-in-from-bottom-4">

                                    {/* P4 Dashboard Card Render */}
                                    <div className={`p-4 rounded-xl border flex items-start gap-4 ${cardData.badge_color === 'red' ? 'bg-red-500/10 border-red-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
                                        <TrendingDown className={`w-8 h-8 mt-1 ${cardData.badge_color === 'red' ? 'text-red-400' : 'text-orange-400'}`} />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-xl font-bold text-white">{cardData.title}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${cardData.badge_color === 'red' ? 'border-red-500/50 text-red-400' : 'border-orange-500/50 text-orange-400'}`}>
                                                    {cardData.badge}
                                                </span>
                                            </div>
                                            <p className="text-white/70">{cardData.subtitle}</p>
                                        </div>
                                    </div>

                                    {/* P1 Analysis Details */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-white/90 border-b border-white/10 pb-2">Why it failed</h4>
                                            <ul className="space-y-3">
                                                {analysisData.underperforming_reasons.map((r: any, i: number) => (
                                                    <li key={i} className="text-sm text-red-300">
                                                        <strong className="block text-red-400 mb-1">{r.issue}</strong>
                                                        {r.detail}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-white/90 border-b border-white/10 pb-2">Optimization Strategy</h4>
                                            <ul className="space-y-3">
                                                {analysisData.optimization_strategy.map((s: any, i: number) => (
                                                    <li key={i} className="text-sm text-green-300">
                                                        <strong className="block text-green-400 mb-1">{s.action}</strong>
                                                        {s.expected_improvement}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* V2 Generation Action */}
                                    <div className="pt-6 border-t border-white/10 flex flex-col items-center">
                                        {!v2Plan ? (
                                            <Button
                                                size="lg"
                                                className="w-full max-w-md bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-xl shadow-purple-900/20"
                                                onClick={handleCreateV2}
                                                disabled={isGeneratingV2}
                                            >
                                                {isGeneratingV2 ? (
                                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Crafting V2 Plan...</>
                                                ) : (
                                                    <><Sparkles className="w-5 h-5 mr-2" /> Generate Optimized V2 <ArrowRight className="w-4 h-4 ml-2" /></>
                                                )}
                                            </Button>
                                        ) : (
                                            <div className="w-full bg-green-500/10 border border-green-500/30 p-6 rounded-xl text-center space-y-4 animate-in zoom-in">
                                                <div className="mx-auto w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-2">
                                                    <CheckCircle className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-lg font-bold text-green-400">V2 Plan Generated Successfully!</h3>
                                                <p className="text-sm text-green-300/80">The new optimized video requires new assets (shorter duration, better hook). You can now send this to the Video Studio.</p>

                                                <div className="bg-black/50 p-4 rounded text-left overflow-hidden h-32 relative">
                                                    <pre className="text-xs text-green-500/50 font-mono">
                                                        {JSON.stringify(v2Plan, null, 2)}
                                                    </pre>
                                                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                                                </div>

                                                <Button className="bg-green-600 hover:bg-green-700 text-white w-full">
                                                    Open V2 in Video Studio
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
