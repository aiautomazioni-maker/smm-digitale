import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            lang = "it",
            platform,
            overall,
            verdict,
            top_change,
            safeMode = false
        } = body;

        if (safeMode) {
            return NextResponse.json({
                score_card: {
                    badge: "OK",
                    badge_color: "orange",
                    title: "Score predittivo: 65/100",
                    subtitle: "Migliorabile: Aumenta il contrasto della copertina.",
                    cta: { label: "Correggi in un click", action: "apply_autofix" }
                }
            });
        }

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const prompt = `
BuildPrePublishScoreCard
Costruisci la UI Data Card per indicare se il post è "Pronto a pubblicare".
Rispondi SOLO con JSON valido.

INPUT:
{
  "lang": "${lang}",
  "platform": "${platform || 'instagram_reels'}",
  "overall": ${overall || 0},
  "verdict": "${verdict || 'unknown'}",
  "top_change": "${top_change || ''}"
}

OUTPUT JSON SCHEMA:
{
  "score_card": {
    "badge": "NOT_READY|OK|STRONG",
    "badge_color": "red|orange|green",
    "title": "string",
    "subtitle": "string",
    "cta": {
      "label": "string",
      "action": "open_optimizer|apply_autofix|publish_anyway"
    }
  }
}

RULES:
- Rispondi SEMPRE e SOLO con JSON valido. Nessun markdown.
- verdict: low -> NOT_READY red, medium -> OK orange, high -> STRONG green
- title formato es: "Score predittivo: 78/100"
- subtitle: 1 frase incoraggiante includendo o adattando top_change se presente.
- Se verdict low/medium e ci sono fix disponibili, consiglia l'action "apply_autofix" o "open_optimizer".
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
        console.error("AI BuildPrePublishScoreCard Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
