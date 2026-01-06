"use client";

import { motion } from "framer-motion";
import { Quote, Users, Heart, TrendingUp, Globe } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

export default function ImpactStory() {
    const { lang } = useLanguage();

    const t = {
        es: {
            eyebrow: "Nuestra Historia",
            title: "De Frutas Importadas a Pioneras en Medio Oriente",
            quote: "Aprovechando todo el historial y la experiencia de las frutas decidimos empezar a exportar... Normalmen el cliente que te pide un fruto te pide 10, van todos de la mano... nuestro valor agregado es tener un portafolio completo.",
            author: "Valentina Garay Díaz",
            role: "Gerente Comercial",
            impactTitle: "Un Legado de Perseverancia",
            impactDesc: "Todo comenzó en el 2000 con Mabelly Díaz comercializando fruta importada. Diez años después, junto a su hija Valentina, transformaron esa pasión en Heaven's Fruits. Hoy, lideran la exportación de mango de azúcar tras ser las primeras en llegar a Medio Oriente y proyectan conquistar el mercado de EE.UU.",
            stats: [
                { label: "Mercados Activos", value: "20+", icon: Globe },
                { label: "Exportación Semestral", value: "347 Ton", icon: TrendingUp },
                { label: "Referencias de Frutas", value: "23+", icon: Heart },
            ],
            collab: "Visión 2024-2026",
            collabDesc: "Tras conquistar Europa y Medio Oriente (Dubái, Catar, Kuwait), la nueva frontera es Estados Unidos, aprovechando la admisibilidad fitosanitaria para el mango."
        },
        en: {
            eyebrow: "Our Story",
            title: "From Imported Fruits to Pioneers in the Middle East",
            quote: "Leveraging all our history and fruit experience, we decided to start exporting... Usually, a client asking for one fruit asks for 10, they go hand in hand... our added value is having a complete portfolio.",
            author: "Valentina Garay Díaz",
            role: "Commercial Manager",
            impactTitle: "A Legacy of Perseverance",
            impactDesc: "It all started in 2000 with Mabelly Díaz marketing imported fruit. Ten years later, alongside her daughter Valentina, they transformed that passion into Heaven's Fruits. Today, they lead sugar mango exports after being the first to reach the Middle East and are projecting to conquer the US market.",
            stats: [
                { label: "Active Markets", value: "20+", icon: Globe },
                { label: "Semiannual Export", value: "347 Tons", icon: TrendingUp },
                { label: "Fruit References", value: "23+", icon: Heart },
            ],
            collab: "Vision 2024-2026",
            collabDesc: "After conquering Europe and the Middle East (Dubai, Qatar, Kuwait), the new frontier is the United States, leveraging phytosanitary admissibility for mango."
        }
    }[lang];

    return (
        <section id="historia" className="py-24 bg-[#0a2e2f] text-white relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('/landing/bg-pattern.png')" }}></div>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[--color-primary] opacity-20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left Column: Story & Philosophy */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="text-[--color-secondary] font-bold tracking-widest uppercase text-sm mb-4 block">
                            {t.eyebrow}
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                            {t.title}
                        </h2>

                        <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm mb-10 relative">
                            <Quote className="absolute top-6 left-6 text-[--color-secondary] opacity-50" size={40} />
                            <p className="text-xl italic text-gray-200 leading-relaxed pl-8 relative z-10 mb-6">
                                "{t.quote}"
                            </p>
                            <div className="flex items-center gap-4 pl-8">
                                <div className="w-12 h-12 rounded-full bg-[--color-secondary] flex items-center justify-center text-[#0a2e2f] font-bold text-xl">
                                    VG
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">{t.author}</h4>
                                    <p className="text-sm text-[--color-secondary]">{t.role}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold mb-4 text-[--color-secondary] flex items-center gap-2">
                                <Heart size={24} /> {t.impactTitle}
                            </h3>
                            <p className="text-gray-300 leading-relaxed text-lg mb-6">
                                {t.impactDesc}
                            </p>
                            <div className="p-4 bg-white/5 rounded-xl border-l-4 border-[--color-secondary]">
                                <h4 className="font-bold mb-1">{t.collab}</h4>
                                <p className="text-sm text-gray-400">{t.collabDesc}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Visuals & Stats */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        {/* Main Image Container */}
                        <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/10 aspect-[4/5] bg-gray-800">
                            <Image
                                src="/landing/historia_heavens.webp"
                                alt="Historia de Heavens Fruits - Mabelly Díaz y Valentina Garay"
                                fill
                                className="object-cover opacity-80 hover:opacity-100 transition-opacity duration-700"
                            />
                            {/* Overlay Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-[#0a2e2f] via-transparent to-transparent">
                                <div className="grid grid-cols-1 gap-4">
                                    {t.stats.map((stat, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.5 + (index * 0.1) }}
                                            className="bg-white/10 backdrop-blur-md p-4 rounded-2xl flex items-center gap-4 border border-white/5 hover:bg-white/20 transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-[--color-secondary] flex items-center justify-center text-[#0a2e2f]">
                                                <stat.icon size={20} />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                                                <p className="text-xs text-gray-300 uppercase tracking-wide">{stat.label}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </motion.div>

                </div>
            </div>
        </section>
    );
}
