import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Instead of raw SQL, we use an RPC if available, or just log the needed query
        // Since we can't easily alter tables from standard JS client without SQL access:
        
        // Let's first check what columns exist
        const { data: cols } = await supabase.from('profiles').select().limit(1);
        const existingCols = Object.keys(cols?.[0] || {});
        
        console.log("Existing columns:", existingCols);
        
        return NextResponse.json({ 
            message: "To fix the TikTok login, run this SQL in your Supabase Dashboard -> SQL Editor:",
            sql: `
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tiktok_access_token TEXT,
ADD COLUMN IF NOT EXISTS tiktok_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS tiktok_open_id TEXT,
ADD COLUMN IF NOT EXISTS tiktok_token_expires_at TIMESTAMPTZ;
            `,
            existing: existingCols
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
