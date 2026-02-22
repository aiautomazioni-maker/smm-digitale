export interface SupportMacro {
    id: string;
    category: string;
    title: string;
    message_points: string[];
    asks: string[];
}

export const SUPPORT_MACROS: SupportMacro[] = [
    {
        "id": "macro_001",
        "category": "social",
        "title": "Ricollega Instagram (OAuth)",
        "message_points": [
            "Vai su Impostazioni > Social",
            "Clicca su 'Ricollega Instagram'",
            "Accetta i permessi richiesti",
            "Riprova a pubblicare dopo il collegamento"
        ],
        "asks": ["Se possibile, inviaci uno screenshot della schermata di errore."]
    },
    {
        "id": "macro_002",
        "category": "publishing",
        "title": "Controllo formato media",
        "message_points": [
            "Assicurati che l'immagine sia JPG o PNG",
            "Prova a usare formato 4:5 per i post e 9:16 per story/reel",
            "Riprova caricando un file con dimensioni inferiori"
        ],
        "asks": ["Che formato e dimensione ha il file che stai caricando?"]
    },
    {
        "id": "macro_003",
        "category": "account",
        "title": "Email non verificata",
        "message_points": [
            "Controlla la cartella Spam/Indesiderata",
            "Clicca su 'Reinvia email di verifica' nella schermata di accesso"
        ],
        "asks": ["Confermi l'indirizzo email usato in registrazione?"]
    }
];
