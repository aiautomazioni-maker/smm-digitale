/**
 * Motore di generazione e rendering per la conversione "Post -> Stories"
 * Gestisce la validazione, i layout preset, e i payload di pubblicazione.
 */

// ==========================================
// 1. SEQUENCE PLAN (Cosa fare)
// ==========================================

export type LayoutPreset = "minimal" | "modern" | "bold";
export type FrameRole = "hook" | "value" | "proof" | "offer" | "cta" | "closing";
export type AssetAction = "ai_generate" | "edit_upload" | "use_uploaded";
export type PositionZone = "top" | "center" | "bottom";
export type Alignment = "left" | "center" | "right";
export type TextSize = "s" | "m" | "l" | "xl";
export type FontWeight = "regular" | "semibold" | "bold";

export interface TextStyle {
    font_weight: FontWeight;
    text_size: TextSize;
    use_brand_color_accent: boolean;
}

export interface OverlayElement {
    id: string;
    type: "text";
    text: string;
    max_chars?: number;
    position_zone: PositionZone;
    alignment: Alignment;
    style: TextStyle;
}

export type StickerType = "link" | "poll" | "quiz" | "question" | "emoji_slider" | "mention" | "location" | "hashtag" | "music";

export interface StickerPlan {
    type: StickerType;
    value: string | null;
    question?: string | null;
    options?: string[];
    position_zone: PositionZone;
    fallback: string | null;
}

export interface CreativePlan {
    asset_action: AssetAction;
    prompt_en: string | null;
    negative_prompt_en: string | null;
    edit_instruction_en: string | null;
    background_style_notes: string[];
    overlay_plan: OverlayElement[];
}

export interface FramePlan {
    frame_index: number;
    role: FrameRole;
    creative: CreativePlan;
    stickers_plan: StickerPlan[];
    alt_text: string;
}

export interface SequencePlanResponse {
    sequence_plan: {
        format: "9:16";
        export_specs: {
            width: number;
            height: number;
            file_type: "jpg" | "png" | "mp4";
            max_duration_sec: number;
        };
        safe_area: {
            top_px: number;
            bottom_px: number;
        };
        layout_preset: LayoutPreset;
        frames: FramePlan[];
    };
    warnings: string[];
}


// ==========================================
// 2. RENDER JOBS (Come farlo - Pipeline tecnica)
// ==========================================

export type JobType = "generate_image" | "edit_image" | "render_overlay";

export interface RenderSpec {
    width: number;
    height: number;
    safe_area_top_px: number;
    safe_area_bottom_px: number;
    overlay_plan: OverlayElement[];
}

export interface RenderJob {
    job_type: JobType;
    frame_index: number;
    input_media_url: string | null;
    prompt_en: string | null;
    negative_prompt_en: string | null;
    edit_instruction_en: string | null;
    render_spec: RenderSpec;
}

export interface RenderJobsResponse {
    render_jobs: RenderJob[];
    warnings: string[];
}


// ==========================================
// 3. MOTORE MOCK (Simulazione della risposta AI)
// ==========================================

/**
 * Genera il piano per le storie partendo da un post (Mock)
 */
export function generateStorySequencePlan(input: any): SequencePlanResponse {
    return {
        sequence_plan: {
            format: "9:16",
            export_specs: { width: 1080, height: 1920, file_type: "jpg", max_duration_sec: 15 },
            safe_area: { top_px: 250, bottom_px: 350 },
            layout_preset: "modern",
            frames: [
                {
                    frame_index: 1,
                    role: "hook",
                    creative: {
                        asset_action: "ai_generate",
                        prompt_en: "A beautiful artisan coffee cup on a wooden table, warm cinematic lighting, minimal background",
                        negative_prompt_en: "text, watermark, messy, people",
                        edit_instruction_en: null,
                        background_style_notes: ["Dark mood", "High contrast"],
                        overlay_plan: [
                            {
                                id: "h1",
                                type: "text",
                                text: "Il tuo caffè non è mai stato così buono.",
                                max_chars: 60,
                                position_zone: "top",
                                alignment: "center",
                                style: { font_weight: "bold", text_size: "xl", use_brand_color_accent: true }
                            }
                        ]
                    },
                    stickers_plan: [],
                    alt_text: "Tazza di caffè artigianale"
                },
                {
                    frame_index: 2,
                    role: "cta",
                    creative: {
                        asset_action: "use_uploaded",
                        prompt_en: null,
                        negative_prompt_en: null,
                        edit_instruction_en: null,
                        background_style_notes: ["Clean"],
                        overlay_plan: [
                            {
                                id: "txt1",
                                type: "text",
                                text: "Vieni a trovarci oggi!",
                                max_chars: 60,
                                position_zone: "center",
                                alignment: "center",
                                style: { font_weight: "regular", text_size: "m", use_brand_color_accent: false }
                            }
                        ]
                    },
                    stickers_plan: [
                        {
                            type: "link",
                            value: "https://caffeartisan.it/prenota",
                            position_zone: "bottom",
                            fallback: "Link in Bio"
                        }
                    ],
                    alt_text: "Testo di invito"
                }
            ]
        },
        warnings: ["Uso fallback per link_sticker se l'account non lo supporta (manual_link_sticker)"]
    };
}

