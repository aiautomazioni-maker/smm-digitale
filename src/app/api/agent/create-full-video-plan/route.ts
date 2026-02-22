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
            targets = ["instagram_reels", "tiktok"],
            source,
            preferences,
            capabilities,
            schedule,
            safeMode = false
        } = body;

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

        const prompt = `
Sei un assistente completo per creare, editare e pubblicare video verticali social (Instagram Reels, Facebook Reels, TikTok).
Rispondi SEMPRE e SOLO con JSON valido (nessun markdown/backticks, nessun testo fuori dal JSON).
Non inventare dettagli sul business/prodotto se non presenti negli input.
Non includere token o segreti.
Tutti i prompt per generazione/edit video e cover devono essere in inglese.

INPUT:
{
  "lang": "${lang}",
  "workspace_id": "${workspace_id || ''}",
  "brand_kit": ${JSON.stringify(brand_kit || null)},
  "user_request": "${user_request || ''}",
  "targets": ${JSON.stringify(targets)},
  "source": ${JSON.stringify(source || { mode: "ai_generate", uploaded_video_url: null, uploaded_media_urls: [], image_analyses: null })},
  "preferences": ${JSON.stringify(preferences || { default_duration_sec: 15, tone: "engaging", cta_type: "none", cta_value: "", subtitle_mode: "phrase", layout_preset: "minimal", cover_style: "clean", want_music: true, music_mood: "energetic", music_energy: "medium" })},
  "capabilities": ${JSON.stringify(capabilities || { instagram_reels: { can_publish: true, supports_cover: true }, facebook_reels: { can_publish: true, supports_cover: true }, tiktok: { can_publish: true, supports_cover: true }, supports_platform_music: false, has_safe_music_library: true })},
  "schedule": ${JSON.stringify(schedule || { timezone: "Europe/Rome", publish_at_iso: null })}
}

OUTPUT JSON:
{
  "video_project": {
    "workspace_id": "string",
    "project_title": "string",
    "goal": "string",
    "concept": "string",
    "style_keywords": ["string"],
    "platform_targets": ["instagram_reels","facebook_reels","tiktok"],
    "specs": {
      "aspect_ratio": "9:16",
      "width": 1080,
      "height": 1920,
      "fps": 30,
      "duration_sec": 0,
      "max_duration_sec": 60,
      "safe_zone": {"top_px": 250, "bottom_px": 420}
    }
  },
  "script": {
    "hook_text": "string",
    "voiceover_text": "string|null",
    "on_screen_text": ["string"],
    "cta_text": "string"
  },
  "storyboard": {
    "scenes": [
      {
        "scene_index": 1,
        "duration_sec": 0,
        "visual_description": "string",
        "camera_motion": "static|slow_zoom|pan|handheld|parallax",
        "overlay_text": "string|null",
        "broll_needed": "ai_generate|from_upload|stock|none"
      }
    ]
  },
  "generation_plan": {
    "mode": "text_to_video|image_to_video|video_edit|assemble_clips",
    "prompt_en": "string|null",
    "negative_prompt_en": "string|null",
    "inputs": {"seed_media_urls": ["string"], "use_brand_palette": true},
    "specs": {"aspect_ratio": "9:16", "width": 1080, "height": 1920, "fps": 30, "duration_sec": 0}
  },
  "editor_edl": {
    "timeline": {
      "duration_sec": 0,
      "segments": [
        {"start_sec": 0, "end_sec": 0, "speed": 1.0, "transition_to_next": "cut|fade|whip"}
      ]
    },
    "filters": [{"name": "clean|warm|cool|vibrant|bw", "intensity": 0.0}],
    "enhancement": {"denoise": 0.0, "sharpen": 0.0, "stabilize": false, "upscale": false},
    "text_overlays": [
      {"text": "string", "start_sec": 0, "end_sec": 0, "position_zone": "top|center|bottom", "style": "minimal|modern|bold"}
    ],
    "subtitles": {
      "enabled": true,
      "mode": "phrase|word",
      "burn_in": true,
      "style": "clean",
      "max_chars_per_line": 28,
      "position_zone": "center|bottom_safe"
    },
    "audio": {
      "music_enabled": true,
      "music_mode": "safe_library|platform_music_manual|no_music",
      "music_keywords": ["string"],
      "ducking": true,
      "ducking_level": "light|medium|strong",
      "manual_steps": ["string"]
    }
  },
  "copy": {
    "caption": "string",
    "cta": "string",
    "hashtags": ["string"],
    "emoji_level": "low|medium|high"
  },
  "cover_options": [
    {
      "option_index": 1,
      "title": "string",
      "hook_text": "string",
      "prompt_en": "string",
      "negative_prompt_en": "string",
      "specs": {"width": 1080, "height": 1920, "aspect_ratio": "9:16"},
      "thumbnail_safe_crop": {"center_box_pct": 60, "notes": ["string"]},
      "overlay_plan": [{"text": "string", "position_zone": "center|top", "style": "minimal|modern|bold"}]
    }
  ],
  "publish_jobs": [
    {
      "platform": "instagram_reels|facebook_reels|tiktok",
      "content_type": "video",
      "media_url": "string|null",
      "cover_url": "string|null",
      "caption": "string",
      "hashtags": ["string"],
      "publish_at_iso": "string|null",
      "timezone": "Europe/Rome",
      "requires_manual_publish": false,
      "manual_steps": ["string"]
    }
  ],
  "warnings": ["string"]
}

RULES:
1) Specs:
- Sempre 9:16, 1080x1920, 30fps.
- duration_sec: usa preferences.default_duration_sec se valido (7..30 consigliato), altrimenti 15.
- max_duration_sec=60.
- safe_zone bottom_px=420 (evita UI TikTok/IG).

2) Script:
- hook_text max 60 caratteri.
- voiceover_text opzionale (se user_request suggerisce voce).
- on_screen_text max 6 elementi, frasi brevi.

3) Storyboard:
- 3-6 scene.
- Somma durata scene = duration_sec (±1s).

4) Generation plan:
- source.mode=ai_generate -> mode=text_to_video e prompt_en obbligatorio.
- source.mode=edit_upload -> mode=video_edit con seed_media_urls=[uploaded_video_url].
- source.mode=mixed -> mode=assemble_clips con seed_media_urls=uploaded_media_urls.
- prompt_en sempre in inglese, max 900 char. negative max 350 char.

5) Editor EDL defaults:
- filters: "clean" intensity 0.25
- enhancement: denoise 0.2, sharpen 0.15
- subtitles.enabled=true
- subtitles.position_zone: "center" se target include tiktok, altrimenti "bottom_safe".
- audio:
  - se preferences.want_music=false -> music_mode=no_music
  - se has_safe_music_library=true -> safe_library con 5-10 keyword
  - se non disponibile e supports_platform_music=true -> platform_music_manual + manual steps
  - se voiceover_text presente -> ducking_level almeno "medium"

6) Copy:
- hashtags max 18 con # e senza spazi.
- Caption coerente con concept e CTA.

7) Cover:
- 4 cover_options sempre.
- hook_text cover max 45 char.
- thumbnail_safe_crop.center_box_pct=60 e note su testo nel centro.

8) Publish jobs:
- Crea un job per ogni platform in targets.
- Se capabilities.platform.can_publish=false -> requires_manual_publish=true + manual_steps.
- Se supports_cover=false -> cover_url=null + warning "cover_not_supported" + manual_steps "Imposta copertina manualmente".
- media_url inizialmente null (finché non hai render finale). NON inventare URL: se non disponibile, null + warning "video_pending_render".
`;

        // Switch to the larger model for a task this complex
        const result = await openai.chat.completions.create({
            model: 'gpt-4o', // using standard 4o to ensure perfect schema adherence on massive json
            messages: [{ role: 'user', content: prompt }]
        });

        const responseText = result.choices[0]?.message?.content || "{}";
        const rawJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedJson = JSON.parse(rawJson);

        return NextResponse.json(parsedJson);

    } catch (error: any) {
        console.error("AI CreateFullVideoPlan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
