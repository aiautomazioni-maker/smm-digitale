"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [error, setError] = useState<string | null>(null);
    const [showResend, setShowResend] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
        setShowResend(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!data.login.allowed) {
                setError(data.ui.message);
                if (data.ui.show_resend_verification) {
                    setShowResend(true);
                }
            } else {
                toast.success(data.ui.message);
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1000);
            }

        } catch (err) {
            console.error("Login error:", err);
            setError("Errore di connessione. Riprova più tardi.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        setResending(true);
        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email })
            });
            const data = await response.json();
            toast.success(data.ui_message);
            setShowResend(false);
            setError(null);
        } catch (err) {
            toast.error("Impossibile inviare la mail.");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black bg-grid-white/[0.05] p-4">
            <Toaster />
            <div className="absolute top-0 left-0 w-full h-1 bg-instagram-gradient" />

            <Card className="w-full max-w-md bg-black border-white/10 shadow-2xl relative overflow-hidden">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-foreground to-muted-foreground">
                        Bentornato
                    </CardTitle>
                    <CardDescription>
                        Accedi alla tua dashboard
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start space-x-2 text-sm text-red-200">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <p>{error}</p>
                                    {showResend && (
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="text-red-300 underline p-0 h-auto mt-1 hover:text-white"
                                            onClick={handleResendVerification}
                                            disabled={resending}
                                        >
                                            {resending ? "Invio in corso..." : "Invia nuova email di verifica"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="mario@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <a href="#" className="text-xs text-muted-foreground hover:text-white">Password dimenticata?</a>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-instagram-gradient hover:opacity-90 text-white font-semibold py-6 shadow-lg shadow-pink-500/20 transition-all duration-300"
                            disabled={loading}
                        >
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Accesso...</> : <><span className="mr-2">Accedi con Instagram Style</span> <ArrowRight className="w-4 h-4" /></>}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center border-t border-white/5 pt-6 bg-white/5">
                    <p className="text-sm text-muted-foreground">Non hai un account? <Link href="/signup" className="text-white font-medium hover:text-pink-500 transition-colors">Registrati</Link></p>
                </CardFooter>
            </Card>
        </div>
    );
}