/**
 * Traduce il piano in job tecnici per il renderer Antigravity
 */
export function createRenderJobs(sequencePlan: SequencePlanResponse['sequence_plan'], uploadedUrls: string[]): RenderJobsResponse {
    const jobs: RenderJob[] = [];

    sequencePlan.frames.forEach(frame => {
        // Job 1: Generazione o Modifica (se necessario)
        if (frame.creative.asset_action === "ai_generate") {
            jobs.push({
                job_type: "generate_image",
                frame_index: frame.frame_index,
                input_media_url: null,
                prompt_en: frame.creative.prompt_en,
                negative_prompt_en: frame.creative.negative_prompt_en,
                edit_instruction_en: null,
                render_spec: {
                    width: sequencePlan.export_specs.width,
                    height: sequencePlan.export_specs.height,
                    safe_area_top_px: sequencePlan.safe_area.top_px,
                    safe_area_bottom_px: sequencePlan.safe_area.bottom_px,
                    overlay_plan: frame.creative.overlay_plan
                }
            });
        }

        // Job 2: Render Overlay (Testo, badges, ecc)
        jobs.push({
            job_type: "render_overlay",
            frame_index: frame.frame_index,
            input_media_url: "internal_pipeline_id_or_url", // Sarebbe url dell'immagine prodotta al job 1
            prompt_en: null,
            negative_prompt_en: null,
            edit_instruction_en: null,
            render_spec: {
                width: sequencePlan.export_specs.width,
                height: sequencePlan.export_specs.height,
                safe_area_top_px: sequencePlan.safe_area.top_px,
                safe_area_bottom_px: sequencePlan.safe_area.bottom_px,
                overlay_plan: frame.creative.overlay_plan
            }
        });
    });

    return {
        render_jobs: jobs,
        warnings: []
    };
}


// ==========================================
// 4. PUBLISH PLAN (Pianificazione Pubblicazione)
// ==========================================

export interface PublishItem {
    platform: "instagram" | "facebook" | "tiktok" | "linkedin";
    content_type: "story" | "post" | "reel";
    media_urls: string[];
    stickers: StickerPlan[];
    publish_at_iso: string | null;
    timezone: string;
}

export interface PublishPlanResponse {
    publish_plan: {
        requires_manual_publish: boolean;
        manual_steps: string[];
        items: PublishItem[];
    };
    warnings: string[];
}

/**
 * Genera il piano di pubblicazione (Mock)
 */
export function createPublishPlan(
    generatedFrameUrls: string[],
    sequencePlan: SequencePlanResponse['sequence_plan'],
    capabilities: any,
    schedule: { timezone: string; publish_at_iso: string; gap_seconds_between_frames: number }
): PublishPlanResponse {
    const warnings: string[] = [];
    const items: PublishItem[] = [];
    let requires_manual = false;
    const manual_steps: string[] = [];

    if (!capabilities.can_publish_story) {
        requires_manual = true;
        manual_steps.push("Download the generated media files.");
        manual_steps.push("Open Instagram app and upload the media to Stories.");
        manual_steps.push("Add interactive stickers manually as defined in the plan.");
    }

    if (generatedFrameUrls.length === 0) {
        warnings.push("media_pending_generation");
    }

    let currentPublishTime = schedule.publish_at_iso ? new Date(schedule.publish_at_iso) : null;
    if (!currentPublishTime || isNaN(currentPublishTime.getTime())) {
        warnings.push("invalid_publish_time");
        currentPublishTime = null;
    }

    // Estrai tutti gli URL o string vuote se mancanti
    const media_urls = sequencePlan.frames.map((f, i) => generatedFrameUrls[i] || "");

    // Prendi gli sticker dall'ultimo frame come default
    const lastFrame = sequencePlan.frames[sequencePlan.frames.length - 1];
    const stickers = lastFrame ? lastFrame.stickers_plan : [];

    items.push({
        platform: "instagram",
        content_type: "story",
        media_urls: media_urls.filter(url => url !== ""),
        stickers: stickers,
        publish_at_iso: currentPublishTime ? currentPublishTime.toISOString() : null,
        timezone: schedule.timezone
    });

    return {
        publish_plan: {
            requires_manual_publish: requires_manual,
            manual_steps: manual_steps,
            items: items
        },
        warnings: warnings
    };
}


