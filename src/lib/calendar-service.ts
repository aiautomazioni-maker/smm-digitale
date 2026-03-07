import { EditorialPlan, PlanInput, PlanItem } from "@/types/calendar";
import { BrandKit } from "@/types/brand";


export async function generateEditorialPlan(input: PlanInput, brandKit: BrandKit | null): Promise<EditorialPlan> {
    if (!brandKit) {
        return {
            strategy: { focus_of_the_cycle: "Configura il Brand Kit per generare un piano.", pillars_breakdown: [] },
            items: [],
            warnings: ["Manca la configurazione del Brand Kit"]
        };
    }

    // Simulate AI Gen Delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    const brandName = brandKit.brand_name || "Automazioni AI";
    const tone = brandKit.tone_of_voice?.[0] || "Professionale";
    const colors = brandKit.visual_direction?.color_palette?.map(c => c.name).join(", ") || "Colori Brand";
    const activePillars = brandKit.visual_direction?.style_keywords || ["Automatizazione", "AI Business"];

    // Generate 14 days
    const items: PlanItem[] = [];
    const startDate = new Date(input.start_date);

    for (let i = 1; i <= 14; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (i - 1));

        const typeRoll = Math.random();
        let type: "post" | "reel" | "story" | "carousel" = "post";

        if (typeRoll > 0.7) type = "reel";
        else if (typeRoll > 0.4) type = "story";
        else if (typeRoll > 0.2) type = "carousel";

        const pillar = activePillars[Math.floor(Math.random() * activePillars.length)];

        // Context-aware prompts
        const visualPrompt = `Foto ${tone.toLowerCase()} per ${brandName}, stile ${brandKit.visual_direction?.photo_style?.[0] || "moderno"}, colori ${colors}. Soggetto: ${pillar}.`;

        const hook = type === "reel"
            ? "POV: Come Automazioni AI rivoluziona..."
            : "Come scalare con l'AI...";

        items.push({
            id: `plan-${i}-${Date.now()}`,
            day_index: i,
            date: currentDate.toISOString(),
            channels: ["instagram"],
            content_type: type,
            pillar: pillar,
            topic: `${pillar} - Day ${i}`,
            hook_text: hook,
            caption_brief: `Scrivi una caption ${tone} su ${pillar}. Focus su: ${input.goals}.`,
            visual_prompt: visualPrompt,
            cta: brandKit.cta_preferences?.[0] || "Scopri di più",
            estimated_effort: type === "reel" ? "high" : "medium",
            status: "planned"
        });
    }

    return {
        strategy: {
            focus_of_the_cycle: `Strategia per: ${input.goals}`,
            pillars_breakdown: activePillars.map(p => ({ pillar: p, percentage: Math.floor(100 / activePillars.length) }))
        },
        items,
        warnings: []
    };
}

export async function getDashboardPreview(): Promise<PlanItem[]> {
    // Return empty by default as requested (no fake preview)
    return [];
}

