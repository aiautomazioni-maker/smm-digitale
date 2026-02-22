import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            lang = "it",
            video_duration_sec,
            script,
            subtitle_style,
            safe_zone,
            safeMode = false
        } = body;

        if (safeMode) {
            return NextResponse.json({
                subtitles: {
                    format: "json_cues",
                    cues: [
                        {
                            start_sec: 0.0, end_sec: 2.5,
                            text: "Questo è un test simulato",
                            style: { position_zone: "center", emphasis_words: ["test simulato"] }
                        },
                        {
                            start_sec: 2.6, end_sec: 5.0,
                            text: "per la safe mode.",
                            style: { position_zone: "center", emphasis_words: ["safe mode"] }
                        }
                    ]
                },
                warnings: ["Safe mode active - simulated subtitles"]
            });
        }

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const prompt = `
GenerateSubtitlesFromScript
Usa lo script già creato o trascrizione. Output pensato per editor.

INPUT:
{
  "lang": "${lang}",
  "video_duration_sec": ${video_duration_sec || 15},
  "script": ${JSON.stringify(script || {})},
  "subtitle_style": ${JSON.stringify(subtitle_style || { mode: "phrase", max_chars_per_line: 28, lines: 2, position_zone: "center", emphasis: "keywords" })},
  "safe_zone": ${JSON.stringify(safe_zone || { top_px: 250, bottom_px: 420 })}
}

OUTPUT JSON SCHEMA:
{
  "subtitles": {
    "format": "json_cues",
    "cues": [
      {
        "start_sec": 0.0,
        "end_sec": 0.0,
        "text": "string",
        "style": {
          "position_zone": "center|bottom_safe",
          "emphasis_words": ["string"]
        }
      }
    ]
  },
  "warnings": ["string"]
}

RULES:
- Rispondi SEMPRE e SOLO con JSON valido. Nessun markdown.
- Se script.voiceover_text è vuoto/null: usa hook_text + cta_text come base e popola warnings con "no_voiceover_text".
- Distribuisci le cue lungo video_duration_sec in modo naturale.
  - phrase: 1.2-2.5 sec per cue
  - word: 0.25-0.6 sec per parola
- Non superare subtitle_style.max_chars_per_line; spezza su subtitle_style.lines.
- position_zone: "bottom_safe" significa che va posizionato *sopra* bottom_px (mai sotto).
- emphasis: scegli 2-6 parole importanti totali nel video e mettile in emphasis_words.
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
        console.error("AI GenerateSubtitlesFromScript Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