// ==========================================
// 5. REPURPOSE PLAN (Da Post a Storie)
// ==========================================

export type ContentType = "post" | "carousel";
export type CropStrategy = "fit_with_blur_bg" | "center_crop" | "top_crop" | "bottom_crop";

export interface RepurposeFramePlan {
    frame_index: number;
    source_media_index: number;
    crop_strategy: CropStrategy;
    edit_instruction_en: string;
    overlay_plan: OverlayElement[];
    stickers_plan: StickerPlan[];
    alt_text: string;
}

export interface RepurposePlanResponse {
    repurpose_plan: {
        format: "9:16";
        safe_area: {
            top_px: number;
            bottom_px: number;
        };
        layout_preset: LayoutPreset;
        frames: RepurposeFramePlan[];
    };
    warnings: string[];
}

/**
 * Genera il piano di repurpose da un post/carousel esistente (Mock)
 */
export function createRepurposePlan(
    sourcePost: { content_type: ContentType; caption: string; media_urls: string[]; image_analyses?: any[] },
    repurposeSettings: { frames_count: number; layout_preset: LayoutPreset; cta_type: StickerType | "none"; cta_value: string; tone: string },
    capabilities: { can_publish_story: boolean; supports_link_sticker: boolean; supports_interactive_stickers: boolean }
): RepurposePlanResponse {
    const warnings: string[] = [];
    let effectiveFramesCount = repurposeSettings.frames_count;

    // Regola 1: max 5 frames (da spec)
    if (effectiveFramesCount > 5) effectiveFramesCount = 5;
    if (effectiveFramesCount < 2) effectiveFramesCount = 2; // min 2

    // Regola 2: se post singolo, limita a 3
    if (sourcePost.content_type === "post" && effectiveFramesCount > 3) {
        effectiveFramesCount = 3;
        warnings.push("post_content_limited_to_3_frames");
    }

    const frames: RepurposeFramePlan[] = [];

    for (let i = 0; i < effectiveFramesCount; i++) {
        // Usa i media in loop se sono meno dei frame
        const mediaIndex = i % sourcePost.media_urls.length;

        // Assegna sticker solo all'ultimo frame
        const isLastFrame = i === effectiveFramesCount - 1;
        const stickers: StickerPlan[] = [];

        if (isLastFrame && repurposeSettings.cta_type !== "none") {
            let stickerType = repurposeSettings.cta_type;
            let fallback: string | null = null;

            // Gestione fallback capabilities
            if (stickerType === "link" && !capabilities.supports_link_sticker) {
                fallback = "Link in Bio";
                warnings.push("manual_link_sticker");
            } else if (["poll", "quiz", "question", "emoji_slider"].includes(stickerType) && !capabilities.supports_interactive_stickers) {
                fallback = "Rispondi al sondaggio nel post originale";
                warnings.push("manual_interactive_sticker");
            }

            stickers.push({
                type: stickerType as StickerType,
                value: repurposeSettings.cta_value,
                position_zone: "bottom",
                fallback: fallback
            });
        }

        frames.push({
            frame_index: i + 1,
            source_media_index: mediaIndex,
            crop_strategy: "fit_with_blur_bg",
            edit_instruction_en: "Resize to 1080x1920 using fit_with_blur_bg strategy. Maintain original mood and lighting. Ensure overlaid text is legible and kept out of the safe zones (top 250px, bottom 350px).",
            overlay_plan: [
                {
                    id: `h1_f${i + 1}`,
                    type: "text",
                    text: i === 0 ? "Nuovo post!" : "Scopri di più",
                    max_chars: 60,
                    position_zone: "center",
                    alignment: "center",
                    style: { font_weight: "bold", text_size: "l", use_brand_color_accent: true }
                }
            ],
            stickers_plan: stickers,
            alt_text: `Frame ${i + 1} repurpose from original post`
        });
    }

    return {
        repurpose_plan: {
            format: "9:16",
            safe_area: { top_px: 250, bottom_px: 350 },
            layout_preset: repurposeSettings.layout_preset,
            frames: frames
        },
        warnings: warnings
    };
}


// ==========================================
// 6. REPURPOSE RENDER JOBS (Esecuzione del Repurpose)
// ==========================================

export interface RepurposeRenderSpec {
    width: number;
    height: number;
    crop_strategy: CropStrategy;
    safe_area_top_px: number;
    safe_area_bottom_px: number;
    overlay_plan: OverlayElement[];
}

export interface RepurposeRenderJob {
    job_type: "edit_image" | "render_overlay";
    frame_index: number;
    input_media_url: string | null;
    edit_instruction_en?: string;
    render_spec: RepurposeRenderSpec;
}

