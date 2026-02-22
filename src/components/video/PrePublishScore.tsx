"use client"

import { useState } from 'react';
import { useVideoStore } from '@/lib/store/video-store';
import { Button } from '@/components/ui/button';
import { Activity, CheckCircle, AlertTriangle, XCircle, Loader2, Sparkles } from 'lucide-react';

export default function PrePublishScore() {
    const { projectManifest, fullPlan, applyPartialEdit } = useVideoStore();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isFixing, setIsFixing] = useState(false);
    const [scoreData, setScoreData] = useState<any>(null);
    const [cardData, setCardData] = useState<any>(null);

    const runAnalysis = async () => {
        if (!fullPlan) return;
        setIsAnalyzing(true);
        try {
            // S1: Predict Score
            const s1Res = await fetch('/api/agent/predict-video-performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: fullPlan.video_project.platform_targets?.[0] || 'instagram_reels',
                    video_project: fullPlan.video_project,
                    script: fullPlan.script,
                    cover: fullPlan.cover_options?.[0], // using first option for score
                    subtitles: fullPlan.editor_edl?.subtitles,
                    copy: fullPlan.copy
                })
            });
            const s1 = await s1Res.json();
            setScoreData(s1);

            // S3: Build Card Badge based on S1
            const topChange = s1.recommended_changes?.[0]?.change || "Nessuna modifica urgente";
            const s3Res = await fetch('/api/agent/build-prepublish-scorecard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    platform: fullPlan.video_project.platform_targets?.[0] || 'instagram_reels',
                    overall: s1.predictive_score?.overall,
                    verdict: s1.predictive_score?.verdict,
                    top_change: topChange
                })
            });
            const s3 = await s3Res.json();
            setCardData(s3.score_card);

        } catch (error) {
            console.error("Score analysis failed", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const applyAutoFixes = async () => {
        if (!scoreData || !scoreData.auto_fixes || !fullPlan) return;
        setIsFixing(true);
        try {
            // S2: Apply Auto Fixes
            const s2Res = await fetch('/api/agent/apply-predictive-autofixes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current: {
                        caption: fullPlan.copy?.caption,
                        hashtags: fullPlan.copy?.hashtags,
                        subtitles: fullPlan.editor_edl?.subtitles
                    },
                    auto_fixes: scoreData.auto_fixes
                })
            });
            const s2 = await s2Res.json();

            // Apply updates to the state
            if (s2.updated) {
                applyPartialEdit({
                    updated_copy: {
                        caption: s2.updated.caption,
                        hashtags: s2.updated.hashtags
                    },
                    updated_editor_edl: {
                        ...fullPlan.editor_edl,
                        subtitles: s2.updated.subtitles
                    }
                });
            }

            // re-run analysis to show updated green lights
            await runAnalysis();

        } catch (error) {
            console.error("Auto fix failed", error);
        } finally {
            setIsFixing(false);
        }
    };

    if (!projectManifest || !fullPlan) return null;

    if (!scoreData) {
        return (
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl mt-6 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" /> Pre-Publish Checks
                    </h3>
                    <p className="text-white/60 text-sm">Analyze your timeline and copy for potential social growth penalizations.</p>
                </div>
                <Button onClick={runAnalysis} disabled={isAnalyzing} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
                    Predict Score
                </Button>
            </div>
        );
    }

    const { badge, badge_color, title, subtitle, cta } = cardData || {};
    const colorClass = badge_color === 'red' ? 'text-red-500 bg-red-500/10 border-red-500/30' :
        badge_color === 'orange' ? 'text-orange-500 bg-orange-500/10 border-orange-500/30' :
            'text-green-500 bg-green-500/10 border-green-500/30';

    const Icon = badge_color === 'red' ? XCircle : badge_color === 'orange' ? AlertTriangle : CheckCircle;

    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-xl mt-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg border ${colorClass}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            {title || `Predictive Score: ${scoreData.predictive_score?.overall}/100`}
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${colorClass}`}>
                                {badge || 'EVALUATED'}
                            </span>
                        </h3>
                        <p className="text-white/70 text-sm mt-1">{subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={runAnalysis} disabled={isAnalyzing || isFixing} className="border-white/10 text-white hover:bg-white/5" size="sm">
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Re-evaluate"}
                    </Button>
                </div>
            </div >

            {/* View the Warnings / Red Flags */}
            {
                scoreData.red_flags?.length > 0 && (
                    <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                        <h4 className="text-red-400 font-semibold text-sm mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Penalizations Found</h4>
                        <ul className="list-disc list-inside text-sm text-red-300">
                            {scoreData.red_flags.map((flag: any, i: number) => (
                                <li key={i}>{flag.detail}</li>
                            ))}
                        </ul>
                    </div>
                )
            }

            {/* Auto Fix Actions */}
            {
                scoreData.auto_fixes?.can_apply_without_user?.length > 0 && (
                    <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-semibold text-white/90">Safe Auto-Fixes Available</h4>
                            <p className="text-xs text-white/50">{scoreData.auto_fixes.can_apply_without_user.length} fixes can be applied to align with best practices.</p>
                        </div>
                        <Button onClick={applyAutoFixes} disabled={isFixing || isAnalyzing} className="bg-green-600 hover:bg-green-700 text-white">
                            {isFixing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            Apply AI Fixes
                        </Button>
                    </div>
                )
            }

            {
                badge_color === 'green' && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg text-center font-medium">
                        🚀 Ready for Publishing! All checks passed.
                    </div>
                )
            }
        </div >
    );
}
