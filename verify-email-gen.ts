import { generateVerificationEmail, VerificationEmailInput } from "./src/lib/auth-service";

const inputIT: VerificationEmailInput = {
    lang: "it",
    to_email: "mario@test.com",
    workspace_name: "Mario Workspace",
    verify_link: "https://app.smmdigitale.com/verify?token=123"
};

const inputEN: VerificationEmailInput = {
    lang: "en",
    to_email: "john@test.com",
    workspace_name: "John Workspace",
    verify_link: "https://app.smmdigitale.com/verify?token=456"
};

console.log("IT Email:", JSON.stringify(generateVerificationEmail(inputIT), null, 2));
console.log("EN Email:", JSON.stringify(generateVerificationEmail(inputEN), null, 2));
