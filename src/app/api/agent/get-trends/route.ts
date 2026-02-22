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
            // Fallback to mock data if table doesn't exist yet or connection fails
            return NextResponse.json(getMockTrends(type));
        }

        return NextResponse.json({ trends });

    } catch (error) {
        console.error('Error getting trends:', error);
        return NextResponse.json({ error: 'Failed to get trends' }, { status: 500 });
    }
}

// Fallback Mock Data (in case DB is empty)
function getMockTrends(type: string | null) {
    const allTrends = [
        { id: '1', type: 'visual_style', label: 'Minimal Clean', score: 95, is_breakout: false },
        { id: '2', type: 'visual_style', label: 'Neon Cyberpunk', score: 88, is_breakout: true },
        { id: '3', type: 'topic', label: 'Sustainable Living', score: 92, is_breakout: false },
        { id: '4', type: 'topic', label: 'AI Revolution', score: 90, is_breakout: true },
        { id: '5', type: 'format', label: 'Carousel', score: 98, is_breakout: false },
        { id: '6', type: 'format', label: 'Reel (Short)', score: 96, is_breakout: false },
    ];

    if (type) {
        return { trends: allTrends.filter(t => t.type === type) };
    }
    return { trends: allTrends };
}
