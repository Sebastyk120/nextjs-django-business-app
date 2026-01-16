"use client";

import { motion } from "framer-motion";
import { TrendingUp, Globe, Award, Rocket } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Projections() {
    const { lang } = useLanguage();

    const t = {
        es: {
            sub: "Nuestra Trayectoria y Visión",
            title: "Pioneros en el Mundo",
            desc: "Desde nuestros inicios comercializando fruta importada hasta convertirnos en líderes exportadores, nuestra historia es de constante evolución.",
            stats: [
                {
                    icon: Globe,
                    value: "20+",
                    label: "Mercados Conquistados",
                    desc: "Llevando el sabor de Colombia a más de 20 destinos internacionales."
                },
                {
                    icon: Award,
                    value: "#1",
                    label: "Pioneros en Exportación",
                    desc: "Primera empresa en llevar Mango de Azúcar al exigente mercado de Medio Oriente - Heaven's Fruits."
                },
                {
                    icon: TrendingUp,
                    value: "2026",
                    label: "Proyección Global",
                    desc: "Para el 2026, proyectamos expandir nuestra presencia a 3 nuevos continentes con un crecimiento sostenido del 50% anual."
                }
            ],
            articleLink: "Leer Historia Completa"
        },
        en: {
            sub: "Our Trajectory and Vision",
            title: "Pioneers in the World",
            desc: "From our beginnings marketing imported fruit to becoming leading exporters, our story is one of constant evolution.",
            stats: [
                {
                    icon: Globe,
                    value: "20+",
                    label: "Markets Conquered",
                    desc: "Bringing the taste of Colombia to more than 20 international destinations."
                },
                {
                    icon: Award,
                    value: "#1",
                    label: "Export Pioneers",
                    desc: "First company to take Sugar Mango to the demanding Middle East market - Heaven's Fruits."
                },
                {
                    icon: TrendingUp,
                    value: "2026",
                    label: "Global Projection",
                    desc: "By 2026, we project expanding our presence to 3 new continents with a sustained 50% annual growth."
                }
            ],
            articleLink: "Read Full Story"
        }
    }[lang];

    return (
        <section id="trayectoria" className="py-24 bg-white relative overflow-hidden">
            {/* Decorativo de fondo */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[--color-primary] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-[--color-secondary] opacity-5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-[--color-secondary] font-semibold tracking-wider text-sm uppercase block mb-3"
                    >
                        {t.sub}
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold mb-6 text-gray-900"
                    >
                        {t.title}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-gray-600 leading-relaxed"
                    >
                        {t.desc}
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                    {t.stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            whileHover={{ y: -10 }}
                            className="bg-gray-50 rounded-2xl p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-[--color-primary] group-hover:scale-110 transition-transform duration-300">
                                    <stat.icon size={32} strokeWidth={1.5} />
                                </div>
                                <div className="text-5xl font-bold text-[--color-primary] mb-3 font-heading tracking-tight">
                                    {stat.value}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3 ml-1">
                                    {stat.label}
                                </h3>
                                <p className="text-gray-600 leading-relaxed text-sm ml-1">
                                    {stat.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 }}
                    className="mt-16 text-center"
                >
                    <a
                        href="https://www.agronegocios.co/agricultura/heavens-fruits-es-la-empresa-pionera-en-exportar-mango-de-azucar-a-medio-oriente-3474509"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[--color-primary] hover:text-[--color-secondary] font-semibold border-b-2 border-[--color-primary] hover:border-[--color-secondary] transition-colors pb-1"
                    >
                        {t.articleLink} <Rocket size={16} />
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
