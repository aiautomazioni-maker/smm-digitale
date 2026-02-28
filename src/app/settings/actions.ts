"use server";

import { cookies } from 'next/headers';

export async function checkTikTokConnection() {
    const cookieStore = await cookies();
    const token = cookieStore.get('tiktok_access_token');
    return !!token;
}
