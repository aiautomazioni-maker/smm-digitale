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
            existing_video_project,
            existing_script,
            existing_storyboard,
            current_editor_edl,
            current_copy,
            edit_request,
            capabilities,
            safeMode = false
        } = body;

        if (safeMode) {
            return NextResponse.json({
                updated_editor_edl: {
                    filters: [{ name: edit_request?.new_filter_style || "vibrant", intensity: 0.3 }],
                    enhancement: { denoise: 0.3, sharpen: 0.2, stabilize: false, upscale: false },
                    subtitles: { enabled: true, mode: edit_request?.subtitle_mode || "phrase", burn_in: true, style: "clean", max_chars_per_line: 28, position_zone: "center" },
                    audio: { music_mode: "safe_library", music_keywords: ["fun"], ducking: true, ducking_level: "medium", manual_steps: [] }
                },
                updated_copy: {
                    caption: "Updated caption mock from safe mode.",
                    cta: edit_request?.new_cta || "Link in bio",
                    hashtags: ["#updated", "#mock"]
                },
                cover_options: [
                    { option_index: 1, title: "Mock Cover", hook_text: "Mock Hook", prompt_en: "mock image generation prompt", negative_prompt_en: "" }
                ],
                publish_update_needed: true,
                warnings: ["Safe mode active - simulated edit plan"]
            });
        }

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const prompt = `
Sei un assistente per modificare un video verticale social già esistente.
NON devi rigenerare storyboard o script da zero.
Devi solo:
- aggiornare EDL editor (filtri, testo, sottotitoli, musica, trim)
- aggiornare caption/hashtag se richiesto
- generare nuove opzioni cover se richiesto
- aggiornare publish payload

Rispondi SEMPRE e SOLO con JSON valido.

INPUT:
{
  "lang": "${lang}",
  "workspace_id": "${workspace_id || ''}",
  "existing_video_project": ${JSON.stringify(existing_video_project || {})},
  "existing_script": ${JSON.stringify(existing_script || {})},
  "existing_storyboard": ${JSON.stringify(existing_storyboard || {})},
  "current_editor_edl": ${JSON.stringify(current_editor_edl || {})},
  "current_copy": ${JSON.stringify(current_copy || {})},
  "edit_request": ${JSON.stringify(edit_request || { change_filters: false, new_filter_style: "", improve_quality: false, change_subtitles: false, subtitle_mode: "phrase", change_music: false, music_mood: "", change_caption: false, new_cta: "", regenerate_cover: false, cover_style: "clean" })},
  "capabilities": ${JSON.stringify(capabilities || { has_safe_music_library: false, supports_platform_music: false })}
}

OUTPUT JSON:
{
  "updated_editor_edl": {
    "filters": [{"name":"string","intensity":0.0}],
    "enhancement": {
      "denoise": 0.0,
      "sharpen": 0.0,
      "stabilize": false,
      "upscale": false
    },
    "subtitles": {
      "enabled": true,
      "mode": "phrase|word",
      "burn_in": true,
      "style": "clean",
      "max_chars_per_line": 28,
      "position_zone": "center|bottom_safe"
    },
    "audio": {
      "music_mode": "safe_library|platform_music_manual|no_music",
      "music_keywords": ["string"],
      "ducking": true,
      "ducking_level": "light|medium|strong",
      "manual_steps": ["string"]
    }
  },
  "updated_copy": {
    "caption": "string",
    "cta": "string",
    "hashtags": ["string"]
  },
  "cover_options": [
    {
      "option_index": 1,
      "title": "string",
      "hook_text": "string",
      "prompt_en": "string",
      "negative_prompt_en": "string"
    }
  ],
  "publish_update_needed": true,
  "warnings": ["string"]
}

RULES:
1) NON modificare storyboard o generation_plan.
2) change_filters=true:
   - aggiorna filters.name con new_filter_style
   - intensity tra 0.2 e 0.4
3) improve_quality=true:
   - denoise almeno 0.3
   - sharpen 0.2
   - upscale=true se video <1080x1920
4) change_subtitles=true:
   - aggiorna subtitles.mode
   - mantieni safe-zone awareness
5) change_music=true:
   - se has_safe_music_library=true -> music_mode=safe_library + keywords coerenti con mood
   - altrimenti se supports_platform_music=true -> platform_music_manual + manual_steps
   - se nessuna opzione -> no_music + warning
6) change_caption=true:
   - aggiorna caption coerente con existing_script e new_cta
   - hashtags max 18
7) regenerate_cover=true:
   - genera 4 cover_options
   - prompt_en sempre in inglese
   - hook_text max 45 caratteri
8) publish_update_needed=true se:
   - caption cambia
   - cover cambia
   - musica cambia
   - altrimenti false
`;

        const result = await openai.chat.completions.create({
            model: 'gpt-4o', // using 4o for large json safety 
            messages: [{ role: 'user', content: prompt }]
        });

        const responseText = result.choices[0]?.message?.content || "{}";
        const rawJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedJson = JSON.parse(rawJson);

        return NextResponse.json(parsedJson);

    } catch (error: any) {
        console.error("AI CreateVideoEditPlan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
