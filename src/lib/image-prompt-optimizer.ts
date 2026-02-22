import OpenAI from 'openai';
import { BrandKit } from '@/types/brand';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ContentBrief {
    content_type: "post" | "story" | "reel" | "carousel";
    pillar: string;
    idea: string;
    hook?: string;
    cta?: string;
    must_include?: string[];
    must_avoid?: string[];
}

export interface OptimizedPromptResult {
    generation: {
        prompt_en: string;
        negative_prompt_en: string;
        aspect_ratio: "1:1" | "4:5" | "9:16";
        style_tags: string[];
        branding_notes: string[];
        safety_notes: string[];
    };
    warnings: string[];
}

export async function optimizeImagePrompt(
    brandKit: BrandKit,
    brief: ContentBrief,
    format: "post" | "story" | "carousel" | "reel" = "post",
    lang: string = "it"
): Promise<OptimizedPromptResult> {

    const systemPrompt = `Sei un esperto Prompt Engineer per AI Generativa (Midjourney v6, DALL-E 3).
Il tuo compito è creare un prompt ottimizzato per generare un'immagine "instagrammabile" e coerente con il Brand Kit fornito.

VINCOLI FONDAMENTALI:
1.  **Lingua Prompt**: Il prompt ("prompt_en") deve essere SEMPRE in INGLESE, dettagliato e descrittivo.
2.  **Stile**: Usa i dati del Brand Kit (colori, tono, stile foto) per definire l'estetica.
3.  **Qualità**: Includi keyword per alta qualità (es. "8k resolution, highly detailed, photorealistic, cinematic lighting, shot on 35mm lens, f/1.8").
4.  **Negative Prompt**: Specifica cosa evitare (testo, watermark, deformazioni, bruttezza).
5.  **Aspect Ratio**: 
    - Post: 1:1 o 4:5
    - Story/Reel: 9:16
    - Carousel: 4:5
6.  **JSON**: Rispondi SOLO con JSON valido secondo lo schema richiesto.

INPUT FORMAT:
Lang: ${lang}
Brand Kit: ${JSON.stringify(brandKit)}
Content Brief: ${JSON.stringify(brief)}
Format: ${format}

OUTPUT SCHEMA:
{
  "generation": {
    "prompt_en": "string (max 900 chars)",
    "negative_prompt_en": "string (max 400 chars)",
    "aspect_ratio": "1:1|4:5|9:16",
    "style_tags": ["string"],
    "branding_notes": ["string"],
    "safety_notes": ["string"]
  },
  "warnings": ["string"]
}`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Genera il prompt ottimizzato." }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");
        return result as OptimizedPromptResult;

    } catch (error) {
        console.error("Prompt Optimization Failed:", error);
        // Fallback safe result
        return {
            generation: {
                prompt_en: `High quality photo for social media, ${brief.idea}. Professional lighting.`,
                negative_prompt_en: "text, watermark, low quality, ugly",
                aspect_ratio: format === "story" || format === "reel" ? "9:16" : "1:1",
                style_tags: ["generic"],
                branding_notes: ["Fallback used"],
                safety_notes: []
            },
            warnings: ["Optimization failed, used fallback"]
        };
    }
}
