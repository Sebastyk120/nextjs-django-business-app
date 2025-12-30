"use client";

import { useState } from "react";
import LanguageOverlay from "./_components/LanguageOverlay";
import Header from "./_components/Header";
import Footer from "./_components/Footer";
import WhatsAppButton from "./_components/WhatsAppButton";
import { LanguageProvider } from "@/context/LanguageContext";

export default function LandingShell({ children }: { children: React.ReactNode }) {
    const [langOpen, setLangOpen] = useState(false);

    return (
        <LanguageProvider>
            <div className="landing-page min-h-screen flex flex-col font-body">
                <LanguageOverlay isOpen={langOpen} onClose={() => setLangOpen(false)} />
                <Header onOpenLanguage={() => setLangOpen(true)} />
                <main className="flex-grow">{children}</main>
                <Footer />
                <WhatsAppButton />
            </div>
        </LanguageProvider>
    );
}

