import { verifyEmailToken, VerifyTokenInput } from "./src/lib/auth-service";

const now = "2024-01-01T12:00:00Z";
const future = "2024-01-01T13:00:00Z";
const past = "2024-01-01T11:00:00Z";

const scenarios = {
    valid: {
        provided_token_hash: "hash123",
        user_record: {
            email_verified: false,
            email_verification_token_hash: "hash123",
            email_verification_expires_at: future
        },
        now_iso: now
    },
    expired: {
        provided_token_hash: "hash123",
        user_record: {
            email_verified: false,
            email_verification_token_hash: "hash123",
            email_verification_expires_at: past
        },
        now_iso: now
    },
    invalid_hash: {
        provided_token_hash: "wrong_hash",
        user_record: {
            email_verified: false,
            email_verification_token_hash: "hash123",
            email_verification_expires_at: future
        },
        now_iso: now
    },
    already_verified: {
        provided_token_hash: "hash123",
        user_record: {
            email_verified: true,
            email_verification_token_hash: null,
            email_verification_expires_at: null
        },
        now_iso: now
    }
} as Record<string, VerifyTokenInput>;

console.log("--- TEST RESULTS ---");
for (const [name, input] of Object.entries(scenarios)) {
    const output = verifyEmailToken(input);
    console.log(`Scenario: ${name.toUpperCase()}`);
    console.log(`Status: ${output.result.status}`);
    console.log(`Allow Login: ${output.result.allow_login}`);
    if (output.result.update_user) {
        console.log("Update:", JSON.stringify(output.result.update_user));
    }
    console.log("-------------------");
}
