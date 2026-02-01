"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Send, MapPin, Phone, Mail, RefreshCw, Sparkles, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axiosClient from "@/lib/axios";
import { useLanguage } from "@/context/LanguageContext";

interface ContactFormData {
    name: string;
    email: string;
    country: string;
    message: string;
    captchaValue: string;
}

interface CaptchaData {
    key: string;
    image_url: string;
}

export default function Contact() {
    const { lang } = useLanguage();
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactFormData>();
    const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState("");

    const t = {
        es: {
            eyebrow: "Contacto",
            title: "Hablemos de",
            titleHighlight: "Negocios",
            subtitle: "Lleva lo mejor de Colombia a tu mercado. Contáctanos para cotizaciones, disponibilidad y logística.",
            location: "Ubicación",
            phones: "Teléfonos",
            emails: "Correos",
            formTitle: "Envíanos un Mensaje",
            labels: {
                name: "Nombre Completo",
                country: "País",
                email: "Email Corporativo",
                message: "Mensaje",
                security: "Verificación de Seguridad"
            },
            placeholders: {
                name: "Tu nombre",
                country: "País de destino",
                email: "nombre@empresa.com",
                message: "Cuéntanos sobre tu requerimiento...",
                captcha: "Código"
            },
            errors: {
                required: "Este campo es requerido",
                email: "Email inválido",
                captcha: "Ingresa el código"
            },
            submit: "Enviar Mensaje",
            success: "¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.",
            errorFields: "Por favor verifica los campos.",
            errorSubmit: "Hubo un error al enviar el mensaje.",
            errorConnection: "Error de conexión. Inténtalo de nuevo más tarde."
        },
        en: {
            eyebrow: "Contact",
            title: "Let's Talk",
            titleHighlight: "Business",
            subtitle: "Bring the best of Colombia to your market. Contact us for quotes, availability, and logistics.",
            location: "Location",
            phones: "Phones",
            emails: "Emails",
            formTitle: "Send Us a Message",
            labels: {
                name: "Full Name",
                country: "Country",
                email: "Corporate Email",
                message: "Message",
                security: "Security Verification"
            },
            placeholders: {
                name: "Your name",
                country: "Destination country",
                email: "name@company.com",
                message: "Tell us about your requirement...",
                captcha: "Code"
            },
            errors: {
                required: "This field is required",
                email: "Invalid email",
                captcha: "Enter the code"
            },
            submit: "Send Message",
            success: "Message sent successfully! We will contact you soon.",
            errorFields: "Please check the fields.",
            errorSubmit: "There was an error sending the message.",
            errorConnection: "Connection error. Please try again later."
        }
    }[lang];

    const fetchCaptcha = async () => {
        try {
            const response = await axiosClient.get<CaptchaData>('/autenticacion/api/get_captcha/');
            setCaptcha(response.data);
        } catch (error) {
            console.error("Error fetching captcha", error);
        }
    };

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const onSubmit = async (data: ContactFormData) => {
        if (!captcha) return;
        setSubmitStatus('idle');

        try {
            const response = await axiosClient.post('/autenticacion/api/contact_submit/', {
                ...data,
                captchaKey: captcha.key
            });

            if (response.data.success) {
                setSubmitStatus('success');
                setStatusMessage(t.success);
                reset();
                fetchCaptcha();
            } else {
                setSubmitStatus('error');
                setStatusMessage(response.data.errors ? t.errorFields : t.errorSubmit);
                fetchCaptcha();
            }
        } catch (error: any) {
            setSubmitStatus('error');
            setStatusMessage(error.response?.data?.message || t.errorConnection);
            fetchCaptcha();
        }
    };

    return (
        <section id="contacto" className="py-32 bg-[#FFFBF5] relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#0D7377]/20 to-transparent" />
            
            <motion.div
                className="absolute top-40 left-0 w-[500px] h-[500px] bg-gradient-to-br from-[#0D7377]/5 to-transparent rounded-full blur-3xl"
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity }}
            />
            
            <motion.div
                className="absolute bottom-40 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-[#FF6B4A]/5 to-transparent rounded-full blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.4, 0.3] }}
                transition={{ duration: 10, repeat: Infinity, delay: 2 }}
            />

            <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <motion.span 
                        className="inline-flex items-center gap-2 text-[#0D7377] font-bold tracking-widest uppercase text-xs mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <Sparkles size={16} />
                        {t.eyebrow}
                    </motion.span>

                    <motion.h2 
                        className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                    >
                        {t.title}{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D7377] to-[#14A0A5]">
                            {t.titleHighlight}
                        </span>
                    </motion.h2>

                    <motion.p 
                        className="text-lg text-[#4A4A5A] max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                    >
                        {t.subtitle}
                    </motion.p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20"
                >
                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="space-y-6"
                    >
                        {[
                            { 
                                icon: MapPin, 
                                title: t.location, 
                                content: "Bogotá D.C, Colombia",
                                color: "#0D7377"
                            },
                            { 
                                icon: Phone, 
                                title: t.phones, 
                                content: "+57 320 274 4313",
                                color: "#FF6B4A"
                            },
                            { 
                                icon: Mail, 
                                title: t.emails, 
                                content: ["mabdime@heavensfruit.com", "valentinagaray@heavensfruit.com"],
                                color: "#FFB800"
                            }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                                whileHover={{ x: 8, scale: 1.02 }}
                                className="group flex items-start gap-5 p-6 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-transparent hover:border-[#0D7377]/10"
                            >
                                <div 
                                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                                    style={{ backgroundColor: `${item.color}15` }}
                                >
                                    <item.icon size={24} style={{ color: item.color }} />
                                </div>
                                
                                <div className="flex-1">
                                    <h4 className="font-bold text-[#1A1A2E] mb-1">{item.title}</h4>
                                    {Array.isArray(item.content) ? (
                                        <div className="space-y-1">
                                            {item.content.map((email, i) => (
                                                <p key={i} className="text-[#4A4A5A] text-sm hover:text-[#0D7377] transition-colors cursor-pointer">
                                                    {email}
                                                </p>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[#4A4A5A]">{item.content}</p>
                                    )}
                                </div>
                            </motion.div>
                        ))}

                        {/* Decorative Element */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6 }}
                            className="hidden lg:block mt-12 p-8 bg-gradient-to-br from-[#0D7377] to-[#14A0A5] rounded-3xl text-white relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                            <MessageSquare size={48} className="mb-4 opacity-80" />
                            <h3 className="text-2xl font-bold mb-2">¿Tienes preguntas?</h3>
                            <p className="text-white/80">Nuestro equipo está listo para ayudarte con cualquier consulta sobre nuestros productos y servicios.</p>
                        </motion.div>
                    </motion.div>

                    {/* Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100"
                    >
                        <h3 className="text-2xl font-bold mb-8 text-[#1A1A2E]">{t.formTitle}</h3>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-[#1A1A2E]">{t.labels.name}</label>
                                    <input
                                        {...register("name", { required: t.errors.required })}
                                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#0D7377] focus:ring-4 focus:ring-[#0D7377]/10 outline-none transition-all bg-gray-50/50"
                                        placeholder={t.placeholders.name}
                                    />
                                    {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-[#1A1A2E]">{t.labels.country}</label>
                                    <input
                                        {...register("country", { required: t.errors.required })}
                                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#0D7377] focus:ring-4 focus:ring-[#0D7377]/10 outline-none transition-all bg-gray-50/50"
                                        placeholder={t.placeholders.country}
                                    />
                                    {errors.country && <span className="text-red-500 text-xs">{errors.country.message}</span>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#1A1A2E]">{t.labels.email}</label>
                                <input
                                    {...register("email", {
                                        required: t.errors.required,
                                        pattern: { value: /^\S+@\S+$/i, message: t.errors.email }
                                    })}
                                    type="email"
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#0D7377] focus:ring-4 focus:ring-[#0D7377]/10 outline-none transition-all bg-gray-50/50"
                                    placeholder={t.placeholders.email}
                                />
                                {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#1A1A2E]">{t.labels.message}</label>
                                <textarea
                                    {...register("message", { required: t.errors.required })}
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#0D7377] focus:ring-4 focus:ring-[#0D7377]/10 outline-none transition-all bg-gray-50/50 min-h-[120px] resize-none"
                                    placeholder={t.placeholders.message}
                                />
                                {errors.message && <span className="text-red-500 text-xs">{errors.message.message}</span>}
                            </div>

                            {/* Captcha */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[#1A1A2E]">{t.labels.security}</label>
                                <div className="flex items-center gap-4">
                                    {captcha ? (
                                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                                            <img src={captcha.image_url} alt="Captcha" className="h-10 rounded" />
                                            <button 
                                                type="button" 
                                                onClick={fetchCaptcha} 
                                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="h-10 w-32 bg-gray-100 animate-pulse rounded-xl" />
                                    )}
                                    <input
                                        {...register("captchaValue", { required: t.errors.captcha })}
                                        className="flex-1 px-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#0D7377] focus:ring-4 focus:ring-[#0D7377]/10 outline-none transition-all bg-gray-50/50 uppercase"
                                        placeholder={t.placeholders.captcha}
                                    />
                                </div>
                                {errors.captchaValue && <span className="text-red-500 text-xs">{errors.captchaValue.message}</span>}
                            </div>

                            <motion.button
                                type="submit"
                                disabled={isSubmitting}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-gradient-to-r from-[#0D7377] to-[#14A0A5] text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#0D7377]/25 hover:shadow-xl hover:shadow-[#0D7377]/30 transition-all"
                            >
                                {isSubmitting ? (
                                    <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                                ) : (
                                    <>
                                        {t.submit}
                                        <Send size={18} />
                                    </>
                                )}
                            </motion.button>

                            <AnimatePresence>
                                {submitStatus !== 'idle' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={`p-4 rounded-xl text-center text-sm font-bold ${
                                            submitStatus === 'success' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}
                                    >
                                        {statusMessage}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
