"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface HeaderProps {
    onOpenLanguage: () => void;
}

export default function Header({ onOpenLanguage }: HeaderProps) {
    const { lang } = useLanguage();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const t = {
        es: {
            links: [
                { name: "Inicio", href: "#inicio" },
                { name: "Productos", href: "#productos" },
                { name: "Historia", href: "#historia" },
                { name: "Nosotros", href: "#nosotros" },
                { name: "Servicios", href: "#servicios" },
                { name: "Contacto", href: "#contacto" },
            ],
            login: "Iniciar Sesión",
            quote: "Cotizar Ahora",
            langLabel: "ES"
        },
        en: {
            links: [
                { name: "Home", href: "#inicio" },
                { name: "Products", href: "#productos" },
                { name: "History", href: "#historia" },
                { name: "About", href: "#nosotros" },
                { name: "Services", href: "#servicios" },
                { name: "Contact", href: "#contacto" },
            ],
            login: "Login",
            quote: "Get Quote",
            langLabel: "EN"
        }
    }[lang];

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                isScrolled 
                    ? "py-3 bg-white/90 backdrop-blur-xl shadow-lg shadow-black/5" 
                    : "py-5 bg-transparent"
            }`}
        >
            <div className="container mx-auto px-4 md:px-6 lg:px-8"
            >
                <nav className="flex items-center justify-between"
                >
                    {/* Logo */}
                    <Link href="#inicio" className="relative z-10"
                    >
                        <motion.img 
                            src="/landing/heavens.webp" 
                            alt="Heavens Fruits SAS Logo" 
                            className={`h-10 md:h-12 w-auto transition-all duration-300 ${
                                isScrolled ? '' : 'brightness-0'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-1"
                    >
                        {t.links.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`relative px-4 py-2 font-medium text-sm transition-colors group ${
                                    isScrolled ? 'text-[#4A4A5A] hover:text-[#0D7377]' : 'text-[#4A4A5A] hover:text-[#0D7377]'
                                }`}
                            >
                                {link.name}
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#0D7377] transition-all duration-300 group-hover:w-1/2" />
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="hidden lg:flex items-center gap-4"
                    >
                        <button
                            onClick={onOpenLanguage}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                                isScrolled 
                                    ? 'text-[#4A4A5A] hover:bg-gray-100' 
                                    : 'text-[#4A4A5A] hover:bg-white/10'
                            }`}
                        >
                            <Globe size={18} />
                            <span>{t.langLabel}</span>
                        </button>

                        <Link
                            href="/login"
                            className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all border ${
                                isScrolled 
                                    ? 'text-[#0D7377] border-[#0D7377]/30 hover:bg-[#0D7377] hover:text-white' 
                                    : 'text-[#0D7377] border-[#0D7377]/30 hover:bg-[#0D7377] hover:text-white'
                            }`}
                        >
                            {t.login}
                        </Link>

                        <Link
                            href="#contacto"
                            className="px-5 py-2.5 rounded-full font-semibold text-sm bg-gradient-to-r from-[#0D7377] to-[#14A0A5] text-white shadow-lg shadow-[#0D7377]/25 hover:shadow-xl hover:shadow-[#0D7377]/30 hover:scale-105 transition-all"
                        >
                            {t.quote}
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="lg:hidden relative z-10 p-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <motion.div
                            animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {isMobileMenuOpen ? <X size={24} className="text-[#1A1A2E]" /> : <Menu size={24} className="text-[#1A1A2E]" />}
                        </motion.div>
                    </button>
                </nav>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden z-40"
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute top-full left-4 right-4 mt-2 bg-white rounded-2xl shadow-2xl overflow-hidden lg:hidden z-50 border border-gray-100"
                        >
                            <div className="p-6 space-y-4"
                            >
                                {t.links.map((link, index) => (
                                    <motion.div
                                        key={link.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Link
                                            href={link.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block py-3 text-lg font-medium text-[#1A1A2E] hover:text-[#0D7377] transition-colors border-b border-gray-100 last:border-0"
                                        >
                                            {link.name}
                                        </Link>
                                    </motion.div>
                                ))}
                                
                                <div className="pt-4 space-y-3"
                                >
                                    <button
                                        onClick={() => {
                                            onOpenLanguage();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-3 text-[#4A4A5A] font-medium"
                                    >
                                        <Globe size={18} />
                                        Cambiar Idioma / Change Language
                                    </button>

                                    <Link
                                        href="/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block w-full py-3 text-center text-[#0D7377] font-semibold border-2 border-[#0D7377]/30 rounded-xl hover:bg-[#0D7377] hover:text-white transition-all"
                                    >
                                        {t.login}
                                    </Link>

                                    <Link
                                        href="#contacto"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block w-full py-3 text-center bg-gradient-to-r from-[#0D7377] to-[#14A0A5] text-white font-semibold rounded-xl"
                                    >
                                        {t.quote}
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}