export interface RepurposeRenderJobsResponse {
    render_jobs: RepurposeRenderJob[];
    warnings: string[];
}

/**
 * Traduce il piano di repurpose in job tecnici per l'engine grafico.
 * Implementato seguendo il json spec fornito dal cliente coerentemente a SMM Digitale.
 */
export function createRepurposeRenderJobs(
    repurposePlan: RepurposePlanResponse['repurpose_plan'],
    sourceMediaUrls: string[]
): RepurposeRenderJobsResponse {
    const jobs: RepurposeRenderJob[] = [];
    const warnings: string[] = [];

    repurposePlan.frames.forEach(frame => {
        let inputMediaUrl: string | null = null;

        // Risolvi url media o genera warning se indice errato
        if (frame.source_media_index >= 0 && frame.source_media_index < sourceMediaUrls.length) {
            inputMediaUrl = sourceMediaUrls[frame.source_media_index];
        } else {
            warnings.push(`missing_source_media_for_frame_${frame.frame_index}`);
        }

        const renderSpec: RepurposeRenderSpec = {
            width: 1080, // Default Stories
            height: 1920,
            crop_strategy: frame.crop_strategy,
            safe_area_top_px: repurposePlan.safe_area.top_px,
            safe_area_bottom_px: repurposePlan.safe_area.bottom_px,
            overlay_plan: frame.overlay_plan
        };

        // Job 1: Resize e crop (Edit Image)
        jobs.push({
            job_type: "edit_image",
            frame_index: frame.frame_index,
            input_media_url: inputMediaUrl,
            edit_instruction_en: frame.edit_instruction_en,
            render_spec: renderSpec
        });

        // Job 2: Render Overlay grafico
        jobs.push({
            job_type: "render_overlay",
            frame_index: frame.frame_index,
            input_media_url: "internal_pipeline_id_or_url", // Rappresenta url temporaneo derivante dall'edit
            render_spec: renderSpec
        });
    });

    return {
        render_jobs: jobs,
        warnings: warnings
    };
}


// ==========================================
// 7. REPURPOSE PUBLISH PLAN (Pianificazione finale)
// ==========================================

/**
 * Genera il piano di pubblicazione per le storie ottenute dal riadattamento (Mock)
 */
export function createRepurposePublishPlan(
    renderedStoryUrls: string[],
    repurposePlan: RepurposePlanResponse['repurpose_plan'],
    capabilities: any,
    schedule: { timezone: string; publish_at_iso: string; gap_seconds_between_frames: number }
): PublishPlanResponse {
    const warnings: string[] = [];
    const items: PublishItem[] = [];
    let requires_manual = false;
    const manual_steps: string[] = [];

    if (!capabilities.can_publish_story) {
        requires_manual = true;
        manual_steps.push("Download the rendered story files.");
        manual_steps.push("Open Instagram app and upload the media to Stories in sequence.");
        manual_steps.push("Add the interactive stickers manually on the last frame as defined.");
    }

    if (renderedStoryUrls.length === 0 || renderedStoryUrls.some(url => !url)) {
        warnings.push("media_pending_generation");
    }

    let basePublishTime = schedule.publish_at_iso ? new Date(schedule.publish_at_iso) : null;
    if (!basePublishTime || isNaN(basePublishTime.getTime())) {
        warnings.push("invalid_publish_time");
        basePublishTime = null;
    }

    // Per la pubblicazione possiamo raggruppare i frame in un singolo elemento (come Carosello Storie)
    // O creare un item per ogni frame separato dal gap. Spesso le API accettano array di media_urls
    // con timestamp unico, ma per rispettare il gap_seconds_between_frames potremmo dividerli.

    // Raggruppiamo tutti in un item (standard pattern per IG Stories via API)
    // e prendiamo lo sticker dell'ultimo frame.
    const mediaUrls = repurposePlan.frames.map((f, i) => renderedStoryUrls[i] || "");
    const lastFrame = repurposePlan.frames[repurposePlan.frames.length - 1];
    const stickers = lastFrame ? lastFrame.stickers_plan : [];

    items.push({
        platform: "instagram",
        content_type: "story",
        media_urls: mediaUrls.filter(url => url !== ""),
        stickers: stickers,
        publish_at_iso: basePublishTime ? basePublishTime.toISOString() : null, // Il gap in un array non è sempre gestibile con singolo publish_at, servirebbe split. Manteniamo semplice la demo.
        timezone: schedule.timezone
    });

    return {
        publish_plan: {
            requires_manual_publish: requires_manual,
            manual_steps: manual_steps,
            items: items
        },
        warnings: warnings
    };
}
