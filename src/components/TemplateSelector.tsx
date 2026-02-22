"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Layout, Star, TrendingUp, Quote } from "lucide-react";

interface Template {
    id: string;
    name: string;
    category: string;
    imageUrl: string; // Preview image
}

const TEMPLATES: Template[] = [
    { id: 't1', name: "Launch Product", category: "Business", imageUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=400" },
    { id: 't2', name: "Minimal Quote", category: "Quote", imageUrl: "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&q=80&w=400" },
    { id: 't3', name: "New Collection", category: "Fashion", imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=400" },
    { id: 't4', name: "Webinar Invite", category: "Business", imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=400" },
    { id: 't5', name: "Monday Motivation", category: "Quote", imageUrl: "https://images.unsplash.com/photo-1497561813398-8fcc7a37b567?auto=format&fit=crop&q=80&w=400" },
    { id: 't6', name: "Flash Sale", category: "Promo", imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=400" },
];

const CATEGORIES = [
    { id: 'all', label: 'Tutti', icon: Layout },
    { id: 'Business', label: 'Business', icon: TrendingUp },
    { id: 'Quote', label: 'Citazioni', icon: Quote },
    { id: 'Promo', label: 'Promo', icon: Star },
];

interface TemplateSelectorProps {
    onSelect: (templateUrl: string) => void;
}

import { useState } from "react";

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
    const [selectedCategory, setSelectedCategory] = useState("all");

    const filteredTemplates = selectedCategory === 'all'
        ? TEMPLATES
        : TEMPLATES.filter(t => t.category === selectedCategory);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            {/* Categories */}
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-4 p-1">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`
                                flex items-center px-4 py-2 rounded-full border transition-all
                                ${selectedCategory === cat.id
                                    ? "bg-white text-black border-white"
                                    : "bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:bg-white/5"}
                            `}
                        >
                            <cat.icon className="w-4 h-4 mr-2" />
                            {cat.label}
                        </button>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                    <div
                        key={template.id}
                        className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-primary transition-all"
                        onClick={() => onSelect(template.imageUrl)}
                    >
                        <img
                            src={template.imageUrl}
                            alt={template.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                            <span className="font-semibold text-white">{template.name}</span>
                            <span className="text-xs text-gray-300">{template.category}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
