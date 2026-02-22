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
            platform_targets,
            length = "medium",
            safeMode = false
        } = body;

        if (safeMode) {
            return NextResponse.json({
                copy: {
                    caption: "This is a simulated video caption for testing our capabilities-aware payload! ✨\n\nCheck out the amazing visuals.",
                    cta: "Clicca il link in bio!",
                    hashtags: ["#VideoTest", "#SafeMode", "#Mocking"],
                    emoji_level: "medium"
                },
                warnings: ["Safe mode is active, AI generation bypassed."]
            });
        }

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const prompt = `
GenerateVideoCaptionAndHashtags
Scrivi caption e hashtag per un video verticale social (Reels/TikTok), coerenti con brand_kit e con lo script.
Non inventare dettagli non presenti in input.

INPUT:
{
  "lang": "${lang}",
  "brand_kit": ${JSON.stringify(brand_kit || null)},
  "video_project": ${JSON.stringify(video_project || {})},
  "script": ${JSON.stringify(script || null)},
  "platform_targets": ${JSON.stringify(platform_targets || [])},
  "length": "${length}"
}

OUTPUT JSON SCHEMA:
{
  "copy": {
    "caption": "string",
    "cta": "string",
    "hashtags": ["string"],
    "emoji_level": "low|medium|high"
  },
  "warnings": ["string"]
}

RULES:
- Rispondi SEMPRE e SOLO con JSON valido. Nessun markdown.
- length: short max 350 char, medium max 700, long max 1400.
- hashtags max 18, senza spazi, con #.
- Includi 3-6 hashtag di settore + 2-4 di intent (es. #prenota #offerta) + 2-3 branded.
- CTA coerente con script.cta_text.
`;

        const result = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }]
        });

        const responseText = result.choices[0]?.message?.content || "{}";

        // Clean up any potential markdown backticks just in case the AI ignores the constraint
        const rawJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

        const parsedJson = JSON.parse(rawJson);

        return NextResponse.json(parsedJson);

    } catch (error: any) {
        console.error("AI Video Metadata Generation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
