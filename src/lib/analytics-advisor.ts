import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface AnalyticsInput {
    lang: string;
    brand_kit: any; // Using any for flexibility, but ideally matches BrandKit
    period: {
        from: string;
        to: string;
    };
    metrics: Record<string, any>;
    top_posts: any[];
    recent_posts: any[];
}

export interface NextWeekPlanItem {
    content_type: "post" | "carousel" | "story" | "reel";
    idea: string;
    why: string;
}

export interface AnalyticsInsights {
    insights: {
        what_worked: string[];
        what_to_improve: string[];
        next_week_plan: NextWeekPlanItem[];
        best_times: string[];
        kpi_focus: string[];
    };
    warnings: string[];
}

export async function analyzePerformance(input: AnalyticsInput): Promise<AnalyticsInsights> {
    const systemPrompt = `Sei un esperto Data Analyst e Social Media Strategist.
Il tuo compito è analizzare le performance e generare insight AZIONABILI. Niente fuffa: solo azioni chiare.

INPUT:
{
  "lang": "${input.lang}",
  "brand_kit": ${JSON.stringify(input.brand_kit)},
  "period": ${JSON.stringify(input.period)},
  "metrics": ${JSON.stringify(input.metrics)},
  "top_posts": ${JSON.stringify(input.top_posts)},
  "recent_posts": ${JSON.stringify(input.recent_posts)}
}

VINCOLI:
1.  **Analisi**: Identifica pattern di successo (es. "I caroselli educativi funzionano meglio") e aree di miglioramento.
2.  **Piano Prossima Settimana**: Suggerisci tra 5 e 10 contenuti specifici.
    -   "idea": Max 140 caratteri.
    -   "content_type": Usa mix bilanciato o basato sui dati.
3.  **KPI Focus**: Su quali metriche concentrarsi la prossima settimana?

OUTPUT JSON SCHEMA:
{
  "insights": {
    "what_worked": ["string (es. 'I Reel hanno generato il 40% in più di reach')"],
    "what_to_improve": ["string (es. 'Engagement basso sulle stories nel weekend')"],
    "next_week_plan": [
      {"content_type": "post|carousel|story|reel", "idea": "string", "why": "string"}
    ],
    "best_times": ["string"],
    "kpi_focus": ["string"]
  },
  "warnings": ["string"]
}`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Analizza i dati e dimmi cosa fare." }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");

        if (!result.insights) {
            throw new Error("Invalid response structure");
        }

        return result as AnalyticsInsights;

    } catch (error) {
        console.error("Analytics Analysis Failed:", error);
        return {
            insights: {
                what_worked: [],
                what_to_improve: [],
                next_week_plan: [],
                best_times: [],
                kpi_focus: []
            },
            warnings: ["Analisi fallita. Riprova più tardi."]
        };
    }
}
