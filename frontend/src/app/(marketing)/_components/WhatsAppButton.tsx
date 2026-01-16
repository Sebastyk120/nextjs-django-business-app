"use client";

import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

import { useLanguage } from "@/context/LanguageContext";

export default function WhatsAppButton() {
    const { lang } = useLanguage();
    const t = {
        es: {
            text: "¡Chatea con nosotros!",
            message: "Hola, estoy interesado en importar frutas colombianas."
        },
        en: {
            text: "Chat with us!",
            message: "Hello, I am interested in importing Colombian fruits."
        }
    }[lang];

    return (
        <motion.a
            href={`https://wa.me/573202744313?text=${encodeURIComponent(t.message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-8 right-8 z-40 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:shadow-2xl transition-all hover:scale-110 flex items-center justify-center group"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: "spring" }}
            whileHover={{ y: -5 }}
        >
            <div className="absolute inset-0 bg-[#25D366] rounded-full animate-ping opacity-75 group-hover:opacity-100 duration-1000"></div>
            <MessageCircle size={32} fill="white" className="relative z-10" />

            <span className="absolute right-full mr-4 bg-white text-gray-800 px-4 py-2 rounded-xl shadow-md text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {t.text}
            </span>
        </motion.a>
    );
}

