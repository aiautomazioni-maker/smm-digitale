
export interface SignupInput {
    account_type: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    email: string;
    password: string;
    password_confirm: string;
    industry: string;
    description: string;
    city?: string;
    accept_terms: boolean;
}

export interface SignupOutput {
    is_valid: boolean;
    normalized: {
        account_type: "personal" | "business";
        workspace_name: string;
        full_name: string | null;
        email: string;
        industry: string;
        description: string;
        city: string | null;
        store_hashed: boolean;
    };
    errors: { field: string; message: string }[];
}

export function validateSignup(input: SignupInput): SignupOutput {
    const errors: { field: string; message: string }[] = [];
    const normalized: any = { store_hashed: true };

    // 1. Account Type
    if (input.account_type === 'personal' || input.account_type === 'business') {
        normalized.account_type = input.account_type;
    } else {
        errors.push({ field: 'account_type', message: 'Tipo account non valido.' });
    }

    // 2. Name / Company Logic
    if (input.account_type === 'personal') {
        if (!input.first_name || input.first_name.trim().length < 2) {
            errors.push({ field: 'first_name', message: 'Nome obbligatorio (min 2 caratteri).' });
        }
        if (!input.last_name || input.last_name.trim().length < 2) {
            errors.push({ field: 'last_name', message: 'Cognome obbligatorio (min 2 caratteri).' });
        }
        if (input.first_name && input.last_name) {
            normalized.full_name = `${input.first_name.trim()} ${input.last_name.trim()}`;
            normalized.workspace_name = normalized.full_name;
        }
    } else if (input.account_type === 'business') {
        if (!input.company_name || input.company_name.trim().length < 2) {
            errors.push({ field: 'company_name', message: 'Nome azienda obbligatorio (min 2 caratteri).' });
        } else {
            normalized.workspace_name = input.company_name.trim();
            normalized.full_name = null; // Or contact person if we had that field
        }
    }

    // 3. Email
    if (!input.email || !input.email.includes('@') || !input.email.includes('.')) {
        errors.push({ field: 'email', message: 'Email non valida.' });
    } else {
        normalized.email = input.email.trim().toLowerCase();
    }

    // 4. Password
    if (!input.password || input.password.length < 8 || !/\d/.test(input.password)) {
        errors.push({ field: 'password', message: 'Password deve essere di almeno 8 caratteri e contenere un numero.' });
    }
    if (input.password !== input.password_confirm) {
        errors.push({ field: 'password_confirm', message: 'Le password non coincidono.' });
    }

    // 5. Industry
    if (!input.industry || input.industry.trim().length < 2) {
        errors.push({ field: 'industry', message: 'Settore obbligatorio.' });
    } else {
        normalized.industry = input.industry.trim();
    }

    // 6. Description
    const desc = (input.description || "").trim();
    if (desc.length < 30 || desc.length > 600) {
        errors.push({ field: 'description', message: 'Descrizione obbligatoria (30-600 caratteri).' });
    } else {
        normalized.description = desc;
    }

    // 7. City
    if (input.city && input.city.trim().length > 0) {
        if (input.city.trim().length < 2) {
            errors.push({ field: 'city', message: 'Città troppo corta.' });
        } else {
            normalized.city = input.city.trim();
        }
    } else {
        normalized.city = null;
    }

    // 8. Terms
    if (input.accept_terms !== true) {
        errors.push({ field: 'accept_terms', message: 'Devi accettare i termini.' });
    }

    return {
        is_valid: errors.length === 0,
        normalized: errors.length === 0 ? normalized : {},
        errors
    };
}
