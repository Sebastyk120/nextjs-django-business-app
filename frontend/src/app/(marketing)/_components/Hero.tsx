"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Star, Leaf, Award, Truck } from "lucide-react";
import { useRef } from "react";

import { useLanguage } from "@/context/LanguageContext";

export default function Hero() {
    const { lang } = useLanguage();
    const targetRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"],
    });

    const yBackground = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacityBackground = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    const t = {
        es: {
            pill: "Sabor y Calidad de Origen",
            title1: "Colombia en tu Paladar:",
            title2: "¡Sabores Exóticos Inolvidables!",
            desc: "Llevamos la riqueza de nuestros campos directamente a tu mercado. Frutas seleccionadas, frescura garantizada y un compromiso inquebrantable con la sostenibilidad.",
            natural: "100% Natural",
            certified: "Certificación GlobalG.A.P.",
            logistics: "Logística Global"
        },
        en: {
            pill: "Origin Taste & Quality",
            title1: "Colombia on your Palate:",
            title2: "Unforgettable Exotic Flavors!",
            desc: "We bring the richness of our fields directly to your market. Selected fruits, guaranteed freshness, and an unwavering commitment to sustainability.",
            natural: "100% Natural",
            certified: "GlobalG.A.P. Certified",
            logistics: "Global Logistics"
        }
    }[lang];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring" as const, stiffness: 50, damping: 20 }
        }
    };

    return (
        <section ref={targetRef} id="inicio" className="min-h-screen pt-28 pb-20 flex items-center overflow-hidden relative">
            {/* Sophisticated Background with Parallax */}
            <motion.div
                style={{ y: yBackground, opacity: opacityBackground }}
                className="absolute inset-0 bg-gradient-to-br from-[#f8f9fc] via-[#fff] to-[#f0fdf4] -z-20"
            ></motion.div>

            {/* Organic Shape Decoration */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(0,91,96,0.03)_0%,transparent_70%)] rounded-full blur-3xl -z-10 -translate-y-1/4 translate-x-1/4"
            ></motion.div>

            <div className="container mx-auto px-4 md:px-6 z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">

                    {/* Left Content */}
                    <motion.div
                        className="flex-1 text-center lg:text-left pt-8 lg:pt-0"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-gray-100 shadow-sm text-[--color-primary] text-sm font-bold tracking-wide uppercase mb-8"
                            whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                            variants={itemVariants}
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366]"></span>
                            </span>
                            {t.pill}
                        </motion.div>

                        <motion.h1
                            className="text-5xl md:text-6xl lg:text-[5rem] font-extrabold leading-[1.1] mb-8 font-heading text-[#1a1a1a] tracking-tight"
                            variants={itemVariants}
                        >
                            {t.title1} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[--color-primary] via-[#0A7778] to-[--color-secondary] drop-shadow-sm">
                                {t.title2}
                            </span>
                        </motion.h1>

                        <motion.p
                            className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-body"
                            variants={itemVariants}
                        >
                            {t.desc}
                        </motion.p>

                        {/* Features Grid */}
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 border-l-4 border-[--color-primary] pl-6 py-2 bg-gradient-to-r from-gray-50 to-transparent"
                            variants={itemVariants}
                        >
                            <div className="flex items-center gap-3 group">
                                <div className="p-2 bg-green-100 rounded-lg text-green-700 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                                    <Leaf size={20} />
                                </div>
                                <span className="font-semibold text-sm text-gray-700">{t.natural}</span>
                            </div>
                            <div className="flex items-center gap-3 group">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                    <Award size={20} />
                                </div>
                                <span className="font-semibold text-sm text-gray-700">{t.certified}</span>
                            </div>
                            <div className="flex items-center gap-3 group">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-700 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                                    <Truck size={20} />
                                </div>
                                <span className="font-semibold text-sm text-gray-700">{t.logistics}</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right Image */}
                    <motion.div
                        className="lg:flex-[1.3] relative w-full max-w-[600px] lg:max-w-none"
                        initial={{ opacity: 0, x: 50, rotate: 5 }}
                        animate={{ opacity: 1, x: 0, rotate: 0 }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    >
                        {/* Abstract backdrop blob */}
                        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] -z-10 opacity-30 text-yellow-200 fill-current animate-spin-slow">
                            <path d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-4.9C93.5,9.3,82.1,22.9,70.6,33.5C59.1,44.1,47.5,51.7,35.8,59.2C24.1,66.7,12.3,74.1,-1.3,76.4C-15,78.7,-28.3,75.9,-40.3,68.6C-52.3,61.3,-63,49.5,-70.5,36.2C-78,22.9,-82.3,8.1,-79.8,-5.4C-77.3,-18.9,-68,-31.1,-57.4,-41.8C-46.8,-52.5,-34.9,-61.7,-22.1,-66.6C-9.3,-71.5,4.3,-72.1,17.7,-71.6L30.5,-76.4Z" transform="translate(100 100)" />
                        </svg>

                        <div className="relative z-10">
                            <motion.div
                                className="relative aspect-[3/2] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200/50 group"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                                <Image
                                    src="/landing/mango-hermoso.webp"
                                    alt="Mango Premium Colombiano Heavens Fruits"
                                    fill
                                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                    priority
                                    quality={100}
                                />
                            </motion.div>

                            {/* Floating Premium Badge */}
                            <motion.div
                                className="absolute -bottom-8 -left-8 bg-white p-6 rounded-2xl shadow-xl z-20 hidden md:block border border-gray-50"
                                initial={{ y: 40, opacity: 0, scale: 0.8 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                transition={{
                                    delay: 0.8,
                                    type: "spring",
                                    stiffness: 100,
                                    damping: 10
                                }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#005B60] flex items-center justify-center text-white">
                                        <Award size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Garantía</p>
                                        <p className="text-lg font-bold text-gray-800">Calidad Exportación</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
