import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            video_title,
            overall_score,
            verdict,
            optimization_priorities,
            safeMode = false
        } = body;

        if (safeMode) {
            return NextResponse.json({
                dashboard_card: {
                    badge_color: "orange",
                    headline: "Ottimizzazione Consigliata",
                    summary: `Il video "${video_title || 'Senza Titolo'}" ha ottenuto uno score di ${overall_score || 50}. Il verdetto è ${verdict || 'average'}. Ti consigliamo di migliorare l'Hook e la Durata.`,
                    top_action: "Crea Versione Ottimizzata"
                }
            });
        }

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const prompt = `
BuildPerformanceDashboardCard
Rispondi SOLO con JSON valido. Genera il contenuto per una Dashboard Card basato sugli input di performance.

INPUT:
{
  "video_title": "${video_title || ''}",
  "overall_score": ${overall_score || 0},
  "verdict": "${verdict || 'unknown'}",
  "optimization_priorities": ${JSON.stringify(optimization_priorities || [])}
}

OUTPUT JSON SCHEMA:
{
  "dashboard_card": {
    "badge_color": "red|orange|green|blue",
    "headline": "string",
    "summary": "string",
    "top_action": "string"
  }
}

RULES:
- Rispondi SEMPRE e SOLO con JSON valido. Nessun markdown.
- Colori in base al verdict:
  - poor -> red
  - average -> orange
  - good -> blue
  - excellent -> green
- La "headline" deve essere breve e accattivante (es. "Potenziale Non Sfruttato", "Hit Virale!").
- Il "summary" deve spiegare in 1-2 frasi il punteggio e menzionare le optimization_priorities in modo discorsivo (es. "Migliorando la copertina e l'inizio potresti raddoppiare le views.").
- La "top_action" suggerita DEVE includere un invito chiaro all'azione basata su "Crea Versione Ottimizzata V2".
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
        console.error("AI BuildPerformanceDashboardCard Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
