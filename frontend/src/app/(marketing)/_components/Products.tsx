"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Leaf, Sparkles, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Fruit } from "@/types/fruit";
import ProductModal from "./ProductModal";
import AllProductsModal from "./AllProductsModal";
import axiosClient from "@/lib/axios";
import { useLanguage } from "@/context/LanguageContext";

export default function Products() {
    const { lang } = useLanguage();
    const [fruits, setFruits] = useState<Fruit[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFruit, setSelectedFruit] = useState<Fruit | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const t = {
        es: {
            sub: "Portafolio Premium",
            title: "Frutas Exóticas",
            titleHighlight: "de Clase Mundial",
            desc: "Descubre más de 23 variedades de frutas tropicales cultivadas en las tierras más fértiles de Colombia. Cada fruta es seleccionada a mano para garantizar la máxima calidad.",
            viewAll: "Ver Catálogo Completo",
            viewAllSub: "23+ frutas exóticas",
            featured: "Destacadas",
            discover: "Descubrir"
        },
        en: {
            sub: "Premium Portfolio",
            title: "World-Class",
            titleHighlight: "Exotic Fruits",
            desc: "Discover more than 23 varieties of tropical fruits grown in Colombia's most fertile lands. Each fruit is hand-selected to guarantee maximum quality.",
            viewAll: "View Full Catalog",
            viewAllSub: "23+ exotic fruits",
            featured: "Featured",
            discover: "Discover"
        }
    }[lang];

    useEffect(() => {
        const fetchFruits = async () => {
            try {
                const response = await axiosClient.get<Fruit[]>('/autenticacion/api/fruits/');
                setFruits(response.data);
            } catch (error) {
                console.error("Failed to fetch fruits", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFruits();
    }, []);

    const openDetailModal = (fruit: Fruit) => {
        setSelectedFruit(fruit);
        setIsDetailModalOpen(true);
    };

    const featuredFruits = fruits.slice(0, 6);

    return (
        <section id="productos" className="py-32 bg-[#F8FAFC] relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent" />
            <motion.div
                className="absolute top-40 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#0D7377]/5 to-transparent rounded-full blur-3xl"
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
                className="absolute bottom-40 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#FF6B4A]/5 to-transparent rounded-full blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.4, 0.3] }}
                transition={{ duration: 10, repeat: Infinity, delay: 2 }}
            />

            <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-20 gap-8"
                >
                    <div className="max-w-2xl">
                        <motion.span
                            className="inline-flex items-center gap-2 text-[#0D7377] font-bold tracking-widest uppercase text-xs mb-4"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            <Sparkles size={16} />
                            {t.sub}
                        </motion.span>

                        <motion.h2
                            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                        >
                            {t.title}{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D7377] to-[#14A0A5]">
                                {t.titleHighlight}
                            </span>
                        </motion.h2>

                        <motion.p
                            className="text-lg text-[#4A4A5A] leading-relaxed"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                        >
                            {t.desc}
                        </motion.p>
                    </div>

                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                        whileHover={{ scale: 1.05, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsCatalogOpen(true)}
                        className="hidden lg:flex flex-col items-start bg-white px-8 py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 group"
                    >
                        <span className="flex items-center gap-2 font-bold text-[#1A1A2E] group-hover:text-[#0D7377] transition-colors">
                            {t.viewAll}
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                        <span className="text-xs text-[#8A8A9A] mt-1">{t.viewAllSub}</span>
                    </motion.button>
                </motion.div>

                {/* Featured Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-[#0D7377] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-4 h-4 bg-[#0D7377] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-4 h-4 bg-[#0D7377] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                ) : (
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.1 }
                            }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
                    >
                        {featuredFruits.map((fruit, index) => (
                            <motion.div
                                key={fruit.id}
                                variants={{
                                    hidden: { opacity: 0, y: 60, scale: 0.95 },
                                    visible: {
                                        opacity: 1,
                                        y: 0,
                                        scale: 1,
                                        transition: {
                                            type: "spring" as const,
                                            stiffness: 80,
                                            damping: 20
                                        }
                                    }
                                }}
                                onClick={() => openDetailModal(fruit)}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                className="group relative h-[450px] rounded-[2rem] overflow-hidden cursor-pointer bg-white shadow-lg hover:shadow-2xl transition-all duration-500"
                            >
                                {/* Background Image */}
                                <div className="absolute inset-0">
                                    {fruit.imagen ? (
                                        <Image
                                            src={fruit.imagen}
                                            alt={fruit.nombre}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            loading="lazy"
                                            quality={80}
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                            <Leaf size={64} className="text-gray-300" />
                                        </div>
                                    )}
                                </div>

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E] via-[#1A1A2E]/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />

                                {/* Content */}
                                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                    {/* Badge */}
                                    <motion.div
                                        className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: hoveredIndex === index ? 1 : 0.9, scale: hoveredIndex === index ? 1.05 : 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <span className="text-xs font-bold text-[#0D7377] uppercase tracking-wider">{t.featured}</span>
                                    </motion.div>

                                    {/* Text Content */}
                                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-[#32E0C4] transition-colors">
                                            {fruit.nombre}
                                        </h3>

                                        {fruit.nombre_en && (
                                            <p className="text-white/70 italic mb-4 text-sm">{fruit.nombre_en}</p>
                                        )}

                                        <p className="text-white/80 line-clamp-2 text-sm mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100"
                                        >
                                            {lang === 'en' && fruit.descripcion_en ? fruit.descripcion_en : fruit.descripcion}
                                        </p>

                                        {/* CTA */}
                                        <motion.div
                                            className="flex items-center gap-2 text-white font-semibold text-sm opacity-0 group-hover:opacity-100 transition-all duration-500 delay-150"
                                            whileHover={{ x: 5 }}
                                        >
                                            <span>{t.discover}</span>
                                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-[#0D7377] transition-colors">
                                                <ArrowRight size={16} />
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Hover Border Effect */}
                                <div className="absolute inset-0 rounded-[2rem] border-2 border-transparent group-hover:border-[#0D7377]/30 transition-colors duration-500 pointer-events-none" />
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Mobile Button */}
                <div className="lg:hidden text-center">
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        whileHover={{ y: -4 }}
                        onClick={() => setIsCatalogOpen(true)}
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-[#0D7377] to-[#14A0A5] text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-[#0D7377]/25"
                    >
                        {t.viewAll}
                        <ExternalLink size={18} />
                    </motion.button>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isDetailModalOpen && (
                    <ProductModal
                        fruit={selectedFruit}
                        isOpen={isDetailModalOpen}
                        onClose={() => setIsDetailModalOpen(false)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isCatalogOpen && (
                    <AllProductsModal
                        isOpen={isCatalogOpen}
                        onClose={() => setIsCatalogOpen(false)}
                        fruits={fruits}
                        onSelectFruit={(fruit) => {
                            setIsCatalogOpen(false);
                            setTimeout(() => openDetailModal(fruit), 100);
                        }}
                    />
                )}
            </AnimatePresence>
        </section>
    );
}
