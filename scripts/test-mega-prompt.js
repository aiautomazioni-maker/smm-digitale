async function testMegaPrompt() {
    console.log(`\n--- Testing Full Video Plan Mega Prompt ---`);
    const payload = {
        lang: "it",
        workspace_id: "demo_ws_123",
        brand_kit: { brandName: "Tazze Belle", colors: ["#FF0000"] },
        user_request: "Un reel veloce di 10 secondi per mostrare l'apertura della scatola della nostra nuova tazza magica. Voglio una chiamata all'azione per commentare, e musica super allegra.",
        targets: ["instagram_reels", "tiktok"],
        source: {
            mode: "ai_generate",
            uploaded_video_url: null,
            uploaded_media_urls: [],
            image_analyses: null
        },
        preferences: {
            default_duration_sec: 10,
            tone: "engaging",
            cta_type: "comment",
            cta_value: "Commenta MAGIA per il link!",
            subtitle_mode: "word",
            layout_preset: "minimal",
            cover_style: "clean",
            want_music: true,
            music_mood: "super allegra",
            music_energy: "high"
        },
        capabilities: {
            instagram_reels: { can_publish: true, supports_cover: true },
            facebook_reels: { can_publish: true, supports_cover: true },
            tiktok: { can_publish: true, supports_cover: false },
            supports_platform_music: true,
            has_safe_music_library: false
        },
        schedule: { timezone: "Europe/Rome", publish_at_iso: null }
        // safeMode: true
    };

    try {
        const res = await fetch("http://localhost:3000/api/agent/create-full-video-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

testMegaPrompt();
