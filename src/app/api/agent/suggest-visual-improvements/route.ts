import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    const lang = payload.lang || 'it';
    const systemPrompt = `Sei un art director per contenuti social.
Analizza descrizione visiva fornita e suggerisci miglioramenti concreti per massimizzare la retention e i click, in base all'obiettivo.
Rispondi SOLO con JSON valido. TRANSLATE OUTPUT ARRAY STRINGS TO LANGUAGE: ${lang}.

RULES:
- Suggerimenti pratici e applicabili.
- Se text_overlay_length > 12 parole → suggerisci riduzione.
- Se contrast low → suggerisci background overlay scuro o bordo testo.

OUTPUT JSON SCHEMA:
{
  "visual_improvements": [
    {
      "priority": 1,
      "suggestion": "string",
      "example_layout_hint": "string"
    }
  ],
  "warnings": ["string"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(payload) }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5
    });

    const content = response.choices[0].message.content;
    return NextResponse.json(JSON.parse(content || '{}'));

  } catch (error: any) {
    console.error('Error suggesting visual improvements:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
