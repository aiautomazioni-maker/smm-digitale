import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .not('tiktok_access_token', 'is', null)
            .order('tiktok_token_expires_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            count: profiles?.length || 0,
            profiles: profiles?.map(p => ({
                user_id: p.user_id,
                tiktok_open_id: p.tiktok_open_id,
                tiktok_token_expires_at: p.tiktok_token_expires_at,
                // Do not expose full tokens for security, just prefixes
                access_token_prefix: p.tiktok_access_token ? p.tiktok_access_token.substring(0, 10) + '...' : null
            }))
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
