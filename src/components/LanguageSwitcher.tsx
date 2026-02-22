"use client";

import { useTranslation, Language } from "@/context/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
    const { language, setLanguage } = useTranslation();

    const languages: { code: Language; label: string; flag: string }[] = [
        { code: "it", label: "Italiano", flag: "🇮🇹" },
        { code: "en", label: "English", flag: "🇬🇧" },
        { code: "es", label: "Español", flag: "🇪🇸" },
        { code: "fr", label: "Français", flag: "🇫🇷" },
        { code: "de", label: "Deutsch", flag: "🇩🇪" }
    ];

    if (!language) return null; // Avoid hydration mismatch

    return (
        <Select value={language} onValueChange={(val: Language) => setLanguage(val)}>
            <SelectTrigger className="w-[140px] bg-white/5 border-white/10 h-9">
                <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Lingua" />
            </SelectTrigger>
            <SelectContent>
                {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code} className="cursor-pointer">
                        <span className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
