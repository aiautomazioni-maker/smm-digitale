import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            workspace_id,
            video_file,
            targets,
            safeMode = false
        } = body;

        if (safeMode) {
            return NextResponse.json({
                is_valid: false,
                issues: [
                    { type: "resolution", severity: "medium", detail: "Video is not 9:16 aspect ratio." },
                    { type: "codec", severity: "high", detail: "Video codec is not H.264." }
                ],
                fix_plan: {
                    needs_transcode: true,
                    actions: [
                        { action: "pad_to_9_16", params: { blur_background: true } },
                        { action: "reencode", params: { codec: "h264" } }
                    ],
                    output_specs: {
                        width: 1080,
                        height: 1920,
                        fps: 30,
                        container: "mp4",
                        codec: "h264",
                        audio_codec: "aac",
                        max_bitrate_kbps: 8000
                    }
                },
                warnings: ["Safe mode active - simulated output"]
            });
        }

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const prompt = `
ValidateAndFixVideoSpecs
Obiettivo:
- Validare che il video finale sia compatibile con Reels (IG/FB) e TikTok
- Proporre un piano di auto-fix (transcode/resize/trim/re-encode) se necessario

INPUT:
{
  "workspace_id": "${workspace_id || ''}",
  "video_file": ${JSON.stringify(video_file || {})},
  "targets": ${JSON.stringify(targets || [])}
}

OUTPUT JSON SCHEMA:
{
  "is_valid": true,
  "issues": [
    {"type": "string", "severity": "low|medium|high", "detail": "string"}
  ],
  "fix_plan": {
    "needs_transcode": false,
    "actions": [
      {
        "action": "resize|pad_to_9_16|crop_to_9_16|trim|reencode|fps_convert|audio_reencode|bitrate_cap",
        "params": {"key": "value"}
      }
    ],
    "output_specs": {
      "width": 1080,
      "height": 1920,
      "fps": 30,
      "container": "mp4",
      "codec": "h264",
      "audio_codec": "aac",
      "max_bitrate_kbps": 8000
    }
  },
  "warnings": ["string"]
}

RULES:
- Rispondi SEMPRE e SOLO con JSON valido. Nessun markdown.
- Standard output consigliato: 1080x1920, 30fps, MP4(H.264), audio AAC.
- Aspect ratio deve essere 9:16 (verticale). Se non lo è: preferisci pad_to_9_16 (blur bg) se non vuoi tagliare contenuto, usa crop_to_9_16 se soggetto centrale.
- Durata: Se > 60 sec: trim a 60 con warning. Se < 5 sec: warning (troppo corto).
- Codec/container: Se non mp4/h264 -> reencode.
- Bitrate: Se bitrate_kbps troppo alto -> bitrate_cap a max_bitrate_kbps.
- File size: Se > 200MB -> bitrate_cap + reencode.
- is_valid=true solo se NON ci sono issue severity=high.
- fix_plan.needs_transcode=true se c'è almeno 1 action.
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
        console.error("AI ValidateAndFixVideoSpecs Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
