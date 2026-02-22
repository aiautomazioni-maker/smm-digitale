import sharp from 'sharp';

/**
 * Composites the text over the provided image buffer.
 * It uses SVG to render text with wrapping and background.
 */
export async function burnTextOnImage(imageBuffer: Buffer, text: string): Promise<Buffer> {
    if (!text || text.trim() === '') {
        return imageBuffer;
    }

    try {
        const image = sharp(imageBuffer);
        const metadata = await image.metadata();
        const width = metadata.width || 1080;
        const height = metadata.height || 1920;

        // Clean up text for SVG XML
        const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

        // Basic SVG wrapping approach. For robust stories, we use a centered text box 
        // with a semi-transparent black background.
        const svgImage = `
            <svg width="${width}" height="${height}">
                <style>
                    .text {
                        fill: white;
                        font-family: Arial, sans-serif;
                        font-size: 40px;
                        font-weight: bold;
                    }
                    .bg {
                        fill: rgba(0, 0, 0, 0.6);
                    }
                </style>
                <rect x="10%" y="70%" width="80%" height="20%" rx="20" ry="20" class="bg" />
                <foreignObject x="12%" y="72%" width="76%" height="16%">
                    <div xmlns="http://www.w3.org/1999/xhtml" style="color: white; font-family: Arial, sans-serif; font-size: 40px; font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center; height: 100%;">
                        ${safeText.replace(/\n/g, '<br/>')}
                    </div>
                </foreignObject>
            </svg>
        `;

        const svgBuffer = Buffer.from(svgImage);

        return await image
            .composite([
                {
                    input: svgBuffer,
                    top: 0,
                    left: 0,
                },
            ])
            .jpeg({ quality: 90 })
            .toBuffer();

    } catch (error) {
        console.error("Error in burnTextOnImage:", error);
        // Fallback to original image if processing fails
        return imageBuffer;
    }
}

/**
 * Generates an MP4 video combining a static image buffer and an audio URL.
 */
export async function generateVideoStory(imageBuffer: Buffer, audioUrl: string): Promise<Buffer> {
    const ffmpeg = require('fluent-ffmpeg');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    // Fix for Next.js webpack breaking static binary paths
    let ffmpegPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg');
    let ffprobePath = path.join(process.cwd(), 'node_modules', 'ffprobe-static', 'bin', os.platform() === 'darwin' ? 'darwin' : os.platform() === 'win32' ? 'win32' : 'linux', os.arch() === 'x64' ? 'x64' : 'ia32', os.platform() === 'win32' ? 'ffprobe.exe' : 'ffprobe');

    // Fallback to exactly what the modules return, but replace /ROOT if it's there
    try {
        const staticFfmpeg = require('ffmpeg-static');
        if (staticFfmpeg && fs.existsSync(staticFfmpeg)) ffmpegPath = staticFfmpeg;

        const staticFfprobe = require('ffprobe-static').path;
        if (staticFfprobe && fs.existsSync(staticFfprobe)) ffprobePath = staticFfprobe;
    } catch (e) { }

    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);


    const tempId = Date.now().toString();
    const tempImage = path.join(os.tmpdir(), `story_img_${tempId}.jpg`);
    const tempAudio = path.join(os.tmpdir(), `story_aud_${tempId}.mp3`);
    const tempOutput = path.join(os.tmpdir(), `story_out_${tempId}.mp4`);

    try {
        // 1. Write image buffer to temp file
        fs.writeFileSync(tempImage, imageBuffer);

        // 2. Download audio to temp file
        const audioRes = await fetch(audioUrl);
        if (!audioRes.ok) throw new Error("Failed to fetch audio");
        const audioArrayBuffer = await audioRes.arrayBuffer();
        fs.writeFileSync(tempAudio, Buffer.from(audioArrayBuffer));

        // 3. Process with FFmpeg
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(tempImage)
                .loop(15) // 15 seconds duration for Story
                .input(tempAudio)
                .outputOptions([
                    '-c:v libx264',
                    '-tune stillimage',
                    '-c:a aac',
                    '-b:a 192k',
                    '-pix_fmt yuv420p',
                    '-shortest', // Stop encoding when the shortest stream ends (the 15s image or audio)
                    '-t 15' // Hard limit to 15s
                ])
                .save(tempOutput)
                .on('end', resolve)
                .on('error', (err: any) => {
                    console.error("FFMPEG Error:", err);
                    reject(err);
                });
        });

        // 4. Read result back into buffer
        const outputBuffer = fs.readFileSync(tempOutput);
        return outputBuffer;

    } catch (error) {
        console.error("Error generating video story:", error);
        throw error;
    } finally {
        // Cleanup temp files
        const cleanup = (filePath: string) => {
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (e) { }
            }
        };
        cleanup(tempImage);
        cleanup(tempAudio);
        cleanup(tempOutput);
    }
}

