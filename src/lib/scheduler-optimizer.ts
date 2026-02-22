import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ScheduleConstraints {
    no_weekend: boolean;
    time_windows: string[]; // e.g. ["09:00-12:00", "15:00-18:00"]
}

export interface ScheduleInput {
    lang: string;
    industry: string;
    city: string;
    timezone: string;
    content_type: string;
    analytics_summary?: Record<string, any> | null;
    constraints: ScheduleConstraints;
}

export interface SuggestedSlot {
    publish_at_iso: string;
    reason: string;
}

export interface ScheduleResult {
    suggested_slots: SuggestedSlot[];
    warnings: string[];
}

export async function suggestSchedule(input: ScheduleInput): Promise<ScheduleResult> {
    const systemPrompt = `Sei un esperto Social Media Manager e Data Analyst.
Il tuo compito è suggerire i 5 migliori slot orari per la pubblicazione, massimizzando l'engagement.

INPUT:
{
  "lang": "${input.lang}",
  "industry": "${input.industry}",
  "city": "${input.city}",
  "timezone": "${input.timezone}",
  "content_type": "${input.content_type}",
  "analytics_summary": ${input.analytics_summary ? JSON.stringify(input.analytics_summary) : "null"},
  "constraints": ${JSON.stringify(input.constraints)}
}

VINCOLI:
1.  **Quantità**: Suggerisci ESATTAMENTE 5 slot.
2.  **Formato**: Data/Ora in formato ISO 8601 con offset corretto per "${input.timezone}" (es. 2026-02-18T18:30:00+01:00).
3.  **Logica**:
    -   Se "analytics_summary" è presente, usalo per identificare i picchi di attività.
    -   Se ASSENTE, usa le best practice per l'industria "${input.industry}" e la città "${input.city}".
    -   Rispetta i "constraints" (es. no weekend, fasce orarie).
4.  **Date**: Suggerisci date future (a partire da domani).

OUTPUT JSON SCHEMA:
{
  "suggested_slots": [
    {"publish_at_iso": "string", "reason": "string (breve spiegazione, es. 'Picco commuting', 'Pausa pranzo')"}
  ],
  "warnings": ["string"]
}`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Trova i migliori slot di pubblicazione." }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");

        // Basic validation ensuring we have slots
        if (!result.suggested_slots || !Array.isArray(result.suggested_slots)) {
            throw new Error("Invalid response structure");
        }

        return result as ScheduleResult;

    } catch (error) {
        console.error("Schedule Optimization Failed:", error);
        return {
            suggested_slots: [],
            warnings: ["Generazione fallita. Riprova più tardi."]
        };
    }
}
