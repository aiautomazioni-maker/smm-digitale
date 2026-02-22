import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            lang = "it",
            video_project,
            script,
            copy,
            metrics,
            safeMode = false
        } = body;

        if (safeMode) {
            return NextResponse.json({
                performance_summary: { overall_score: 65, verdict: "average" },
                retention_analysis: { hook_strength: "weak", retention_problem_point_sec: 2.5, diagnosis: "Utenti scrollano via nei primi 3 secondi. L'hook non è abbastanza incisivo." },
                engagement_analysis: { engagement_rate_estimate: 2.1, cta_effectiveness: "medium", shareability: "low" },
                cover_effectiveness: { likely_issue: "too_generic", improvement_hint: "Aggiungi un testo più grande e un volto umano." },
                optimization_priorities: ["hook", "duration", "cover"],
                warnings: ["Safe mode active - Mocked performance data"]
            });
        }

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const prompt = `
AnalyzeVideoPerformance
Sei un esperto di growth social e performance video.
Analizza dati reali e fornisci insight pratici.
Rispondi SOLO con JSON valido.

INPUT:
{
  "lang": "${lang}",
  "video_project": ${JSON.stringify(video_project || {})},
  "script": ${JSON.stringify(script || {})},
  "copy": ${JSON.stringify(copy || {})},
  "metrics": ${JSON.stringify(metrics || { platform: "instagram_reels", views: 0, reach: 0, watch_time_avg_sec: 0, completion_rate_pct: 0, likes: 0, comments: 0, shares: 0, saves: 0, profile_visits: 0, clicks: 0 })}
}

OUTPUT JSON SCHEMA:
{
  "performance_summary": {
    "overall_score": 0,
    "verdict": "poor|average|good|excellent"
  },
  "retention_analysis": {
    "hook_strength": "weak|medium|strong",
    "retention_problem_point_sec": 0,
    "diagnosis": "string"
  },
  "engagement_analysis": {
    "engagement_rate_estimate": 0,
    "cta_effectiveness": "weak|medium|strong",
    "shareability": "low|medium|high"
  },
  "cover_effectiveness": {
    "likely_issue": "hook_not_clear|too_generic|ok|unknown",
    "improvement_hint": "string"
  },
  "optimization_priorities": [
    "hook",
    "duration",
    "cta",
    "subtitles",
    "hashtags",
    "cover"
  ],
  "warnings": []
}

RULES:
- Rispondi SEMPRE e SOLO con JSON valido. Nessun markdown.
- overall_score 0-100.
- engagement_rate_estimate = (likes+comments+shares+saves)/views*100 se views>0.
- Se completion_rate_pct < 30 -> hook debole o durata eccessiva.
- Se views alte ma engagement basso -> CTA debole o contenuto poco specifico.
- Non inventare dati. Analizza strettamente i numeri in input.
`;

        const result = await openai.chat.completions.create({
            model: 'gpt-4o', // using 4o for precise analytical reasoning
            messages: [{ role: 'user', content: prompt }]
        });

        const responseText = result.choices[0]?.message?.content || "{}";
        const rawJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedJson = JSON.parse(rawJson);

        return NextResponse.json(parsedJson);

    } catch (error: any) {
        console.error("AI AnalyzeVideoPerformance Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
