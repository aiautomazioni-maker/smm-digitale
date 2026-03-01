import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const { fileName, contentType } = await req.json();

        if (!fileName) {
            return NextResponse.json({ error: 'No fileName provided' }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Sanitize logic
        const fileExt = fileName.split('.').pop() || 'mp4';
        const safeName = `video_${Date.now()}.${fileExt}`;

        // Create a signed upload URL valid for 10 minutes, bypassing RLS using the admin key
        const { data, error: signError } = await supabaseAdmin.storage
            .from('video-uploads')
            .createSignedUploadUrl(safeName);

        if (signError || !data) {
            console.error('[UPLOAD_URL] Supabase sign error:', signError);
            return NextResponse.json({ error: signError?.message || 'Failed to generate upload URL' }, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('video-uploads')
            .getPublicUrl(safeName);

        return NextResponse.json({
            success: true,
            signedUrl: data.signedUrl,
            token: data.token,
            path: data.path,
            publicUrl: publicUrl
        });

    } catch (err: any) {
        console.error('[UPLOAD_URL] Exception full:', err);
        console.error('[UPLOAD_URL] Stack:', err.stack);
        console.error('[UPLOAD_URL] Cause:', err.cause);
        return NextResponse.json({
            error: err.message || 'Signature failed',
            cause: err.cause?.message || String(err.cause)
        }, { status: 500 });
    }
}
