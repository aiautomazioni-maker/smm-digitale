"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en } from '@/lib/i18n/dictionaries/en';
import { it } from '@/lib/i18n/dictionaries/it';
import { es } from '@/lib/i18n/dictionaries/es';
import { fr } from '@/lib/i18n/dictionaries/fr';
import { de } from '@/lib/i18n/dictionaries/de';

export type Language = 'en' | 'it' | 'es' | 'fr' | 'de';

type Dictionary = Record<string, any>;

const dictionaries: Record<Language, Dictionary> = {
    en,
    it,
    es,
    fr,
    de
};

interface LanguageContextProps {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string | string[]; // Can return string or array of strings (like for days)
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>('it'); // Default IT come prima
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Al caricamento, controlla se c'è una lingua salvata
        const savedLang = localStorage.getItem('smm-lang') as Language;
        if (savedLang && Object.keys(dictionaries).includes(savedLang)) {
            setLanguageState(savedLang);
        }
        setMounted(true);
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('smm-lang', lang);
    };

    const t = (key: string): any => {
        if (!mounted) return ""; // Evita discrepanze lato server durante il primo render
        const dictionary = dictionaries[language];
        return dictionary[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};
