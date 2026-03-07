const fetch = require('node-fetch');

async function testOpenAIFallback() {
    console.log("--- Testing OpenAI Fallback ---");
    // We expect this to return the Demo Project if the key is invalid (which it might be in this environment)
    try {
        const res = await fetch('http://localhost:3000/api/agent/create-full-video-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workspace_id: "test_ws",
                targets: ["tiktok_reels"],
                lang: "it"
            })
        });
        const data = await res.json();
        if (data.warnings && data.warnings.some(w => w.includes("OPENAI_API_ERROR"))) {
            console.log("✅ OpenAI Fallback successful: Received Demo Project with warning.");
        } else if (data.video_project) {
            console.log("✅ OpenAI Success: Received dynamic video project.");
        } else {
            console.log("❌ OpenAI Fallback failed: unexpected response", data);
        }
    } catch (e) {
        console.log("❌ OpenAI Fallback failed: network error", e.message);
    }
}

async function testTikTokPublish() {
    console.log("\n--- Testing TikTok Publish (Simulation) ---");
    try {
        const res = await fetch('http://localhost:3000/api/agent/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                platform: 'tiktok',
                workspace_id: 'test_ws',
                lang: 'it',
                post: {
                    content_type: 'reel',
                    caption: "Test TikTok Publish",
                    hashtags: ["#test"],
                    media_urls: ["https://example.com/test.mp4"]
                }
            })
        });
        const data = await res.json();
        if (data.simulated || data.success) {
            console.log("✅ TikTok Publish successful (Simulated/Real).");
        } else {
            console.log("❌ TikTok Publish failed:", data.error);
        }
    } catch (e) {
        console.log("❌ TikTok Publish failed: network error", e.message);
    }
}

async function runTests() {
    // Note: These tests require the dev server to be running.
    // Since I cannot guarantee the server state, I will perform high-level verification.
    await testOpenAIFallback();
    await testTikTokPublish();
}

runTests();
