export const HELP_CONFIG = {
    enabled: true,
    position: "bottom-right",
    primary_color: "#111827",
    support_email: "support@smmdigitale.it",
    ai_mode: "free_chat",
    faq_categories: ["Account", "Social", "Pubblicazione", "AI Studio", "Pagamenti", "Altro"]
};

export const FAQS = [
    {
        "id": "faq_001",
        "category": "Account",
        "question": "Non mi arriva l’email di conferma, cosa devo fare?",
        "answer": "Controlla nella cartella Spam o Posta indesiderata. Se non la trovi, clicca su 'Reinvia email di verifica'. Assicurati che l’indirizzo inserito sia corretto."
    },
    {
        "id": "faq_002",
        "category": "Account",
        "question": "Ho dimenticato la password.",
        "answer": "Nella schermata di login clicca su 'Password dimenticata' e segui le istruzioni per reimpostarla tramite email."
    },
    {
        "id": "faq_003",
        "category": "Social",
        "question": "Non riesco a collegare Instagram.",
        "answer": "Verifica di avere un account Instagram Business o Creator collegato a una pagina Facebook. Poi vai su Impostazioni > Social e premi 'Ricollega Instagram'."
    },
    {
        "id": "faq_004",
        "category": "Social",
        "question": "Instagram risulta 'needs_reauth'.",
        "answer": "Significa che il token è scaduto. Vai in Impostazioni > Social e clicca su 'Ricollega' per autorizzare nuovamente l’account."
    },
    {
        "id": "faq_005",
        "category": "Pubblicazione",
        "question": "Il post non viene pubblicato all’orario previsto.",
        "answer": "Controlla il fuso orario impostato nel workspace. Verifica anche che l’account social sia ancora collegato e che non ci siano errori nel media."
    },
    {
        "id": "faq_006",
        "category": "Pubblicazione",
        "question": "Errore durante il caricamento dell’immagine.",
        "answer": "Verifica che il formato sia supportato (JPG, PNG) e che le dimensioni rispettino i limiti della piattaforma. Prova anche a ridimensionare l’immagine."
    },
    {
        "id": "faq_007",
        "category": "AI Studio",
        "question": "Le immagini generate non sono coerenti con il mio brand.",
        "answer": "Assicurati di aver completato il Brand Kit e di usare i campi 'must_include' e 'must_avoid' nella generazione. Puoi anche caricare un esempio di stile."
    },
    {
        "id": "faq_008",
        "category": "AI Studio",
        "question": "La qualità delle immagini è bassa.",
        "answer": "Usa la funzione di Upscale o prova a specificare nel prompt dettagli come illuminazione, stile fotografico e qualità professionale."
    },
    {
        "id": "faq_009",
        "category": "Pagamenti",
        "question": "Ho finito i crediti AI.",
        "answer": "Puoi verificare il piano attuale nella sezione Pagamenti. I crediti si rinnovano mensilmente oppure puoi effettuare un upgrade."
    },
    {
        "id": "faq_010",
        "category": "Pagamenti",
        "question": "Come posso ricevere la fattura?",
        "answer": "Vai nella sezione Pagamenti > Fatturazione e scarica la fattura disponibile. Se non la trovi, contatta il supporto."
    }
];
