"use client";

import { Button } from "@/components/ui/button";
import { MoveLeft } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto py-20 px-6 space-y-8">
            <Link href="/">
                <Button variant="ghost" size="sm" className="mb-8">
                    <MoveLeft className="w-4 h-4 mr-2" /> Torna alla Home
                </Button>
            </Link>

            <h1 className="text-4xl font-bold tracking-tight">Termini di Servizio</h1>
            <p className="text-muted-foreground italic">Ultimo aggiornamento: 22 Febbraio 2026</p>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary">1. Accettazione dei Termini</h2>
                <p>
                    Accedendo o utilizzando SMM Digitale, l'utente accetta di essere vincolato dai presenti Termini di Servizio e da tutte le leggi e i regolamenti applicabili.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary">2. Descrizione del Servizio</h2>
                <p>
                    SMM Digitale è una piattaforma SaaS che utilizza l'intelligenza artificiale per aiutare gli utenti a creare, ottimizzare e programmare contenuti per le piattaforme social (Facebook, Instagram, TikTok).
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary">3. Integrazioni con Terze Parti</h2>
                <p>
                    Il nostro servizio si integra con le API di TikTok e Meta. L'utente riconosce che l'uso di tali integrazioni è soggetto anche ai termini di servizio di tali piattaforme. SMM Digitale non è responsabile per eventuali limitazioni o modifiche apportate dalle API di terze parti.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary">4. Utilizzo Corretto</h2>
                <p>
                    L'utente si impegna a non utilizzare la piattaforma per la pubblicazione di contenuti illegali, offensivi o che violino i diritti di proprietà intellettuale di terzi. L'uso di bot o sistemi automatizzati per forzare l'uso della piattaforma è severamente vietato.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary">5. Limitazione di Responsabilità</h2>
                <p>
                    SMM Digitale non garantisce incrementi specifici di follower o engagement, in quanto tali risultati dipendono dalla qualità del contenuto e dagli algoritmi esterni delle piattaforme social.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-primary">6. Modifiche ai Termini</h2>
                <p>
                    Ci riserviamo il diritto di modificare questi termini in qualsiasi momento. L'uso continuato del servizio dopo tali modifiche costituisce l'accettazione dei nuovi termini.
                </p>
            </section>
        </div>
    );
}
