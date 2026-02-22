import { prepareUserCreation, PrepareUserCreationInput } from "./src/lib/auth-service";

const testInput: PrepareUserCreationInput = {
    normalized: {
        account_type: "business",
        workspace_name: "Tech Solutions SRL",
        full_name: null,
        email: "admin@techsolutions.com",
        industry: "IT Services",
        description: "Innovative IT solutions for modern businesses.",
        city: "Milano"
    },
    password_hash: "hashed_password_123",
    verification: {
        token_hash: "verification_token_hash_456",
        expires_at_iso: "2024-12-31T23:59:59Z"
    }
};

const result = prepareUserCreation(testInput);

console.log("Input:", JSON.stringify(testInput, null, 2));
console.log("Output:", JSON.stringify(result, null, 2));
