"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Leaf, Globe, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Fruit } from "@/types/fruit";

interface ProductModalProps {
    fruit: Fruit | null;
    isOpen: boolean;
    onClose: () => void;
}

import { useLanguage } from "@/context/LanguageContext";

export default function ProductModal({ fruit, isOpen, onClose }: ProductModalProps) {
    const { lang } = useLanguage();
    if (!fruit) return null;

    const t = {
        es: {
            descTitle: "Descripción",
            charTitle: "Características Destacadas",
            highQuality: "Alta Calidad",
            sustainable: "Cultivo Sostenible",
            exportStandard: "Estándar de Exportación",
            requestQuote: "Solicitar Cotización",
            defaultDesc: "Fruta exótica colombiana de altísima calidad, cultivada bajo estrictos controles de calidad y sostenibilidad."
        },
        en: {
            descTitle: "Description",
            charTitle: "Key Features",
            highQuality: "High Quality",
            sustainable: "Sustainable Farming",
            exportStandard: "Export Standard",
            requestQuote: "Request a Quote",
            defaultDesc: "High-quality Colombian exotic fruit, grown under strict quality and sustainability controls."
        }
    }[lang];

    const displayNombre = lang === "en" && fruit.nombre_en ? fruit.nombre_en : fruit.nombre;
    const secondaryNombre = lang === "en" ? fruit.nombre : fruit.nombre_en;
    const displayDesc = (lang === "en" && fruit.descripcion_en) ? fruit.descripcion_en : (fruit.descripcion || t.defaultDesc);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                        >
                            <X size={24} className="text-[--color-text]" />
                        </button>

                        {/* Image Section */}
                        <div className="w-full md:w-1/2 bg-gray-100 relative min-h-[300px] md:min-h-full">
                            {fruit.imagen ? (
                                <Image
                                    src={fruit.imagen}
                                    alt={displayNombre}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    <Leaf size={64} />
                                </div>
                            )}
                        </div>

                        {/* Content Section */}
                        <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto">
                            <h3 className="text-3xl font-bold text-[--color-primary] mb-2">{displayNombre}</h3>
                            {secondaryNombre && (
                                <h4 className="text-lg text-[--color-text-light] mb-6 italic">{secondaryNombre}</h4>
                            )}

                            <div className="mb-6">
                                <h5 className="text-[--color-primary] font-semibold mb-2 flex items-center gap-2">
                                    <Leaf size={18} /> {t.descTitle}
                                </h5>
                                <p className="text-[--color-text] leading-relaxed">
                                    {displayDesc}
                                </p>
                            </div>

                            <div className="mb-8">
                                <h5 className="text-[--color-primary] font-semibold mb-3 flex items-center gap-2">
                                    <AwardIcon /> {t.charTitle}
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                    <span className="feature-pill text-xs">
                                        <Check size={14} /> {t.highQuality}
                                    </span>
                                    <span className="feature-pill text-xs">
                                        <Leaf size={14} /> {t.sustainable}
                                    </span>
                                    <span className="feature-pill text-xs">
                                        <Globe size={14} /> {t.exportStandard}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 mt-auto">
                                <Link
                                    href="#contacto"
                                    onClick={onClose}
                                    className="btn-secondary-custom text-center flex items-center justify-center gap-2 w-full"
                                >
                                    {t.requestQuote} <MessageCircle size={20} />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}


function AwardIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="8" r="7" />
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
    )
}
