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
            safeMode = false
        } = body;

        // SAFE MODE CHECK
        if (safeMode) {
            console.log("SAFE MODE ACTIVE: Returning mock Video Script.");
            return NextResponse.json({
                script: {
                    hook_text: "Guarda questa novità!",
                    body_text: "Le nostre tazze in ceramica sono fatte a mano con amore.",
                    cta_text: "Acquista ora sul nostro sito."
                },
                storyboard: [
                    {
                        scene_number: 1,
                        duration_sec: 3,
                        visual_description_en: "Close up of a colorful ceramic mug on a wooden table.",
                        on_screen_text: "Novità Pazzesca!",
                        audio_cue: "Upbeat intro music"
                    },
                    {
                        scene_number: 2,
                        duration_sec: 7,
                        visual_description_en: "Hands holding the mug, pouring hot coffee. Steam rising.",
                        on_screen_text: "Fatto a mano in Italia.",
                        audio_cue: "Music drops, sound of pouring coffee"
                    },
                    {
                        scene_number: 3,
                        duration_sec: 5,
                        visual_description_en: "Logo of the brand and website link.",
                        on_screen_text: "Acquista ora",
                        audio_cue: "Upbeat outro music"
                    }
                ],
                warnings: ["Safe mode is active, AI generation bypassed."]
            });
        }

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const prompt = `
BuildVideoScriptAndStoryboard
Crea uno script coinvolgente e uno storyboard scena per scena per un video verticale social.

INPUT:
{
  "lang": "${lang}",
  "video_project": ${JSON.stringify(video_project || {})},
  "brand_kit": ${JSON.stringify(brand_kit || null)}
}

OUTPUT JSON SCHEMA:
{
  "script": {
    "hook_text": "string",
    "body_text": "string",
    "cta_text": "string"
  },
  "storyboard": [
    {
      "scene_number": 1,
      "duration_sec": 0,
      "visual_description_en": "string",
      "on_screen_text": "string|null",
      "audio_cue": "string|null"
    }
  ],
  "warnings": ["string"]
}

RULES:
- Rispondi SEMPRE e SOLO con JSON valido. Nessun markdown.
- Lo script (hook, body, cta e on_screen_text) DEVE essere scritto nella lingua richiesta ("${lang}").
- "visual_description_en" DEVE essere rigorosamente in INGLESE per facilitare la generazione video successiva.
- La somma dei "duration_sec" dello storyboard deve coincidere approssimativamente con "video_project.specs.duration_sec" (default 15s).
- Mantieni scene veloci (2-4 secondi l'una) ideali per l'attenzione su Reels/TikTok.
- Non inventare dettagli sul prodotto se non specificati.
`;

        const result = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }]
        });

        const responseText = result.choices[0]?.message?.content || "{}";

        // Clean up markdown just in case
        const rawJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedJson = JSON.parse(rawJson);

        return NextResponse.json(parsedJson);

    } catch (error: any) {
        console.error("AI BuildVideoScriptAndStoryboard Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
