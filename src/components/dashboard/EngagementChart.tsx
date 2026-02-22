"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Loader2, TrendingUp } from "lucide-react";

export function EngagementChart() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activePlatform, setActivePlatform] = useState<"instagram" | "facebook" | "both">("both");

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/dashboard/stats');
                const json = await res.json();
                setData(json.chartData);
            } catch (e) {
                console.error("Failed to fetch stats", e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="lg:col-span-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
        );
    }

    return (
        <div className="lg:col-span-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            {/* Glow Effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-pink-500/20 transition-all duration-700" />

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        Engagement Overview <TrendingUp className="w-5 h-5 text-green-400" />
                    </h3>
                    <p className="text-sm text-gray-400">Interazioni negli ultimi 7 giorni</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActivePlatform(activePlatform === 'instagram' ? 'both' : 'instagram')}
                        className={`text-xs border px-3 py-1 rounded-full transition-colors ${activePlatform === 'instagram' || activePlatform === 'both' ? 'bg-pink-500/20 border-pink-500/50 text-white' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300'}`}>
                        Instagram
                    </button>
                    <button
                        onClick={() => setActivePlatform(activePlatform === 'facebook' ? 'both' : 'facebook')}
                        className={`text-xs border px-3 py-1 rounded-full transition-colors ${activePlatform === 'facebook' || activePlatform === 'both' ? 'bg-blue-600/20 border-blue-500/50 text-white' : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300'}`}>
                        Facebook
                    </button>
                </div>
            </div>

            <div className="h-[300px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D62976" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#D62976" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#ffffff50"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#ffffff50"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#000000cc', borderColor: '#333', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#aaa', marginBottom: '5px' }}
                            cursor={{ stroke: '#ffffff20', strokeWidth: 2 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#D62976"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
