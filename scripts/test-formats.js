
async function testPublish(type, mediaUrls) {
    console.log(`\n--- Testing ${type} with ${mediaUrls.length} media URLs ---`);
    const payload = {
        lang: "it",
        platform: "facebook",
        workspace_id: "test_ws",
        post: {
            content_type: type,
            caption: `Test ${type} publishing`,
            hashtags: ["test", type],
            media_urls: mediaUrls
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

async function runTests() {
    // 1. Carousel
    await testPublish("carousel", [
        "https://picsum.photos/800/800?random=1",
        "https://picsum.photos/800/800?random=2"
    ]);

    // 2. Story
    await testPublish("story", [
        "https://picsum.photos/1080/1920?random=3"
    ]);
}

runTests();
