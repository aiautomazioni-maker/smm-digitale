export interface ValidationResult {
    isValid: boolean;
    hasWarnings: boolean;
    errors: string[];
    warnings: string[];
}

const FORBIDDEN_WORDS = [
    "truffa", "inganno", "falso", "rubare", "illegal", "droga", "armi", "violenza",
    "odio", "razzismo", "sessista", "discriminazione"
];

const AGGRESSIVE_CLAIMS = [
    /guadagn.*facil/i,
    /soldi.*subito/i,
    /100%.*garantit/i,
    /risultat.*immediate/i,
    /perdere.*peso.*veloc/i,
    /miracol/i,
    /segret.*svelat/i
];

const SECTOR_RULES: Record<string, string[]> = {
    medical: ["guarigione", "cura definitiva", "addio dolore", "medico", "dottore"],
    financial: ["investimento sicuro", "no rischi", "rendita passiva", "diventa ricco"],
    crypto: ["to the moon", "pump", "garantito", "x100"],
};

export function validateContent(text: string, sector: string = "general"): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        hasWarnings: false,
        errors: [],
        warnings: []
    };

    const lowerText = text.toLowerCase();

    // 1. Check Forbidden Words (Errors)
    FORBIDDEN_WORDS.forEach(word => {
        if (lowerText.includes(word)) {
            result.isValid = false;
            result.errors.push(`Parola vietata rilevata: "${word}"`);
        }
    });

    // 2. Check Aggressive Claims (Warnings)
    AGGRESSIVE_CLAIMS.forEach(regex => {
        if (regex.test(lowerText)) {
            result.hasWarnings = true;
            result.warnings.push("Rilevato claim potenzialmente aggressivo o ingannevole.");
        }
    });

    // 3. Check Sector Rules (Warnings/Errors depending on severity, let's allow as warnings for now)
    if (SECTOR_RULES[sector]) {
        SECTOR_RULES[sector].forEach(term => {
            if (lowerText.includes(term)) {
                result.hasWarnings = true;
                result.warnings.push(`Attenzione: termine "${term}" sensibile per il settore ${sector}.`);
            }
        });
    }

    // Special rule for Medical: Strict compliance
    if (sector === "medical" && (lowerText.includes("garantis") || lowerText.includes("sicuro"))) {
        result.hasWarnings = true;
        result.warnings.push("Settore Medico: Evitare promesse di risultati garantiti.");
    }

    return result;
}
