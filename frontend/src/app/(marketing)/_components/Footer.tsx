import Link from "next/link";
import { Facebook, Instagram, Linkedin } from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
    const { lang } = useLanguage();

    const t = {
        es: {
            brandDesc: "Exportando lo mejor del campo colombiano al mundo. Calidad, frescura y compromiso en cada envío.",
            navTitle: "Navegación",
            navLinks: [
                { name: "Inicio", href: "#inicio" },
                { name: "Nuestros Productos", href: "#productos" },
                { name: "Quiénes Somos", href: "#nosotros" },
                { name: "Servicios", href: "#servicios" },
            ],
            legalTitle: "Legal",
            legalLinks: [
                { name: "Política de Privacidad", href: "#" },
                { name: "Términos y Condiciones", href: "#" },
                { name: "Certificaciones", href: "#" },
            ],
            contactTitle: "Contáctanos",
            rights: `Heavens Fruits SAS. Todos los derechos reservados.`
        },
        en: {
            brandDesc: "Exporting the best of the Colombian countryside to the world. Quality, freshness, and commitment in every shipment.",
            navTitle: "Navigation",
            navLinks: [
                { name: "Home", href: "#inicio" },
                { name: "Our Products", href: "#productos" },
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
            rights: `Heavens Fruits SAS. All rights reserved.`
        }
    }[lang];

    return (
        <footer className="bg-[--color-primary] text-white pt-16 pb-8">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div>
                        <Link href="#inicio" className="block mb-6">
                            <img src="/landing/heavens.webp" alt="Heavens Fruits SAS Logo" className="h-12 w-auto" />
                        </Link>
                        <p className="text-white/80 mb-6 leading-relaxed">
                            {t.brandDesc}
                        </p>
                        <div className="flex gap-4">
                            <SocialLink href="https://www.instagram.com/heavensfruitscol/" icon={Instagram} />
                            <SocialLink href="https://www.facebook.com/HeavensFruits/" icon={Facebook} />
                            <SocialLink href="https://www.linkedin.com/company/heavens-fruits/" icon={Linkedin} />
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-[--color-secondary]">{t.navTitle}</h4>
                        <ul className="space-y-3">
                            {t.navLinks.map(link => (
                                <FooterLink key={link.name} href={link.href}>{link.name}</FooterLink>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-[--color-secondary]">{t.legalTitle}</h4>
                        <ul className="space-y-3">
                            {t.legalLinks.map(link => (
                                <FooterLink key={link.name} href={link.href}>{link.name}</FooterLink>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Short */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-[--color-secondary]">{t.contactTitle}</h4>
                        <p className="text-white/80 mb-2">Bogotá, Colombia</p>
                        <p className="text-white/80 mb-2">mabdime@heavensfruit.com</p>
                        <p className="text-white/80">+57 320 274 4313</p>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 text-center text-white/60 text-sm">
                    <p>&copy; {new Date().getFullYear()} {t.rights}</p>
                </div>
            </div>
        </footer>
    );
}


function SocialLink({ href, icon: Icon }: { href: string; icon: any }) {
    return (
        <Link href={href} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[--color-secondary] transition-colors">
            <Icon size={20} />
        </Link>
    );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <li>
            <Link href={href} className="text-white/80 hover:text-[--color-secondary] transition-colors">
                {children}
            </Link>
        </li>
    );
}
