import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });
    }

    const prompt = `Analizza l'immagine e restituisci una descrizione strutturata utile per creare contenuti social.
NON inventare brand o luogo se non visibili.

INPUT:
{
  "lang": "it",
  "context_notes": "Analisi per social media marketing"
}

OUTPUT JSON:
{
  "image_analysis": {
    "summary": "string",
    "subjects": ["string"],
    "setting": "string",
    "mood": "string",
    "colors": ["string"],
    "composition": ["string"],
    "visible_text": ["string"],
    "brand_elements_visible": ["string"],
    "quality_issues": ["string"],
    "instagrammability_score": 0,
    "suggested_improvements": ["string"]
  },
  "warnings": ["string"]
}

VINCOLI:
- "instagrammability_score" è un numero intero 0-100.
- "visible_text" solo testo effettivamente presente (se nessuno, array vuoto).
- Rispondi SOLO con JSON valido.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");

    return NextResponse.json({ analysis });

  } catch (error) {
    console.error('Error analyzing image:', error);
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
  }
}
