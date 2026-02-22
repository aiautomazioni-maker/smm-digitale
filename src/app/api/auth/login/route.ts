import { NextResponse } from 'next/server';
import { validateLogin } from '@/lib/auth-service';
import crypto from 'crypto';
import { findUserByEmail } from '@/lib/mock-db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = body;

        // 1. Find User
        const user = findUserByEmail(email);

        // 2. Hash Password and Check
        let passwordOk = false;
        if (user) {
            const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
            if (hashedPassword === user.password_hash) {
                passwordOk = true;
            }
        }

        // 3. Validate Logic (Service)
        const validationOutput = validateLogin({
            email,
            password_ok: passwordOk,
            user_record: {
                exists: !!user,
                email_verified: user ? user.email_verified : false
            }
        });

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return NextResponse.json(validationOutput);

    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({
            login: { allowed: false, reason: "server_error" },
            ui: { message: "Errore del server.", show_resend_verification: false }
        }, { status: 500 });
    }
}
