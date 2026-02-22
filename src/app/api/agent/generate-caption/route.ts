import { NextResponse } from 'next/server';
import { optimizeCaption } from '@/lib/caption-optimizer';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { brandKit, contentBrief, imageAnalysis, platform, length, lang } = body;

        if (!brandKit || !contentBrief) {
            return NextResponse.json({ error: 'Missing required fields: brandKit or contentBrief' }, { status: 400 });
        }

        const result = await optimizeCaption(
            brandKit,
            contentBrief,
            imageAnalysis || null,
            platform,
            length,
            lang
        );

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error serving caption request:', error);
        return NextResponse.json({ error: 'Failed to generate caption' }, { status: 500 });
    }
}
