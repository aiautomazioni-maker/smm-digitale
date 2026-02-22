import { NextResponse } from 'next/server';
import { analyzePerformance, AnalyticsInput } from '@/lib/analytics-advisor';

export async function POST(req: Request) {
    try {
        const body: AnalyticsInput = await req.json();

        if (!body.brand_kit || !body.metrics) {
            return NextResponse.json({ error: 'Missing required fields: brand_kit or metrics' }, { status: 400 });
        }

        const result = await analyzePerformance(body);

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error analyzing performance:', error);
        return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
    }
}
