import OpenAI from 'openai';
import { BrandKit } from '@/types/brand';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ContentBrief {
    content_type?: "post" | "story" | "reel" | "carousel";
    pillar?: string;
    idea?: string;
    hook?: string;
    cta?: string;
    must_include?: string[];
    must_avoid?: string[];
}

export interface ImageAnalysis {
    subject: string;
    mood: string;
    keywords?: string[];
    description?: string;
}

export interface CaptionResult {
    copy: {
        caption: string;
        cta: string;
        hashtags: string[];
        alt_text: string;
        emoji_level: "low" | "medium" | "high";
    };
    warnings: string[];
}

export async function optimizeCaption(
    brandKit: BrandKit,
    contentBrief: ContentBrief,
    imageAnalysis: ImageAnalysis | null,
    platform: string = "instagram",
    length: "short" | "medium" | "long" = "medium",
    lang: string = "it"
): Promise<CaptionResult> {

    const systemPrompt = `Sei un esperto Social Media Manager e Copywriter AI.
Il tuo compito è scrivere una caption PRO pronta da pubblicare, perfettamente allineata con il Brand Kit e il Content Brief forniti.

INPUT:
{
  "lang": "${lang}",
  "brand_kit": ${JSON.stringify(brandKit)},
  "content_brief": ${JSON.stringify(contentBrief)},
  "image_analysis": ${imageAnalysis ? JSON.stringify(imageAnalysis) : "null"},
  "platform": "${platform}",
  "length": "${length}"
}

VINCOLI:
1.  **Coerenza Brand**: Usa SEMPRE il "tone" e le "keywords" del Brand Kit. Evita le parole vietate.
2.  **Image Analysis**: Se presente, descrivi ciò che si vede realmente. NON inventare dettagli visivi non presenti nell'analisi.
3.  **Lunghezza**: 
    -   Short: max 350 caratteri.
    -   Medium: max 700 caratteri.
    -   Long: max 1400 caratteri.
4.  **Hashtags**: Max 20, pertinenti, senza spazi, con #.
5.  **Alt Text**: Max 220 caratteri, ottimizzato per accessibilità e SEO.
6.  **Emoji**: Usa il livello specificato nel Brand Kit o inferiscilo dal tono.

OUTPUT JSON SCHEMA:
{
  "copy": {
    "caption": "string (il testo del post)",
    "cta": "string (la call to action esplicita)",
    "hashtags": ["string"],
    "alt_text": "string",
    "emoji_level": "low|medium|high"
  },
  "warnings": ["string (eventuali discrepanze o note)"]
}`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Genera la caption ottimizzata." }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");
        return result as CaptionResult;

    } catch (error) {
        console.error("Caption Optimization Failed:", error);
        return {
            copy: {
                caption: "Errore nella generazione della caption. Riprova più tardi.",
                cta: "",
                hashtags: [],
                alt_text: "",
                emoji_level: "low"
            },
            warnings: ["Generazione fallita"]
        };
    }
}
