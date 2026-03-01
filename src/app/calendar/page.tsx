"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Sparkles, Wand2, Calendar as CalendarIcon, Loader2, Video, Image as ImageIcon, Layers, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PlanInput, EditorialPlan, PlanItem } from "@/types/calendar";
import { generateEditorialPlan } from "@/lib/calendar-service";
import { HOLIDAYS } from "@/lib/holidays";
import { BrandKitResponse } from "@/types/brand";
import { generateBrandKit } from "@/lib/brand-service"; // Reusing for mock context
import { useRouter } from "next/navigation";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";
import { it } from "date-fns/locale";

import { useTranslation } from "@/context/LanguageContext";

// Mock pre-existing brand kit state (in real app, from DB/Context)
const MOCK_BRAND_KIT_INPUT = {
    lang: "it",
    business_name: "CyberPizza 2077",
    industry: "Food",
    city: "Neo Tokyo",
    target_audience: "Gamers",
    offer: "Pizza",
    tone_preferences: "Ironico"
};

export default function CalendarPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isGenerating, setIsGenerating] = useState(false);
    const [plan, setPlan] = useState<EditorialPlan | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Generator Inputs
    const [goals, setGoals] = useState("Aumentare follower e engagement");
    const [freq, setFreq] = useState({ posts: 3, stories: 5, reels: 2 });

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            // 1. Get Brand Context (Mock)
            const brandRes = await generateBrandKit(MOCK_BRAND_KIT_INPUT);

            // 2. Generate Plan
            const input: PlanInput = {
                start_date: new Date(),
                goals,
                frequency: freq
            };
            const generatedPlan = await generateEditorialPlan(input, brandRes.brand_kit);
            setPlan(generatedPlan);
            setDialogOpen(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCreatePost = (item: PlanItem) => {
        // Navigate to new-post with query params
        const params = new URLSearchParams({
            type: item.content_type,
            prompt: item.visual_prompt, // Pass visual prompt
            caption: item.caption_brief, // Pass caption brief
            hook: item.hook_text,
            topic: item.topic
        });
        router.push(`/new-post?${params.toString()}`);
    };

    // Calendar Grid Logic
    const monthStart = startOfWeek(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), { weekStartsOn: 1 });
    const monthEnd = endOfWeek(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const getDayItems = (day: Date) => {
        if (!plan) return [];
        return plan.items.filter(item => item.date && isSameDay(parseISO(item.date), day));
    };

    const getDayHolidays = (day: Date) => {
        return HOLIDAYS.filter(h => h.month === day.getMonth() && h.day === day.getDate());
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 h-screen flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-1">{t("calendar.title")}</h1>
                    <p className="text-muted-foreground">{t("calendar.subtitle")}</p>
                </div>

                <div className="flex gap-3">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-instagram-gradient hover:opacity-90">
                                <Sparkles className="w-4 h-4 mr-2" /> {t("calendar.generate_ai")}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-black/90 border-white/10 backdrop-blur-xl sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>{t("calendar.generator.title")}</DialogTitle>
                                <DialogDescription>{t("calendar.generator.desc")}</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>{t("calendar.generator.goal") as string}</Label>
                                    <Input value={goals} onChange={e => setGoals(e.target.value)} className="bg-white/5 border-white/10" placeholder={t("calendar.generator.goal_placeholder") as string} />
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs">{t("calendar.generator.post_week")}</Label>
                                        <Input type="number" value={freq.posts} onChange={e => setFreq({ ...freq, posts: parseInt(e.target.value) })} className="bg-white/5 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">{t("calendar.generator.reel_week")}</Label>
                                        <Input type="number" value={freq.reels} onChange={e => setFreq({ ...freq, reels: parseInt(e.target.value) })} className="bg-white/5 border-white/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">{t("calendar.generator.stories_week")}</Label>
                                        <Input type="number" value={freq.stories} onChange={e => setFreq({ ...freq, stories: parseInt(e.target.value) })} className="bg-white/5 border-white/10" />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-instagram-gradient">
                                    {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("calendar.generator.loading")}</> : <><Wand2 className="mr-2 h-4 w-4" /> {t("calendar.generator.button")}</>}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button variant="outline"><Plus className="w-4 h-4 mr-2" /> {t("calendar.event")}</Button>
                </div>
            </div>

            {/* Calendar Controls */}
            <div className="flex justify-between items-center shrink-0 bg-white/5 p-2 rounded-lg border border-white/5">
                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -30))}><ChevronLeft className="w-4 h-4" /></Button>
                <div className="text-lg font-medium capitalize">
                    {format(currentDate, 'MMMM yyyy', { locale: it })}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 30))}><ChevronRight className="w-4 h-4" /></Button>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 min-h-0 bg-black/20 border border-white/10 rounded-xl overflow-auto shadow-2xl flex flex-col">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
                    {((t("calendar.days") as string[]) || ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']).map((day: string, index: number) => (
                        <div key={index} className="p-3 text-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                    {calendarDays.map((day, i) => {
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isToday = isSameDay(day, new Date());
                        const items = getDayItems(day);
                        const holidays = getDayHolidays(day);

                        return (
                            <div
                                key={day.toISOString()}
                                className={`min-h-[120px] p-2 border-b border-r border-white/5 relative group transition-colors hover:bg-white/[0.02] flex flex-col gap-1 ${!isCurrentMonth ? 'bg-black/40 opacity-50' : ''}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white' : 'text-muted-foreground'}`}>
                                        {format(day, 'd')}
                                    </div>
                                    <div className="flex gap-0.5">
                                        {holidays.map((h, idx) => (
                                            <div
                                                key={idx}
                                                className={`w-2 h-2 rounded-full cursor-help ${h.color || (h.type === 'holiday' ? 'bg-green-500' : 'bg-purple-500')}`}
                                                title={`${h.name}: ${h.description}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {holidays.length > 0 && (
                                    <div className="mb-1 space-y-0.5">
                                        {holidays.map((h, idx) => (
                                            <div key={idx} className="text-[9px] font-bold text-white/40 truncate flex items-center gap-1 group-hover:text-white/80 transition-colors">
                                                <div className={`w-1 h-1 rounded-full ${h.color || (h.type === 'holiday' ? 'bg-green-500' : 'bg-purple-500')}`} />
                                                {h.name}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Items */}
                                <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                                    {items.map(item => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`
                                                text-[10px] p-1.5 rounded-md border border-white/5 cursor-pointer shadow-sm hover:border-white/20 transition-all group/item
                                                ${item.content_type === 'reel' ? 'bg-pink-500/10 text-pink-200' : ''}
                                                ${item.content_type === 'post' ? 'bg-blue-500/10 text-blue-200' : ''}
                                                ${item.content_type === 'story' ? 'bg-yellow-500/10 text-yellow-200' : ''}
                                            `}
                                            onClick={() => handleCreatePost(item)}
                                        >
                                            <div className="flex items-center gap-1 font-bold mb-0.5">
                                                {item.content_type === 'reel' && <Video className="w-3 h-3" />}
                                                {item.content_type === 'post' && <ImageIcon className="w-3 h-3" />}
                                                {item.content_type === 'story' && <Zap className="w-3 h-3" />}
                                                <span className="truncate uppercase">{item.pillar}</span>
                                            </div>
                                            <div className="truncate opacity-80 mb-1">{item.topic}</div>

                                            {/* Hover Action */}
                                            <div className="hidden group-hover/item:flex items-center justify-center mt-1 pt-1 border-t border-white/10">
                                                <span className="flex items-center text-[9px] font-bold"><Sparkles className="w-2.5 h-2.5 mr-1" /> CREA</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {isCurrentMonth && (
                                    <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
