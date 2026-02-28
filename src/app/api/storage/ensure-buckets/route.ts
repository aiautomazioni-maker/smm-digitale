import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

// POST /api/storage/ensure-buckets
// Creates the required Supabase Storage buckets if they don't exist
export async function GET() {
    try {
        const BUCKETS = [
            { name: 'video-uploads', public: true },
            { name: 'story-images', public: true },
        ];

        const results = [];
        for (const bucket of BUCKETS) {
            const { data: existing } = await supabaseAdmin.storage.getBucket(bucket.name);
            if (existing) {
                results.push({ bucket: bucket.name, status: 'already_exists' });
                continue;
            }
            const { error } = await supabaseAdmin.storage.createBucket(bucket.name, {
                public: bucket.public,
            });
            if (error) {
                results.push({ bucket: bucket.name, status: 'error', error: error.message });
            } else {
                results.push({ bucket: bucket.name, status: 'created' });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
