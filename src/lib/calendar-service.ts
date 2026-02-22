import { EditorialPlan, PlanInput, PlanItem } from "@/types/calendar";
import { BrandKit } from "@/types/brand";

// Mock Data
const MOCK_PILLARS = ["Educazione", "Intrattenimento", "Vendita", "Dietro le Quinte"];

export async function generateEditorialPlan(input: PlanInput, brandKit: BrandKit | null): Promise<EditorialPlan> {
    // Simulate AI Gen Delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    const brandName = brandKit?.brand_name || "Tuo Brand";
    const tone = brandKit?.tone_of_voice[0] || "Professionale";
    const colors = brandKit?.visual_direction.color_palette.map(c => c.name).join(", ") || "Colori Brand";

    // Generate 14 days
    const items: PlanItem[] = [];
    const startDate = new Date(input.start_date);

    for (let i = 1; i <= 14; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (i - 1));
        // Simple logic to mix types based on frequency (mock)
        const typeRoll = Math.random();
        let type: "post" | "reel" | "story" | "carousel" = "post";

        if (typeRoll > 0.7) type = "reel";
        else if (typeRoll > 0.4) type = "story";
        else if (typeRoll > 0.2) type = "carousel";

        const pillar = MOCK_PILLARS[Math.floor(Math.random() * MOCK_PILLARS.length)];

        // Context-aware prompts
        const visualPrompt = `Foto ${tone.toLowerCase()} per ${brandName}, stile ${brandKit?.visual_direction.photo_style[0] || "moderno"}, colori ${colors}. Soggetto: ${pillar} relativo al settore ${brandKit?.visual_direction.style_keywords[0] || "generico"}.`;

        const hook = type === "reel"
            ? "POV: Quando scopri che..."
            : "3 Cose che non sai su...";

        items.push({
            id: `plan-${i}-${Date.now()}`,
            day_index: i,
            date: currentDate.toISOString(),
            channels: ["instagram"], // Default for MVP
            content_type: type,
            pillar: pillar,
            topic: `Topic day ${i} - ${pillar}`,
            hook_text: hook,
            caption_brief: `Scrivi una caption ${tone} su ${pillar}. Focus su: ${input.goals}. Usa emoji.`,
            visual_prompt: visualPrompt,
            cta: brandKit?.cta_preferences[0] || "Scopri di più",
            estimated_effort: type === "reel" ? "high" : "medium",
            status: "planned"
        });

        // Dates are handled at top of loop
    }

    return {
        strategy: {
            focus_of_the_cycle: `Crescita e Engagement per raggiungere l'obiettivo: ${input.goals}`,
            pillars_breakdown: MOCK_PILLARS.map(p => ({ pillar: p, percentage: 25 }))
        },
        items,
        warnings: []
    };
}

export async function getDashboardPreview(): Promise<PlanItem[]> {
    // Generate a quick 3-day preview without delay
    const input: PlanInput = {
        start_date: new Date(),
        goals: "Preview",
        frequency: { posts: 7, stories: 7, reels: 7 }
    };

    // Simulate fetching from DB
    const plan = await generateEditorialPlan(input, null);

    // Return first 3 items
    return plan.items.slice(0, 3);
}
