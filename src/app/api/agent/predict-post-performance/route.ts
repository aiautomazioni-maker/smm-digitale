import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        const lang = payload.lang || 'it';
        const systemPrompt = `Sei un esperto di crescita organica per social media.
Devi stimare un punteggio predittivo per un post prima della pubblicazione.
Rispondi SOLO con JSON valido.
TRADUCI I TESTI DEI CONSIGLI (red_flags, recommended_changes, quick_auto_fixes) NELLA LINGUA RIGOROSAMENTE RICHIESTA: ${lang}.

SCORING LOGIC:
OVERALL 0–100

Visual impact:
- contrast_level=low → penalizza
- visual_hook_strength=strong → bonus
- is_brand_consistent=false → penalizza

Hook strength:
- prima riga caption deve essere: beneficio, problema, o curiosità.
- se first_line generica → penalizza

Carousel:
- slides_count >1 e first_slide_hook_strength strong → bonus
- carousel >8 slide senza forte hook → penalizza

CTA:
- cta_type=none → penalizza
- CTA specifica ("Scrivi INFO nei commenti") → bonus

Hashtag:
- >18 → penalizza
- solo hashtag generici (#love #instagood) → penalizza
- mix settore + intent + branded → bonus

Verdict:
- low < 50
- medium 50–74
- high >= 75

OUTPUT JSON SCHEMA:
{
  "predictive_score": { "overall": 0, "verdict": "low|medium|high", "confidence": "high" },
  "breakdown": { "visual_impact": 0, "hook_strength": 0, "clarity": 0, "cta_effectiveness": 0, "hashtag_quality": 0, "shareability": 0 },
  "red_flags": [ { "area": "caption|visual", "severity": "low|high", "detail": "string" } ],
  "recommended_changes": [ { "priority": 1, "area": "caption", "change": "string", "example": "string" } ],
  "quick_auto_fixes": [ { "area": "hashtags", "action": "string", "result_preview": "string" } ]
}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: JSON.stringify(payload) }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2
        });

        const content = response.choices[0].message.content;
        return NextResponse.json(JSON.parse(content || '{}'));

    } catch (error: any) {
        console.error('Error predicting post performance:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
