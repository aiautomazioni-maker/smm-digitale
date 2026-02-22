import { NextResponse } from 'next/server';
import { verifyEmailToken } from '@/lib/auth-service';
import crypto from 'crypto';
import { findUserByEmail, updateUser } from '@/lib/mock-db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token, email } = body;

        const user = findUserByEmail(email);

        if (!user) {
            return NextResponse.json({
                result: { status: "invalid", ui_message: "Utente non trovato." }
            });
        }

        // 1. Verify Logic
        // We need to hash the provided token to compare with DB hash
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const verifyResult = verifyEmailToken({
            provided_token_hash: tokenHash,
            user_record: {
                email_verified: user.email_verified,
                email_verification_token_hash: user.email_verification_token_hash,
                email_verification_expires_at: user.email_verification_expires_at
            },
            now_iso: new Date().toISOString()
        });

        // 2. Update DB if verified
        if (verifyResult.result.update_user) {
            updateUser(email, verifyResult.result.update_user);
        }

        return NextResponse.json(verifyResult);

    } catch (error) {
        console.error("Verify Error:", error);
        return NextResponse.json({
            result: { status: "invalid", ui_message: "Errore del server." }
        }, { status: 500 });
    }
}
