import { createClient } from '@supabase/supabase-js';

// Use SERVICE_ROLE_KEY to bypass RLS for admin tasks (checking/deducting credits)
const getSupabaseAdmin = () => {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    }
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
};

export const COSTS = {
    IMAGE_GENERATION: 1,
    IMAGE_REMIX: 1,
    CAPTION_GENERATION: 0, // Free for now? Or 1? Let's keep it free or low cost if needed.
};

export async function checkCredits(userId: string, cost: number): Promise<boolean> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

    if (error || !profile) {
        console.error("Error checking credits:", error);
        return false;
    }

    return (profile.credits || 0) >= cost;
}

export async function deductCredits(userId: string, cost: number, action: string, metadata: Record<string, unknown> = {}) {
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Deduct credits
    // Try simple update first since we don't know if RPC creates successfully for user
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

    if (profile) {
        const newCredits = (profile.credits || 0) - cost;
        await supabaseAdmin
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', userId);
    }

    // 2. Log usage
    await supabaseAdmin
        .from('usage_logs')
        .insert({
            user_id: userId,
            action: action,
            cost: cost,
            metadata: metadata
        });
}

// Helper to get current credits
export async function getCredits(userId: string): Promise<number> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();
    return profile?.credits || 0;
}
