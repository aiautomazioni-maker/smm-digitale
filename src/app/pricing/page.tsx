"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, Crown, Star, Gem, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PaymentModal } from "@/components/payment/PaymentModal";

import { useTranslation } from "@/context/LanguageContext";

type BillingCycle = "monthly" | "quarterly" | "nine_months" | "yearly";

const PRICING_PLANS = [
    {
        name: "Micro",
        icon: Star,
        monthlyPrice: 19,
        credits: 80,
        description: "Per iniziare a sperimentare con l'AI.",
        features: ["80 Crediti/mese", "Generazione Immagini Standard", "Accesso Base Tool AI", "Supporto Standard"],
        gradient: "from-orange-400 to-orange-600",
        popular: false
    },
    {
        name: "Starter",
        icon: Zap,
        monthlyPrice: 49,
        credits: 250,
        description: "Ideale per piccoli creator e hobbyist.",
        features: ["250 Crediti/mese", "Generazione Immagini HD", "Accesso Prioritario", "Supporto Email"],
        gradient: "from-pink-500 to-rose-500",
        popular: true
    },
    {
        name: "Pro",
        icon: Crown,
        monthlyPrice: 99,
        credits: 600,
        description: "Per social media manager professionisti.",
        features: ["600 Crediti/mese", "Generazione Video (Beta)", "Analisi Trend AI", "Supporto Prioritario"],
        gradient: "from-purple-500 to-indigo-600",
        popular: false
    },
    {
        name: "Business",
        icon: Rocket,
        monthlyPrice: 249,
        credits: 1800,
        description: "Per agenzie e team in crescita.",
        features: ["1.800 Crediti/mese", "API Access", "Account Multi-utente", "Account Manager Dedicato"],
        gradient: "from-blue-500 to-cyan-500",
        popular: false
    },
    {
        name: "Empire",
        icon: Gem,
        monthlyPrice: 499,
        credits: 4500,
        description: "Potenza illimitata per grandi brand.",
        features: ["4.500 Crediti/mese", "Modelli Personalizzati", "SLA Garantito", "Supporto 24/7 VIP"],
        gradient: "bg-instagram-gradient",
        popular: false,
        isEmpire: true
    }
];

const DISCOUNTS = {
    monthly: 0,
    quarterly: 0.10,
    nine_months: 0.15,
    yearly: 0.20
};

export default function PricingPage() {
    const { t } = useTranslation();
    const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<typeof PRICING_PLANS[0] | null>(null);

    const calculatePrice = (basePrice: number) => {
        const discount = DISCOUNTS[billingCycle];
        const pricePerMonth = basePrice * (1 - discount);
        return pricePerMonth.toFixed(2);
    };

    const calculateTotalBilled = (basePrice: number) => {
        const discount = DISCOUNTS[billingCycle];
        const pricePerMonth = basePrice * (1 - discount);
        let multiplier = 1;
        if (billingCycle === "quarterly") multiplier = 3;
        if (billingCycle === "nine_months") multiplier = 9;
        if (billingCycle === "yearly") multiplier = 12;
        return (pricePerMonth * multiplier).toFixed(2);
    };

    const getBilledText = (price: number) => {
        const total = calculateTotalBilled(price);

        switch (billingCycle) {
            case "monthly": return t("pricing.billed_monthly");
            case "quarterly": return `${t("pricing.billed_every")} 3 mesi: €${total}`;
            case "nine_months": return `${t("pricing.billed_every")} 9 mesi: €${total}`;
            case "yearly": return `${t("pricing.billed_yearly")}: €${total}`;
        }
    };

    const handlePlanSelect = (plan: typeof PRICING_PLANS[0]) => {
        setSelectedPlan(plan);
        setIsPaymentOpen(true);
    };

    return (
        <div className="min-h-screen bg-black bg-grid-white/[0.05] p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-instagram-gradient pb-2">
                        {t("pricing.title")}
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        {t("pricing.subtitle")}
                    </p>
                </div>

                {/* Billing Cycle Toggle */}
                <div className="flex justify-center">
                    <div className="bg-white/5 p-1 rounded-xl flex flex-wrap justify-center gap-1 border border-white/10">
                        {(Object.keys(DISCOUNTS) as BillingCycle[]).map((cycle) => (
                            <button
                                key={cycle}
                                onClick={() => setBillingCycle(cycle)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                                    billingCycle === cycle
                                        ? "bg-white/10 text-white shadow-lg bg-instagram-gradient"
                                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                                )}
                            >
                                {cycle === "monthly" && t("pricing.monthly")}
                                {cycle === "quarterly" && t("pricing.quarterly")}
                                {cycle === "nine_months" && t("pricing.nine_months")}
                                {cycle === "yearly" && t("pricing.yearly")}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scaling Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {PRICING_PLANS.map((plan) => (
                        <Card
                            key={plan.name}
                            className={cn(
                                "relative border-white/10 bg-black/40 backdrop-blur-xl flex flex-col transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20",
                                plan.popular && "border-pink-500/50 shadow-lg shadow-pink-500/10 ring-1 ring-pink-500/50",
                                plan.isEmpire && "border-yellow-500/50 shadow-lg shadow-yellow-500/10"
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                    {t("pricing.popular")}
                                </div>
                            )}
                            {plan.isEmpire && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                    {t("pricing.ultimate")}
                                </div>
                            )}

                            <CardHeader>
                                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-white shadow-lg",
                                    plan.isEmpire ? "bg-instagram-gradient" : `bg-gradient-to-br ${plan.gradient}`
                                )}>
                                    <plan.icon className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-xl">{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1 space-y-6">
                                <div>
                                    <span className="text-4xl font-bold text-white">€{calculatePrice(plan.monthlyPrice)}</span>
                                    <span className="text-muted-foreground">/mese</span>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {getBilledText(plan.monthlyPrice)}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    {plan.features.map((feature, i) => (
                                        <div key={i} className="flex items-center text-sm text-gray-300">
                                            <Check className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>

                            <CardFooter>
                                <Button
                                    onClick={() => handlePlanSelect(plan)}
                                    className={cn("w-full h-12 font-bold text-white transition-all",
                                        plan.isEmpire
                                            ? "bg-instagram-gradient hover:opacity-90"
                                            : `bg-gradient-to-r ${plan.gradient} hover:opacity-90`
                                    )}
                                >
                                    {t("pricing.choose")} {plan.name}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                <div className="text-center mt-12 text-muted-foreground text-sm">
                    <p>{t("pricing.taxes")}</p>
                </div>
            </div>

            {selectedPlan && (
                <PaymentModal
                    isOpen={isPaymentOpen}
                    onClose={() => setIsPaymentOpen(false)}
                    planName={selectedPlan.name}
                    totalPrice={`€${calculateTotalBilled(selectedPlan.monthlyPrice)}`}
                    billingCycle={billingCycle}
                    onSuccess={() => {
                        // Refresh to show updated credits (would work if we fetched user data client-side)
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}
