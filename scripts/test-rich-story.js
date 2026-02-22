

async function testRichStory() {
    console.log(`\n--- Testing Rich Video Story with Music & Text ---`);
    const payload = {
        lang: "it",
        platform: "facebook",
        workspace_id: "test_ws",
        post: {
            content_type: "story",
            caption: "Offerta Esclusiva!\n\nAcquista ora e ricevi il 20% di sconto.",
            hashtags: ["offerta", "sconto", "promozione"],
            // A random vertical image
            media_urls: ["https://picsum.photos/1080/1920?random=100"],
            // A sample royalty free audio track URL for testing
            audio_url: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg"
        }
    };

    try {
        const res = await fetch("http://localhost:3000/api/agent/publish", {
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

testRichStory();
