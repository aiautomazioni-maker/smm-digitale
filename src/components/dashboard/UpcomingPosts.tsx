"use client";

import { useEffect, useState } from "react";
import { Calendar, Instagram, Linkedin, Loader2, Video } from "lucide-react";
import Link from "next/link";

export function UpcomingPosts() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPosts() {
            try {
                const res = await fetch('/api/dashboard/stats');
                const json = await res.json();
                setPosts(json.upcoming_posts || []);
            } catch (e) {
                console.error("Failed to load posts", e);
            } finally {
                setLoading(false);
            }
        }
        fetchPosts();
    }, []);

    if (loading) return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-[300px] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
    );

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-500" /> In Programma
            </h3>
            <div className="space-y-4">
                {posts.length === 0 ? (
                    <p className="text-gray-500 text-sm">Nessun post in programma.</p>
                ) : (
                    posts.map((post) => (
                        <Link href="/calendar" key={post.id} className="block">
                            <div className="flex items-center gap-4 group cursor-pointer">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-pink-500/20 group-hover:border-pink-500/50 transition-colors">
                                    {post.platform === 'instagram' ? <Instagram className="w-5 h-5 text-gray-300 group-hover:text-pink-400" /> : <Linkedin className="w-5 h-5 text-gray-300 group-hover:text-blue-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-white truncate group-hover:text-pink-400 transition-colors">{post.title}</h4>
                                    <p className="text-xs text-gray-400">{post.date}</p>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
