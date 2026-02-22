async function testCreateVideoProject() {
    console.log(`\n--- Testing Create Video Project AI ---`);
    const payload = {
        lang: "it",
        workspace_id: "test_ws",
        platforms: ["instagram_reels", "tiktok"],
        user_request: "Voglio fare un video per promuovere la mia nuova linea di tazze in ceramica artigianale. Facciamolo dinamico.",
        brand_kit: {
            brandName: "Ceramiche Belle",
            colors: ["#FFAA00", "#FFFFFF"]
        },
        source: {
            mode: "ai_generate",
            uploaded_video_url: null,
            uploaded_media_urls: []
        }
    };

    try {
        const res = await fetch("http://localhost:3000/api/agent/create-video-project", {
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

testCreateVideoProject();
