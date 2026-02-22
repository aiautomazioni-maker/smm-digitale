export interface Holiday {
    name: string;
    month: number; // 0-11
    day: number;   // 1-31
    type: "marketing" | "holiday";
    description: string;
    color?: string;
}

export const HOLIDAYS: Holiday[] = [
    { name: "Capodanno", month: 0, day: 1, type: "holiday", description: "Inizio dell'anno nuovo." },
    { name: "Epifania", month: 0, day: 6, type: "holiday", description: "Arriva la Befana." },
    { name: "Blue Monday", month: 0, day: 20, type: "marketing", description: "Il giorno più triste dell'anno, ottimo per messaggi motivazionali.", color: "bg-blue-500" },
    { name: "San Valentino", month: 1, day: 14, type: "marketing", description: "Festa degli innamorati. Focus su regali, coppie e amore.", color: "bg-red-500" },
    { name: "Festa della Donna", month: 2, day: 8, type: "marketing", description: "Giornata internazionale della donna.", color: "bg-yellow-500" },
    { name: "Festa del Papà", month: 2, day: 19, type: "marketing", description: "Idee regalo per i papà.", color: "bg-blue-600" },
    { name: "Pesce d'Aprile", month: 3, day: 1, type: "marketing", description: "Giorno degli scherzi. Ottimo per brand ironici.", color: "bg-orange-500" },
    { name: "Pasqua", month: 3, day: 20, type: "holiday", description: "Domenica di Pasqua (Variabile, mock 2025)." },
    { name: "Festa della Liberazione", month: 3, day: 25, type: "holiday", description: "Festa nazionale italiana." },
    { name: "Festa dei Lavoratori", month: 4, day: 1, type: "holiday", description: "1 Maggio." },
    { name: "Festa della Repubblica", month: 5, day: 2, type: "holiday", description: "2 Giugno." },
    { name: "Prime Day", month: 6, day: 15, type: "marketing", description: "Grandi sconti Amazon, trend e-commerce.", color: "bg-cyan-500" },
    { name: "Ferragosto", month: 7, day: 15, type: "holiday", description: "Assunzione di Maria, picco dell'estate." },
    { name: "Back to School", month: 8, day: 1, type: "marketing", description: "Rientro a scuola e ufficio.", color: "bg-green-500" },
    { name: "Halloween", month: 9, day: 31, type: "marketing", description: "Festa del terrore. Creatività spooky e dolcetti.", color: "bg-orange-600" },
    { name: "Ognissanti", month: 10, day: 1, type: "holiday", description: "1 Novembre." },
    { name: "Black Friday", month: 10, day: 28, type: "marketing", description: "Il giorno degli sconti più atteso dell'anno.", color: "bg-zinc-800" },
    { name: "Cyber Monday", month: 11, day: 1, type: "marketing", description: "Sconti tech e digitali.", color: "bg-indigo-500" },
    { name: "Immacolata", month: 11, day: 8, type: "holiday", description: "Inizio ufficiale del periodo natalizio." },
    { name: "Natale", month: 11, day: 25, type: "holiday", description: "Giorno di Natale.", color: "bg-red-600" },
    { name: "Santo Stefano", month: 11, day: 26, type: "holiday", description: "26 Dicembre." },
    { name: "San Silvestro", month: 11, day: 31, type: "holiday", description: "Vigilia di Capodanno." }
];
