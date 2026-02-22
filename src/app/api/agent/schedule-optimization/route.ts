import { NextResponse } from 'next/server';
import { suggestSchedule, ScheduleInput } from '@/lib/scheduler-optimizer';

export async function POST(req: Request) {
    try {
        const body: ScheduleInput = await req.json();

        if (!body.industry || !body.city || !body.timezone) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await suggestSchedule(body);

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error in schedule optimization:', error);
        return NextResponse.json({ error: 'Failed to optimize schedule' }, { status: 500 });
    }
}
