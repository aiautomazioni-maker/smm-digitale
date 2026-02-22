import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { lang, workspace_id, brand_kit, sequence_settings, source_assets, capabilities, schedule } = body;

        const prompt = `Sei un assistente per creare una sequenza di Instagram Stories (multi-frame) pronta per generazione asset e pubblicazione/scheduling. 
Rispondi SEMPRE e SOLO con JSON valido (senza markdown/backticks).

Obiettivo:
- Preparare un "sequence_plan" completo (3-5 frame) con struttura funnel coerente con brand_kit.
- Ogni frame deve avere un ruolo chiaro (hook, value, proof, etc.).
- Garantire consistenza visiva tra i frame.

INPUT:
{
  "lang": "${lang || 'it'}",
  "workspace_id": "${workspace_id}",
  "platform": "instagram",
  "brand_kit": ${JSON.stringify(brand_kit)},
  "sequence_settings": ${JSON.stringify(sequence_settings)},
  "source_assets": ${JSON.stringify(source_assets)},
  "capabilities": ${JSON.stringify(capabilities)},
  "schedule": ${JSON.stringify(schedule)}
}

OUTPUT JSON SCHEMA:
{
  "sequence_plan": {
    "format": "9:16",
    "export_specs": {"width": 1080, "height": 1920, "file_type": "jpg|png|mp4", "max_duration_sec": 15},
    "safe_area": {"top_px": 250, "bottom_px": 350, "notes": ["string"]},
    "frames": [
      {
        "frame_index": 1,
        "role": "hook|value|proof|offer|cta|closing",
        "creative": {
          "asset_action": "ai_generate|edit_upload|use_uploaded",
          "prompt_en": "string|null",
          "negative_prompt_en": "string|null",
          "edit_instruction_en": "string|null",
          "overlays": [
            {"type": "text", "text": "string", "position": "top|center|bottom", "style_notes": ["string"]}
          ]
        },
        "copy": {
          "headline": "string",
          "subheadline": "string|null",
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
        ],
        "transition_hint": "string"
      }
    ]
  },
  "publish_plan": {
    "requires_manual_publish": false,
    "manual_steps": ["string"],
    "items": [
      {
        "content_type": "story",
        "media_urls": ["string"],
        "overlays": [{"type": "text", "text": "string", "position": "top|center|bottom"}],
        "stickers": [{"type": "string", "value": "string|null", "question": "string|null", "options": ["string"]}],
        "publish_at_iso": "string|null",
        "timezone": "Europe/Rome"
      }
    ]
  },
  "warnings": ["string"]
}

RULES:
1) frames_count deve essere tra 3 e 5.
2) Struttura funnel:
   - hook_value_cta: frame1=hook, frame2=value, frame3=cta (+ frame4 proof se 4, frame5 closing se 5)
   - problem_solution_cta: frame1=problem, frame2=solution, frame3=cta (+ frame4 proof, frame5 closing)
   - offer_socialproof_cta: frame1=offer, frame2=proof, frame3=cta (+ frame4 value, frame5 closing)
   - education_cta: frame1=hook, frame2=education, frame3=education, frame4=cta (se 4) o frame5=cta (se 5)
3) Consistenza Visiva: i prompt_en per ogni frame devono descrivere uno stile coerente con il brand_kit e coerente tra i frame della sequenza.
4) Safe area: testi/sticker non devono essere posizionati in top 250px e bottom 350px.
5) Headline max 60 caratteri, subheadline max 90.
6) Sticker capability handling:
   - link senza supports_link_sticker => fallback + manual_steps.
   - poll/quiz/question/emoji_slider senza supports_interactive_stickers => fallback + manual_steps.
7) Se can_publish_story=false => publish_plan.requires_manual_publish=true e manual_steps deve includere procedure di download e upload manuale.
8) Scheduling:
   - publish_at_iso per frame1 = input publish_at_iso (se valido)
   - frame successivi = frame1 + gap_seconds_between_frames
9) Asset actions:
   - Se source_assets.mode=ai_generate: compila prompt_en/negative_prompt_en (in inglese).
   - Se edit_upload e c’è media: compila edit_instruction_en.
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const multiStoryPlan = JSON.parse(response.choices[0].message.content || "{}");

        return NextResponse.json(multiStoryPlan);
    } catch (error) {
        console.error('Error generating multi-story plan:', error);
        return NextResponse.json({ error: 'Failed to generate multi-story plan' }, { status: 500 });
    }
}
