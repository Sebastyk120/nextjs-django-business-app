"use client";

import { motion } from "framer-motion";
import { Plane, Package, ClipboardCheck, Headset } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Services() {
    const { lang } = useLanguage();

    const t = {
        es: {
            title: "Servicios Integrales de Exportación",
            desc: "Desde el cultivo hasta tu destino, garantizamos un proceso eficiente y confiable.",
            services: [
                {
                    icon: Plane,
                    title: "Logística Aérea Global",
                    description: "Transporte rápido y seguro para preservar la frescura de nuestras frutas."
                },
                {
                    icon: Package,
                    title: "Empaque Especializado",
                    description: "Soluciones de empaque que cumplen normativas y protegen la calidad del producto."
                },
                {
                    icon: ClipboardCheck,
                    title: "Control de Calidad Riguroso",
                    description: "Inspección en cada etapa, desde la cosecha hasta el embarque final."
                },
                {
                    icon: Headset,
                    title: "Asesoría Personalizada",
                    description: "Acompañamiento experto para facilitar tu proceso de importación."
                }
            ]
        },
        en: {
            title: "Comprehensive Export Services",
            desc: "From cultivation to your destination, we guarantee an efficient and reliable process.",
            services: [
                {
                    icon: Plane,
                    title: "Global Air Logistics",
                    description: "Fast and safe transportation to preserve the freshness of our fruits."
                },
                {
                    icon: Package,
                    title: "Specialized Packaging",
                    description: "Packaging solutions that comply with regulations and protect product quality."
                },
                {
                    icon: ClipboardCheck,
                    title: "Rigorous Quality Control",
                    description: "Inspection at every stage, from harvest to final shipment."
                },
                {
                    icon: Headset,
                    title: "Personalized Advice",
                    description: "Expert guidance to facilitate your import process."
                }
            ]
        }
    }[lang];

    return (
        <section id="servicios" className="py-24 bg-[--color-background-alt]">
            <div className="container mx-auto px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.title}</h2>
                    <p className="text-[--color-text-light] max-w-2xl mx-auto text-lg">
                        {t.desc}
                    </p>
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: { staggerChildren: 0.15 }
                        }
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                >
                    {t.services.map((service, index) => (
                        <motion.div
                            key={index}
                            variants={{
                                hidden: { opacity: 0, y: 50 },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    transition: { type: "spring" as const, stiffness: 60, damping: 15 }
                                }
                            }}
                            whileHover={{ y: -10, boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.1)" }}
                            className="service-card text-center h-full flex flex-col items-center border border-transparent hover:border-[--color-primary-light]/20 transition-all duration-300"
                        >
                            <div className="service-icon-wrapper">
                                <service.icon size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-4 text-[--color-primary]">{service.title}</h3>
                            <p className="text-[--color-text-light] leading-relaxed">
                                {service.description}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

