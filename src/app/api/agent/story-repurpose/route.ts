import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { lang, workspace_id, brand_kit, source_post, repurpose_settings, capabilities, schedule } = body;

        const prompt = `Sei un assistente che trasforma un contenuto esistente (post o carousel) in una sequenza di Instagram Stories 9:16.
Rispondi SEMPRE e SOLO con JSON valido (senza markdown/backticks).

Obiettivo:
- Estrarre il messaggio core e gli hook visivi dal "source_post".
- Adattarli in una sequenza di storie 9:16 (frames_count tra 2 e 5).
- Applicare strategie di ritaglio e editing per ottimizzare l'asset originale per le Stories.

INPUT:
{
  "lang": "${lang || 'it'}",
  "workspace_id": "${workspace_id}",
  "platform": "instagram",
  "brand_kit": ${JSON.stringify(brand_kit)},
  "source_post": ${JSON.stringify(source_post)},
  "repurpose_settings": ${JSON.stringify(repurpose_settings)},
  "capabilities": ${JSON.stringify(capabilities)},
  "schedule": ${JSON.stringify(schedule)}
}

OUTPUT JSON SCHEMA:
{
  "story_repurpose_plan": {
    "format": "9:16",
    "safe_area": {"top_px": 250, "bottom_px": 350, "notes": ["string"]},
    "frames": [
      {
        "frame_index": 1,
        "source_media_index": 0,
        "crop_strategy": "fit_with_blur_bg|center_crop|top_crop|bottom_crop",
        "edit_instruction_en": "string",
        "overlays": [
          {"type": "text", "text": "string", "position": "top|center|bottom", "style_notes": ["string"]}
        ],
        "stickers": [
          {"type": "link|poll|quiz|question|emoji_slider|mention|location|hashtag", "value": "string|null", "question": "string|null", "options": ["string"], "fallback": "string|null"}
        ],
        "alt_text": "string"
      }
    ]
  },
  "publish_plan": {
    "requires_manual_publish": false,
    "manual_steps": ["string"],
    "items": [
      {"content_type": "story", "media_urls": ["string"], "overlays": [{"type":"text","text":"string","position":"top|center|bottom"}], "stickers": [{"type":"string","value":"string|null","question":"string|null","options":["string"]}], "publish_at_iso":"string|null", "timezone":"Europe/Rome"}
    ]
  },
  "warnings": ["string"]
}

RULES:
1) frames_count tra 2 e 5. Se source_post.content_type=post e frames_count>3, limita a 3 e aggiungi warning.
2) Ogni frame deve scegliere un media_url (source_media_index) dal post originale.
3) Strategia ritaglio: 
   - fit_with_blur_bg: mette l'immagine/video originale centrato con sfondo sfocato dei colori dominanti.
   - center_crop: ritaglio 9:16 centrale.
4) edit_instruction_en: descrivi accuratamente come adattare l'asset (colori, contrasto, posizionamento) in inglese.
5) Overlays: trasforma la caption originale in brevi testi d'impatto (headline max 60 char). Massimo 2 overlay per frame.
6) CTA: inserisci la Call to Action nell’ultimo frame con sticker coerente.
7) Scheduler: calcola publish_at_iso incrementando di gap_seconds_between_frames per ogni frame.
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const repurposePlan = JSON.parse(response.choices[0].message.content || "{}");

        return NextResponse.json(repurposePlan);
    } catch (error) {
        console.error('Error repurposing story:', error);
        return NextResponse.json({ error: 'Failed to repurpose story' }, { status: 500 });
    }
}
