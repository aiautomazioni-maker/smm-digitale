"use client";

import { useState } from "react";
import { Bell, Heart, MessageCircle, Repeat, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

// Dati mockati per le notifiche
const systemNotifications = [
    { id: 1, type: "system", icon: AlertTriangle, color: "text-amber-500", title: "Crediti in esaurimento", desc: "Hai consumato l'80% dei crediti AI.", time: "1h fa", unread: true },
    { id: 2, type: "system", icon: Info, color: "text-blue-500", title: "Aggiornamento SMM", desc: "Nuova funzione Brand Kit disponibile!", time: "2g fa", unread: false },
];

export function NotificationBell() {
    const { t } = useTranslation();
    const [unreadCount, setUnreadCount] = useState(systemNotifications.filter(n => n.unread).length);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative rounded-full border-white/10 bg-white/5 hover:bg-white/10 h-10 w-10">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 bg-black/90 border-white/10 backdrop-blur-xl" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Notifiche di Sistema</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            Ultime novità e avvisi
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuGroup className="max-h-[300px] overflow-y-auto">
                    {systemNotifications.length > 0 ? (
                        systemNotifications.map((notification) => {
                            const Icon = notification.icon;
                            return (
                                <DropdownMenuItem key={notification.id} className="cursor-pointer py-3 focus:bg-white/5" onClick={() => { if (notification.unread) setUnreadCount(prev => Math.max(0, prev - 1)) }}>
                                    <div className="flex gap-3 items-start">
                                        <div className={`mt-0.5 rounded-full p-1 bg-white/5 ${notification.color}`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col space-y-1">
                                            <span className={`text-sm ${notification.unread ? 'font-bold text-white' : 'font-medium text-foreground'}`}>
                                                {notification.title}
                                            </span>
                                            <span className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.desc}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/80 pt-1">
                                                {notification.time}
                                            </span>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            );
                        })
                    ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Nessuna notifica di sistema.
                        </div>
                    )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-white/10" />
                <div className="p-2">
                    <Link href="/notifications" passHref>
                        <Button variant="ghost" className="w-full text-xs h-8 justify-center text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                            Vedi tutte le notifiche
                        </Button>
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
