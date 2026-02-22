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
      brand_kit,
      video_project,
      script,
      cover,
      subtitles,
      copy,
      publishing,
      optional_context,
      safeMode = false
    } = body;

    if (safeMode) {
      return NextResponse.json({
        predictive_score: { overall: 85, verdict: "high", confidence: "high" },
        breakdown: { hook: 90, retention: 80, clarity: 85, cta: 90, cover: 80, subtitles: 95, hashtags: 80 },
        red_flags: [],
        recommended_changes: [
          { priority: 1, area: "cover", change: "Aumenta contrasto della copertina", example: "Usa colori più accesi per il testo" }
        ],
        auto_fixes: {
          can_apply_without_user: [
            { area: "hashtags", action: "Rimuovi tag troppo generici", result_preview: "#nicchia, #brand" }
          ],
          needs_user_approval: []
        },
        warnings: ["Safe mode active - Mocked pre-publish score"]
      });
    }

    if (!openai) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const prompt = `
PredictVideoPerformanceScore
Sei un esperto di crescita social e ottimizzazione contenuti video.
Devi stimare un punteggio predittivo e dare suggerimenti pratici prima della pubblicazione.
Rispondi SOLO con JSON valido.

INPUT:
{
  "lang": "${lang}",
  "platform": "${platform || 'instagram_reels'}",
  "brand_kit": ${JSON.stringify(brand_kit || {})},
  "video_project": ${JSON.stringify(video_project || {})},
  "script": ${JSON.stringify(script || {})},
  "cover": ${JSON.stringify(cover || {})},
  "subtitles": ${JSON.stringify(subtitles || {})},
  "copy": ${JSON.stringify(copy || {})},
  "publishing": ${JSON.stringify(publishing || {})},
  "optional_context": ${JSON.stringify(optional_context || {})}
}

OUTPUT JSON SCHEMA:
{
  "predictive_score": {
    "overall": 0,
    "verdict": "low|medium|high",
    "confidence": "low|medium|high"
  },
  "breakdown": {
    "hook": 0,
    "retention": 0,
    "clarity": 0,
    "cta": 0,
    "cover": 0,
    "subtitles": 0,
    "hashtags": 0
  },
  "red_flags": [
    {"type": "string", "severity": "low|medium|high", "detail": "string"}
  ],
  "recommended_changes": [
    {
      "priority": 1,
      "area": "hook|duration|cta|cover|subtitles|caption|hashtags",
      "change": "string",
      "example": "string|null"
    }
  ],
  "auto_fixes": {
    "can_apply_without_user": [
      {"area": "hashtags|caption|subtitles", "action": "string", "result_preview": "string"}
    ],
    "needs_user_approval": [
      {"area": "hook|cover|duration|cta", "action": "string", "options": ["string"]}
    ]
  },
  "warnings": ["string"]
}

SCORING RULES:
- Rispondi SEMPRE e SOLO con JSON valido. Nessun markdown.
- overall 0-100.
- hook (0-100): penalizza hook generici e premia hook specifici/beneficio.
- retention: durata ideale TikTok/Reels: 7-20 sec ottimale; 21-35 ok; >35 penalizza se non educativo.
- clarity: se concept/goal non è chiaro in hook + onscreen_text -> penalizza.
- cta: CTA deve essere specifica (DM con keyword, visita link, commenta "INFO").
- cover: penalizza se cover_hook_text vuoto o troppo lungo (>45 char) o contrast_level=low o non grid safe.
- subtitles: se subtitles disabled -> penalizza; se enabled e keyword_emphasis true -> bonus.
- hashtags: max 18; mix: settore + intent + branded; penalizza hashtag troppo generici senza nicchia.

OUTPUT RULES:
- verdict: low < 50, medium 50-74, high >= 75
- breakdown: somma non necessaria, ma coerente con overall.
- recommended_changes: max 6, ordinate per impatto.
- auto_fixes: proponi auto-fix solo su cose sicure (hashtags cleanup, caption trim, subtitles position).
- TRADUCI i feedback testuali (red_flags, recommended_changes, auto_fixes) NELLA LINGUA RIGOROSAMENTE RICHIESTA: ${lang}.
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
    console.error("AI PredictVideoPerformanceScore Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
