"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface LanguageOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LanguageOverlay({ isOpen, onClose }: LanguageOverlayProps) {
    const { setLang } = useLanguage();

    const changeLanguage = (lang: "es" | "en") => {
        setLang(lang);
        onClose();
    };


    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(0,91,96,0.97)] backdrop-blur-sm"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 text-white/80 hover:text-white transition-colors"
                    >
                        <X size={48} />
                    </button>

                    <div className="text-center text-white px-4">
                        <div className="mb-8 flex justify-center">
                            <img src="/landing/heavens.webp" alt="Heavens Fruits SAS" className="h-20 w-auto" />
                        </div>

                        <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">
                            Selecciona tu idioma / Select your language
                        </h2>

                        <p className="text-lg text-white/80 mb-1">
                            Elige el idioma en el que prefieres navegar nuestro sitio
                        </p>
                        <p className="text-lg text-white/80 mb-12">
                            Choose the language in which you prefer to browse our site
                        </p>

                        <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
                            <button
                                onClick={() => changeLanguage('es')}
                                className="group flex flex-col items-center gap-4 transition-transform hover:scale-105"
                            >
                                <div className="text-6xl group-hover:drop-shadow-lg transition-all">🇪🇸</div>
                                <span className="text-xl font-semibold border-b-2 border-transparent group-hover:border-[#FF7F50] pb-1 transition-all">
                                    Español
                                </span>
                            </button>

                            <button
                                onClick={() => changeLanguage('en')}
                                className="group flex flex-col items-center gap-4 transition-transform hover:scale-105"
                            >
                                <div className="text-6xl group-hover:drop-shadow-lg transition-all">🇺🇸</div>
                                <span className="text-xl font-semibold border-b-2 border-transparent group-hover:border-[#FF7F50] pb-1 transition-all">
                                    English
                                </span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
