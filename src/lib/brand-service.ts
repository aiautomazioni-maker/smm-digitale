import { BrandInput, BrandKitResponse } from "@/types/brand";

export async function generateBrandKit(input: BrandInput): Promise<BrandKitResponse> {
    // Simulate AI Delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Mock Logic based on Industry/Tone
    const isFood = input.industry.toLowerCase().includes("food") || input.industry.toLowerCase().includes("ristora");
    const isFashion = input.industry.toLowerCase().includes("fashion") || input.industry.toLowerCase().includes("moda");

    // Default: Modern/Professional
    let colors = [
        { name: "Deep Navy", hex: "#0F172A" },
        { name: "Electric Blue", hex: "#3B82F6" },
        { name: "Clean White", hex: "#FFFFFF" },
        { name: "Slate Grey", hex: "#64748B" }
    ];
    let styleKeywords = ["Moderno", "Affidabile", "Innovativo"];
    let tagline = `Il futuro del ${input.industry} a ${input.city}`;

    if (isFood) {
        colors = [
            { name: "Warm Orange", hex: "#F97316" },
            { name: "Fresh Green", hex: "#22C55E" },
            { name: "Creamy White", hex: "#FFF7ED" },
            { name: "Charcoal", hex: "#374151" }
        ];
        styleKeywords = ["Genuino", "Accogliente", "Gustoso"];
        tagline = `Sapore autentico nel cuore di ${input.city}`;
    } else if (isFashion) {
        colors = [
            { name: "Classic Black", hex: "#000000" },
            { name: "Gold", hex: "#D4AF37" },
            { name: "Soft Beige", hex: "#F5F5DC" }
        ];
        styleKeywords = ["Elegante", "Minimal", "Chic"];
        tagline = `Stile senza tempo per ${input.target_audience}`;
    }

    return {
        brand_kit: {
            brand_name: input.business_name,
            tagline: tagline,
            tone_of_voice: [input.tone_preferences, "Professionale", "Coinvolgente", "Autorevole", "Empatico"],
            writing_rules: [
                "Usa frasi brevi e dirette",
                "Evita il gergo tecnico non necessario",
                "Parla direttamente al lettore (usa il 'tu')",
                "Usa emoji con moderazione",
                "Inizia sempre con un gancio forte",
                "Concludi con una Call to Action chiara"
            ],
            do_not_say: [
                "Siamo i leader del settore (senza prove)",
                "Prezzi stracciati",
                "Ovvio",
                "Onesto",
                "Qualità prezzo"
            ],
            value_props: [
                `La soluzione migliore per ${input.target_audience}`,
                "Eccellenza garantita nel servizio",
                "Innovazione costante",
                `Supporto locale a ${input.city}`
            ],
            audience_personas: [
                {
                    name: "L'Appassionato",
                    age_range: "25-35",
                    goals: ["Trovare prodotti autentici", "Sentirsi parte di una community"],
                    pain_points: ["Scarsa qualità altrove", "Prezzi poco chiari"],
                    objections: ["Sarà davvero così buono?"]
                },
                {
                    name: "Il Professionista Impegnato",
                    age_range: "35-50",
                    goals: ["Risparmiare tempo", "Affidabilità totale"],
                    pain_points: ["Servizi lenti", "Scarsa comunicazione"],
                    objections: ["Ho poco tempo per gestire imprevisti"]
                }
            ],
            visual_direction: {
                style_keywords: styleKeywords,
                color_palette: colors,
                photo_style: ["Luce naturale", "Focus sui dettagli", "Colori saturati", "Persone autentiche"],
                video_style: ["Ritmo veloce", "Transizioni fluide", "Audio pulito", "Sottotitoli grandi"],
                composition_rules: ["Regola dei terzi", "Spazio negativo abbondante", "Soggetti centrati"]
            },
            cta_preferences: [
                input.offer ? `Scopri ${input.offer}` : "Scopri di più",
                "Prenota una consulenza",
                "Acquista ora",
                "Salva questo post"
            ],
            brand_hashtags: [
                `#${input.business_name.replace(/\s+/g, '')}`,
                `#${input.industry.replace(/\s+/g, '')}${input.city.replace(/\s+/g, '')}`,
                `#${input.city}Life`,
                "#Community",
                "#Inspiration"
            ]
        },
        warnings: []
    };
}
