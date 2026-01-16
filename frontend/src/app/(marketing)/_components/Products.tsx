
"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Leaf, Star } from "lucide-react";
import { motion } from "framer-motion";
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

    const t = {
        es: {
            sub: "Nuestra Selección",
            title: "Frutas Exóticas de Calidad Mundial",
            desc: "Descubre el sabor auténtico de Colombia. Contamos con un portafolio de más de 23 frutas exóticas listas para exportar.",
            viewAll: "Ver Catálogo Completo (23+ Frutas)",
            featured: "Destacados"
        },
        en: {
            sub: "Our Selection",
            title: "World Class Exotic Fruits",
            desc: "Discover the authentic taste of Colombia. We have a portfolio of over 23 exotic fruits ready for export.",
            viewAll: "View Full Catalog (23+ Fruits)",
            featured: "Featured"
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

    // Show only first 6 fruits for the teaser
    const featuredFruits = fruits.slice(0, 6);

    return (
        <section id="productos" className="py-24 bg-[--color-background-alt]">
            <div className="container mx-auto px-4 md:px-6">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6"
                >
                    <div className="max-w-2xl">
                        <span className="text-[--color-primary] font-bold tracking-wider uppercase text-sm mb-2 block">{t.sub}</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t.title}</h2>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            {t.desc}
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsCatalogOpen(true)}
                        className="hidden md:flex items-center gap-2 bg-[--color-primary] text-white px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl hover:bg-[--color-secondary] transition-all"
                    >
                        {t.viewAll} <ArrowRight size={20} />
                    </motion.button>
                </motion.div>

                {/* Featured Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[--color-primary]"></div>
                    </div>
                ) : (
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.1
                                }
                            }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
                    >
                        {featuredFruits.map((fruit, index) => (
                            <motion.div
                                key={fruit.id}
                                variants={{
                                    hidden: { opacity: 0, y: 50 },
                                    visible: {
                                        opacity: 1,
                                        y: 0,
                                        transition: { type: "spring" as const, stiffness: 50, damping: 20 }
                                    }
                                }}
                                onClick={() => openDetailModal(fruit)}
                                className="group relative h-[400px] rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-500"
                            >
                                {/* Background Image */}
                                {fruit.imagen ? (
                                    <Image
                                        src={fruit.imagen}
                                        alt={fruit.nombre}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                                        <Leaf size={48} className="text-gray-400" />
                                    </div>
                                )}

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity duration-300"></div>

                                {/* Content */}
                                <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-2xl font-bold text-white group-hover:text-[--color-accent] transition-colors">{fruit.nombre}</h3>
                                        <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                                            <ArrowRight className="text-white" size={20} />
                                        </div>
                                    </div>
                                    {fruit.nombre_en && (
                                        <p className="text-white/80 italic mb-4 text-sm font-light">{fruit.nombre_en}</p>
                                    )}
                                    <p className="text-white/70 line-clamp-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75">
                                        {lang === 'en' && fruit.descripcion_en ? fruit.descripcion_en : fruit.descripcion}
                                    </p>
                                </div>

                                {/* Floating Badge */}
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[--color-primary] shadow-sm flex items-center gap-1">
                                    <Star size={12} fill="currentColor" /> Premium
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Mobile Button */}
                <div className="md:hidden text-center">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsCatalogOpen(true)}
                        className="flex w-full justify-center items-center gap-2 bg-[--color-primary] text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-[--color-secondary] transition-colors"
                    >
                        {t.viewAll} <ArrowRight size={20} />
                    </motion.button>
                </div>
            </div>

            {/* Modals */}
            <ProductModal
                fruit={selectedFruit}
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
            />

            <AllProductsModal
                isOpen={isCatalogOpen}
                onClose={() => setIsCatalogOpen(false)}
                fruits={fruits}
                onSelectFruit={(fruit) => {
                    setIsCatalogOpen(false); // Close catalog
                    // Short timeout to allow catalog close animation to start/finish smoothly if needed
                    setTimeout(() => openDetailModal(fruit), 100);
                }}
            />
        </section>
    );
}
