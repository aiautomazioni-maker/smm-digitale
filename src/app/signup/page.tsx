"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, User, Building2, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [accountType, setAccountType] = useState<"personal" | "business">("personal");
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        company_name: "",
        email: "",
        password: "",
        password_confirm: "",
        industry: "",
        description: "",
        city: "",
        accept_terms: false
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleCheckboxChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, accept_terms: checked }));
        if (errors.accept_terms) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.accept_terms;
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, account_type: accountType })
            });

            const data = await response.json();

            if (!data.is_valid) {
                const newErrors: Record<string, string> = {};
                data.errors.forEach((err: { field: string; message: string }) => {
                    newErrors[err.field] = err.message;
                });
                setErrors(newErrors);
                toast.error("Ci sono errori nel modulo.");
            } else {
                setSuccess(true);
                toast.success("Account creato con successo!");
                // setTimeout(() => {
                //     router.push('/dashboard'); 
                // }, 2000);
            }

        } catch (error) {
            console.error("Signup error:", error);
            toast.error("Errore di connessione.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black bg-grid-white/[0.05]">
                <Card className="w-full max-w-md bg-white/5 border-white/10 animate-in fade-in zoom-in duration-500">
                    <CardContent className="flex flex-col items-center justify-center p-10 text-center space-y-4">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Controlla la tua Email!</h2>
                        <p className="text-muted-foreground">Abbiamo inviato un link di conferma a {formData.email}.</p>
                        <p className="text-sm text-gray-500">Per accedere alla dashboard, devi prima verificare il tuo account.</p>
                        <Button variant="outline" className="mt-4 border-white/20 text-white hover:bg-white/10" onClick={() => router.push('/login')}>
                            Vai al Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black bg-grid-white/[0.05] p-4">
            <Toaster />
            <Card className="w-full max-w-2xl bg-black border-white/10 shadow-2xl relative overflow-hidden">
                {/* Decorative background update */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />

                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-foreground to-muted-foreground">
                        Crea il tuo account
                    </CardTitle>
                    <CardDescription>
                        Inizia a gestire i tuoi social con l'intelligenza artificiale.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Tabs defaultValue="personal" onValueChange={(v) => setAccountType(v as "personal" | "business")} className="w-full mb-8">
                        <TabsList className="grid w-full grid-cols-2 bg-white/5">
                            <TabsTrigger value="personal">
                                <User className="w-4 h-4 mr-2" /> Persona
                            </TabsTrigger>
                            <TabsTrigger value="business">
                                <Building2 className="w-4 h-4 mr-2" /> Azienda
                            </TabsTrigger>
                        </TabsList>

                        <form onSubmit={handleSubmit} className="space-y-6 mt-6">

                            <TabsContent value="personal" className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="first_name">Nome</Label>
                                        <Input id="first_name" name="first_name" placeholder="Mario" value={formData.first_name} onChange={handleChange} className={errors.first_name ? "border-red-500" : ""} />
                                        {errors.first_name && <p className="text-red-500 text-xs">{errors.first_name}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="last_name">Cognome</Label>
                                        <Input id="last_name" name="last_name" placeholder="Rossi" value={formData.last_name} onChange={handleChange} className={errors.last_name ? "border-red-500" : ""} />
                                        {errors.last_name && <p className="text-red-500 text-xs">{errors.last_name}</p>}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="business" className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <Label htmlFor="company_name">Ragione Sociale</Label>
                                    <Input id="company_name" name="company_name" placeholder="La Tua Azienda SRL" value={formData.company_name} onChange={handleChange} className={errors.company_name ? "border-red-500" : ""} />
                                    {errors.company_name && <p className="text-red-500 text-xs">{errors.company_name}</p>}
                                </div>
                            </TabsContent>

                            {/* Common Fields */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" placeholder="mario@example.com" value={formData.email} onChange={handleChange} className={errors.email ? "border-red-500" : ""} />
                                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" name="password" type="password" placeholder="Min. 8 caratteri" value={formData.password} onChange={handleChange} className={errors.password ? "border-red-500" : ""} />
                                    {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password_confirm">Conferma Password</Label>
                                    <Input id="password_confirm" name="password_confirm" type="password" placeholder="Ripeti password" value={formData.password_confirm} onChange={handleChange} className={errors.password_confirm ? "border-red-500" : ""} />
                                    {errors.password_confirm && <p className="text-red-500 text-xs">{errors.password_confirm}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="industry">Settore</Label>
                                    <Input id="industry" name="industry" placeholder="es. Marketing, Food, Tech" value={formData.industry} onChange={handleChange} className={errors.industry ? "border-red-500" : ""} />
                                    {errors.industry && <p className="text-red-500 text-xs">{errors.industry}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">Città (Opzionale)</Label>
                                    <Input id="city" name="city" placeholder="es. Milano" value={formData.city} onChange={handleChange} className={errors.city ? "border-red-500" : ""} />
                                    {errors.city && <p className="text-red-500 text-xs">{errors.city}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrizione Attività</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Descrivi brevemente di cosa ti occupi (min 30 caratteri)..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    className={`min-h-[100px] ${errors.description ? "border-red-500" : ""}`}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{formData.description.length}/600</span>
                                    {errors.description && <span className="text-red-500">{errors.description}</span>}
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox id="terms" checked={formData.accept_terms} onCheckedChange={handleCheckboxChange} className={errors.accept_terms ? "border-red-500" : ""} />
                                <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Accetto i <a href="#" className="underline hover:text-white">Termini di Servizio</a> e la <a href="#" className="underline hover:text-white">Privacy Policy</a>
                                </Label>
                            </div>
                            {errors.accept_terms && <p className="text-red-500 text-xs">{errors.accept_terms}</p>}

                            <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6" disabled={loading}>
                                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creazione Account...</> : <><span className="mr-2">Inizia Ora</span> <ArrowRight className="w-4 h-4" /></>}
                            </Button>
                        </form>
                    </Tabs>
                </CardContent>
                <CardFooter className="justify-center border-t border-white/5 pt-6">
                    <p className="text-sm text-muted-foreground">Hai già un account? <a href="/login" className="text-white font-medium hover:underline">Accedi</a></p>
                </CardFooter>
            </Card>
        </div>
    );
}
