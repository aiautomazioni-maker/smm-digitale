import { NextResponse } from 'next/server';
import { validateSignup, SignupInput } from '@/lib/auth-validator';
import { prepareUserCreation, generateVerificationEmail, prepareSocialAccountsCreation } from '@/lib/auth-service';
import crypto from 'crypto';
import { saveUser, findUserByEmail, MockUser } from '@/lib/mock-db';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const body: SignupInput = await req.json();

        // 1. Validate & Normalize
        const validationResult = validateSignup(body);

        if (!validationResult.is_valid) {
            return NextResponse.json(validationResult);
        }

        // Check if user already exists
        if (findUserByEmail(validationResult.normalized.email)) {
            return NextResponse.json({
                is_valid: false,
                errors: [{ field: "email", message: "Email già registrata." }]
            });
        }

        // 2. Generate Verification Data
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

        // 3. Prepare User Creation Payload
        const passwordHash = crypto.createHash('sha256').update(body.password).digest('hex');

        const userPayload = prepareUserCreation({
            normalized: validationResult.normalized,
            password_hash: passwordHash,
            verification: {
                token_hash: tokenHash,
                expires_at_iso: expiresAt
            }
        });

        // SAVE TO MOCK DB
        const newUser: MockUser = {
            id: crypto.randomUUID(),
            email: userPayload.create.user.email,
            password_hash: userPayload.create.user.password_hash,
            full_name: userPayload.create.user.full_name,
            workspace_name: userPayload.create.workspace.workspace_name,
            email_verified: userPayload.create.user.email_verified,
            email_verification_token_hash: userPayload.create.user.email_verification_token_hash,
            email_verification_expires_at: userPayload.create.user.email_verification_expires_at
        };
        saveUser(newUser);

        // 4. Prepare Social Accounts (if applicable)
        const socialPayload = prepareSocialAccountsCreation({
            workspace_id: "ws_" + crypto.randomBytes(8).toString('hex'), // Mock ID
            social_inputs: {
                // In a real app we'd extract these from body if present, but signup form currently doesn't ask for handles 
                // We can assume they are empty for now
            }
        });

        // 5. Generate Verification Link & Email
        // Localhost:
        const verifyLink = `http://localhost:3000/verify?token=${token}&email=${encodeURIComponent(validationResult.normalized.email)}`;

        const emailContent = generateVerificationEmail({
            lang: "it", // Default to IT for now
            to_email: validationResult.normalized.email,
            workspace_name: validationResult.normalized.workspace_name,
            verify_link: verifyLink
        });




        // 6. "Send" Email (Log to Console & File)
        const logContent = `
----------------------------------------------------------------
DATE: ${new Date().toISOString()}
📧 MOCK EMAIL SENT 📧
To: ${emailContent.email.to}
Subject: ${emailContent.email.subject}
Link: ${verifyLink}
Body:
${emailContent.email.body_text}
----------------------------------------------------------------
`;
        console.log(logContent);

        // Append to email_debug.log
        try {
            fs.appendFileSync(path.join(process.cwd(), 'email_debug.log'), logContent);
        } catch (err) {
            console.error("Failed to write to email_debug.log", err);
        }

        // Simulate DB delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Return success response
        return NextResponse.json({
            is_valid: true,
            redirect: '/signup?success=true' // Frontend handles this state
        });

    } catch (error) {
        console.error("Signup Error:", error);
        return NextResponse.json({
            is_valid: false,
            errors: [{ field: "server", message: "Errore interno del server." }]
        }, { status: 500 });
    }
}
