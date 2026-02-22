import { NextResponse } from 'next/server';
import { getAllUsers, updateUser } from '@/lib/mock-db';
import fs from 'fs';
import path from 'path';

// Mock invoice generator
function generateInvoice(planName: string, amount: string, user: any) {
    const invoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const date = new Date().toLocaleDateString('it-IT');

    return `
    FATTURA N. ${invoiceId}
    Data: ${date}
    --------------------------------------------------
    Cliente: ${user.name || user.email} (${user.email})
    Metodo: Carta di Credito (Stripe Secure)
    --------------------------------------------------
    Descrizione                 | Importo
    --------------------------------------------------
    SMM Digitale - Piano ${planName} | ${amount}
    --------------------------------------------------
    TOTALE                      | ${amount}
    --------------------------------------------------
    Stato: PAGATO
    Grazie per il tuo acquisto!
    `;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { planName, totalPrice, billingCycle, mockPaymentToken } = body;

        // Simulate Stripe processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // In a real app, verify session/user securelly. 
        // Here we mock getting the logged in user (e.g., the first verified one or hardcoded test user)
        // For demo, let's assume "testuser@example.com" is the active one if verified.
        const users = getAllUsers();
        const user = users.find(u => u.email === "testuser@example.com");

        if (!user) {
            return NextResponse.json({ success: false, error: "Utente non trovato" }, { status: 404 });
        }

        // Determine credits to add
        let creditsToAdd = 0;
        switch (planName) {
            case "Micro": creditsToAdd = 80; break;
            case "Starter": creditsToAdd = 250; break;
            case "Pro": creditsToAdd = 600; break;
            case "Business": creditsToAdd = 1800; break;
            case "Empire": creditsToAdd = 4500; break;
        }

        // Update User Credits
        const newCredits = (user.credits || 0) + creditsToAdd;
        updateUser(user.email, { credits: newCredits, plan: planName });

        // Generate Invoice
        const invoiceText = generateInvoice(planName, totalPrice, user);

        // "Send" Email (Log to file)
        const logPath = path.join(process.cwd(), 'email_debug.log');
        const logEntry = `
[${new Date().toISOString()}] 📧 INVOICE EMAIL SENT 📧
To: ${user.email}
Subject: Fattura ${planName} - Pagamento Confermato
Body:
${invoiceText}
----------------------------------------------------------------
\n`;
        fs.appendFileSync(logPath, logEntry);

        console.log("Payment Processed:", { user: user.email, plan: planName, creditsAdded: creditsToAdd });

        return NextResponse.json({ success: true, invoiceId: "INV-MOCK" });

    } catch (error) {
        console.error("Payment Error:", error);
        return NextResponse.json({ success: false, error: "Errore interno del server" }, { status: 500 });
    }
}
