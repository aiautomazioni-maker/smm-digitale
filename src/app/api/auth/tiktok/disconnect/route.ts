import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    const cookieStore = await cookies();
    cookieStore.delete('tiktok_access_token');
    return NextResponse.json({ success: true });
}
