import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            selected_cover_url,
            cover_specs,
            grid_preview,
            safeMode = false
        } = body;

        if (safeMode) {
            return NextResponse.json({
                cover_finalize: {
                    selected_cover_url: selected_cover_url || "https://example.com/cover.jpg",
                    grid_safe_center_box: {
                        center_crop_pct: 60,
                        notes: ["Testo e volto devono essere posizionati nel 60% centrale dell'immagine."]
                    },
                    recommended_overlay_area: "center",
                    warnings: ["Safe mode active - Mocked grid rules"]
                }
            });
        }

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const prompt = `
FinalizeCoverSelectionRules
Obiettivo: Generare le regole finali di overlay e grid-safe in base alla copertina scelta. Assicurarsi che l'estetica della griglia 1:1 sia preservata.

INPUT:
{
  "selected_cover_url": "${selected_cover_url || ''}",
  "cover_specs": ${JSON.stringify(cover_specs || { width: 1080, height: 1920 })},
  "grid_preview": ${JSON.stringify(grid_preview || { center_crop_pct: 60 })}
}

OUTPUT JSON SCHEMA:
{
  "cover_finalize": {
    "selected_cover_url": "string",
    "grid_safe_center_box": {
      "center_crop_pct": 60,
      "notes": ["string"]
    },
    "recommended_overlay_area": "center",
    "warnings": ["string"]
  }
}

RULES:
- Rispondi SEMPRE e SOLO con JSON valido. Nessun markdown.
- Conferma il center_crop_pct (default 60%).
- Indica chiaramente nelle "notes" che il testo e il soggetto principale (es. volto) DEVONO essere all'interno del box centrale 1080x1080 (che corrisponde al 60% circa dell'altezza) per apparire correttamente nella preview quadrata (grid) del profilo Instagram.
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
        console.error("AI FinalizeCoverSelectionRules Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
