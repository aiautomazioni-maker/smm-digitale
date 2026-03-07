import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category') || 'general';
        const type = searchParams.get('type'); // optional: 'visual_style', 'topic', 'format', 'hashtag'

        let query = supabaseAdmin
            .from('trends')
            .select('id, type, label, score, is_breakout')
            .eq('region', 'IT') // Hardcoded to IT for now as per n8n workflow
            .eq('category', category)
            .order('score', { ascending: false })
            .limit(20);

        if (type) {
            query = query.eq('type', type);
        }

        const { data: trends, error } = await query;

        if (error) {
            console.error('Supabase error fetching trends:', error);
            return NextResponse.json({ trends: [] });
        }

        return NextResponse.json({ trends: trends || [] });

    } catch (error) {
        console.error('Error getting trends:', error);
        return NextResponse.json({ error: 'Failed to get trends' }, { status: 500 });
    }
}

