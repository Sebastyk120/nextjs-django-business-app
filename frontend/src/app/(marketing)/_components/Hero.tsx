"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Leaf, Award, Truck } from "lucide-react";
import { useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function Hero() {
    const { lang } = useLanguage();
    const isMobile = useIsMobile();
    const targetRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"],
    });

    // Disable parallax on mobile for better performance
    const yBackground = useTransform(scrollYProgress, [0, 1], isMobile ? ["0%", "0%"] : ["0%", "30%"]);
    const opacityBackground = useTransform(scrollYProgress, [0, 0.5], isMobile ? [1, 1] : [1, 0]);
    const scaleBackground = useTransform(scrollYProgress, [0, 1], isMobile ? [1, 1] : [1, 1.1]);

    const t = {
        es: {
            pill: "Sabor y Calidad de Origen",
            title1: "Sabores que",
            titleHighlight: "Conquistan",
            title2: "el Mundo",
            desc: "Llevamos la esencia de Colombia a los mercados internacionales. Frutas seleccionadas, frescura garantizada y un compromiso inquebrantable con la sostenibilidad.",
            natural: "100% Natural",
            certified: "GlobalG.A.P.",
            logistics: "Exportación Global"
        },
        en: {
            pill: "Exporters of Excellence",
            title1: "Flavors that",
            titleHighlight: "Conquer",
            title2: "the World",
            desc: "We bring the essence of Colombia to international markets. Selected fruits, guaranteed freshness, and an unwavering commitment to sustainability.",
            natural: "100% Natural",
            certified: "GlobalG.A.P.",
            logistics: "Global Export"
        }
    }[lang];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.12,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring" as const,
                stiffness: 100,
                damping: 20,
                duration: 0.8
            }
        }
    };

    const floatingVariants = {
        animate: {
            y: [0, -8, 0],
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut" as const
            }
        }
    };

    return (
        <section
            ref={targetRef}
            id="inicio"
            className="min-h-screen pt-24 pb-16 flex items-center overflow-hidden relative bg-gradient-to-br from-[#F8FAFC] via-white to-[#FFFBF5]"
        >
            {/* Animated Background Elements */}
            <motion.div
                style={{ y: yBackground, opacity: opacityBackground, scale: scaleBackground }}
                className="absolute inset-0 -z-20"
            >
                {/* Gradient Orbs - Reduced blur for mobile performance */}
                <div className="absolute top-20 right-20 w-[600px] h-[600px] bg-gradient-to-br from-[#0D7377]/5 to-transparent rounded-full blur-xl md:blur-3xl" />
                <div className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-gradient-to-tr from-[#FF6B4A]/5 to-transparent rounded-full blur-xl md:blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#FFB800]/5 via-transparent to-[#0D7377]/5 rounded-full blur-xl md:blur-3xl" />
            </motion.div>

            {/* Grid Pattern Overlay */}
            <div
                className="absolute inset-0 -z-10 opacity-[0.015]"
                style={{
                    backgroundImage: `linear-gradient(#0D7377 1px, transparent 1px), linear-gradient(90deg, #0D7377 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }}
            />

            <div className="container mx-auto px-4 md:px-6 lg:px-8 z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                    {/* Left Content */}
                    <motion.div
                        className="flex-1 text-center lg:text-left pt-8 lg:pt-0"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* Feature Pill */}
                        <motion.div
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-[#0D7377]/10 shadow-sm text-[#0D7377] text-xs font-bold tracking-widest uppercase mb-8"
                            whileHover={{
                                y: -3,
                                boxShadow: "0 20px 40px -10px rgba(13, 115, 119, 0.2)",
                                scale: 1.02
                            }}
                            variants={itemVariants}
                        >
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0D7377] opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0D7377]" />
                            </span>
                            {t.pill}
                        </motion.div>

                        {/* Main Title */}
                        <motion.h1
                            className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold leading-[0.95] mb-8 tracking-tight"
                            variants={itemVariants}
                        >
                            <span className="text-[#1A1A2E]">{t.title1}</span>
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D7377] via-[#14A0A5] to-[#32E0C4]">
                                {t.titleHighlight}
                            </span>
                            <br />
                            <span className="text-[#1A1A2E]">{t.title2}</span>
                        </motion.h1>

                        {/* Description */}
                        <motion.p
                            className="text-lg md:text-xl text-[#4A4A5A] mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light"
                            variants={itemVariants}
                        >
                            {t.desc}
                        </motion.p>

                        {/* Features Grid */}
                        <motion.div
                            className="flex flex-wrap justify-center lg:justify-start gap-6"
                            variants={itemVariants}
                        >
                            {[
                                { icon: Leaf, text: t.natural, color: "#10B981" },
                                { icon: Award, text: t.certified, color: "#0D7377" },
                                { icon: Truck, text: t.logistics, color: "#FF6B4A" }
                            ].map((feature, index) => (
                                <motion.div
                                    key={index}
                                    className="flex items-center gap-3 group cursor-default"
                                    whileHover={{ x: 4 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                >
                                    <div
                                        className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110"
                                        style={{ backgroundColor: `${feature.color}15` }}
                                    >
                                        <feature.icon size={20} style={{ color: feature.color }} />
                                    </div>
                                    <span className="font-semibold text-sm text-[#4A4A5A] group-hover:text-[#1A1A2E] transition-colors">
                                        {feature.text}
                                    </span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Right Image Section */}
                    <motion.div
                        className="lg:flex-[1.1] relative w-full max-w-[580px] lg:max-w-none"
                        initial={{ opacity: 0, x: 80, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                    >
                        {/* Decorative Elements */}
                        {/* Decorative Elements - Simplified for mobile */}
                        <motion.div
                            className="hidden md:block absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-[#FFB800] to-[#FF6B4A] rounded-full opacity-20 blur-2xl"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
                            transition={{ duration: 4, repeat: Infinity }}
                        />
                        <motion.div
                            className="hidden md:block absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-[#0D7377] to-[#14A0A5] rounded-full opacity-20 blur-2xl"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.35, 0.2] }}
                            transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
                        />

                        {/* Main Image Container */}
                        <motion.div
                            className="relative z-10"
                            variants={floatingVariants}
                            animate="animate"
                        >
                            {/* Rotating Frame - Decorative SVG */}
                            <motion.div
                                className="absolute inset-0 rounded-[2.5rem] -z-10"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                style={{ margin: -12 }}
                            >
                                <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                    {/* Esquinas decorativas - estilo marco orgánico/fruta */}
                                    <path
                                        d="M20 80 Q20 20 80 20"
                                        stroke="#0D7377"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        fill="none"
                                        opacity="0.4"
                                    />
                                    <path
                                        d="M380 80 Q380 20 320 20"
                                        stroke="#0D7377"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        fill="none"
                                        opacity="0.4"
                                    />
                                    <path
                                        d="M20 220 Q20 280 80 280"
                                        stroke="#0D7377"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        fill="none"
                                        opacity="0.4"
                                    />
                                    <path
                                        d="M380 220 Q380 280 320 280"
                                        stroke="#0D7377"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        fill="none"
                                        opacity="0.4"
                                    />
                                    {/* Hojas decorativas */}
                                    <ellipse cx="200" cy="10" rx="15" ry="8" fill="#0D7377" opacity="0.3" />
                                    <ellipse cx="200" cy="290" rx="15" ry="8" fill="#0D7377" opacity="0.3" />
                                    <ellipse cx="10" cy="150" rx="8" ry="15" fill="#0D7377" opacity="0.3" />
                                    <ellipse cx="390" cy="150" rx="8" ry="15" fill="#0D7377" opacity="0.3" />
                                </svg>
                            </motion.div>

                            {/* Image Card */}
                            <motion.div
                                className="relative aspect-[4/3.5] rounded-[2rem] overflow-hidden shadow-2xl shadow-[#0D7377]/10"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            >
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0D7377]/30 via-transparent to-transparent z-10" />

                                <Image
                                    src="/landing/mango-hermoso.webp"
                                    alt="Premium Colombian Mango - Heavens Fruits"
                                    fill
                                    className="object-cover transition-transform duration-1000 hover:scale-110"
                                    priority
                                    quality={85}
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />

                                {/* Floating Badge */}
                                <motion.div
                                    className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl z-20"
                                    initial={{ y: 30, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 1, type: "spring", stiffness: 100 }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0D7377] to-[#14A0A5] flex items-center justify-center text-white shadow-lg">
                                            <Award size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[#8A8A9A] uppercase tracking-wider">Calidad Premium</p>
                                            <p className="text-base font-bold text-[#1A1A2E]">Exportación Mundial</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* Floating Stats Card */}
                            <motion.div
                                className="absolute -top-3 -right-3 bg-white p-3 rounded-xl shadow-xl z-20 hidden md:block"
                                initial={{ x: 30, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 1.2, type: "spring", stiffness: 100 }}
                                whileHover={{ y: -3, scale: 1.05 }}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFB800] to-[#FF6B4A] flex items-center justify-center text-white font-bold text-xs">
                                        20+
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#8A8A9A]">Países</p>
                                        <p className="text-xs font-bold text-[#1A1A2E]">Exportando</p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
