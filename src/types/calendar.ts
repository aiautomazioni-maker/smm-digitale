export type Channel = "instagram" | "facebook" | "linkedin" | "tiktok";
export type ContentType = "post" | "reel" | "story" | "carousel";

export interface PlanItem {
    id: string;
    day_index: number; // 1-14
    date?: string; // Optional for dynamic start date
    channels: Channel[];
    content_type: ContentType;
    pillar: string;
    topic: string;

    // AI Content Studio Integration
    hook_text: string;
    caption_brief: string;
    visual_prompt: string;

    cta: string;
    estimated_effort: "low" | "medium" | "high";
    status: "planned" | "created" | "posted";
}

export interface EditorialStrategy {
    focus_of_the_cycle: string;
    pillars_breakdown: { pillar: string; percentage: number }[];
}

export interface EditorialPlan {
    strategy: EditorialStrategy;
    items: PlanItem[];
    warnings: string[];
}

export interface PlanInput {
    brand_kit_id?: string; // In a real app
    start_date: Date;
    goals: string;
    frequency: {
        posts: number;
        stories: number;
        reels: number;
    };
}
