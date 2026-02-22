import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        const lang = payload.lang || 'it';
        const systemPrompt = `Sei un copywriter specializzato in social organico.
Riscrivi il post per aumentare engagement e salvataggi in base alle raccomandazioni.
Rispondi SOLO con JSON valido e RIGOROSAMENTE IN LINGUA: ${lang}.

RULES:
- Prima riga max 120 caratteri.
- CTA sempre presente.
- Hashtag max 18.
- Evita emoji eccessive.
- Mantieni tono coerente.

OUTPUT JSON SCHEMA:
{
  "optimized_caption": "string (whole text formatted)",
  "optimized_first_line": "string",
  "optimized_cta": "string",
  "optimized_hashtags": ["string"]
}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: JSON.stringify(payload) }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7
        });

        const content = response.choices[0].message.content;
        return NextResponse.json(JSON.parse(content || '{}'));

    } catch (error: any) {
        console.error('Error optimizing post caption:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
