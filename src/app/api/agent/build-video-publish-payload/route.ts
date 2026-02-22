import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            workspace_id,
            video_url,
            selected_cover_url,
            copy,
            targets,
            capabilities,
            schedule,
            safeMode = false
        } = body;

        if (safeMode) {
            return NextResponse.json({
                publish_jobs: targets.map((t: string) => ({
                    platform: t,
                    content_type: "video",
                    media_url: video_url || "https://example.com/video.mp4",
                    cover_url: selected_cover_url,
                    caption: copy?.caption || "Default caption",
                    hashtags: copy?.hashtags || [],
                    publish_at_iso: schedule?.publish_at_iso || null,
                    timezone: schedule?.timezone || "Europe/Rome",
                    requires_manual_publish: false,
                    manual_steps: []
                })),
                warnings: ["Safe mode active"]
            });
        }

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const prompt = `
BuildVideoPublishPayload
Prepara il payload di pubblicazione/scheduling per video (Reels/TikTok) con cover selezionata.
Se una piattaforma non supporta publish API, imposta requires_manual_publish e manual_steps.

INPUT:
{
  "workspace_id": "${workspace_id || ''}",
  "video_url": "${video_url || ''}",
  "selected_cover_url": "${selected_cover_url || ''}",
  "copy": ${JSON.stringify(copy || {})},
  "targets": ${JSON.stringify(targets || [])},
  "capabilities": ${JSON.stringify(capabilities || {})},
  "schedule": ${JSON.stringify(schedule || { timezone: "Europe/Rome", publish_at_iso: null })}
}

OUTPUT JSON SCHEMA:
{
  "publish_jobs": [
    {
      "platform": "instagram_reels|facebook_reels|tiktok",
      "content_type": "video",
      "media_url": "string",
      "cover_url": "string|null",
      "caption": "string",
      "hashtags": ["string"],
      "publish_at_iso": "string|null",
      "timezone": "Europe/Rome",
      "requires_manual_publish": false,
      "manual_steps": ["string"]
    }
  ],
  "warnings": ["string"]
}

RULES:
- Rispondi SEMPRE e SOLO con JSON valido. Nessun markdown.
- caption = copy.caption (non duplicare hashtag se già in caption; se servono in caption, aggiungili in fondo).
- Se supports_cover=false => cover_url=null + warning "cover_not_supported" + manual_steps: "Imposta copertina manualmente".
- Se can_publish=false => requires_manual_publish=true e manual_steps: "Scarica video e copertina", "Carica su piattaforma", "Incolla caption e hashtag".
- publish_at_iso se invalid => null + warning.
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
        console.error("AI BuildVideoPublishPayload Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
