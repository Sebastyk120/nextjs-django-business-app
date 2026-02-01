"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Leaf, HeartHandshake, Award, ArrowRight, Target, Globe } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function AboutUs() {
    const { lang } = useLanguage();

    const t = {
        es: {
            eyebrow: "Nuestra Esencia",
            title: "Pasión por la",
            titleHighlight: "Fruta Colombiana",
            desc: "En Heavens Fruits, somos más que exportadores; somos embajadores del sabor y la riqueza de Colombia. Nuestro compromiso es conectar al mundo con frutas exóticas de calidad insuperable, cultivadas con respeto por la tierra y nuestros agricultores.",
            features: [
                {
                    icon: Leaf,
                    title: "Sostenibilidad",
                    desc: "Prácticas agrícolas responsables que protegen nuestro planeta"
                },
                {
                    icon: HeartHandshake,
                    title: "Comercio Justo",
                    desc: "Relaciones directas con agricultores locales"
                },
                {
                    icon: Award,
                    title: "Calidad Premium",
                    desc: "Estándares internacionales de exportación"
                }
            ],
            stats: [
                { value: "23+", label: "Variedades de Frutas" },
                { value: "20+", label: "Países Exportando" },
                { value: "24/7", label: "Control de Calidad" }
            ],
            cta: "Conoce Más Sobre Nosotros"
        },
        en: {
            eyebrow: "Our Essence",
            title: "Passion for",
            titleHighlight: "Colombian Fruit",
            desc: "At Heavens Fruits, we are more than exporters; we are ambassadors of Colombia's flavor and richness. Our commitment is to connect the world with exotic fruits of unsurpassed quality, grown with respect for the land and our farmers.",
            features: [
                {
                    icon: Leaf,
                    title: "Sustainability",
                    desc: "Responsible agricultural practices that protect our planet"
                },
                {
                    icon: HeartHandshake,
                    title: "Fair Trade",
                    desc: "Direct relationships with local farmers"
                },
                {
                    icon: Award,
                    title: "Premium Quality",
                    desc: "International export standards"
                }
            ],
            stats: [
                { value: "23+", label: "Fruit Varieties" },
                { value: "20+", label: "Countries Exporting" },
                { value: "24/7", label: "Quality Control" }
            ],
            cta: "Learn More About Us"
        }
    }[lang];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
        }
    };

    return (
        <section id="nosotros" className="py-32 bg-white relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#0D7377]/3 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#FFB800]/5 to-transparent rounded-full blur-3xl" />

            <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                    {/* Left Content */}
                    <motion.div
                        className="flex-1"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={containerVariants}
                    >
                        <motion.span 
                            variants={itemVariants}
                            className="inline-flex items-center gap-2 text-[#0D7377] font-bold tracking-widest uppercase text-xs mb-4"
                        >
                            <Target size={16} />
                            {t.eyebrow}
                        </motion.span>

                        <motion.h2 
                            variants={itemVariants} 
                            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                        >
                            {t.title}
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D7377] to-[#14A0A5]">
                                {t.titleHighlight}
                            </span>
                        </motion.h2>

                        <motion.p 
                            variants={itemVariants} 
                            className="text-lg text-[#4A4A5A] mb-10 leading-relaxed"
                        >
                            {t.desc}
                        </motion.p>

                        {/* Features Grid */}
                        <motion.div 
                            variants={itemVariants} 
                            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
                        >
                            {t.features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    className="group p-6 rounded-2xl bg-[#F8FAFC] hover:bg-white hover:shadow-xl transition-all duration-500 border border-transparent hover:border-[#0D7377]/10"
                                    whileHover={{ y: -8 }}
                                >
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0D7377]/10 to-[#14A0A5]/10 flex items-center justify-center mb-4 group-hover:from-[#0D7377] group-hover:to-[#14A0A5] transition-all duration-500">
                                        <feature.icon size={28} className="text-[#0D7377] group-hover:text-white transition-colors" />
                                    </div>
                                    <h5 className="font-bold text-[#1A1A2E] mb-2">{feature.title}</h5>
                                    <p className="text-sm text-[#8A8A9A]">{feature.desc}</p>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* CTA */}
                        <motion.div variants={itemVariants}>
                            <Link 
                                href="#contacto" 
                                className="group inline-flex items-center gap-3 bg-[#1A1A2E] text-white px-8 py-4 rounded-full font-bold hover:bg-[#0D7377] transition-all duration-300"
                            >
                                {t.cta}
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Right Image */}
                    <motion.div
                        className="flex-1 relative"
                        initial={{ opacity: 0, x: 60 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Main Image */}
                        <motion.div 
                            className="relative rounded-[2.5rem] overflow-hidden shadow-2xl"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="relative w-full aspect-[4/5]">
                                <Image
                                    src="/landing/canasta_fruta.jpg"
                                    alt="Heavens Fruits - Fresh Colombian Fruits"
                                    fill
                                    className="object-cover"
                                />
                                
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0D7377]/40 via-transparent to-transparent" />
                            </div>

                            {/* Stats Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-8">
                                <div className="grid grid-cols-3 gap-4">
                                    {t.stats.map((stat, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.5 + index * 0.1 }}
                                            className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl text-center shadow-lg"
                                        >
                                            <p className="text-2xl font-bold text-[#0D7377]">{stat.value}</p>
                                            <p className="text-xs text-[#8A8A9A]">{stat.label}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Floating Badge */}
                        <motion.div
                            className="absolute -top-6 -right-6 bg-white p-5 rounded-2xl shadow-xl hidden lg:block"
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6, type: "spring" }}
                            whileHover={{ y: -5 }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFB800] to-[#FF6B4A] flex items-center justify-center text-white">
                                    <Globe size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-[#8A8A9A]">Presencia</p>
                                    <p className="font-bold text-[#1A1A2E]">Global</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
