import { generateSupportEmail } from "./src/lib/support-email-generator";

const testInput = {
    "lang": "it",
    "ticket": {
        "id": "tkt_000123",
        "workspace_name": "Pizzeria Roma",
        "category": "publishing",
        "summary": "Publish Instagram fallito"
    },
    "customer": {
        "email": "mario@pizzeria.it",
        "name": "Mario Rossi"
    },
    "agent_input": {
        "goal": "Risolvere il problema di pubblicazione",
        "message_points": [
            "Controlla la connessione dell'account Instagram",
            "Assicurati che l'immagine sia nel formato corretto",
            "Riprova la pubblicazione tra 5 minuti"
        ],
        "asks": [
            "Puoi inviarci uno screenshot dell'errore esatto?",
            "Quale versione dell'app stai usando?"
        ]
    }
};

const result = generateSupportEmail(testInput);
console.log(JSON.stringify(result, null, 2));
