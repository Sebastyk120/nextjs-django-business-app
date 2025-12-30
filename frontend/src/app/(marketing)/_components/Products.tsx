"use client";

import { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Search, ChevronLeft, ChevronRight, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Fruit } from "@/types/fruit";
import ProductModal from "./ProductModal";

import { useLanguage } from "@/context/LanguageContext";

export default function Products() {
    const { lang } = useLanguage();
    const [fruits, setFruits] = useState<Fruit[]>([]);
    const [filteredFruits, setFilteredFruits] = useState<Fruit[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedFruit, setSelectedFruit] = useState<Fruit | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });

    const t = {
        es: {
            title: "Descubre Nuestra Selección Exótica",
            desc: "Frutas frescas de calidad superior, cultivadas con esmero y listas para exportar.",
            placeholder: "Buscar por nombre de fruta...",
            noResults: "No se encontraron frutas con ese nombre.",
            viewDetails: "Ver Detalles"
        },
        en: {
            title: "Discover Our Exotic Selection",
            desc: "Superior quality fresh fruits, carefully grown and ready for export.",
            placeholder: "Search by fruit name...",
            noResults: "No fruits found with that name.",
            viewDetails: "View Details"
        }
    }[lang];

    useEffect(() => {
        const fetchFruits = async () => {
            try {
                const res = await fetch("/api/fruits");
                if (res.ok) {
                    const data = await res.json();
                    setFruits(data);
                    setFilteredFruits(data);
                }
            } catch (error) {
                console.error("Failed to fetch fruits", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFruits();
    }, []);

    useEffect(() => {
        const filtered = fruits.filter(fruit =>
            fruit.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (fruit.nombre_en && fruit.nombre_en.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredFruits(filtered);
    }, [searchTerm, fruits]);

    const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
    const scrollNext = () => emblaApi && emblaApi.scrollNext();

    const openModal = (fruit: Fruit) => {
        setSelectedFruit(fruit);
        setIsModalOpen(true);
    };

    return (
        <section id="productos" className="py-20 bg-[--color-background-alt]">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-12" data-aos="fade-up">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.title}</h2>
                    <p className="text-[--color-text-light] max-w-2xl mx-auto mb-8">
                        {t.desc}
                    </p>

                    <div className="relative max-w-md mx-auto">
                        <input
                            type="text"
                            placeholder={t.placeholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary] focus:ring-opacity-20 transition-all outline-none"
                        />
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[--color-primary]" size={20} />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[--color-primary]"></div>
                    </div>
                ) : filteredFruits.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-xl text-[--color-text-light]">{t.noResults}</p>
                    </div>
                ) : (

                    <div className="relative group">
                        <div className="overflow-hidden" ref={emblaRef}>
                            <div className="flex gap-6 py-4">
                                {filteredFruits.map((fruit) => (
                                    <div key={fruit.id} className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.33%] min-w-0 pl-4">
                                        <div
                                            className="product-card h-full flex flex-col cursor-pointer"
                                            onClick={() => openModal(fruit)}
                                        >
                                            <div className="relative h-64 overflow-hidden bg-gray-100">
                                                {fruit.imagen ? (
                                                    <Image
                                                        src={fruit.imagen}
                                                        alt={fruit.nombre}
                                                        fill
                                                        className="object-cover transition-transform duration-500 hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                                                        <Leaf size={48} />
                                                    </div>
                                                )}
                                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-[--color-primary] shadow-sm">
                                                    Premium
                                                </div>
                                            </div>
                                            <div className="p-6 flex-grow flex flex-col items-center text-center">
                                                <h3 className="text-xl font-bold mb-2">{fruit.nombre}</h3>
                                                {fruit.nombre_en && (
                                                    <p className="text-sm text-[--color-text-light] italic mb-4">{fruit.nombre_en}</p>
                                                )}
                                                <button className="mt-auto text-[--color-primary] font-semibold text-sm hover:underline">
                                                    {t.viewDetails}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <button
                            onClick={scrollPrev}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white text-[--color-primary] p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:block hover:bg-[--color-primary] hover:text-white"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={scrollNext}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white text-[--color-primary] p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:block hover:bg-[--color-primary] hover:text-white"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                )}
            </div>

            <ProductModal
                fruit={selectedFruit}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </section>
    );
}
