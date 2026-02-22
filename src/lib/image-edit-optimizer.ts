import OpenAI from 'openai';
import { BrandKit } from '@/types/brand';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ImageAnalysis {
    summary: string;
    subjects: string[];
    setting: string;
    mood: string;
    colors: string[];
    composition: string[];
    quality_issues: string[];
}

export interface EditConstraints {
    keep_subject_identity: boolean;
    remove_objects?: string[];
    add_objects?: string[];
    style?: string;
    background?: string;
}

export interface EditInput {
    lang: string;
    brand_kit: BrandKit;
    image_analysis: ImageAnalysis;
    edit_goal: string;
    constraints: EditConstraints;
    format: "post" | "story" | "reel" | "carousel";
}

export interface OptimizedEditResult {
    edit: {
        instruction_en: string;
        negative_instruction_en: string;
        aspect_ratio: "1:1" | "4:5" | "9:16";
        crop_notes: string[];
        retouch_notes: string[];
    };
    warnings: string[];
}

export async function optimizeEditInstruction(input: EditInput): Promise<OptimizedEditResult> {
    const systemPrompt = `Sei un esperto di AI Image Editing (Inpainting, Generative Fill).
Il tuo compito è creare istruzioni di editing precise e coerenti con il Brand Kit per migliorare un'immagine caricata.

VINCOLI:
1.  **Istruzioni**: "instruction_en" deve essere in INGLESE, imperativo e descrittivo (max 800 chars).
2.  **Identità**: Se "keep_subject_identity" è true, specifica chiaramente di NON alterare i tratti somatici o il soggetto principale.
3.  **Brand**: Integra lo stile del brand (colori, mood) nelle istruzioni di modifica (es. "change background to smooth gradient using brand colors #FF00FF and #00FFFF").
4.  **Negative**: Specifica cosa evitare in "negative_instruction_en".
5.  **Output**: JSON valido.

INPUT DATA:
${JSON.stringify(input, null, 2)}

OUTPUT SCHEMA:
{
  "edit": {
    "instruction_en": "string",
    "negative_instruction_en": "string",
    "aspect_ratio": "1:1|4:5|9:16",
    "crop_notes": ["string"],
    "retouch_notes": ["string"]
  },
  "warnings": ["string"]
}`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Genera istruzioni di editing ottimizzate." }
            ],
            response_format: { type: "json_object" },
            temperature: 0.5, // Lower temp for precision in editing commands
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");
        return result as OptimizedEditResult;

    } catch (error) {
        console.error("Edit Optimization Failed:", error);
        return {
            edit: {
                instruction_en: `Edit image: ${input.edit_goal}. Keep subject identity. High quality.`,
                negative_instruction_en: "distortion, low quality, altered face",
                aspect_ratio: input.format === "story" || input.format === "reel" ? "9:16" : "1:1",
                crop_notes: [],
                retouch_notes: []
            },
            warnings: ["Optimization failed, used fallback"]
        };
    }
}
