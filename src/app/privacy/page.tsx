"use client";

import { Button } from "@/components/ui/button";
import { MoveLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto py-20 px-6 space-y-8">
            <Link href="/">
                <Button variant="ghost" size="sm" className="mb-8">
                    <MoveLeft className="w-4 h-4 mr-2" /> Torna alla Home
                </Button>
            </Link>

            <h1 className="text-4xl font-bold tracking-tight">Informativa sulla Privacy</h1>
            <p className="text-muted-foreground italic">Ultimo aggiornamento: 22 Febbraio 2026</p>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary">1. Informazioni Generali</h2>
                <p>
                    Benvenuti su SMM Digitale. La protezione dei vostri dati personali è una nostra priorità. Questa informativa descrive come raccogliamo, utilizziamo e proteggiamo le informazioni fornite attraverso l'uso della nostra piattaforma e delle integrazioni API (incluso TikTok).
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary">2. Dati che Raccogliamo via API</h2>
                <p>
                    Quando colleghi i tuoi account social (Facebook, Instagram, TikTok), raccogliamo esclusivamente i dati necessari per la gestione dei contenuti:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Informazioni sul profilo base (Nome utente, ID account).</li>
                    <li>Token di accesso per la pubblicazione di contenuti multimediali.</li>
                    <li>Statistiche di performance dei post (Reach, Engagement).</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary">3. Utilizzo dei Dati</h2>
                <p>
                    I dati raccolti vengono utilizzati esclusivamente per:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Consentire la pubblicazione programmata di post e video.</li>
                    <li>Fornire analisi predittive tramite la nostra intelligenza artificiale.</li>
                    <li>Migliorare l'esperienza dell'utente all'interno della dashboard.</li>
                </ul>
                <p className="font-semibold">Non vendiamo né condividiamo i tuoi dati social con terze parti a scopo pubblicitario.</p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary">4. Sicurezza</h2>
                <p>
                    Utilizziamo protocolli di crittografia avanzati per proteggere i tuoi token di accesso e le tue credenziali. Puoi revocare l'accesso alla nostra app in qualsiasi momento tramite le impostazioni del tuo account social.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary">5. Contatti</h2>
                <p>
                    Per qualsiasi domanda riguardante questa informativa, puoi contattarci all'indirizzo email di supporto indicato nel tuo pannello di controllo.
                </p>
            </section>
        </div>
    );
}
