"use client";

import Link from "next/link";
import { Facebook, Instagram, Linkedin, ArrowUpRight, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
    const { lang } = useLanguage();

    const t = {
        es: {
            brandDesc: "Exportando lo mejor del campo colombiano al mundo. Calidad, frescura y compromiso en cada envío.",
            navTitle: "Navegación",
            navLinks: [
                { name: "Inicio", href: "#inicio" },
                { name: "Productos", href: "#productos" },
                { name: "Trayectoria", href: "#trayectoria" },
                { name: "Historia", href: "#historia" },
                { name: "Nosotros", href: "#nosotros" },
                { name: "Servicios", href: "#servicios" },
            ],
            legalTitle: "Legal",
            legalLinks: [
                { name: "Política de Privacidad", href: "#" },
                { name: "Términos y Condiciones", href: "#" },
                { name: "Certificaciones", href: "#" },
            ],
            contactTitle: "Contáctanos",
            rights: "Heavens Fruits SAS. Todos los derechos reservados.",
            madeWith: "Hecho con"
        },
        en: {
            brandDesc: "Exporting the best of the Colombian countryside to the world. Quality, freshness, and commitment in every shipment.",
            navTitle: "Navigation",
            navLinks: [
                { name: "Home", href: "#inicio" },
                { name: "Products", href: "#productos" },
                { name: "Trajectory", href: "#trayectoria" },
                { name: "History", href: "#historia" },
                { name: "About Us", href: "#nosotros" },
                { name: "Services", href: "#servicios" },
            ],
            legalTitle: "Legal",
            legalLinks: [
                { name: "Privacy Policy", href: "#" },
                { name: "Terms and Conditions", href: "#" },
                { name: "Certifications", href: "#" },
            ],
            contactTitle: "Contact Us",
            rights: "Heavens Fruits SAS. All rights reserved.",
            madeWith: "Made with"
        }
    }[lang];

    return (
        <footer className="relative bg-[#0A1A1B] text-white overflow-hidden"
        >
            {/* Top Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0D7377]/50 to-transparent" />

            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#0D7377]/5 rounded-full blur-[120px]" />

            <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10"
            >
                {/* Main Footer Content */}
                <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"
                >
                    {/* Brand Column */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <Link href="#inicio" className="inline-block mb-6"
                        >
                            <img 
                                src="/landing/heavens.webp" 
                                alt="Heavens Fruits SAS Logo" 
                                className="h-12 w-auto brightness-0 invert"
                            />
                        </Link>
                        
                        <p className="text-white/60 mb-8 leading-relaxed max-w-xs"
                        >
                            {t.brandDesc}
                        </p>
                        
                        <div className="flex gap-3"
                        >
                            {[
                                { href: "https://www.instagram.com/heavensfruitscol/", icon: Instagram },
                                { href: "https://www.facebook.com/HeavensFruits/", icon: Facebook },
                                { href: "https://www.linkedin.com/company/heavens-fruits/", icon: Linkedin }
                            ].map((social, index) => (
                                <motion.a
                                    key={index}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ y: -4, scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#0D7377] hover:border-[#0D7377] transition-all duration-300"
                                >
                                    <social.icon size={20} />
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Navigation Column */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <h4 className="text-sm font-bold uppercase tracking-widest text-[#32E0C4] mb-6"
                        >
                            {t.navTitle}
                        </h4>
                        
                        <ul className="space-y-4"
                        >
                            {t.navLinks.map((link, index) => (
                                <li key={index}
                                >
                                    <Link 
                                        href={link.href}
                                        className="group flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                                    >
                                        <span>{link.name}</span>
                                        <ArrowUpRight 
                                            size={14} 
                                            className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" 
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Legal Column */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <h4 className="text-sm font-bold uppercase tracking-widest text-[#32E0C4] mb-6"
                        >
                            {t.legalTitle}
                        </h4>
                        
                        <ul className="space-y-4"
                        >
                            {t.legalLinks.map((link, index) => (
                                <li key={index}
                                >
                                    <Link 
                                        href={link.href}
                                        className="group flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                                    >
                                        <span>{link.name}</span>
                                        <ArrowUpRight 
                                            size={14} 
                                            className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" 
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Contact Column */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <h4 className="text-sm font-bold uppercase tracking-widest text-[#32E0C4] mb-6"
                        >
                            {t.contactTitle}
                        </h4>
                        
                        <div className="space-y-4 text-white/60"
                        >
                            <p>Bogotá, Colombia</p>
                            <p className="hover:text-[#32E0C4] transition-colors cursor-pointer">
                                mabdime@heavensfruit.com
                            </p>
                            <p className="hover:text-[#32E0C4] transition-colors cursor-pointer">
                                valentinagaray@heavensfruit.com
                            </p>
                            <p className="hover:text-[#32E0C4] transition-colors cursor-pointer">
                                +57 320 274 4313
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Bar */}
                <div className="py-6 border-t border-white/10"
                >
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4"
                    >
                        <p className="text-white/40 text-sm"
                        >
                            &copy; {new Date().getFullYear()} {t.rights}
                        </p>
                        
                        <p className="text-white/40 text-sm flex items-center gap-1"
                        >
                            {t.madeWith}
                            <Heart size={14} className="text-[#FF6B4A] fill-[#FF6B4A]" />
                            in Colombia
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
