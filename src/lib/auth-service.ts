
export interface NormalizedSignupData {
    account_type: "personal" | "business";
    workspace_name: string;
    full_name: string | null;
    email: string;
    industry: string;
    description: string;
    city: string | null;
}

export interface VerificationData {
    token_hash: string;
    expires_at_iso: string;
}

export interface PrepareUserCreationInput {
    normalized: NormalizedSignupData;
    password_hash: string;
    verification: VerificationData;
}

export interface UserCreationOutput {
    create: {
        user: {
            email: string;
            password_hash: string;
            full_name: string | null;
            role: "admin";
            email_verified: boolean;
            email_verification_token_hash: string;
            email_verification_expires_at: string;
        };
        workspace: {
            workspace_name: string;
            type: "personal" | "business";
            industry: string;
            description: string;
            city: string | null;
        };
    };
    next_step: string;
}

export function prepareUserCreation(input: PrepareUserCreationInput): UserCreationOutput {
    const { normalized, password_hash, verification } = input;

    // Construct the payload for DB creation
    return {
        create: {
            user: {
                email: normalized.email,
                password_hash: password_hash,
                full_name: normalized.full_name,
                role: "admin", // First user is always admin
                email_verified: false,
                email_verification_token_hash: verification.token_hash,
                email_verification_expires_at: verification.expires_at_iso
            },
            workspace: {
                workspace_name: normalized.workspace_name,
                type: normalized.account_type,
                industry: normalized.industry,
                description: normalized.description,
                city: normalized.city
            }
        },
        next_step: "create_social_placeholders_and_send_verification_email"
    };
}

export interface SocialInputs {
    instagram_handle?: string;
    facebook_page?: string;
    tiktok_handle?: string;
}

export interface CreateSocialAccountsInput {
    workspace_id: string;
    social_inputs: SocialInputs;
}

export interface SocialAccountCreationOutput {
    social_accounts_to_create: {
        workspace_id: string;
        platform: "instagram" | "facebook" | "tiktok";
        handle: string | null;
        status: "connected" | "disconnected" | "needs_reauth";
    }[];
    requires_oauth: {
        instagram: boolean;
        facebook: boolean;
        tiktok: boolean;
    };
}

export function prepareSocialAccountsCreation(input: CreateSocialAccountsInput): SocialAccountCreationOutput {
    const { workspace_id, social_inputs } = input;
    const platforms: ("instagram" | "facebook" | "tiktok")[] = ["instagram", "facebook", "tiktok"];

    const accounts = platforms.map(platform => {
        let handle: string | null = null;

        switch (platform) {
            case "instagram":
                handle = social_inputs.instagram_handle || null;
                break;
            case "facebook":
                handle = social_inputs.facebook_page || null;
                break;
            case "tiktok":
                handle = social_inputs.tiktok_handle || null;
                break;
        }

        return {
            workspace_id,
            platform,
            handle: handle && handle.trim() !== "" ? handle.trim() : null,
            status: "disconnected" as const
        };
    });

    return {
        social_accounts_to_create: accounts,
        requires_oauth: {
            instagram: true,
            facebook: true,
            tiktok: true
        }
    };
}

export interface VerificationEmailInput {
    lang: string;
    to_email: string;
    workspace_name: string;
    verify_link: string;
}

export interface VerificationEmailOutput {
    email: {
        to: string;
        subject: string;
        body_text: string;
    };
}

export function generateVerificationEmail(input: VerificationEmailInput): VerificationEmailOutput {
    const { lang, to_email, workspace_name, verify_link } = input;
    const isItalian = lang.startsWith("it");

    const subject = isItalian
        ? `Benvenuto in ${workspace_name} - Verifica la tua Email`
        : `Welcome to ${workspace_name} - Verify your Email`;

    const body_text = isItalian
        ? `Ciao! Grazie per esserti registrato.\n\nPer iniziare a usare ${workspace_name}, verifica il tuo indirizzo email cliccando qui:\n${verify_link}\n\nSe non hai richiesto questa email, ignorala.`
        : `Hi! Thanks for signing up.\n\nTo start using ${workspace_name}, please verify your email address by clicking here:\n${verify_link}\n\nIf you didn't request this email, please ignore it.`;

    return {
        email: {
            to: to_email,
            subject,
            body_text
        }
    };
}

