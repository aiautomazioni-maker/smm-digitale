import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI since we have the key in .env.local
const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            lang = "it",
            workspace_id = "default_ws",
            platforms = ["instagram_reels", "tiktok"],
            user_request = "",
            brand_kit = null,
            source = {
                mode: "ai_generate",
                uploaded_video_url: null,
                uploaded_media_urls: []
            },
            safeMode = false
        } = body;

        // SAFE MODE CHECK
        if (safeMode) {
            console.log("SAFE MODE ACTIVE: Returning mock VideoProject.");
            return NextResponse.json({
                route: source.mode,
                video_project: {
                    workspace_id: workspace_id,
                    project_title: "Mock Video Project",
                    goal: "Demonstrate capabilities",
                    concept: "A quick energetic video showing off the product.",
                    style_keywords: ["dynamic", "bright", "modern"],
                    platform_targets: platforms,
                    specs: {
                        aspect_ratio: "9:16",
                        width: 1080,
                        height: 1920,
                        fps: 30,
                        duration_sec: 15,
                        max_duration_sec: 60,
                        safe_zone: { top_px: 250, bottom_px: 420 }
                    }
                },
                missing_info: ["Target audience?", "Specific call to action?"],
                warnings: ["Safe mode is active, AI generation bypassed."]
            });
        }

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const prompt = `
Decidi il flusso per creare un video verticale social (Reels/TikTok) e prepara un VideoProject in formato JSON.


INPUT:
{
  "lang": "${lang}",
  "workspace_id": "${workspace_id}",
  "platforms": ${JSON.stringify(platforms)},
  "user_request": "${user_request.replace(/"/g, '\\"')}",
  "brand_kit": ${brand_kit ? JSON.stringify(brand_kit) : 'null'},
  "source": ${JSON.stringify(source)}
}

OUTPUT JSON SCHEMA:
{
  "route": "ai_generate|edit_upload|template|mixed",
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
  "missing_info": ["string"],
  "warnings": ["string"]
}

RULES:
- Rispondi SEMPRE e SOLO con JSON valido. Niente markdown, niente backticks, nessun testo extra.
- Sempre 9:16 (1080x1920). fps 30.
- duration_sec: proponi tra 7 e 30 sec se reels/tiktok (default 12-15 sec).
- safe_zone bottom_px più ampio perché UI (caption/buttons) coprono molto.
- Se user_request troppo vaga -> complia missing_info (es. "che prodotto?", "che offerta?", "che target?").
- Non inventare dettagli sul brand/prodotto se non presenti in input.
`;

        let result;
        try {
            result = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }]
            });
        } catch (apiError: any) {
            console.error("OpenAI API Failure in CreateVideoProject, falling back to mock:", apiError);
            return NextResponse.json({
                route: source.mode,
                video_project: {
                    workspace_id: workspace_id,
                    project_title: "Demo Project (Fallback)",
                    goal: "Visual demonstration",
                    concept: "Il sistema ha caricato un progetto demo perché l'AI è momentaneamente non disponibile.",
                    style_keywords: ["dynamic", "bright", "modern"],
                    platform_targets: platforms,
                    specs: {
                        aspect_ratio: "9:16",
                        width: 1080,
                        height: 1920,
                        fps: 30,
                        duration_sec: 15,
                        max_duration_sec: 60,
                        safe_zone: { top_px: 250, bottom_px: 420 }
                    }
                },
                missing_info: ["Target audience?", "Specific call to action?"],
                warnings: ["OPENAI_API_ERROR: Chiave non valida o limite raggiunto. Caricato il progetto di test."]
            });
        }

        const responseText = result.choices[0]?.message?.content || "{}";

        // Clean up markdown just in case
        const rawJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedJson = JSON.parse(rawJson);


        return NextResponse.json(parsedJson);

    } catch (error: any) {
        console.error("AI Create Video Project Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
