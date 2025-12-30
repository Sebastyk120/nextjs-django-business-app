"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Send, MapPin, Phone, Mail, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

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

import { useLanguage } from "@/context/LanguageContext";

export default function Contact() {
    const { lang } = useLanguage();
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactFormData>();
    const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState("");

    const t = {
        es: {
            title: "Hablemos de Negocios",
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
            title: "Let's Talk Business",
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
            const res = await fetch("/api/captcha");
            if (res.ok) {
                const data = await res.json();
                setCaptcha(data);
            }
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
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, captchaKey: captcha.key })
            });

            const result = await res.json();

            if (res.ok && result.success) {
                setSubmitStatus('success');
                setStatusMessage(t.success);
                reset();
                fetchCaptcha(); // Refresh captcha
            } else {
                setSubmitStatus('error');
                setStatusMessage(result.errors ? t.errorFields : t.errorSubmit);
                // Usually refresh captcha on error too as it gets invalidated
                fetchCaptcha();
            }
        } catch (error) {
            setSubmitStatus('error');
            setStatusMessage(t.errorConnection);
        }
    };

    return (
        <section id="contacto" className="py-24 contact-section">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

                    {/* Contact Info */}
                    <div data-aos="fade-right">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[--color-primary]">{t.title}</h2>
                        <p className="text-lg text-[--color-text] mb-12">
                            {t.subtitle}
                        </p>

                        <div className="contact-card cursor-pointer hover:bg-white/80">
                            <div className="contact-icon bg-green-100 text-green-600">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-[--color-primary]">{t.location}</h4>
                                <p className="text-[--color-text-light]">Bogotá D.C, Colombia</p>
                            </div>
                        </div>

                        <div className="contact-card cursor-pointer hover:bg-white/80">
                            <div className="contact-icon bg-blue-100 text-blue-600">
                                <Phone size={24} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-[--color-primary]">{t.phones}</h4>
                                <p className="text-[--color-text-light] hover:text-[--color-primary]">+57 320 274 4313</p>
                            </div>
                        </div>

                        <div className="contact-card cursor-pointer hover:bg-white/80">
                            <div className="contact-icon bg-orange-100 text-orange-600">
                                <Mail size={24} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-[--color-primary]">{t.emails}</h4>
                                <p className="text-[--color-text-light] break-words hover:text-[--color-primary]">mabdime@heavensfruit.com</p>
                                <p className="text-[--color-text-light] break-words hover:text-[--color-primary]">valentinagaray@heavensfruit.com</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl" data-aos="fade-left">
                        <h3 className="text-2xl font-bold mb-6 text-[--color-primary]">{t.formTitle}</h3>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-[--color-text]">{t.labels.name}</label>
                                    <input
                                        {...register("name", { required: t.errors.required })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary] focus:ring-opacity-20 outline-none transition-all"
                                        placeholder={t.placeholders.name}
                                    />
                                    {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-[--color-text]">{t.labels.country}</label>
                                    <input
                                        {...register("country", { required: t.errors.required })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary] focus:ring-opacity-20 outline-none transition-all"
                                        placeholder={t.placeholders.country}
                                    />
                                    {errors.country && <span className="text-red-500 text-xs">{errors.country.message}</span>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[--color-text]">{t.labels.email}</label>
                                <input
                                    {...register("email", {
                                        required: t.errors.required,
                                        pattern: { value: /^\S+@\S+$/i, message: t.errors.email }
                                    })}
                                    type="email"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary] focus:ring-opacity-20 outline-none transition-all"
                                    placeholder={t.placeholders.email}
                                />
                                {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[--color-text]">{t.labels.message}</label>
                                <textarea
                                    {...register("message", { required: t.errors.required })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary] focus:ring-opacity-20 outline-none transition-all min-h-[120px]"
                                    placeholder={t.placeholders.message}
                                ></textarea>
                                {errors.message && <span className="text-red-500 text-xs">{errors.message.message}</span>}
                            </div>

                            {/* Captcha */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[--color-text]">{t.labels.security}</label>
                                <div className="flex items-center gap-4">
                                    {captcha ? (
                                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={captcha.image_url} alt="Captcha" className="h-10 rounded" />
                                            <button type="button" onClick={fetchCaptcha} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                                                <RefreshCw size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="h-10 w-32 bg-gray-100 animate-pulse rounded"></div>
                                    )}
                                    <input
                                        {...register("captchaValue", { required: t.errors.captcha })}
                                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary] focus:ring-opacity-20 outline-none transition-all uppercase"
                                        placeholder={t.placeholders.captcha}
                                    />
                                </div>
                                {errors.captchaValue && <span className="text-red-500 text-xs">{errors.captchaValue.message}</span>}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full btn-primary-custom flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
                                ) : (
                                    <>
                                        {t.submit} <Send size={20} />
                                    </>
                                )}
                            </button>

                            <AnimatePresence>
                                {submitStatus !== 'idle' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={`p-4 rounded-xl text-center text-sm font-bold ${submitStatus === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                    >
                                        {statusMessage}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}

