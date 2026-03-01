"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, PlusCircle, Settings, History, Calendar as CalendarIcon, User as UserIcon, Megaphone, LogOut, Gem, Bell, MessageSquare, Video, BarChart3 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Sidebar() {
    const router = useRouter();
    const { t } = useTranslation();

    const [credits, setCredits] = useState<number | null>(null);

    useEffect(() => {
        async function fetchCredits() {
            try {
                // We use the dashboard stats API as it's the most convenient place where user stats are aggregated
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

    const handleLogout = () => {
        // In a real app, clear cookies/tokens here
        router.push('/login');
    };

    return (
        <div className="hidden lg:flex w-64 border-r border-white/10 bg-black/20 backdrop-blur-xl h-full flex-col p-4">
            <div className="flex items-center space-x-3 px-2 py-6 mb-6">
                <div className="w-10 h-10 bg-instagram-gradient rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20 shrink-0">
                    <span className="text-white font-bold text-lg">AA</span>
                </div>
                <div>
                    <span className="font-bold text-lg block tracking-tight">Automazioni AI</span>
                    <span className="text-xs text-muted-foreground font-medium">Crediti: <span className="text-primary font-bold">{credits !== null ? credits : '...'}</span></span>
                </div>
            </div>

            <div className="space-y-1 flex-1">
                <Link href="/">
                    <Button variant="ghost" className="w-full justify-start space-x-3 h-12 hover:bg-white/5 data-[active=true]:bg-white/10">
                        <LayoutDashboard className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{t("nav.dashboard")}</span>
                    </Button>
                </Link>
                <Link href="/pricing">
                    <Button variant="ghost" className="w-full justify-start space-x-3 h-12 hover:bg-white/5 font-semibold text-pink-500">
                        <Gem className="w-5 h-5 text-pink-500" />
                        <span className="font-medium">{t("nav.pricing")}</span>
                    </Button>
                </Link>
                <Link href="/new-post">
                    <Button variant="ghost" className="w-full justify-start space-x-3 h-12 hover:bg-white/5">
                        <PlusCircle className="w-5 h-5 text-pink-500" />
                        <span className="font-medium">{t("nav.new_post")}</span>
                    </Button>
                </Link>
                <Link href="/history">
                    <Button variant="ghost" className="w-full justify-start space-x-3 h-12 hover:bg-white/5">
                        <History className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">Cronologia</span>
                    </Button>
                </Link>
                <Link href="/calendar">
                    <Button variant="ghost" className="w-full justify-start space-x-3 h-12 hover:bg-white/5">
                        <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{t("nav.calendar")}</span>
                    </Button>
                </Link>
                <Link href="/notifications">
                    <Button variant="ghost" className="w-full justify-start space-x-3 h-12 hover:bg-white/5">
                        <Bell className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{t("nav.notifications")}</span>
                    </Button>
                </Link>
                <Link href="/inbox">
                    <Button variant="ghost" className="w-full justify-start space-x-3 h-12 hover:bg-white/5">
                        <MessageSquare className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{t("nav.inbox")}</span>
                    </Button>
                </Link>
            </div>

            <div className="space-y-1 mt-auto">
                <div className="mb-4">
                    <Link href="/settings">
                        <Button variant="ghost" className="w-full justify-start space-x-3 h-12 hover:bg-white/5">
                            <Settings className="w-5 h-5 text-muted-foreground" />
                            <span className="font-medium">{t("nav.settings")}</span>
                        </Button>
                    </Link>
                    <Link href="/profiles">
                        <Button variant="ghost" className="w-full justify-start space-x-3 h-12 hover:bg-white/5">
                            <UserIcon className="w-5 h-5 text-muted-foreground" />
                            <span className="font-medium">{t("nav.profiles")}</span>
                        </Button>
                    </Link>
                    <Link href="/ads">
                        <Button variant="ghost" className="w-full justify-start space-x-3 h-12 hover:bg-white/5">
                            <Megaphone className="w-5 h-5 text-muted-foreground" />
                            <span className="font-medium">Sponsorizzate</span>
                        </Button>
                    </Link>
                </div>

                <div className="border-t border-white/10 pt-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start px-2 h-14 hover:bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                                        TU
                                    </div>
                                    <div className="text-left overflow-hidden">
                                        <p className="text-sm font-medium text-white truncate">Test User</p>
                                        <p className="text-xs text-muted-foreground truncate">testuser@example.com</p>
                                    </div>
                                    <Settings className="w-4 h-4 ml-auto text-muted-foreground opacity-50" />
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-black border-white/10 text-white" side="right" sideOffset={10}>
                            <DropdownMenuLabel>Il mio Account</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem className="focus:bg-white/10 cursor-pointer" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Logout</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="mt-4 flex flex-col items-center gap-2">
                        <LanguageSwitcher />
                        <span className="text-[10px] text-muted-foreground opacity-30 mt-2 italic">
                            Ultimo Aggiornamento: {new Date().toLocaleTimeString('it-IT')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
