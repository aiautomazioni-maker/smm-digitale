import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies();
    const tiktokToken = cookieStore.get('tiktok_access_token')?.value;

    return NextResponse.json({
        tiktok: !!tiktokToken,
    });
}
