import { NextResponse } from 'next/server';
import { refreshVerificationToken, generateVerificationEmail } from '@/lib/auth-service';
import crypto from 'crypto';
import { findUserByEmail, updateUser } from '@/lib/mock-db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email } = body;

        const user = findUserByEmail(email);

        if (user) {
            // 1. Refresh Token logic
            const refreshResult = refreshVerificationToken({
                now_iso: new Date().toISOString()
            });

            // 2. Update DB
            updateUser(email, {
                email_verification_token_hash: crypto.createHash('sha256').update(refreshResult.verification.token_hash).digest('hex'),
                email_verification_expires_at: refreshResult.verification.expires_at_iso
            });

            // 3. Generate Email
            // Note: In refreshVerificationToken we generate a "token_hash" as the new token logic, 
            // but for the email link we need the raw token.
            // Wait, refreshVerificationToken in auth-service.ts generates a "newToken" which IS the raw token in the mock implementation,
            // and returns { token_hash: newToken ... }.
            // In a real crypto implementation we should return { raw_token, token_hash }.
            // For this mock, let's assume the returned hash IS the raw token we can use in the link, 
            // BUT we should hash it before saving to DB if we want to be consistent with signup.
            // The signup route does: token (raw) -> sha256 -> db.
            // My refreshVerificationToken implementation in auth-service.ts currently just returns a string "new_token_..." as the hash.
            // Let's use it as the raw token for the link, and hash it for the DB.

            const rawToken = refreshResult.verification.token_hash;
            const dbHash = crypto.createHash('sha256').update(rawToken).digest('hex');

            updateUser(email, {
                email_verification_token_hash: dbHash,
                email_verification_expires_at: refreshResult.verification.expires_at_iso
            });

            const verifyLink = `http://localhost:3000/verify?token=${rawToken}&email=${encodeURIComponent(email)}`;

            const emailContent = generateVerificationEmail({
                lang: "it",
                to_email: email,
                workspace_name: user.workspace_name,
                verify_link: verifyLink
            });

            // 4. Send Email (Log)
            console.log("----------------------------------------------------------------");
            console.log("📧 MOCK RESEND EMAIL SENT 📧");
            console.log(`To: ${emailContent.email.to}`);
            console.log(`Subject: ${emailContent.email.subject}`);
            console.log("Body:");
            console.log(emailContent.email.body_text);
            console.log("----------------------------------------------------------------");

            return NextResponse.json({ ui_message: refreshResult.ui_message });
        }

        // Security: Don't reveal user doesn't exist, just say sent.
        return NextResponse.json({ ui_message: "Se l'email esiste, riceverai un link." });

    } catch (error) {
        console.error("Resend Error:", error);
        return NextResponse.json({ ui_message: "Errore del server." }, { status: 500 });
    }
}
