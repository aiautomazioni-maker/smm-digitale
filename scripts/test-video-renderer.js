const fs = require('fs');
const path = require('path');
// Import the TS compiler on the fly for the test script
require('ts-node').register();
const renderer = require('../src/lib/video-renderer');

async function testEDLRender() {
    console.log(`\n--- Testing EDL Video Engine ---`);

    // We need a dummy input video buffer. For testing, we can use the result of test-rich-story.js 
    // or simulate it, but since we don't have a reliable mp4 lying around in this script, we'll
    // download a small public domain sample video to memory.

    console.log("Downloading sample MP4...");
    const sampleRes = await fetch("http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4");
    const videoBuffer = Buffer.from(await sampleRes.arrayBuffer());

    console.log(`Sample downloaded: ${videoBuffer.length} bytes.`);

    const mockEDL = {
        timeline: {
            duration_sec: 5,
            segments: [
                { start_sec: 2, end_sec: 7, speed: 1.0, transition_to_next: "cut" }
            ]
        },
        crop: {
            aspect_ratio: "9:16",
            safe_zone: { top_px: 250, bottom_px: 420 }
        },
        filters: [
            { name: "bw", intensity: 1.0 }
        ],
        text_overlays: [
            { text: "B&W TEST", start_sec: 0, end_sec: 5, position_zone: "center", style: "bold" },
            { text: "TOP ZONE", start_sec: 2, end_sec: 5, position_zone: "top", style: "minimal" }
        ],
        audio: {
            music_enabled: false, // Mute original
            music_style: "none",
            ducking: false
        }
    };

    try {
        console.log("Starting FFmpeg engine rendering...");
        const outputBuffer = await renderer.renderVideoFromEDL(videoBuffer, mockEDL);

        const outPath = path.join(__dirname, 'edl-test-output.mp4');
        fs.writeFileSync(outPath, outputBuffer);

        console.log(`✅ Success! Rendered video saved to ${outPath}`);
    } catch (e) {
        console.error("Rendering Error:", e);
    }
}

testEDLRender();
