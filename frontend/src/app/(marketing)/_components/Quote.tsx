"use client";

import { Quote as QuoteIcon } from "lucide-react";
import { motion } from "framer-motion";

import { useLanguage } from "@/context/LanguageContext";

export default function Quote() {
    const { lang } = useLanguage();
    const t = {
        es: {
            text: '"Dentro de cada semilla está el potencial para una gran cosecha. Quién recibe agradecido recoge una cosecha abundante"',
            author: "— William Blake"
        },
        en: {
            text: '"Within every seed is the potential for a great harvest. He who receives gratefully gathers a bountiful harvest"',
            author: "— William Blake"
        }
    }[lang];

    return (
        <section className="relative py-24 bg-fixed bg-cover bg-center overflow-hidden"
            style={{
                backgroundImage: 'linear-gradient(rgba(0, 91, 96, 0.85), rgba(0, 91, 96, 0.85)), url("/landing/Caja-de-Mango_.webp")',
                backgroundAttachment: "fixed"
            }}>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <motion.div
                    className="max-w-3xl mx-auto text-center relative"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <QuoteIcon className="absolute -top-8 -left-8 md:-left-16 text-[--color-secondary] opacity-30 w-16 h-16 md:w-24 md:h-24 transform -scale-x-100" />

                    <blockquote className="text-2xl md:text-3xl lg:text-4xl text-white font-serif italic leading-relaxed mb-6">
                        {t.text}
                    </blockquote>

                    <footer className="text-[--color-accent] font-bold text-lg md:text-xl mt-4">
                        {t.author}
                    </footer>

                    <QuoteIcon className="absolute -bottom-8 -right-8 md:-right-16 text-[--color-secondary] opacity-30 w-16 h-16 md:w-24 md:h-24" />
                </motion.div>
            </div>
        </section>
    );
}
