import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
          user_prompt,
            current_editor_edl,
          current_copy
        } = body;

        if (!openai) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const prompt = `
Sei un velocissimo assistente JSON Video Editor. Non scrivere descrizioni o markdown testuale, rispondi SOLO con un JSON valido.

Riceverai lo stato attuale dei dati del video e una richiesta testuale dell'utente. Devi restituire il JSON aggiornato in base alla richiesta.
Limita le modifiche SOLO a quello che l'utente ha chiesto. Se non chiede di cambiare il filtro, lascia quello attuale.

STATO ATTUALE (EDL):
${JSON.stringify(current_editor_edl || {})}

STATO ATTUALE (COPY):
${JSON.stringify(current_copy || {})}

RICHIESTA UTENTE:
"${user_prompt}"

REGOLE DI MODIFICA:
1) "filters": un array con oggetti { "name": string, "intensity": number }. I nomi validi sono: "clean", "warm", "cool", "vibrant", "bw". Intensity tra 0.0 e 1.0. 
2) "text_overlays": array di { "text": string, "start_time": number, "end_time": number, "position": string }. Cambia il testo se richiesto.
3) "audio": { "url": string, "music_mode": "no_music" o "safe_library" }. (Ignora se non menziona la musica).
4) copy.caption: Modifica il testo della caption del post social se l'utente lo chiede.

FORMATO OUTPUT:
DEVI rispondere rigorosamente e solo con la struttura JSON qui sotto, compilandola con i dati aggiornati. Non inventare proprietà che non esistono qui sotto.

{
  "updated_editor_edl": {
    "filters": [{"name":"vibrant","intensity":0.5}],
    "text_overlays": [{"text":"Nuovo Titolo","start_time":0,"end_time":5,"position":"center"}],
    "audio": {"music_mode":"no_music"}
  },
  "updated_copy": {
    "caption": "testo"
  }
}
`;

        const result = await openai.chat.completions.create({
          model: 'gpt-4o-mini', // 🚀 Super cheap and fast model!
          response_format: { type: "json_object" },
            messages: [{ role: 'user', content: prompt }]
        });

      const rawJson = result.choices[0]?.message?.content || "{}";
        const parsedJson = JSON.parse(rawJson);

      // Merge back preserving other missing EDL fields for safety
      const finalEdl = {
        ...current_editor_edl,
        ...parsedJson.updated_editor_edl,
      };

      const finalCopy = {
        ...current_copy,
        ...parsedJson.updated_copy,
      };

      return NextResponse.json({
        updated_editor_edl: finalEdl,
        updated_copy: finalCopy,
      });

    } catch (error: any) {
        console.error("AI CreateVideoEditPlan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
