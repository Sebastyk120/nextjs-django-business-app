"use client";

import { motion } from "framer-motion";
import { Plane, Package, ClipboardCheck, Headset, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Services() {
    const { lang } = useLanguage();

    const t = {
        es: {
            eyebrow: "Nuestros Servicios",
            title: "Soluciones Integrales de",
            titleHighlight: "Exportación",
            desc: "Desde el cultivo hasta tu destino, garantizamos un proceso eficiente, confiable y de la más alta calidad.",
            services: [
                {
                    icon: Plane,
                    title: "Logística Aérea Global",
                    description: "Transporte rápido y seguro para preservar la frescura de nuestras frutas en cada destino."
                },
                {
                    icon: Package,
                    title: "Empaque Especializado",
                    description: "Soluciones de empaque que cumplen normativas internacionales y protegen la calidad del producto."
                },
                {
                    icon: ClipboardCheck,
                    title: "Control de Calidad",
                    description: "Inspección rigurosa en cada etapa, desde la cosecha hasta el embarque final."
                },
                {
                    icon: Headset,
                    title: "Asesoría Personalizada",
                    description: "Acompañamiento experto para facilitar tu proceso de importación y exportación."
                }
            ]
        },
        en: {
            eyebrow: "Our Services",
            title: "Comprehensive",
            titleHighlight: "Export Solutions",
            desc: "From cultivation to your destination, we guarantee an efficient, reliable, and highest quality process.",
            services: [
                {
                    icon: Plane,
                    title: "Global Air Logistics",
                    description: "Fast and safe transportation to preserve the freshness of our fruits at every destination."
                },
                {
                    icon: Package,
                    title: "Specialized Packaging",
                    description: "Packaging solutions that comply with international regulations and protect product quality."
                },
                {
                    icon: ClipboardCheck,
                    title: "Quality Control",
                    description: "Rigorous inspection at every stage, from harvest to final shipment."
                },
                {
                    icon: Headset,
                    title: "Personalized Advice",
                    description: "Expert guidance to facilitate your import and export process."
                }
            ]
        }
    }[lang];

    return (
        <section id="servicios" className="py-32 bg-[#0A2E2F] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0D7377]/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0D7377]/50 to-transparent" />
                
                <motion.div
                    className="absolute top-20 right-20 w-[400px] h-[400px] bg-[#0D7377]/10 rounded-full blur-[100px]"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
                
                <motion.div
                    className="absolute bottom-20 left-20 w-[300px] h-[300px] bg-[#FF6B4A]/10 rounded-full blur-[100px]"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity, delay: 2 }}
                />
            </div>

            <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center mb-20"
                >
                    <motion.span 
                        className="inline-flex items-center gap-2 text-[#32E0C4] font-bold tracking-widest uppercase text-xs mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <Sparkles size={16} />
                        {t.eyebrow}
                    </motion.span>

                    <motion.h2 
                        className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                    >
                        {t.title}{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#32E0C4] to-[#0D7377]">
                            {t.titleHighlight}
                        </span>
                    </motion.h2>

                    <motion.p 
                        className="text-lg text-white/70 max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                    >
                        {t.desc}
                    </motion.p>
                </motion.div>

                {/* Services Grid */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: { staggerChildren: 0.12 }
                        }
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {t.services.map((service, index) => (
                        <motion.div
                            key={index}
                            variants={{
                                hidden: { opacity: 0, y: 50, scale: 0.95 },
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
                            whileHover={{ y: -12 }}
                            className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 overflow-hidden"
                        >
                            {/* Gradient Border on Hover */}
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#0D7377]/50 to-[#32E0C4]/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl" />
                            
                            {/* Top Line */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0D7377] to-[#32E0C4] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                            {/* Icon */}
                            <div className="relative mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0D7377]/20 to-[#32E0C4]/20 flex items-center justify-center group-hover:from-[#0D7377] group-hover:to-[#32E0C4] transition-all duration-500">
                                    <service.icon size={32} className="text-[#32E0C4] group-hover:text-white transition-colors" />
                                </div>
                                
                                {/* Glow Effect */}
                                <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-[#0D7377] opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500" />
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-bold mb-3 text-white group-hover:text-[#32E0C4] transition-colors">
                                {service.title}
                            </h3>
                            
                            <p className="text-white/60 leading-relaxed text-sm">
                                {service.description}
                            </p>

                            {/* Number */}
                            <div className="absolute top-6 right-6 text-5xl font-bold text-white/5 group-hover:text-white/10 transition-colors">
                                0{index + 1}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
