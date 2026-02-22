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
            brand_kit,
            audio_preferences,
            capabilities,
            safeMode = false
        } = body;

        if (safeMode) {
            return NextResponse.json({
                music_plan: {
                    mode: "safe_library",
                    track_search_keywords: ["upbeat", "acoustic", "corporate", "cheerful", "background piano"],
                    mixing: {
                        music_enabled: true,
                        voiceover_ducking: true,
                        ducking_level: "medium"
                    },
                    manual_steps: []
                },
                warnings: ["Safe mode active - mocked music plan"]
            });
        }

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const prompt = `
SelectMusicPlan
Obiettivo: Definire un piano audio compatibile con policy (solo librerie safe) prevendendo un fallback manuale se necessario.

INPUT:
{
  "lang": "${lang}",
  "video_project": ${JSON.stringify(video_project || {})},
  "brand_kit": ${JSON.stringify(brand_kit || null)},
  "audio_preferences": ${JSON.stringify(audio_preferences || { want_music: true, mood: "energetic", energy: "high", genre_hint: "pop", voiceover_present: false })},
  "capabilities": ${JSON.stringify(capabilities || { supports_platform_music: false, has_safe_music_library: true })}
}

OUTPUT JSON SCHEMA:
{
  "music_plan": {
    "mode": "safe_library|platform_music_manual|no_music",
    "track_search_keywords": ["string"],
    "mixing": {
      "music_enabled": true,
      "voiceover_ducking": true,
      "ducking_level": "light|medium|strong"
    },
    "manual_steps": ["string"]
  },
  "warnings": ["string"]
}

RULES:
- Rispondi SEMPRE e SOLO con JSON valido. Nessun markdown.
- Se want_music=false => mode=no_music, music_enabled=false.
- Se has_safe_music_library=true => mode=safe_library e genera 5-10 keyword.
- Se has_safe_music_library=false e supports_platform_music=true:
  - mode=platform_music_manual
  - manual_steps: ["Pubblica/Carica", "Aggiungi musica dall'app nativa", "Regola volume"]
- Se voiceover_present=true => voiceover_ducking=true e ducking_level minimo "medium".
- Assolutamente non consigliare brani protetti da copyright specifici (no titoli di canzoni famose).
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
        console.error("AI SelectMusicPlan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
