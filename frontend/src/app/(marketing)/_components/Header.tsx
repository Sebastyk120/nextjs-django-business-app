"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
    onOpenLanguage: () => void;
}

import { useLanguage } from "@/context/LanguageContext";

export default function Header({ onOpenLanguage }: HeaderProps) {
    const { lang } = useLanguage();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const t = {
        es: {
            links: [
                { name: "Inicio", href: "#inicio" },
                { name: "Productos", href: "#productos" },
                { name: "Nosotros", href: "#nosotros" },
                { name: "Servicios", href: "#servicios" },
                { name: "Contacto", href: "#contacto" },
            ],
            login: "Iniciar Sesión",
            quote: "Cotiza Ahora",
            changeLang: "Cambiar Idioma",
            langLabel: "ES"
        },
        en: {
            links: [
                { name: "Home", href: "#inicio" },
                { name: "Products", href: "#productos" },
                { name: "About Us", href: "#nosotros" },
                { name: "Services", href: "#servicios" },
                { name: "Contact", href: "#contacto" },
            ],
            login: "Login",
            quote: "Quote Now",
            changeLang: "Change Language",
            langLabel: "EN"
        }
    }[lang];

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "py-2 glass-nav shadow-md" : "py-4 bg-transparent"}`}
        >
            <div className="container mx-auto px-4 md:px-6">
                <nav className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="#inicio" className="transition-transform hover:scale-105">
                        <img src="/landing/heavens.webp" alt="Heavens Fruits SAS Logo" className="h-10 md:h-12 w-auto" />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-8">
                        {t.links.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-[--color-text] hover:text-[--color-secondary] font-medium transition-colors relative group"
                            >
                                {link.name}
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[--color-secondary] transition-all duration-300 group-hover:w-full"></span>
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="hidden lg:flex items-center gap-4">
                        <Link
                            href="/login"
                            className="btn-outline-custom px-6 py-2 text-sm"
                        >
                            {t.login}
                        </Link>
                        <Link
                            href="#contacto"
                            className="btn-secondary-custom px-6 py-2 text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                        >
                            {t.quote}
                        </Link>
                        <button
                            onClick={onOpenLanguage}
                            className="flex items-center gap-2 text-[--color-text-light] hover:text-[--color-primary] transition-colors"
                        >
                            <Globe size={20} />
                            <span className="font-semibold">{t.langLabel}</span>
                        </button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="lg:hidden text-[--color-primary]"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </nav>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden bg-white border-t border-gray-100 overflow-hidden shadow-xl"
                    >
                        <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
                            {t.links.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-lg font-medium text-[--color-text] hover:text-[--color-secondary] py-2 border-b border-gray-50"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="flex flex-col gap-3 mt-4">
                                <Link
                                    href="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="btn-outline-custom text-center justify-center p-3"
                                >
                                    {t.login}
                                </Link>
                                <Link
                                    href="#contacto"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="btn-secondary-custom text-center justify-center p-3"
                                >
                                    {t.quote}
                                </Link>
                                <button
                                    onClick={() => {
                                        onOpenLanguage();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="flex items-center justify-center gap-2 text-[--color-text-light] py-2"
                                >
                                    <Globe size={20} />
                                    <span>{t.changeLang}</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>

    );
}
