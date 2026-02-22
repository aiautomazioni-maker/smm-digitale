"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, Ticket, User, Wand2, Loader2, Info } from "lucide-react";

export function RecentActivity() {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchActivity() {
            try {
                const res = await fetch('/api/dashboard/stats');
                const json = await res.json();
                setActivities(json.recent_activity || []);
            } catch (e) {
                console.error("Failed to load activity", e);
            } finally {
                setLoading(false);
            }
        }
        fetchActivity();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'post': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
            case 'ticket': return <Ticket className="w-4 h-4 text-orange-400" />;
            case 'login': return <User className="w-4 h-4 text-blue-400" />;
            case 'ai': return <Wand2 className="w-4 h-4 text-pink-400" />;
            default: return <Info className="w-4 h-4 text-gray-400" />;
        }
    };

    if (loading) return (
        <div className="lg:col-span-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-[300px] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
    );

    return (
        <div className="lg:col-span-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" /> Attività Recenti
            </h3>
            <div className="space-y-4 relative">
                {/* Timeline Line */}
                <div className="absolute left-2.5 top-2 bottom-2 w-[1px] bg-white/10" />

                {activities.map((item) => (
                    <div key={item.id} className="relative pl-8 flex flex-col group">
                        <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-black border border-white/20 flex items-center justify-center z-10 group-hover:border-purple-500 transition-colors">
                            {getIcon(item.type)}
                        </div>
                        <span className="text-sm text-gray-200 font-medium group-hover:text-purple-400 transition-colors">{item.title}</span>
                        <span className="text-xs text-gray-500">{item.time}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
