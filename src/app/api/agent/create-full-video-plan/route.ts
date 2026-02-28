import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            lang = "it",
            workspace_id,
            brand_kit,
            user_request,
          advanced_config = {},
            targets = ["instagram_reels", "tiktok"],
            source,
            preferences,
            capabilities,
            schedule,
            safeMode = false
        } = body;

      // ... safeMode logic remains ...
        if (safeMode) {
            return NextResponse.json({
                video_project: {
                    workspace_id: workspace_id || "simulated",
                    project_title: "Mocked Project",
                    goal: "Safe Mode Mock",
                    concept: "Simulated response",
                    style_keywords: ["mock"],
                    platform_targets: targets,
                    specs: { aspect_ratio: "9:16", width: 1080, height: 1920, fps: 30, duration_sec: 15, max_duration_sec: 60, safe_zone: { top_px: 250, bottom_px: 420 } }
                },
                script: { hook_text: "Mock Hook", voiceover_text: "Mock text", on_screen_text: ["text"], cta_text: "Link in bio" },
                storyboard: { scenes: [{ scene_index: 1, duration_sec: 15, visual_description: "Blank scene", camera_motion: "static", overlay_text: null, broll_needed: "none" }] },
                generation_plan: { mode: "text_to_video", prompt_en: "mock video prompt", negative_prompt_en: "", inputs: { seed_media_urls: [], use_brand_palette: true }, specs: { aspect_ratio: "9:16", width: 1080, height: 1920, fps: 30, duration_sec: 15 } },
                editor_edl: { timeline: { duration_sec: 15, segments: [{ start_sec: 0, end_sec: 15, speed: 1.0, transition_to_next: "cut" }] }, filters: [{ name: "clean", intensity: 0.25 }], enhancement: { denoise: 0.2, sharpen: 0.15, stabilize: false, upscale: false }, text_overlays: [], subtitles: { enabled: true, mode: "phrase", burn_in: true, style: "clean", max_chars_per_line: 28, position_zone: "center" }, audio: { music_enabled: true, music_mode: "safe_library", music_keywords: ["upbeat"], ducking: true, ducking_level: "medium", manual_steps: [] } },
                copy: { caption: "Mock caption", cta: "Link in bio", hashtags: ["#mock"], emoji_level: "medium" },
                cover_options: [{ option_index: 1, title: "Cover", hook_text: "Cover Hook", prompt_en: "cover prompt", negative_prompt_en: "", specs: { width: 1080, height: 1920, aspect_ratio: "9:16" }, thumbnail_safe_crop: { center_box_pct: 60, notes: ["Keep center"] }, overlay_plan: [] }],
                publish_jobs: targets.map((t: string) => ({ platform: t, content_type: "video", media_url: null, cover_url: null, caption: "Default cap", hashtags: [], publish_at_iso: null, timezone: "Europe/Rome", requires_manual_publish: false, manual_steps: [] })),
                warnings: ["Safe Mode Active - Generated from local mock"]
            });
        }

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

      const safeSource = source ? { ...source } : null;
      if (safeSource && safeSource.media_url && safeSource.media_url.startsWith('data:')) {
        safeSource.media_url = `[DATA_URL_TRUNCATED]`;
      }

        const prompt = `
You are a senior TikTok/Reels content strategist specialized in high-retention vertical videos.
Your task is to generate a complete video concept optimized for performance.

CLIENT DATA:
- Industry: ${advanced_config.industry || 'General'}
- Content Type: ${advanced_config.content_type || 'Educational'}
- Marketing Goal: ${advanced_config.goal || 'Awareness'}
- Target Audience: ${advanced_config.target_audience || 'Broad'}
- Key Topic: ${advanced_config.topic || user_request}
- Offer: ${advanced_config.offer || 'None'}
- Lang: ${lang}

Before generating the script, analyze:
- What emotional trigger works best for this industry?
- What psychological bias should be used? (curiosity gap, social proof, urgency, authority, relatability)
- What type of hook statistically performs best for this niche?

Generate a TikTok video concept that is:
1. Optimized for retention (strong hook in first 3 seconds)
2. Designed for vertical 9:16 format
3. Between 20-45 seconds unless strategically longer
4. Native to TikTok style (not corporate)
5. Emotion-driven and psychologically engaging

The tone must adapt automatically based on industry. Avoid generic scripts. Make it feel like native viral TikTok content.
Respect TikTok best practices: Hook in under 2 seconds, pattern interrupt within 5 seconds, short sentences, spoken language, optimize for average watch time.

OUTPUT JSON STRUCTURE:
{
  "analysis": {
    "emotional_trigger": "string",
    "psychological_bias": "string",
    "recommended_hook_type": "string",
    "retention_score": 0.0,
    "why_it_works": "string"
  },
  "video_project": {
    "project_title": "string",
    "goal": "string",
    "concept": "string",
    "style_keywords": ["string"],
    "specs": {
      "aspect_ratio": "9:16",
      "duration_sec": 30
    }
  },
  "content_variants": {
    "hooks": ["string", "string", "string"],   // Provide 3 highly optimized hook variations
    "ctas": ["string", "string"],              // Provide 2 CTA variations optimized for the goal
    "captions": ["string", "string"]           // Provide 2 TikTok optimized captions (conversational, emojis)
  },
  "script": {
    "hook_text": "string (chose the best from variants)",
    "voiceover_text": "Full voiceover script here",
    "on_screen_text": ["Key text elements floating on screen"],
    "cta_text": "string (chose the best from variants)"
  },
  "storyboard": {
    "scenes": [
      {
        "scene_index": 1,
        "duration_sec": 5,
        "visual_description": "What happens visually",
        "camera_motion": "static|dynamic|zoom",
        "overlay_text": "string|null"
      }
    ]
  },
  "editor_edl": {
    "timeline": { "duration_sec": 30 },
    "filters": [{"name": "vibrant", "intensity": 0.5}],
    "audio": {
      "music_enabled": true,
      "music_keywords": ["trending", "lofi", "upbeat"],
      "ducking": true
    },
    "subtitles": { "enabled": true, "mode": "word", "burn_in": true, "style": "dynamic" }
  },
  "publish_jobs": [
    {
      "platform": "tiktok",
      "caption": "string",
      "hashtags": ["#viral", "#niche"]
    }
  ]
}

Respond ONLY with valid JSON. No markdown backticks. All text in ${lang}.
`;


        // Switch to the larger model for a task this complex
      let result;
      try {
        result = await openai.chat.completions.create({
          model: 'gpt-4o', // using standard 4o to ensure perfect schema adherence on massive json
          messages: [{ role: 'user', content: prompt }]
        });
        } catch (apiError: any) {
          console.error("OpenAI API Failure, falling back to Demo Project:", apiError);

          // Return the same mock project as safeMode but with a dynamic warning
          return NextResponse.json({
            video_project: {
              workspace_id: workspace_id || "demo_ws",
              project_title: "Demo Project (AI Fallback)",
              goal: "Visual demonstration",
              concept: "Il sistema ha caricato un progetto demo perché l'AI è momentaneamente non disponibile.",
              style_keywords: ["demo", "fallback"],
              platform_targets: targets,
              specs: { aspect_ratio: "9:16", width: 1080, height: 1920, fps: 30, duration_sec: 15, max_duration_sec: 60, safe_zone: { top_px: 250, bottom_px: 420 } }
            },
            script: { hook_text: "Benvenuto nel Video Studio", voiceover_text: "Questo è un progetto demo caricato in modalità fallback.", on_screen_text: ["Demo Mode"], cta_text: "Inizia a creare" },
            storyboard: { scenes: [{ scene_index: 1, duration_sec: 15, visual_description: "Interfaccia demo attiva", camera_motion: "static", overlay_text: "Demo", broll_needed: "none" }] },
            generation_plan: { mode: "text_to_video", prompt_en: "demo video", negative_prompt_en: "", inputs: { seed_media_urls: [], use_brand_palette: true }, specs: { aspect_ratio: "9:16", width: 1080, height: 1920, fps: 30, duration_sec: 15 } },
            editor_edl: { timeline: { duration_sec: 15, segments: [{ start_sec: 0, end_sec: 15, speed: 1.0, transition_to_next: "cut" }] }, filters: [{ name: "clean", intensity: 0.25 }], enhancement: { denoise: 0.2, sharpen: 0.15, stabilize: false, upscale: false }, text_overlays: [], subtitles: { enabled: true, mode: "phrase", burn_in: true, style: "clean", max_chars_per_line: 28, position_zone: "center" }, audio: { music_enabled: true, music_mode: "safe_library", music_keywords: ["upbeat"], ducking: true, ducking_level: "medium", manual_steps: [] } },
            copy: { caption: "Progetto Demo", cta: "Link in bio", hashtags: ["#demo"], emoji_level: "medium" },
            cover_options: [{ option_index: 1, title: "Cover Demo", hook_text: "Demo Hook", prompt_en: "cover prompt", negative_prompt_en: "", specs: { width: 1080, height: 1920, aspect_ratio: "9:16" }, thumbnail_safe_crop: { center_box_pct: 60, notes: ["Keep center"] }, overlay_plan: [] }],
            publish_jobs: targets.map((t: string) => ({ platform: t, content_type: "video", media_url: null, cover_url: null, caption: "Default cap", hashtags: [], publish_at_iso: null, timezone: "Europe/Rome", requires_manual_publish: false, manual_steps: [] })),
            warnings: [`OPENAI_API_ERROR: ${apiError.message || 'Errore Sconosciuto'}. Caricato Demo Project.`]
          });
        }

        const responseText = result.choices[0]?.message?.content || "{}";
        const rawJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedJson = JSON.parse(rawJson);

      // Inject the original uploaded video URL so the timeline editor has access to it
      if (source?.media_url) {
        if (!parsedJson.video_project) parsedJson.video_project = {};
        parsedJson.video_project.original_video_url = source.media_url;
      }

        return NextResponse.json(parsedJson);

    } catch (error: any) {
        console.error("AI CreateFullVideoPlan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