export interface LoginValidationInput {
    email: string;
    password_ok: boolean;
    user_record: {
        exists: boolean;
        email_verified: boolean;
    };
}

export interface LoginValidationOutput {
    login: {
        allowed: boolean;
        reason: "ok" | "invalid_credentials" | "email_not_verified";
    };
    ui: {
        message: string;
        show_resend_verification: boolean;
    };
}

export function validateLogin(input: LoginValidationInput): LoginValidationOutput {
    const { email, password_ok, user_record } = input;

    // 1. Invalid Credentials (User not found or wrong password)
    if (!user_record.exists || !password_ok) {
        return {
            login: {
                allowed: false,
                reason: "invalid_credentials"
            },
            ui: {
                message: "Email o password non corretti.",
                show_resend_verification: false
            }
        };
    }

    // 2. Email Not Verified
    if (!user_record.email_verified) {
        return {
            login: {
                allowed: false,
                reason: "email_not_verified"
            },
            ui: {
                message: "Devi verificare la tua email prima di accedere.",
                show_resend_verification: true
            }
        };
    }

    // 3. OK
    return {
        login: {
            allowed: true,
            reason: "ok"
        },
        ui: {
            message: "Accesso consentito.",
            show_resend_verification: false
        }
    };
}

export interface VerifyTokenInput {
    provided_token_hash: string;
    user_record: {
        email_verified: boolean;
        email_verification_token_hash: string | null;
        email_verification_expires_at: string | null;
    };
    now_iso: string;
}

export interface VerifyTokenOutput {
    result: {
        status: "verified" | "already_verified" | "invalid" | "expired";
        update_user: {
            email_verified: boolean;
            email_verification_token_hash: null;
            email_verification_expires_at: null;
        } | null;
        ui_message: string;
        allow_login: boolean;
    };
}

export function verifyEmailToken(input: VerifyTokenInput): VerifyTokenOutput {
    const { provided_token_hash, user_record, now_iso } = input;

    // 1. Already Verified
    if (user_record.email_verified) {
        return {
            result: {
                status: "already_verified",
                update_user: null,
                ui_message: "Email già verificata. Puoi accedere.",
                allow_login: true
            }
        };
    }

    // 2. Invalid Token (Hash mismatch or missing)
    if (!user_record.email_verification_token_hash || user_record.email_verification_token_hash !== provided_token_hash) {
        return {
            result: {
                status: "invalid",
                update_user: null,
                ui_message: "Token di verifica non valido.",
                allow_login: false
            }
        };
    }

    // 3. Expired Token
    if (user_record.email_verification_expires_at && now_iso > user_record.email_verification_expires_at) {
        return {
            result: {
                status: "expired",
                update_user: null,
                ui_message: "Il link di verifica è scaduto.",
                allow_login: false
            }
        };
    }

    // 4. Valid
    return {
        result: {
            status: "verified",
            update_user: {
                email_verified: true,
                email_verification_token_hash: null,
                email_verification_expires_at: null
            },
            ui_message: "Email verificata con successo!",
            allow_login: true
        }
    };
}

export interface RefreshTokenInput {
    now_iso: string;
}

export interface RefreshTokenOutput {
    verification: {
        token_hash: string;
        expires_at_iso: string;
    };
    ui_message: string;
}

export function refreshVerificationToken(input: RefreshTokenInput): RefreshTokenOutput {
    // Generate new token (mock hash)
    const newToken = "new_token_" + Date.now();

    // Set expiration to 24h from now
    const now = new Date(input.now_iso);
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return {
        verification: {
            token_hash: newToken,
            expires_at_iso: expiresAt.toISOString()
        },
        ui_message: "Un nuovo link di verifica è stato inviato alla tua email."
    };
}
