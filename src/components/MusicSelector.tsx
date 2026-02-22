"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Search, Music, Play, Pause, Check,
    TrendingUp, Coffee, Zap, Briefcase,
    X, Volume2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export interface Track {
    id: string;
    title: string;
    artist: string;
    duration: string;
    category: string;
    previewUrl: string;
}

const MOCK_TRACKS: Track[] = [
    { id: "1", title: "Midnight City", artist: "SynthWave Dreams", duration: "0:30", category: "Trending", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { id: "2", title: "Chill Lofi Beats", artist: "Study Zone", duration: "0:45", category: "Chill", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { id: "3", title: "Corporate Success", artist: "Business Audio", duration: "1:00", category: "Professional", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { id: "4", title: "Techno Rave", artist: "Club Bangers", duration: "0:30", category: "Energetic", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
    { id: "5", title: "Summer Vibes", artist: "Tropical House", duration: "0:45", category: "Trending", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
    { id: "6", title: "Acoustic Morning", artist: "Guitar Guy", duration: "0:30", category: "Chill", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
    { id: "7", title: "Hype Beast", artist: "Trap Lord", duration: "0:15", category: "Energetic", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
];

const CATEGORIES = [
    { id: "all", label: "Tutti", icon: Music },
    { id: "Trending", label: "Trending", icon: TrendingUp },
    { id: "Chill", label: "Chill", icon: Coffee },
    { id: "Energetic", label: "Energetic", icon: Zap },
    { id: "Professional", label: "Professional", icon: Briefcase },
];

interface MusicSelectorProps {
    onSelect: (track: Track | null) => void;
    selectedTrackId?: string;
}

export function MusicSelector({ onSelect, selectedTrackId }: MusicSelectorProps) {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const filteredTracks = MOCK_TRACKS.filter(track => {
        const matchesSearch = track.title.toLowerCase().includes(search.toLowerCase()) ||
            track.artist.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === "all" || track.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const handlePlayPause = (track: Track) => {
        if (playingId === track.id) {
            audioRef.current?.pause();
            setPlayingId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = track.previewUrl;
                audioRef.current.play().catch(e => {
                    console.error("Audio playback error:", e);
                    toast.error("Errore durante la riproduzione audio.");
                });
            }
            setPlayingId(track.id);
        }
    };

    const handleSelect = (track: Track) => {
        if (selectedTrackId === track.id) {
            onSelect(null);
        } else {
            onSelect(track);
            toast.success(`Musica selezionata: ${track.title}`);
        }
    };

    return (
        <Card className="p-4 bg-white/5 border-white/10 space-y-4">
            <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />

            <div className="flex items-center gap-3 mb-2">
                <Volume2 className="w-5 h-5 text-purple-400" />
                <div>
                    <h3 className="text-sm font-bold">Libreria Musicale</h3>
                    <p className="text-[10px] text-muted-foreground">Associa una colonna sonora al tuo post per aumentare l'engagement.</p>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Cerca brano o artista..."
                    className="pl-10 bg-black/20"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                        <Button
                            key={cat.id}
                            variant={activeCategory === cat.id ? "secondary" : "ghost"}
                            size="sm"
                            className="h-8 text-[11px] whitespace-nowrap gap-2 flex-shrink-0"
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            <Icon className="w-3 h-3" />
                            {cat.label}
                        </Button>
                    );
                })}
            </div>

            <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-2">
                    {filteredTracks.map((track) => (
                        <div
                            key={track.id}
                            onClick={() => handleSelect(track)}
                            className={`group flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${selectedTrackId === track.id
                                ? 'bg-purple-600/20 border-purple-500/50'
                                : 'bg-black/20 border-white/5 hover:border-white/20'
                                }`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 shrink-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlayPause(track);
                                    }}
                                >
                                    {playingId === track.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </Button>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-bold truncate">{track.title}</h4>
                                    <p className="text-[10px] text-muted-foreground truncate">{track.artist}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="outline" className="text-[9px] h-5 opacity-60">
                                    {track.duration}
                                </Badge>
                                <Button
                                    size="icon"
                                    variant={selectedTrackId === track.id ? "default" : "ghost"}
                                    className={`w-7 h-7 rounded-sm ${selectedTrackId === track.id ? 'bg-purple-600' : 'opacity-0 group-hover:opacity-100'}`}
                                    onClick={() => handleSelect(track)}
                                >
                                    {selectedTrackId === track.id ? <Check className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    ))}
                    {filteredTracks.length === 0 && (
                        <div className="py-8 text-center text-muted-foreground">
                            <Music className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-xs">Nessun brano trovato</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
}
