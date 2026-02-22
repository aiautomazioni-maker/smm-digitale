import { startOfDay, parseISO, isValid } from 'date-fns';

export interface PostInput {
    lang: string;
    platform: string;
    workspace_id: string;
    post: {
        content_type: string;
        caption: string;
        cta?: string;
        hashtags: string[];
        media_urls: string[];
        audio_url?: string;
        alt_text?: string;
    };
    schedule?: {
        timezone: string;
        publish_at_iso: string;
    };
}

export interface PostNormalized {
    publish_payload: {
        workspace_id: string;
        platform: string;
        content_type: string;
        caption_final: string;
        hashtags_final: string[];
        media_urls: string[];
        audio_url: string | null;
        alt_text: string;
        publish_at_iso: string | null;
        timezone: string;
    };
    warnings: string[];
}

export function normalizePostPayload(input: PostInput): PostNormalized {
    const warnings: string[] = [];
    const { post, schedule, platform } = input;

    // 1. Hashtag Cleaning
    // Remove duplicates, trim, ensure # prefix, remove spaces
    const uniqueHashtags = Array.from(new Set(
        (post.hashtags || []).map(tag => {
            let t = tag.trim().replace(/\s+/g, '');
            if (!t.startsWith('#')) t = '#' + t;
            return t;
        }).filter(t => t.length > 1) // Remove empty '#'
    ));

    // 2. Caption Construction
    // caption + 2 newlines + hashtags (if platform requires it contextually, implied yes for logic)
    // CTA is usually part of caption in social media, we append it if present
    let finalCaption = (post.caption || "").trim();

    if (post.cta) {
        finalCaption += `\n\n${post.cta.trim()}`;
    }

    if (uniqueHashtags.length > 0) {
        finalCaption += `\n\n${uniqueHashtags.join(' ')}`;
    }

    // 3. Date Validation
    let publishAt = null;
    if (schedule?.publish_at_iso) {
        const date = parseISO(schedule.publish_at_iso);
        if (isValid(date)) {
            publishAt = schedule.publish_at_iso;
        } else {
            warnings.push("Invalid 'publish_at_iso'. Date set to null.");
        }
    }

    // 4. Platform Constraints (Simplified)
    // Instagram Max Chars: 2200
    if (platform === 'instagram' && finalCaption.length > 2200) {
        warnings.push("Caption exceeds Instagram limit (2200 chars).");
    }
    // TikTok Max Chars: 2200 (recently increased, staying safe)

    // 5. Alt Text
    let altText = (post.alt_text || "").trim();
    if (altText.length > 220) {
        altText = altText.substring(0, 217) + "...";
        warnings.push("Alt text truncated to 220 chars.");
    }

    return {
        publish_payload: {
            workspace_id: input.workspace_id,
            platform: input.platform,
            content_type: post.content_type,
            caption_final: finalCaption,
            hashtags_final: uniqueHashtags,
            media_urls: post.media_urls || [],
            audio_url: post.audio_url || null,
            alt_text: altText,
            publish_at_iso: publishAt,
            timezone: schedule?.timezone || "Europe/Rome"
        },
        warnings
    };
}
