import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            lang = "it",
            video_project,
            brand_kit,
            script,
            user_edit_intent,
            safeMode = false
        } = body;

        if (safeMode) {
            return NextResponse.json({
                editor_edl: {
                    timeline: { duration_sec: 15, segments: [{ start_sec: 0, end_sec: 15, speed: 1.0, transition_to_next: "cut" }] },
                    crop: { aspect_ratio: "9:16", safe_zone: { top_px: 250, bottom_px: 420 } },
                    filters: [{ name: "clean", intensity: 0.25 }],
                    enhancement: { denoise: 0.2, sharpen: 0.15, stabilize: false, upscale: false },
                    text_overlays: [],
                    subtitles: { enabled: true, burn_in: true, style: "clean", max_chars_per_line: 28 },
                    audio: { music_enabled: true, music_style: "upbeat", ducking: true }
                },
                warnings: ["Safe mode active"]
            });
        }

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const prompt = `
BuildManualEditorEDL
Crea un EDL (Edit Decision List) per un editor manuale stile Instagram (non distruttivo). Include trim, crop, speed, color/filters, sharpening/denoise, overlays, subtitles, transitions.

INPUT:
{
  "lang": "${lang}",
  "video_project": ${JSON.stringify(video_project || {})},
  "brand_kit": ${JSON.stringify(brand_kit || null)},
  "script": ${JSON.stringify(script || null)},
  "user_edit_intent": "${(user_edit_intent || "").replace(/"/g, '\\"')}"
}

OUTPUT JSON SCHEMA:
{
  "editor_edl": {
    "timeline": {
      "duration_sec": 0,
      "segments": [
        {"start_sec": 0, "end_sec": 0, "speed": 1.0, "transition_to_next": "cut|fade|whip"}
      ]
    },
    "crop": {"aspect_ratio": "9:16", "safe_zone": {"top_px": 250, "bottom_px": 420}},
    "filters": [
      {"name": "clean|warm|cool|vibrant|bw", "intensity": 0.0}
    ],
    "enhancement": {
      "denoise": 0.0,
      "sharpen": 0.0,
      "stabilize": false,
      "upscale": false
    },
    "text_overlays": [
      {"text": "string", "start_sec": 0, "end_sec": 0, "position_zone": "top|center|bottom", "style": "minimal|modern|bold"}
    ],
    "subtitles": {
      "enabled": true,
      "burn_in": true,
      "style": "clean",
      "max_chars_per_line": 28
    },
    "audio": {
      "music_enabled": true,
      "music_style": "string",
      "ducking": true
    }
  },
  "warnings": ["string"]
}

RULES:
- Rispondi SEMPRE e SOLO con JSON valido. Nessun markdown.
- Intensità filtri 0.0-1.0.
- Default: filter "clean" intensity 0.25, denoise 0.2, sharpen 0.15.
- Text overlay: mai in safe zone bottom 420px per elementi critici.
- Subtitles: safe-zone aware.
`;

        const result = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }]
        });

        const responseText = result.choices[0]?.message?.content || "{}";
        const rawJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedJson = JSON.parse(rawJson);

        return NextResponse.json(parsedJson);

    } catch (error: any) {
        console.error("AI BuildManualEditorEDL Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
