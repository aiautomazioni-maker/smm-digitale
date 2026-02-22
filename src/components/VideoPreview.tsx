"use client";

import { useState, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Music, Play, Pause, Volume2, VolumeX, Clapperboard } from "lucide-react";

interface VideoPreviewProps {
    imageUrl: string;
    aspectRatio?: "1/1" | "9/16" | "16/9";
}

export function VideoPreview({ imageUrl, aspectRatio = "9/16" }: VideoPreviewProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(15); // Seconds
    const [isMuted, setIsMuted] = useState(false);

    // Mock audio track
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Create audio element for mock track
        audioRef.current = new Audio("https://cdn.freesound.org/previews/563/563479_11868846-lq.mp3"); // Short LoFi clip wrapper or similar open source
        audioRef.current.loop = true;

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        }
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            audioRef.current?.play().catch(e => console.log("Audio play failed (interaction needed)", e));
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) return 0;
                    return prev + (100 / (duration * 10)); // Update every 100ms
                });
            }, 100);
        } else {
            audioRef.current?.pause();
        }
        return () => clearInterval(interval);
    }, [isPlaying, duration]);

    const togglePlay = () => setIsPlaying(!isPlaying);
    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
            {/* Video Container */}
            <div
                className={`relative overflow-hidden rounded-2xl bg-black shadow-2xl border border-white/10 group ${aspectRatio === "9/16" ? "aspect-[9/16]" : "aspect-square"
                    }`}
            >
                {/* Ken Burns Effect Image */}
                <div
                    className={`w-full h-full bg-cover bg-center transition-transform duration-[20s] ease-in-out ${isPlaying ? "scale-150 translate-x-10" : "scale-100 translate-x-0"
                        }`}
                    style={{ backgroundImage: `url(${imageUrl})` }}
                />

                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 flex flex-col justify-between p-6">
                    <div className="flex justify-between items-start">
                        <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white flex items-center border border-white/10">
                            <Clapperboard className="w-3 h-3 mr-1 text-pink-500" /> Reel Preview
                        </div>
                        <button onClick={toggleMute} className="p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-white/20 transition-colors">
                            {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Play/Pause Center */}
                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                    <Play className="w-8 h-8 text-white ml-1" />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            {/* Music Track Info */}
                            <div className="flex items-center text-white/80 text-sm">
                                <Music className="w-4 h-4 mr-2 animate-spin-slow" />
                                <span>Trending Audio: &quot;Cyber Night&quot;</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-100"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="flex justify-center">
                                <Button
                                    onClick={togglePlay}
                                    variant="ghost"
                                    className="text-white hover:bg-white/20"
                                >
                                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Editor Tools */}
            <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="font-semibold text-white">Opzioni Video</h3>
                <div className="space-y-2">
                    <label className="text-sm text-muted-foreground flex justify-between">
                        Durata <span>{duration}s</span>
                    </label>
                    <Slider
                        value={[duration]}
                        min={5}
                        max={60}
                        step={5}
                        onValueChange={(v) => setDuration(v[0])}
                        className="py-4"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="w-full text-xs">Cambia Musica</Button>
                    <Button variant="outline" className="w-full text-xs">Cambia Animazione</Button>
                </div>
            </div>
        </div>
    );
}
