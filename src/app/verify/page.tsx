"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verifica in corso...");

    useEffect(() => {
        if (!token || !email) {
            setStatus("error");
            setMessage("Link non valido.");
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, email })
                });
                const data = await res.json();

                if (data.result.status === "verified" || data.result.status === "already_verified") {
                    setStatus("success");
                    setMessage(data.result.ui_message);
                    // Build trust: wait a bit before redirecting? No, let user choose.
                } else {
                    setStatus("error");
                    setMessage(data.result.ui_message);
                }
            } catch (err) {
                setStatus("error");
                setMessage("Si è verificato un errore.");
            }
        };

        verify();
    }, [token, email]);

    return (
        <Card className="w-full max-w-md bg-black border-white/10 text-center">
            <CardHeader>
                <CardTitle className="text-white">Verifica Account</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-8">
                {status === "loading" && (
                    <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
                )}
                {status === "success" && (
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                )}
                {status === "error" && (
                    <XCircle className="h-10 w-10 text-red-500" />
                )}

                <p className="text-lg text-muted-foreground">{message}</p>

                {status !== "loading" && (
                    <Button onClick={() => router.push('/login')} className="mt-4">
                        Vai al Login
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

export default function VerifyPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <Suspense fallback={<div className="text-white">Caricamento...</div>}>
                <VerifyContent />
            </Suspense>
        </div>
    );
}
