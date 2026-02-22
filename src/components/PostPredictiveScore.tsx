"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Activity, CheckCircle, AlertTriangle, XCircle, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function PostPredictiveScore({
    postData,
    brandKit,
    onCaptionOptimized
}: {
    postData: any;
    brandKit: any;
    onCaptionOptimized: (newCaption: string) => void;
}) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isSuggestingVisuals, setIsSuggestingVisuals] = useState(false);

    const [scoreData, setScoreData] = useState<any>(null);
    const [visualSuggestions, setVisualSuggestions] = useState<any>(null);

    const runAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            // S1: Predict Score
            const s1Res = await fetch('/api/agent/predict-post-performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lang: 'it',
                    platform: postData.format === 'reel' ? 'instagram_reels' : (postData.format === 'story' ? 'instagram_story' : 'instagram_post'),
                    brand_kit: brandKit,
                    post_type: postData.format,
                    visual: {
                        has_text_overlay: false, // Could be derived from image analysis
                        text_overlay_length: 0,
                        contrast_level: "medium", // Default assumption
                        visual_hook_strength: "medium",
                        is_brand_consistent: true
                    },
                    caption: {
                        text: postData.caption,
                        length_char: postData.caption?.length || 0,
                        first_line: postData.caption?.split('\n')[0] || "",
                        cta_present: postData.caption?.toLowerCase().includes('commenta') || postData.caption?.toLowerCase().includes('link'),
                        cta_type: postData.caption?.toLowerCase().includes('commenta') ? 'comment' : 'none'
                    },
                    hashtags: postData.caption?.match(/#[a-z0-9]+/gi) || [],
                    optional_context: {
                        industry: brandKit.brand_name || 'Marketing',
                        target_audience: brandKit.audience_personas?.[0]?.name || 'Generale',
                        goal: 'Engagement'
                    }
                })
            });
            const s1 = await s1Res.json();
            setScoreData(s1);

        } catch (error) {
            console.error("Score analysis failed", error);
            toast.error("Failed to predict score");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const optimizeCaption = async () => {
        if (!scoreData || !postData.caption) return;
        setIsOptimizing(true);
        try {
            const res = await fetch('/api/agent/optimize-post-caption', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lang: 'it',
                    platform: postData.format,
                    current_caption: postData.caption,
                    goal: 'Engagement',
                    industry: brandKit.brand_name,
                    target_audience: brandKit.audience_personas?.[0]?.name,
                    recommended_changes: scoreData.recommended_changes || []
                })
            });
            const data = await res.json();
            if (data.optimized_caption) {
                onCaptionOptimized(data.optimized_caption);
                toast.success("Caption optimized!");
                await runAnalysis(); // Re-run analysis with new caption
            }
        } catch (error) {
            console.error("Optimization failed", error);
            toast.error("Failed to optimize caption");
        } finally {
            setIsOptimizing(false);
        }
    };

    const getVisualSuggestions = async () => {
        setIsSuggestingVisuals(true);
        try {
            const res = await fetch('/api/agent/suggest-visual-improvements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: postData.format,
                    post_type: postData.format,
                    visual: {
                        has_text_overlay: false,
                        text_overlay_length: 0,
                        contrast_level: "medium",
                        visual_hook_strength: "medium"
                    },
                    goal: 'Engagement'
                })
            });
            const data = await res.json();
            setVisualSuggestions(data);
        } catch (error) {
            console.error("Visual suggestions failed", error);
        } finally {
            setIsSuggestingVisuals(false);
        }
    };

    if (!scoreData) {
        return (
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl mt-6 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-400" /> Pre-Publish Checks
                    </h3>
                    <p className="text-white/60 text-sm">Analyze your post for potential algorithm penalizations.</p>
                </div>
                <Button onClick={runAnalysis} disabled={isAnalyzing} className="bg-purple-600 hover:bg-purple-700 text-white">
                    {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
                    Predict Score
                </Button>
            </div>
        );
    }

    const overallScore = scoreData.predictive_score?.overall || 0;
    const verdict = scoreData.predictive_score?.verdict || 'low';

    const badgeColorClass = verdict === 'high' ? 'text-green-500 bg-green-500/10 border-green-500/30' :
        verdict === 'medium' ? 'text-orange-500 bg-orange-500/10 border-orange-500/30' :
            'text-red-500 bg-red-500/10 border-red-500/30';

    const Icon = verdict === 'high' ? CheckCircle : verdict === 'medium' ? AlertTriangle : XCircle;

    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-xl mt-6 animate-in fade-in duration-500 space-y-4">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg border ${badgeColorClass}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            Predictive Score: {overallScore}/100
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${badgeColorClass} uppercase`}>
                                {verdict} PERFORMANCE
                            </span>
                        </h3>
                        <p className="text-white/70 text-sm mt-1">
                            {verdict === 'high' ? 'Excellent! This post is highly optimized.' : 'There is room for improvement before you publish.'}
                        </p>
                    </div>
                </div>

                <Button variant="outline" onClick={runAnalysis} disabled={isAnalyzing || isOptimizing} className="border-white/10 text-white hover:bg-white/5" size="sm">
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Re-evaluate"}
                </Button>
            </div>

            {/* Red Flags */}
            {scoreData.red_flags?.length > 0 && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <h4 className="text-red-400 font-semibold text-sm mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Penalizations Found</h4>
                    <ul className="list-disc list-inside text-sm text-red-300">
                        {scoreData.red_flags.map((flag: any, i: number) => (
                            <li key={i}>[{flag.area.toUpperCase()}] {flag.detail}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Recommended Changes & Auto Fix */}
            {scoreData.recommended_changes?.length > 0 && verdict !== 'high' && (
                <div className="border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-white/90">Suggestions</h4>
                        <div className="flex gap-2">
                            <Button onClick={getVisualSuggestions} disabled={isSuggestingVisuals} variant="outline" size="sm" className="bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/40 hover:text-white">
                                {isSuggestingVisuals ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                                Graphic Tips
                            </Button>
                            <Button onClick={optimizeCaption} disabled={isOptimizing || isAnalyzing} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                {isOptimizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                AI Fix Text
                            </Button>
                        </div>
                    </div>
                    <ul className="space-y-2 text-sm text-white/70">
                        {scoreData.recommended_changes.map((rec: any, i: number) => (
                            <li key={i} className="flex gap-2 items-start bg-black/20 p-2 rounded">
                                <span className="text-blue-400 mt-0.5">•</span>
                                <div>
                                    <span className="font-medium text-white/90">{rec.change}</span>
                                    {rec.example && <div className="text-xs text-white/50 italic mt-1">Ex: {rec.example}</div>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Visual Suggestions Display */}
            {visualSuggestions?.visual_improvements?.length > 0 && (
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg mt-4">
                    <h4 className="text-blue-400 font-semibold text-sm mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Art Director Tips</h4>
                    <ul className="list-disc list-inside text-sm text-blue-300/80">
                        {visualSuggestions.visual_improvements.map((tip: any, i: number) => (
                            <li key={i}>{tip.suggestion} {tip.example_layout_hint && <span className="opacity-70 text-xs">({tip.example_layout_hint})</span>}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
