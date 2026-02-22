import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            lang = "it",
            existing_video_project,
            existing_script,
            existing_copy,
            v2_strategy,
            safeMode = false
        } = body;

        if (safeMode) {
            return NextResponse.json({
                updated_video_project: { duration_sec: v2_strategy?.new_duration_sec || 10 },
                updated_script: {
                    hook_text: v2_strategy?.hook_rewrite || "Mocked Better Hook!",
                    cta_text: v2_strategy?.cta_rewrite || "Mocked Better CTA!"
                },
                updated_copy: {
                    caption: "Caption aggiornata con il nuovo hook aggressivo per catturare l'attenzione subito! 🔥",
                    hashtags: ["#updated", "#v2", "#socialhacks"]
                },
                cover_update_hint: "Use a bold text with a facial reaction to increase CTR.",
                warnings: ["Safe mode active - Mocked P3 Optimized Version"]
            });
        }

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const prompt = `
GenerateOptimizedVideoVersion
Sei un assistente che crea la versione v2 ottimizzata di un video.
Non ricreare tutto da zero, ma modifica hook, durata, CTA, cover e caption in base alla v2_strategy.

Rispondi SOLO con JSON valido.

INPUT:
{
  "lang": "${lang}",
  "existing_video_project": ${JSON.stringify(existing_video_project || {})},
  "existing_script": ${JSON.stringify(existing_script || {})},
  "existing_copy": ${JSON.stringify(existing_copy || {})},
  "v2_strategy": ${JSON.stringify(v2_strategy || {})}
}

OUTPUT JSON SCHEMA:
{
  "updated_video_project": {
    "duration_sec": 0
  },
  "updated_script": {
    "hook_text": "string",
    "cta_text": "string"
  },
  "updated_copy": {
    "caption": "string",
    "hashtags": ["string"]
  },
  "cover_update_hint": "string",
  "warnings": []
}

RULES:
- Rispondi SEMPRE e SOLO con JSON valido. Nessun markdown.
- updated_video_project.duration_sec DEVE ESSERE UGUALE A v2_strategy.new_duration_sec.
- updated_script.hook_text = v2_strategy.hook_rewrite.
- updated_script.cta_text = v2_strategy.cta_rewrite.
- updated_copy.caption deve riflettere il nuovo hook in modo naturale.
- updated_copy.hashtags max 18, applicando hashtag_adjustment.
`;

        const result = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }]
        });

        const responseText = result.choices[0]?.message?.content || "{}";
        const rawJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedJson = JSON.parse(rawJson);

        return NextResponse.json(parsedJson);

    } catch (error: any) {
        console.error("AI GenerateOptimizedVideoVersion Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
