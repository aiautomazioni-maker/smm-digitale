import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateImagen } from '@/lib/imagen';
import { checkCredits, deductCredits, COSTS } from '@/lib/credits';
import { createClient } from '@supabase/supabase-js';
import { optimizeImagePrompt } from '@/lib/image-prompt-optimizer';
import { optimizeEditInstruction } from '@/lib/image-edit-optimizer';
import { BrandKit } from '@/types/brand';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const safeMode = process.env.NEXT_PUBLIC_SAFE_MODE === 'true';
        const body = await req.json();

        const {
            prompt,
            brandKit,
            brief,
            format = "post",
            style = "natural",
            quality = "standard",
            size = "1024x1024",
            analysis,
            userInstructions,
            edit_goal,
            constraints,
            model = "dall-e-3"
        } = body;

        // 1. SAFE MODE CHECK (Early Exit)
        if (safeMode) {
            console.log("SAFE MODE ACTIVE: Skipping real auth and generation.");
            const randomId = Math.floor(Math.random() * 1000);
            const [width, height] = size.split('x');
            const placeholderUrl = `https://picsum.photos/seed/${randomId}/${width}/${height}`;

            return NextResponse.json({
                imageUrl: placeholderUrl,
                metadata: {
                    prompt_en: prompt || "Simulated safe mode prompt",
                    aspect_ratio: size === "1024x1792" ? "9:16" : "1:1"
                }
            });
        }

        // 2. AUTHENTICATION (Only if NOT in safeMode)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized: Missing Authorization header' }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
        }

        const userId = user.id;

        // 3. CREDIT CHECK
        const hasCredits = await checkCredits(userId, COSTS.IMAGE_GENERATION);
        if (!hasCredits) {
            return NextResponse.json({ error: 'Insufficient credits. Please upgrade your plan.' }, { status: 402 });
        }

        console.log(`Generating/Editing with model: ${model}`);

        let finalPrompt = "";
        let optimizedData = null;

        // PATH A: ADVANCED CREATION (Brand Kit + Brief)
        if (brandKit && brief) {
            const optimizationResult = await optimizeImagePrompt(brandKit, brief, format);
            optimizedData = optimizationResult.generation;
            finalPrompt = optimizedData.prompt_en;
        }
        // PATH B: ADVANCED EDITING (Brand Kit + Analysis + Edit Goal)
        else if (brandKit && analysis && edit_goal) {
            const editInput = {
                lang: "it",
                brand_kit: brandKit as BrandKit,
                image_analysis: analysis,
                edit_goal: edit_goal,
                constraints: constraints || { keep_subject_identity: true },
                format: format
            };
            const optimizationResult = await optimizeEditInstruction(editInput);
            optimizedData = optimizationResult.edit;
            finalPrompt = optimizedData.instruction_en;
        }
        // PATH C: LEGACY REMIX (Simple)
        else if (analysis && userInstructions) {
            finalPrompt = `
            Genera un'immagine basata su questa descrizione:
            SOGGETTO: ${analysis.subject}
            MOOD: ${analysis.mood}
            DETTAGLI VISIVI: ${analysis.keywords?.join(', ')}

            MODIFICHE RICHIESTE DALL'UTENTE: "${userInstructions}"

            STILE: ${style}.
            Assicurati che l'immagine rispetti le richieste di modifica mentre mantiene il soggetto originale.
            `;
        }
        // PATH D: SIMPLE PROMPT
        else if (prompt) {
            finalPrompt = `
            Genera un'immagine per social media.
            DESCRIZIONE: ${prompt}
            STILE: ${style}
            `;
        } else {
            return NextResponse.json({ error: 'Missing prompt, brandKit+brief, or remix data' }, { status: 400 });
        }

        let imageUrl = "";

        if (model === "imagen-3") {
            let aspectRatio = "1:1";
            if (optimizedData?.aspect_ratio === "9:16") aspectRatio = "9:16";
            if (size === "1024x1792") aspectRatio = "9:16";

            const imgData = await generateImagen(finalPrompt, aspectRatio);
            if (!imgData) throw new Error("Failed to generate image with Imagen 3");
            imageUrl = imgData;
        } else {
            let dalleSize = size;
            if (optimizedData?.aspect_ratio === "9:16") dalleSize = "1024x1792";

            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: finalPrompt,
                style: style as "vivid" | "natural",
                quality: quality as "standard" | "hd",
                size: dalleSize as "1024x1024" | "1024x1792",
                n: 1,
            });
            imageUrl = response.data?.[0]?.url || "";
        }

        if (!imageUrl) throw new Error("No image generated");

        await deductCredits(userId, COSTS.IMAGE_GENERATION, 'image_generation', { prompt: finalPrompt, model });

        return NextResponse.json({
            imageUrl,
            metadata: optimizedData
        });

    } catch (error: any) {
        console.error('Error generating image:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate image' }, { status: 500 });
    }
}
