export interface VideoEditIntent {
    trim?: { start: number; end: number };
    filters?: string[];
    textOverlays?: Array<{ text: string; position: string; timestamp: number }>;
    audioTrackUrl?: string;
    generateSubtitles?: boolean;
    crop?: { x: number; y: number; width: number; height: number };
}

export interface PlatformCapabilities {
    nativeScheduling: boolean;
    nativeAudioUpload: boolean;
    nativeTextOverlays: boolean;
    nativeSubtitles: boolean;
    nativeFilters: boolean;
}

const PLATFORM_CAPS: Record<string, PlatformCapabilities> = {
    'instagram_reels': {
        nativeScheduling: false, // Often requires internal scheduling fallback for some accounts depending on API tier
        nativeAudioUpload: false, // Instagram API requires the video to already have the audio mixed in or uses in-app tools
        nativeTextOverlays: false, // Must be burned in for Reels API
        nativeSubtitles: false,
        nativeFilters: false
    },
    'facebook_video': {
        nativeScheduling: true, // Native API scheduling supported via published=false & scheduled_publish_time
        nativeAudioUpload: false,
        nativeTextOverlays: false,
        nativeSubtitles: true, // FB API supports uploading SRT files
        nativeFilters: false
    },
    'tiktok': {
        nativeScheduling: false, // Usually requires internal webhook/cron support
        nativeAudioUpload: false,
        nativeTextOverlays: false,
        nativeSubtitles: false,
        nativeFilters: false
    }
};

export interface CapabilitiesAwarePayload {
    platform: string;
    serverSideRenderingTasks: {
        burnAudio: boolean;
        burnText: boolean;
        burnSubtitles: boolean;
        applyFilters: boolean;
        applyTrim: boolean;
        applyCrop: boolean;
    };
    manualFallbackSteps: string[];
    isSchedulingNative: boolean;
    schedulingFallbackRequired: boolean;
}

/**
 * Analyzes the user's video editing intent against the target platform's API capabilities.
 * If the API does not support a feature natively, it routes the task to our server-side FFmpeg rendering engine
 * or generates a manual fallback warning.
 */
export function buildCapabilitiesPayload(platform: string, scheduleAtIso: string | null, intent: VideoEditIntent): CapabilitiesAwarePayload {
    const caps = PLATFORM_CAPS[platform] || PLATFORM_CAPS['instagram_reels']; // Default to strict constraints

    const payload: CapabilitiesAwarePayload = {
        platform,
        serverSideRenderingTasks: {
            burnAudio: false,
            burnText: false,
            burnSubtitles: false,
            applyFilters: false,
            applyTrim: !!intent.trim, // Trimming is always done server-side to save bandwidth
            applyCrop: !!intent.crop, // Cropping is always server-side
        },
        manualFallbackSteps: [],
        isSchedulingNative: false,
        schedulingFallbackRequired: false
    };

    // Evaluate Audio
    if (intent.audioTrackUrl) {
        if (!caps.nativeAudioUpload) {
            payload.serverSideRenderingTasks.burnAudio = true;
        }
    }

    // Evaluate Text Overlays
    if (intent.textOverlays && intent.textOverlays.length > 0) {
        if (!caps.nativeTextOverlays) {
            payload.serverSideRenderingTasks.burnText = true;
        }
    }

    // Evaluate Subtitles
    if (intent.generateSubtitles) {
        if (!caps.nativeSubtitles) {
            payload.serverSideRenderingTasks.burnSubtitles = true;
            payload.manualFallbackSteps.push("Subtitles will be hard-burned into the video since the platform does not support soft SRT uploads via API.");
        }
    }

    // Evaluate Filters
    if (intent.filters && intent.filters.length > 0) {
        if (!caps.nativeFilters) {
            payload.serverSideRenderingTasks.applyFilters = true;
            payload.manualFallbackSteps.push("Filters will be applied server-side before upload.");
        }
    }

    // Evaluate Scheduling
    if (scheduleAtIso) {
        if (caps.nativeScheduling) {
            payload.isSchedulingNative = true;
        } else {
            payload.schedulingFallbackRequired = true;
            payload.manualFallbackSteps.push("Native scheduling not supported via API for this platform. Using internal chron-job delay queue.");
        }
    }

    return payload;
}
