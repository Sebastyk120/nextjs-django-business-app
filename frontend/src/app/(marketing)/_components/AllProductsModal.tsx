"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Leaf } from "lucide-react";
import Image from "next/image";
import { Fruit } from "@/types/fruit";
import { useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";

interface AllProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
    fruits: Fruit[];
    onSelectFruit: (fruit: Fruit) => void;
}

export default function AllProductsModal({ isOpen, onClose, fruits, onSelectFruit }: AllProductsModalProps) {
    const { lang } = useLanguage();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    const t = {
        es: {
            title: "Nuestro Catálogo Completo",
            subtitle: "Explora la variedad de frutas exóticas que llevamos al mundo.",
            searchPlaceholder: "Buscar fruta...",
            all: "Todas",
            noResults: "No encontramos frutas que coincidan con tu búsqueda.",
        },
        en: {
            title: "Our Full Catalog",
            subtitle: "Explore the variety of exotic fruits we bring to the world.",
            searchPlaceholder: "Search fruit...",
            all: "All",
            noResults: "We couldn't find any fruits matching your search.",
        }
    }[lang];

    const filteredFruits = useMemo(() => {
        return fruits.filter(fruit => {
            const matchesSearch = fruit.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (fruit.nombre_en && fruit.nombre_en.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesSearch;
        });
    }, [fruits, searchTerm]);

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
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-gray-100 flex-shrink-0 bg-white z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{t.title}</h2>
                                    <p className="text-gray-500">{t.subtitle}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <X size={24} className="text-gray-600" />
                                </button>
                            </div>

                            <div className="relative max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder={t.searchPlaceholder}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[--color-primary] focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Scrolling Grid */}
                        <div className="flex-grow overflow-y-auto p-8 custom-scrollbar bg-gray-50/50">
                            {filteredFruits.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <Leaf size={64} className="mb-4 opacity-50" />
                                    <p className="text-xl">{t.noResults}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {filteredFruits.map((fruit, index) => (
                                        <motion.div
                                            key={fruit.id}
                                            layoutId={`fruit-card-${fruit.id}`}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileHover={{ y: -5 }}
                                            onClick={() => onSelectFruit(fruit)}
                                            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl border border-gray-100 cursor-pointer group transition-all duration-300"
                                        >
                                            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-4">
                                                {fruit.imagen ? (
                                                    <Image
                                                        src={fruit.imagen}
                                                        alt={fruit.nombre}
                                                        fill
                                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                                                        <Leaf size={32} />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded-full p-2 text-[--color-primary]">
                                                    <Search size={16} />
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <h3 className="font-bold text-gray-900 group-hover:text-[--color-primary] transition-colors">
                                                    {fruit.nombre}
                                                </h3>
                                                {fruit.nombre_en && (
                                                    <p className="text-xs text-gray-500 italic mt-1">
                                                        {fruit.nombre_en}
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
