"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Leaf, HeartHandshake, Award } from "lucide-react";
import Link from "next/link";

import { useLanguage } from "@/context/LanguageContext";

export default function AboutUs() {
    const { lang } = useLanguage();

    const t = {
        es: {
            title: "Pasión por la Fruta Colombiana",
            desc: "En Heavens Fruits, somos más que exportadores; somos embajadores del sabor y la riqueza de Colombia. Nuestro compromiso es conectar al mundo con frutas exóticas de calidad insuperable, cultivadas con respeto por la tierra y nuestros agricultores.",
            sustainability: "Sostenibilidad",
            fairTrade: "Comercio Justo",
            premiumQuality: "Calidad Premium",
            learnMore: "Conoce Más Sobre Nosotros"
        },
        en: {
            title: "Passion for Colombian Fruit",
            desc: "At Heavens Fruits, we are more than exporters; we are ambassadors of Colombia's flavor and richness. Our commitment is to connect the world with exotic fruits of unsurpassed quality, grown with respect for the land and our farmers.",
            sustainability: "Sustainability",
            fairTrade: "Fair Trade",
            premiumQuality: "Premium Quality",
            learnMore: "Learn More About Us"
        }
    }[lang];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <section id="nosotros" className="py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                    <motion.div
                        className="flex-1"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={containerVariants}
                    >
                        <motion.h2 variants={itemVariants} className="text-3xl md:text-4xl font-bold mb-6">
                            {t.title}
                        </motion.h2>

                        <motion.p variants={itemVariants} className="text-lg text-[--color-text] mb-10 leading-relaxed">
                            {t.desc}
                        </motion.p>

                        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center p-4 rounded-xl hover:bg-green-50 transition-colors group">
                                <div className="w-16 h-16 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Leaf size={32} />
                                </div>
                                <h5 className="font-bold text-[--color-primary]">{t.sustainability}</h5>
                            </div>

                            <div className="text-center p-4 rounded-xl hover:bg-orange-50 transition-colors group">
                                <div className="w-16 h-16 mx-auto bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <HeartHandshake size={32} />
                                </div>
                                <h5 className="font-bold text-[--color-primary]">{t.fairTrade}</h5>
                            </div>

                            <div className="text-center p-4 rounded-xl hover:bg-yellow-50 transition-colors group">
                                <div className="w-16 h-16 mx-auto bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Award size={32} />
                                </div>
                                <h5 className="font-bold text-[--color-primary]">{t.premiumQuality}</h5>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="mt-10 text-center lg:text-left">
                            <Link href="#contacto" className="btn-primary-custom inline-block">
                                {t.learnMore}
                            </Link>
                        </motion.div>
                    </motion.div>


                    <motion.div
                        className="flex-1 relative"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl skew-y-3 hover:skew-y-0 transition-transform duration-700">
                            <div className="relative w-full aspect-[4/3] bg-gray-200">
                                <Image
                                    src="/landing/canasta_fruta.jpg"
                                    alt="Equipo Heavens Fruits"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                        {/* Background blob */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[--color-secondary] opacity-5 rounded-full blur-3xl -z-10"></div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
