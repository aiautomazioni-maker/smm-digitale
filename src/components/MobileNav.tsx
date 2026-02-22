"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, Calendar as CalendarIcon, MessageSquare, User as UserIcon, Bell, Menu, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/context/LanguageContext";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { motion } from "framer-motion";

export function MobileNav() {
    const pathname = usePathname();
    const { t } = useTranslation();
    const [credits, setCredits] = useState<number | null>(null);

    useEffect(() => {
        async function fetchCredits() {
            try {
                const res = await fetch('/api/dashboard/stats');
                const data = await res.json();
                if (data.stats && typeof data.stats.credits === 'number') {
                    setCredits(data.stats.credits);
                }
            } catch (e) {
                console.error("Failed to fetch credits", e);
            }
        }
        fetchCredits();
    }, []);

    const navItems = [
        { href: "/", icon: LayoutDashboard, label: t("nav.dashboard") },
        { href: "/calendar", icon: CalendarIcon, label: t("nav.calendar") },
        { href: "/new-post", icon: PlusCircle, label: t("nav.new_post"), primary: true },
        { href: "/inbox", icon: MessageSquare, label: t("nav.inbox") },
        { href: "/profiles", icon: UserIcon, label: t("nav.profiles") },
    ];

    return (
        <div className="lg:hidden">
            {/* Top Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-xl border-b border-white/10 z-50 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-instagram-gradient rounded-lg flex items-center justify-center shadow-lg shrink-0">
                        <span className="text-white font-bold text-sm">SM</span>
                    </div>
                    <span className="font-bold text-sm tracking-tight text-white italic">SMM Digitale</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end mr-1">
                        <span className="text-[10px] text-muted-foreground font-medium leading-none mb-0.5">Crediti</span>
                        <span className="text-xs text-primary font-bold leading-none">{credits ?? '...'}</span>
                    </div>

                    <Link href="/notifications" className="relative p-2 text-muted-foreground hover:text-white transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-black" />
                    </Link>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="bg-black border-white/10 text-white w-[280px]">
                            <SheetHeader className="text-left mb-6">
                                <SheetTitle className="text-white flex items-center gap-2">
                                    Menu
                                </SheetTitle>
                            </SheetHeader>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Link href="/pricing">
                                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-pink-500 hover:bg-white/5">
                                            <Gem className="w-5 h-5" />
                                            <span>{t("nav.pricing")}</span>
                                        </Button>
                                    </Link>
                                    <Link href="/settings">
                                        <Button variant="ghost" className="w-full justify-start gap-3 h-12 hover:bg-white/5">
                                            <Menu className="w-5 h-5" />
                                            <span>{t("nav.settings")}</span>
                                        </Button>
                                    </Link>
                                    <div className="pt-2">
                                        <Button variant="outline" className="w-full justify-start gap-3 h-12 border-pink-500/50 hover:bg-pink-500/10 text-white" onClick={() => {
                                            // Handle opening the help widget from here if wanted, or just a link to a support page
                                            window.location.href = "mailto:support@smmdigitale.com"; // Placeholder action
                                        }}>
                                            <MessageSquare className="w-5 h-5 text-pink-400" />
                                            <span>Centro Assistenza</span>
                                        </Button>
                                    </div>
                                </div>
                                <div className="border-t border-white/10 pt-4 mt-4">
                                    <div className="flex items-center gap-3 px-3 py-2">
                                        <Avatar className="w-10 h-10 border border-white/10">
                                            <AvatarImage src="https://i.pravatar.cc/150?u=test" />
                                            <AvatarFallback>TU</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">Test User</p>
                                            <p className="text-xs text-muted-foreground">testuser@example.com</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-center">
                                        <LanguageSwitcher />
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </header>

            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black/60 backdrop-blur-2xl border-t border-white/10 z-50 flex items-center justify-around px-1 pb-safe">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center flex-1 h-full relative group min-w-0">
                            <div className={`
                                p-2 rounded-xl transition-all duration-300 flex items-center justify-center
                                ${isActive ? 'text-white' : 'text-muted-foreground group-hover:text-white'}
                                ${item.primary ? 'bg-instagram-gradient -mt-8 shadow-xl shadow-pink-500/30 shrink-0 w-12 h-12' : ''}
                            `}>
                                <Icon className={`${item.primary ? 'w-6 h-6 text-white' : 'w-5 h-5'}`} />
                            </div>
                            {!item.primary && (
                                <span className={`text-[9px] mt-0.5 font-medium truncate w-full flex-1 text-center px-0.5 ${isActive ? 'text-white' : 'text-muted-foreground'}`}>
                                    {item.label}
                                </span>
                            )}
                            {isActive && !item.primary && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute -top-[1px] w-8 h-[2px] bg-white rounded-full"
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
