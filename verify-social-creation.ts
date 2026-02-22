import { prepareSocialAccountsCreation, CreateSocialAccountsInput } from "./src/lib/auth-service";

const testInput: CreateSocialAccountsInput = {
    workspace_id: "ws_456",
    social_inputs: {
        instagram_handle: " @tech_solutions ",
        facebook_page: "",
        tiktok_handle: "tech_tok"
    }
};

const result = prepareSocialAccountsCreation(testInput);

console.log("Input:", JSON.stringify(testInput, null, 2));
console.log("Output:", JSON.stringify(result, null, 2));
