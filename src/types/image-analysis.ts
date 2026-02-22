export interface ImageAnalysisResult {
    image_analysis: {
        summary: string;
        subjects: string[];
        setting: string;
        mood: string;
        colors: string[];
        composition: string[];
        visible_text: string[];
        brand_elements_visible: string[];
        quality_issues: string[];
        instagrammability_score: number;
        suggested_improvements: string[];
    };
    warnings: string[];
}
