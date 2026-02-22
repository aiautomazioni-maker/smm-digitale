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
            script,
            copy,
            performance_summary,
            retention_analysis,
            engagement_analysis,
            cover_effectiveness,
            safeMode = false
        } = body;

        if (safeMode) {
            return NextResponse.json({
                v2_strategy: {
                    new_duration_sec: 10,
                    hook_rewrite: "Se fai questo errore, perdi follower!",
                    cta_rewrite: "Salva il video per non dimenticarlo!",
                    subtitle_style_change: "more_dynamic",
                    cover_change_strategy: "stronger_hook",
                    hashtag_adjustment: { remove: ["#generic"], add: ["#socialhacks", "#growth"] }
                },
                why_these_changes: ["Il retention point era a 2 secondi. Hook cambiato per shock value.", "Durata ridotta per matchare il completion rate basso."]
            });
        }

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const prompt = `
BuildVideoOptimizationPlan
Sei un video strategist. Crea un piano di ottimizzazione basato sui risultati dell'analisi.
Rispondi SOLO con JSON valido.

INPUT:
{
  "lang": "${lang}",
  "video_project": ${JSON.stringify(video_project || {})},
  "script": ${JSON.stringify(script || {})},
  "copy": ${JSON.stringify(copy || {})},
  "performance_summary": ${JSON.stringify(performance_summary || {})},
  "retention_analysis": ${JSON.stringify(retention_analysis || {})},
  "engagement_analysis": ${JSON.stringify(engagement_analysis || {})},
  "cover_effectiveness": ${JSON.stringify(cover_effectiveness || {})}
}

OUTPUT JSON SCHEMA:
{
  "v2_strategy": {
    "new_duration_sec": 0,
    "hook_rewrite": "string",
    "cta_rewrite": "string",
    "subtitle_style_change": "none|more_dynamic|larger_text|keyword_emphasis",
    "cover_change_strategy": "keep|stronger_hook|more_contrast|face_focus",
    "hashtag_adjustment": {
      "remove": ["string"],
      "add": ["string"]
    }
  },
  "why_these_changes": ["string"]
}

RULES:
- Rispondi SEMPRE e SOLO con JSON valido. Nessun markdown.
- Se retention_problem_point_sec < 3 -> hook completamente riscritto in modo più aggressivo o curioso.
- Se completion_rate è bassa -> riduci new_duration_sec del 20-40% rispetto all'originale.
- CTA weak -> rendila più specifica e orientata azione immediata.
- Non superare 60 sec durata totale.
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
        console.error("AI BuildVideoOptimizationPlan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
