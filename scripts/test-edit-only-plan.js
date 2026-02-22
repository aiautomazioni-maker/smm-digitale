async function testEditOnlyPlan() {
    console.log(`\n--- Testing Edit-Only Video Plan ---`);

    const payload = {
        lang: "it",
        workspace_id: "demo_ws_123",
        existing_video_project: {
            project_title: "Old Video",
            specs: { aspect_ratio: "9:16", duration_sec: 15 }
        },
        existing_script: {
            hook_text: "Old Hook",
            voiceover_text: "Bla bla bla, buy my product",
            cta_text: "Click here"
        },
        existing_storyboard: { scenes: [{ scene_index: 1, duration_sec: 15 }] },
        current_editor_edl: {
            filters: [{ name: "clean", intensity: 0.2 }],
            subtitles: { mode: "phrase" },
            audio: { music_keywords: ["pop"] }
        },
        current_copy: {
            caption: "Old caption for an old video",
            hashtags: ["#old"]
        },
        edit_request: {
            change_filters: true,
            new_filter_style: "vibrant",
            improve_quality: true,
            change_subtitles: true,
            subtitle_mode: "word",
            change_music: true,
            music_mood: "cinematic epic",
            change_caption: true,
            new_cta: "Seguimi per altre avventure!",
            regenerate_cover: true,
            cover_style: "bold"
        },
        capabilities: {
            has_safe_music_library: true,
            supports_platform_music: false
        }
        // safeMode: true
    };

    try {
        const res = await fetch("http://localhost:3000/api/agent/create-video-edit-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log("Edit-Only Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

testEditOnlyPlan();
