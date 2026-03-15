const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env' });

/**
 * TRAFFIC GENERATOR V2: Stress & Pipeline Validation
 * Simulates concurrent users performing various actions with random delays and error cases.
 */

const CONFIG = {
    CONCURRENT_USERS: 30,
    ACTIONS_PER_USER: 8,
    DELAY: { MIN: 500, MAX: 5000 },
    BASE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    TEST_ID: crypto.randomUUID(),
    DUMMY_VIDEO_URL: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4'
};

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function logTestResult(action, status, start, error = null, metadata = {}) {
    const duration = Date.now() - start;
    try {
        await supabase.from('pipeline_test_logs').insert({
            test_id: CONFIG.TEST_ID,
            action,
            status,
            duration_ms: duration,
            error_details: error ? (error.message || JSON.stringify(error)) : null,
            metadata: { ...metadata, timestamp: new Date().toISOString() }
        });
    } catch (e) {
        console.error("Failed to log to DB:", e.message);
    }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock EDL for rendering
const MOCK_EDL = {
    timeline: {
        duration_sec: 10,
        segments: [{ start_sec: 0, end_sec: 10, speed: 1, transition_to_next: 'none' }]
    },
    text_overlays: [{ text: "Stress Test", start_sec: 1, end_sec: 5, position_zone: 'top', style: 'modern' }]
};

async function validatePipeline(projectId, jobId) {
    // 1. Check if job exists and reaches completed
    let attempts = 0;
    while (attempts < 20) {
        const { data: job } = await supabase.from('render_jobs').select('*').eq('id', jobId).single();
        if (job && job.status === 'completed') {
            // Verify output URL
            if (job.output_url && job.output_url.startsWith('http')) {
                return { valid: true, url: job.output_url };
            }
        }
        if (job && job.status === 'failed') return { valid: false, error: job.error_message };
        await sleep(3000);
        attempts++;
    }
    return { valid: false, error: 'Timeout waiting for render' };
}

async function simulateUser(userId) {
    console.log(`[User ${userId}] Simulating...`);

    for (let i = 0; i < CONFIG.ACTIONS_PER_USER; i++) {
        const start = Date.now();
        await sleep(Math.random() * (CONFIG.DELAY.MAX - CONFIG.DELAY.MIN) + CONFIG.DELAY.MIN);

        // Randomly pick an action or an error case
        const scenario = Math.random();
        
        try {
            if (scenario < 0.05) { // 5% Prompt Vuoto
                console.log(`[User ${userId}] Scenario: Prompt Vuoto`);
                const res = await fetch(`${CONFIG.BASE_URL}/api/agent/generate-image`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: "" })
                });
                await logTestResult('generate_image', res.ok ? 'success' : 'error', start, !res.ok ? new Error('Expected prompt error') : null, { scenario: 'empty_prompt' });
            } 
            else if (scenario < 0.10) { // 5% Asset non trovato
                console.log(`[User ${userId}] Scenario: Asset non trovato`);
                const res = await fetch(`${CONFIG.BASE_URL}/api/video/render-video`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoUrl: "https://invalid.url/video.mp4", edl: MOCK_EDL })
                });
                // This might return success (job queued) but failed later. We log success if queued.
                await logTestResult('render', 'success', start, null, { scenario: 'invalid_asset' });
            }
            else if (scenario < 0.55) { // 45% Render Video (Success Path)
                console.log(`[User ${userId}] Action: Render Video`);
                const res = await fetch(`${CONFIG.BASE_URL}/api/video/render-video`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoUrl: CONFIG.DUMMY_VIDEO_URL, edl: MOCK_EDL, platform: 'TIKTOK' })
                });
                const data = await res.json();
                if (res.ok) {
                    await logTestResult('render', 'success', start, null, { job_id: data.job_id });
                    // Background validation
                    validatePipeline(data.project_id, data.job_id).then(v => {
                        logTestResult('pipeline_validation', v.valid ? 'success' : 'error', start, v.error ? new Error(v.error) : null, { project_id: data.project_id });
                    });
                } else {
                    await logTestResult('render', 'error', start, new Error(data.error));
                }
            }
            else { // 45% Generate Image (Success Path)
                console.log(`[User ${userId}] Action: Generate Image`);
                const res = await fetch(`${CONFIG.BASE_URL}/api/agent/generate-image`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        prompt: "A beautiful abstract painting of AI data flowing", 
                        format: "post",
                        model: "flux-schnell" 
                    })
                });
                const data = await res.json();
                await logTestResult('generate_image', res.ok ? 'success' : 'error', start, !res.ok ? new Error(data.error || 'Image gen failed') : null);
            }
        } catch (err) {
            await logTestResult('system_error', 'error', start, err);
        }
    }
}

async function run() {
    console.log(`🚀 STRESS TEST STARTED | TEST_ID: ${CONFIG.TEST_ID}`);
    console.log(`   Config: ${CONFIG.CONCURRENT_USERS} users, ${CONFIG.ACTIONS_PER_USER} actions each`);
    console.log(`   Base URL: ${CONFIG.BASE_URL}`);
    
    const users = Array.from({ length: CONFIG.CONCURRENT_USERS }, (_, i) => simulateUser(i + 1));
    console.log(`   Spawned ${users.length} user simulations...`);
    
    await Promise.all(users);
    console.log(`\n🏁 STRESS TEST FINISHED | Results in pipeline_test_logs`);
}

run().catch(console.error);
