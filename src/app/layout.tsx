import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { HelpWidget } from "@/components/help/HelpWidget";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { LanguageProvider } from "@/context/LanguageContext";

export const metadata: Metadata = {
  title: "Automazioni AI - AI Social Manager",
  description: "La tua suite completa per l'automazione social con Intelligenza Artificiale",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="dark">
      <body className="font-sans antialiased text-foreground bg-background">
        <LanguageProvider>
          <Toaster />
          <MobileNav />
          <div className="flex h-screen overflow-hidden pt-16 lg:pt-0">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8">
              {children}
            </main>
          </div>
          <HelpWidget />
        </LanguageProvider>
      </body>
    </html>
  );
}
