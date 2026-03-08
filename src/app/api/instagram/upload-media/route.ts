import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const bucketName = 'instagram-attachments';

        if (!file) {
            return NextResponse.json({ error: "Nessun file fornito" }, { status: 400 });
        }

        // Ensure bucket exists (or at least try to upload)
        // We'll trust our ensure-buckets logic or create it on the fly if needed
        // but for performance we just upload.
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
        const filePath = `chat/${fileName}`;

        const { data, error } = await supabaseAdmin.storage
            .from(bucketName)
            .upload(filePath, file, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error("Supabase Upload Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return NextResponse.json({ 
            success: true, 
            url: publicUrl,
            fileName: fileName,
            fileType: file.type 
        });

    } catch (error: any) {
        console.error("Upload Media Internal Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
