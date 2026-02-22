
export async function generateImagen(prompt: string, aspectRatio: string = "1:1"): Promise<string | null> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("Missing GOOGLE_API_KEY");
        return null;
    }

    // Endpoint for Imagen 3 on Gemini API (Generative Language API)
    // Note: The specific endpoint might change as it's beta. 
    // We try the predict endpoint common for Generative Language.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;

    const body = {
        instances: [
            {
                prompt: prompt
            }
        ],
        parameters: {
            sampleCount: 1,
            aspectRatio: aspectRatio
        }
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("Imagen API Error:", err);
            // Fallback strategy or throw
            throw new Error(`Imagen API Error: ${response.statusText} - ${err}`);
        }

        const data = await response.json();

        // Predict API usually returns: predictions: [{ bytesBase64Encoded: "..." }] or similar
        // Let's inspect the structure safely.
        const prediction = data.predictions?.[0];

        if (prediction?.bytesBase64Encoded) {
            return `data:image/png;base64,${prediction.bytesBase64Encoded}`;
        }

        if (prediction?.mimeType && prediction?.bytesBase64Encoded) {
            return `data:${prediction.mimeType};base64,${prediction.bytesBase64Encoded}`;
        }

        console.error("Unexpected Imagen response structure:", data);
        return null;

    } catch (e) {
        console.error("generateImagen Exception:", e);
        return null;
    }
}
