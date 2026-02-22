import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { lang, workspace_id, brand_kit, story_brief, source, capabilities, schedule } = body;

        const prompt = `Sei un assistente per creare e pubblicare Instagram Stories in un'app di social automation.
Rispondi SEMPRE e SOLO con JSON valido (senza markdown/backticks).

Obiettivo:
- Preparare un "story_plan" completo (creative + copy + stickers) coerente con brand_kit
- Generare istruzioni per asset (generate/edit) in 9:16
- Costruire "publish_payload" per pubblicazione/scheduling, rispettando capabilities
- Applicare regole Instagram Stories: safe area, overlay text breve, CTA, sticker placement

INPUT:
{
  "lang": "${lang || 'it'}",
  "workspace_id": "${workspace_id}",
  "platform": "instagram",
  "brand_kit": ${JSON.stringify(brand_kit)},
  "story_brief": ${JSON.stringify(story_brief)},
  "source": ${JSON.stringify(source)},
  "capabilities": ${JSON.stringify(capabilities)},
  "schedule": ${JSON.stringify(schedule)}
}

OUTPUT JSON SCHEMA:
{
  "story_plan": {
    "format": "9:16",
    "safe_area": {
      "top_px": 250,
      "bottom_px": 350,
      "notes": ["string"]
    },
    "creative": {
      "asset_action": "ai_generate|edit_upload|use_uploaded",
      "prompt_en": "string|null",
      "negative_prompt_en": "string|null",
      "edit_instruction_en": "string|null",
      "overlays": [
        {
          "type": "text",
          "text": "string",
          "position": "top|center|bottom",
          "style_notes": ["string"]
        }
      ],
      "export_specs": {
        "width": 1080,
        "height": 1920,
        "file_type": "jpg|png|mp4",
        "max_duration_sec": 15
      }
    },
    "copy": {
      "headline": "string",
      "subheadline": "string|null",
      "cta_text": "string|null",
      "alt_text": "string"
    },
    "stickers": [
      {
        "type": "link|mention|hashtag|location|poll|quiz|question|emoji_slider|music",
        "value": "string|null",
        "question": "string|null",
        "options": ["string"],
        "position_hint": "top|center|bottom",
        "fallback": "string|null"
      }
    ]
  },
  "publish_payload": {
    "workspace_id": "string",
    "platform": "instagram",
    "content_type": "story",
    "media_urls": ["string"],
    "aspect_ratio": "9:16",
    "overlays": [
      {"type": "text", "text": "string", "position": "top|center|bottom"}
    ],
    "stickers": [
      {"type": "string", "value": "string|null", "question": "string|null", "options": ["string"]}
    ],
    "publish_at_iso": "string|null",
    "timezone": "Europe/Rome",
    "requires_manual_publish": false,
    "manual_steps": ["string"]
  },
  "warnings": ["string"]
}

RULES (Instagram Stories):
1) Formato sempre 9:16 (1080x1920). Tutti i testi/sticker devono evitare safe area:
   - non posizionare elementi critici in alto ~250px e in basso ~350px.
2) Testo overlay corto:
   - headline max 60 caratteri
   - subheadline max 90 caratteri
3) CTA:
   - se cta_type=link e supports_link_sticker=false: fallback = "Inserisci link manualmente come sticker" e aggiungi manual_steps.
   - se cta_type in (poll|quiz|question|emoji_slider) e supports_interactive_stickers=false: fallback = "Crea sticker interattivo manualmente" e aggiungi manual_steps.
4) Se can_publish_story=false:
   - publish_payload.requires_manual_publish=true
   - manual_steps deve includere: "Scarica asset" + "Carica su Instagram come storia" + "Aggiungi sticker/CTA"
5) Creative generation:
   - Se source.mode=ai_generate: crea prompt_en e negative_prompt_en coerenti con brand_kit (prompt sempre in inglese).
   - Se source.mode=edit_upload: crea edit_instruction_en.
   - Se source.mode=template: prompt_en può essere null, ma overlays/copy/stickers devono essere compilati.
6) Alt text max 220 caratteri.
7) Non inventare informazioni non presenti in brand_kit/story_brief/image_analysis.
8) media_urls: se non ancora generato/convertito, lascia array vuoto e aggiungi warning "media_pending_generation".
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const storyPlan = JSON.parse(response.choices[0].message.content || "{}");

        return NextResponse.json(storyPlan);
    } catch (error) {
        console.error('Error generating story plan:', error);
        return NextResponse.json({ error: 'Failed to generate story plan' }, { status: 500 });
    }
}
