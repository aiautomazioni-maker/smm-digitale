import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            lang = "it",
            brand_kit,
            video_project,
            script,
            cover_style = "clean",
            safeMode = false
        } = body;

        if (safeMode) {
            return NextResponse.json({
                cover_options: [{
                    option_index: 1,
                    title: "Mock Cover",
                    hook_text: "Look at this!",
                    prompt_en: "A beautiful cover image of ceramic mugs.",
                    negative_prompt_en: "blurry, low contrast",
                    specs: { width: 1080, height: 1920, aspect_ratio: "9:16" },
                    thumbnail_safe_crop: { center_box_pct: 60, notes: ["Keep text centered."] },
                    overlay_plan: [{ text: "Look at this!", position_zone: "center", style: "bold" }]
                }],
                warnings: ["Safe mode active"]
            });
        }

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const prompt = `
GenerateCoverOptions
Genera 4 idee di copertina per il video + prompt per crearle (in inglese) e linee guida overlay.
Deve essere coerente col video e brand kit e leggibile in thumbnail.

INPUT:
{
  "lang": "${lang}",
  "brand_kit": ${JSON.stringify(brand_kit || null)},
  "video_project": ${JSON.stringify(video_project || {})},
  "script": ${JSON.stringify(script || null)},
  "cover_style": "${cover_style}"
}

OUTPUT JSON SCHEMA:
{
  "cover_options": [
    {
      "option_index": 1,
      "title": "string",
      "hook_text": "string",
      "prompt_en": "string",
      "negative_prompt_en": "string",
      "specs": {"width": 1080, "height": 1920, "aspect_ratio": "9:16"},
      "thumbnail_safe_crop": {"center_box_pct": 60, "notes": ["string"]},
      "overlay_plan": [
        {"text": "string", "position_zone": "center|top", "style": "minimal|modern|bold"}
      ]
    }
  ],
  "warnings": ["string"]
}

RULES:
- Rispondi SEMPRE e SOLO con JSON valido. Nessun markdown.
- 4 opzioni sempre.
- hook_text max 45 caratteri.
- prompt_en max 700 caratteri.
- thumbnail_safe_crop.center_box_pct indica la zona centrale che deve contenere testo/soggetto principale (es. 60%).
- Overlay mai troppo basso (evita bottom 420px).
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
        console.error("AI GenerateCoverOptions Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
