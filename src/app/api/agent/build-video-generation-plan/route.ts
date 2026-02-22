import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            video_project,
            brand_kit,
            script,
            storyboard,
            source,
            safeMode = false
        } = body;

        if (safeMode) {
            return NextResponse.json({
                generation_plan: {
                    mode: "text_to_video",
                    prompt_en: "vertical 9:16, high quality, cinematic lighting, sharp focus, dynamic shot of artisanal ceramic mugs on a rustic wooden table",
                    negative_prompt_en: "blurry, low quality, distorted, watermark",
                    inputs: { seed_media_urls: source?.uploaded_media_urls || [], use_brand_palette: true },
                    specs: { aspect_ratio: "9:16", width: 1080, height: 1920, fps: 30, duration_sec: 15 },
                    music: { style: "upbeat modern acoustic", use_safe_library: true },
                    subtitles: { enabled: true, style: "clean", safe_zone_aware: true }
                },
                warnings: ["Safe mode active"]
            });
        }

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const prompt = `
BuildVideoGenerationPlan
Crea un piano di generazione/assemblaggio video in base al route specificato nel source.
Prompt sempre in inglese.

INPUT:
{
  "video_project": ${JSON.stringify(video_project || {})},
  "brand_kit": ${JSON.stringify(brand_kit || null)},
  "script": ${JSON.stringify(script || null)},
  "storyboard": ${JSON.stringify(storyboard || null)},
  "source": ${JSON.stringify(source || {})}
}

OUTPUT JSON SCHEMA:
{
  "generation_plan": {
    "mode": "text_to_video|image_to_video|video_edit|assemble_clips",
    "prompt_en": "string|null",
    "negative_prompt_en": "string|null",
    "inputs": {
      "seed_media_urls": ["string"],
      "use_brand_palette": true
    },
    "specs": {
      "aspect_ratio": "9:16",
      "width": 1080,
      "height": 1920,
      "fps": 30,
      "duration_sec": 0
    },
    "music": {
      "style": "string|null",
      "use_safe_library": true
    },
    "subtitles": {
      "enabled": true,
      "style": "clean",
      "safe_zone_aware": true
    }
  },
  "warnings": ["string"]
}

RULES:
- Rispondi SEMPRE e SOLO con JSON valido. Nessun markdown.
- Se route=ai_generate: mode=text_to_video e prompt_en obbligatorio.
- Se route=edit_upload: mode=video_edit e prompt_en null, usa inputs.seed_media_urls=[uploaded_video_url].
- Se route=mixed: mode=assemble_clips usando uploaded_media_urls come base + generazione di b-roll se serve.
- prompt_en max 900 caratteri, negative_prompt_en max 350.
- In prompt_en specifica chiaramente: "vertical 9:16, high quality, cinematic lighting, sharp focus".
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
        console.error("AI BuildVideoGenerationPlan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
