async function testPerformanceFlow() {
    console.log(`\n--- Testing Performance Optimizer Flow (P1 -> P4) ---`);

    try {
        // 1. P1: Analyze Performance
        console.log("\n[1] P1: Analyzing Performance Metrics...");
        const p1Res = await fetch("http://localhost:3000/api/agent/analyze-video-performance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                lang: "it",
                video_project: { specs: { duration_sec: 25 } },
                script: { hook_text: "Un hook medio" },
                metrics: {
                    platform: "tiktok",
                    views: 10000,
                    reach: 8000,
                    watch_time_avg_sec: 4,
                    completion_rate_pct: 15,
                    likes: 120,
                    comments: 5,
                    shares: 10,
                    saves: 50
                }
            })
        });
        const p1Data = await p1Res.json();
        console.log("P1 Result:", JSON.stringify(p1Data, null, 2));

        // 2. P2: Build Optimization Plan V2
        console.log("\n[2] P2: Building Optimization Plan V2...");
        const p2Res = await fetch("http://localhost:3000/api/agent/build-video-optimization-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                lang: "it",
                performance_summary: p1Data.performance_summary,
                retention_analysis: p1Data.retention_analysis,
                engagement_analysis: p1Data.engagement_analysis,
                cover_effectiveness: p1Data.cover_effectiveness
            })
        });
        const p2Data = await p2Res.json();
        console.log("P2 Result:", JSON.stringify(p2Data, null, 2));

        // 3. P3: Generate Optimized Video Version
        console.log("\n[3] P3: Generating Optimized Video (V2)...");
        const p3Res = await fetch("http://localhost:3000/api/agent/generate-optimized-video-version", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                lang: "it",
                existing_video_project: { duration_sec: 25 },
                existing_script: { hook_text: "Un hook medio", cta_text: "Guarda il mio profilo" },
                existing_copy: { caption: "Video originale noioso", hashtags: ["#boring"] },
                v2_strategy: p2Data.v2_strategy
            })
        });
        const p3Data = await p3Res.json();
        console.log("P3 Result:", JSON.stringify(p3Data, null, 2));

        // 4. P4: Dashboard Card
        console.log("\n[4] P4: Building Performance Dashboard Card...");
        const p4Res = await fetch("http://localhost:3000/api/agent/build-performance-card", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                video_title: "My TikTok Test Video",
                overall_score: p1Data.performance_summary?.overall_score,
                verdict: p1Data.performance_summary?.verdict,
                optimization_priorities: p1Data.optimization_priorities
            })
        });
        const p4Data = await p4Res.json();
        console.log("P4 Result:", JSON.stringify(p4Data.dashboard_card, null, 2));

    } catch (e) {
        console.error("Test Error:", e);
    }
}

testPerformanceFlow();
