export interface BrandInput {
    lang: string;
    business_name: string;
    industry: string;
    city: string;
    website?: string;
    instagram_handle?: string;
    target_audience: string;
    offer: string;
    tone_preferences: string;
    competitors?: string[];
    notes?: string;
}

export interface Persona {
    name: string;
    age_range: string;
    goals: string[];
    pain_points: string[];
    objections: string[];
}

export interface ColorPalette {
    name: string;
    hex: string;
}

export interface VisualDirection {
    style_keywords: string[];
    color_palette: ColorPalette[];
    photo_style: string[];
    video_style: string[];
    composition_rules: string[];
}

export interface BrandKit {
    brand_name: string;
    tagline: string;
    tone_of_voice: string[];
    writing_rules: string[];
    do_not_say: string[];
    value_props: string[];
    audience_personas: Persona[];
    visual_direction: VisualDirection;
    cta_preferences: string[];
    brand_hashtags: string[];
}

export interface BrandKitResponse {
    brand_kit: BrandKit;
    warnings: string[];
}
