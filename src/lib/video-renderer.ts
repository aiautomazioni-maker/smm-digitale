import fs from 'fs';
import path from 'path';
import os from 'os';

export interface EditorEDL {
    timeline: {
        duration_sec: number;
        segments: Array<{ start_sec: number; end_sec: number; speed: number; transition_to_next: string }>;
    };
    crop?: { aspect_ratio: string; safe_zone: { top_px: number; bottom_px: number } };
    filters?: Array<{ name: string; intensity: number }>;
    enhancement?: { denoise: number; sharpen: number; stabilize: boolean; upscale: boolean };
    text_overlays?: Array<{ text: string; start_sec: number; end_sec: number; position_zone: string; style: string }>;
    subtitles?: { enabled: boolean; burn_in: boolean; style: string; max_chars_per_line: number };
    audio?: { music_enabled: boolean; music_style: string; ducking: boolean };
}

/**
 * Renders a final MP4 video applying the provided Edit Decision List (EDL) using fluent-ffmpeg.
 * Note: This is a complex pipeline that builds a filtergraph based on the EDL. 
 */
export async function renderVideoFromEDL(inputVideoBuffer: Buffer, edl: EditorEDL): Promise<Buffer> {
    const ffmpeg = require('fluent-ffmpeg');

    // Path resolution fixes for Next.js
    let ffmpegPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg');
    let ffprobePath = path.join(process.cwd(), 'node_modules', 'ffprobe-static', 'bin', os.platform() === 'darwin' ? 'darwin' : os.platform() === 'win32' ? 'win32' : 'linux', os.arch() === 'x64' ? 'x64' : 'ia32', os.platform() === 'win32' ? 'ffprobe.exe' : 'ffprobe');

    try {
        const staticFfmpeg = require('ffmpeg-static');
        if (staticFfmpeg && fs.existsSync(staticFfmpeg)) ffmpegPath = staticFfmpeg;

        const staticFfprobe = require('ffprobe-static').path;
        if (staticFfprobe && fs.existsSync(staticFfprobe)) ffprobePath = staticFfprobe;
    } catch (e) { }

    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);

    const tempId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
    const tempInput = path.join(os.tmpdir(), `edl_in_${tempId}.mp4`);
    const tempOutput = path.join(os.tmpdir(), `edl_out_${tempId}.mp4`);

    try {
        fs.writeFileSync(tempInput, inputVideoBuffer);

        const command = ffmpeg().input(tempInput);
        const filterGraph: string[] = [];

        // 1. TIMELINE & TRIM (Handling the first segment for simplicity currently)
        if (edl.timeline && edl.timeline.segments.length > 0) {
            const seg = edl.timeline.segments[0];
            command.setStartTime(seg.start_sec);
            command.setDuration(seg.end_sec - seg.start_sec);
        }

        // 2. VIDEO ENHANCEMENTS AND FILTERS (using complex filter)
        // Crop/Scale to 1080x1920 (9:16)
        filterGraph.push('scale=-1:1920,crop=1080:1920');

        // Text Overlays
        if (edl.text_overlays && edl.text_overlays.length > 0) {
            for (const overlay of edl.text_overlays) {
                // Determine Y position based on zone to respect safe zones
                let yPos = '(h-text_h)/2'; // center default
                if (overlay.position_zone === 'top') yPos = '250';
                if (overlay.position_zone === 'bottom') yPos = 'h-450'; // avoiding bottom 420px UI

                // Extremely basic text rendering without external fonts (using standard sans)
                filterGraph.push(`drawtext=text='${overlay.text}':x=(w-text_w)/2:y=${yPos}:fontsize=60:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=20:enable='between(t,${overlay.start_sec},${overlay.end_sec})'`);
            }
        }

        // Apply visual filters if present (simulated via eq/colorbalance)
        if (edl.filters && edl.filters.length > 0) {
            const f = edl.filters[0];
            if (f.name === 'warm') filterGraph.push('colorbalance=rs=0.2:gs=0.1');
            if (f.name === 'cool') filterGraph.push('colorbalance=bs=0.2:gs=0.1');
            if (f.name === 'bw') filterGraph.push('hue=s=0');
            // ... more filters can be added ...
        }

        // Audio Ducking / Removal
        if (edl.audio && !edl.audio.music_enabled) {
            command.noAudio();
        }

        await new Promise((resolve, reject) => {
            if (filterGraph.length > 0) {
                command.complexFilter(filterGraph.join(','));
            }

            command
                .outputOptions([
                    '-c:v libx264',
                    '-preset fast',
                    '-c:a aac',
                    '-b:a 192k',
                    '-pix_fmt yuv420p'
                ])
                .save(tempOutput)
                .on('end', resolve)
                .on('error', (err: any) => {
                    console.error("EDL Render Error:", err);
                    reject(err);
                });
        });

        const outputBuffer = fs.readFileSync(tempOutput);
        return outputBuffer;

    } finally {
        // Cleanup temp files
        const cleanup = (filePath: string) => {
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (e) { }
            }
        };
        cleanup(tempInput);
        cleanup(tempOutput);
    }
}
