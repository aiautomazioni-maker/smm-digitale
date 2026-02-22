async function testPredictiveScoreFlow() {
    console.log(`\n--- Testing Predictive Performance Score Flow (S1 -> S3) ---`);

    try {
        // 1. S1: Predict Score
        console.log("\n[1] S1: Predicting Pre-Publish Score...");
        const s1Res = await fetch("http://localhost:3000/api/agent/predict-video-performance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                lang: "it",
                platform: "tiktok",
                video_project: { duration_sec: 25, concept: "Tutorial React" },
                script: { hook_text: "Oggi parliamo di React", on_screen_text: ["React tutorial"] },
                cover: { hook_text: "React 101", is_grid_safe: true, contrast_level: "low" },
                subtitles: { enabled: true, keyword_emphasis: false },
                copy: { caption: "Video su react lunghissimo pieno di testo...", hashtags: ["#react", "#code", "#programming", "#1", "#2", "#asdf", "#test", "#bla"] },
                publishing: { publish_at_iso: new Date().toISOString() }
            })
        });
        const s1Data = await s1Res.json();
        console.log("S1 Result:", JSON.stringify(s1Data, null, 2));

        // Let's assume the user clicks "Applica correzioni rapide" if there are any
        let s2Data = null;
        if (s1Data.auto_fixes?.can_apply_without_user?.length > 0) {
            console.log("\n[2] S2: Applying Predictive Auto-Fixes...");
            const s2Res = await fetch("http://localhost:3000/api/agent/apply-predictive-autofixes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lang: "it",
                    current: {
                        caption: "Video su react lunghissimo pieno di testo...",
                        hashtags: ["#react", "#code", "#programming", "#1", "#2", "#asdf", "#test", "#bla"],
                        subtitles: { enabled: true, mode: "phrase", position_zone: "top", keyword_emphasis: false }
                    },
                    auto_fixes: s1Data.auto_fixes
                })
            });
            s2Data = await s2Res.json();
            console.log("S2 Result:", JSON.stringify(s2Data, null, 2));
        } else {
            console.log("\n[2] S2: No auto-fixes available to apply.");
        }

        // 3. S3: Build Scorecard UI
        console.log("\n[3] S3: Building Pre-Publish Scorecard...");
        const topChange = s1Data.recommended_changes?.[0]?.change || "Nessuna modifica urgente";
        const s3Res = await fetch("http://localhost:3000/api/agent/build-prepublish-scorecard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                lang: "it",
                platform: "tiktok",
                overall: s1Data.predictive_score?.overall,
                verdict: s1Data.predictive_score?.verdict,
                top_change: topChange
            })
        });
        const s3Data = await s3Res.json();
        console.log("S3 Result:", JSON.stringify(s3Data.score_card, null, 2));

    } catch (e) {
        console.error("Test Error:", e);
    }
}

testPredictiveScoreFlow();
