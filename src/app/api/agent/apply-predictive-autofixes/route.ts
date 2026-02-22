import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            lang = "it",
            current,
            auto_fixes,
            safeMode = false
        } = body;

        if (safeMode) {
            return NextResponse.json({
                updated: {
                    caption: "Caption tagliata e fixata",
                    hashtags: ["#safe", "#fix"],
                    subtitles: { enabled: true, mode: "word", position_zone: "bottom_safe", keyword_emphasis: false }
                },
                change_log: ["Applicato fix hashtag base nella safe mode"]
            });
        }

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const prompt = `
ApplyPredictiveAutoFixes
Applica correzioni automatiche sicure senza cambiare il significato basandoti sui fix approvati.
Rispondi SOLO con JSON valido.

INPUT:
{
  "lang": "${lang}",
  "current": ${JSON.stringify(current || {})},
  "auto_fixes": ${JSON.stringify(auto_fixes || {})}
}

OUTPUT JSON SCHEMA:
{
  "updated": {
    "caption": "string",
    "hashtags": ["string"],
    "subtitles": {
      "enabled": true,
      "mode": "phrase|word",
      "position_zone": "center|bottom_safe",
      "keyword_emphasis": false
    }
  },
  "change_log": ["string"]
}

RULES:
- Rispondi SEMPRE e SOLO con JSON valido. Nessun markdown.
- Rimuovi duplicati hashtag mantenendo ordine, taglia se ne sono forniti troppi generici in base all'AI auto_fix.
- Taglia caption se troppo lunga (senza perdere CTA) in base all'auto_fix.
- Se position_zone è stata segnalata rischiosa per la piattaforma, sposta in "center" (TikTok) o "bottom_safe" (IG) e logga la modifica.
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
        console.error("AI ApplyPredictiveAutoFixes Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
