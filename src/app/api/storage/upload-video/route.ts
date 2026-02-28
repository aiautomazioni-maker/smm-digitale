import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate type
        if (!file.type.startsWith('video/')) {
            return NextResponse.json({ error: 'Solo file video sono permessi' }, { status: 400 });
        }

        // Validate size (50MB)
        const MAX_SIZE = 50 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'File troppo grande (max 50MB)' }, { status: 400 });
        }

        // Use service_role key to bypass RLS - this runs server-side only
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const fileExt = file.name.split('.').pop() || 'mp4';
        const fileName = `video_${Date.now()}.${fileExt}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabaseAdmin.storage
            .from('video-uploads')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) {
            console.error('[UPLOAD] Supabase error:', uploadError);
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('video-uploads')
            .getPublicUrl(fileName);

        return NextResponse.json({ success: true, url: publicUrl, fileName });

    } catch (err: any) {
        console.error('[UPLOAD] Exception:', err);
        return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
    }
}
