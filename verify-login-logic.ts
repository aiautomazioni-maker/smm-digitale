import { validateLogin, LoginValidationInput } from "./src/lib/auth-service";

const scenarios = {
    valid: {
        email: "mario@test.com",
        password_ok: true,
        user_record: { exists: true, email_verified: true }
    },
    invalid_credentials_password: {
        email: "mario@test.com",
        password_ok: false,
        user_record: { exists: true, email_verified: true }
    },
    invalid_credentials_user: {
        email: "mario@test.com",
        password_ok: true,
        user_record: { exists: false, email_verified: true }
    },
    email_not_verified: {
        email: "mario@test.com",
        password_ok: true,
        user_record: { exists: true, email_verified: false }
    }
} as Record<string, LoginValidationInput>;

console.log("--- TEST RESULTS ---");
for (const [name, input] of Object.entries(scenarios)) {
    const output = validateLogin(input);
    console.log(`Scenario: ${name.toUpperCase()}`);
    console.log(`Allowed: ${output.login.allowed}`);
    console.log(`Reason: ${output.login.reason}`);
    console.log(`Message: ${output.ui.message}`);
    console.log(`Show Resend: ${output.ui.show_resend_verification}`);
    console.log("-------------------");
}
