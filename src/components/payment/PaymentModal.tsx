"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, ShieldCheck, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    planName: string;
    totalPrice: string; // e.g., "€49.00"
    billingCycle: string;
    onSuccess: () => void;
}

export function PaymentModal({ isOpen, onClose, planName, totalPrice, billingCycle, onSuccess }: PaymentModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        cardName: "",
        cardNumber: "",
        expiry: "",
        cvc: "",
        zip: ""
    });

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
        const parts = [];
        for (let i = 0; i < v.length; i += 4) {
            parts.push(v.substr(i, 4));
        }
        return parts.length > 1 ? parts.join(" ") : value;
    };

    const formatExpiry = (value: string) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
        if (v.length >= 2) {
            return `${v.substr(0, 2)}/${v.substr(2, 2)}`;
        }
        return v;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === "cardNumber") formattedValue = formatCardNumber(value);
        if (name === "expiry") formattedValue = formatExpiry(value);
        if (name === "cvc" && value.length > 4) return; // Limit CVC

        setFormData(prev => ({ ...prev, [name]: formattedValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Mock API call
            const response = await fetch('/api/billing/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planName,
                    totalPrice,
                    billingCycle,
                    // In a real app, send a token, not raw verification data
                    mockPaymentToken: "tok_visa_mock_" + Date.now()
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Pagamento confermato! 🎉");
                toast.info("La fattura è stata inviata alla tua email.");
                setLoading(false);
                onSuccess();
                onClose();
            } else {
                throw new Error(data.error || "Transazione fallita");
            }

        } catch (error) {
            toast.error("Errore nel pagamento. Verifica i dati e riprova.");
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-black border-white/10 text-white">
                <DialogHeader>
                    <div className="flex items-center space-x-2 mb-2 text-green-500">
                        <Lock className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Pagamento Sicuro SSL da 256-bit</span>
                    </div>
                    <DialogTitle className="text-2xl">Completa l'acquisto</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Stai acquistando il piano <span className="text-white font-bold">{planName}</span> ({billingCycle}).
                        <br />
                        Totale da addebitare: <span className="text-white font-bold">{totalPrice}</span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cardName">Intestatario Carta</Label>
                            <Input
                                id="cardName"
                                name="cardName"
                                placeholder="Mario Rossi"
                                required
                                value={formData.cardName}
                                onChange={handleChange}
                                className="bg-white/5 border-white/10 focus:border-pink-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cardNumber">Numero Carta</Label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="cardNumber"
                                    name="cardNumber"
                                    placeholder="0000 0000 0000 0000"
                                    required
                                    maxLength={19}
                                    value={formData.cardNumber}
                                    onChange={handleChange}
                                    className="pl-10 bg-white/5 border-white/10 focus:border-pink-500 font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="expiry">Scadenza (MM/YY)</Label>
                                <Input
                                    id="expiry"
                                    name="expiry"
                                    placeholder="MM/YY"
                                    required
                                    maxLength={5}
                                    value={formData.expiry}
                                    onChange={handleChange}
                                    className="bg-white/5 border-white/10 focus:border-pink-500 font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cvc">CVC</Label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="cvc"
                                        name="cvc"
                                        placeholder="123"
                                        required
                                        maxLength={4}
                                        value={formData.cvc}
                                        onChange={handleChange}
                                        className="pl-10 bg-white/5 border-white/10 focus:border-pink-500 font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-lg flex items-center justify-between text-xs text-muted-foreground border border-white/5">
                        <div className="flex items-center space-x-2">
                            <div className="bg-white/10 p-1 rounded">
                                <span className="font-bold text-white">VISA</span>
                            </div>
                            <div className="bg-white/10 p-1 rounded">
                                <span className="font-bold text-white">Mastercard</span>
                            </div>
                        </div>
                        <div className="flex items-center text-green-500">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Processato in sicurezza
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 bg-instagram-gradient hover:opacity-90 font-bold text-lg"
                        disabled={loading}
                    >
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Elaborazione...</> : `Paga ${totalPrice}`}
                    </Button>
                </form>

                <DialogFooter className="justify-center sm:justify-center">
                    <p className="text-[10px] text-muted-foreground text-center w-full">
                        Cliccando su "Paga" accetti i Termini di Servizio. L'abbonamento si rinnova automaticamente.
                        <br /> transazione crittografata end-to-end.
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
