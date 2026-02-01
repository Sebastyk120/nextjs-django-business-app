'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, Loader2, LogIn, Sparkles, Instagram, Linkedin, Facebook } from 'lucide-react'
import { auth } from '@/lib/auth'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface FeatureCardProps {
    icon: React.ReactNode
    title: string
    description: string
    delay: number
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-emerald-500/30 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20 transition-all duration-300 group"
        >
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            </div>
        </motion.div>
    )
}

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)
    const [focusedField, setFocusedField] = useState<string | null>(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    useEffect(() => {
        const checkAuthentication = async () => {
            const authStatus = await auth.checkAuth()
            if (authStatus.authenticated) {
                router.push('/home/')
            } else {
                setIsCheckingAuth(false)
            }
        }
        checkAuthentication()
    }, [router])

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(event.currentTarget)
        const response = await auth.login(formData)

        if (response.success) {
            window.location.href = response.redirect_url || '/home/'
        } else {
            setError(response.message || 'Credenciales incorrectas. Por favor, inténtalo de nuevo.')
            setIsLoading(false)
        }
    }

    if (isCheckingAuth) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="relative">
                        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                        <div className="absolute inset-0 h-10 w-10 rounded-full bg-emerald-500/20 blur-xl" />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Verificando sesión...</p>
                </motion.div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
        >
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="space-y-3 text-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-semibold tracking-wide uppercase">
                    <Sparkles className="h-3.5 w-3.5" />
                    Portal Exclusivo
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Bienvenido de nuevo
                </h1>
            </motion.div>

            {/* Error Alert */}
            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-red-600 dark:text-red-200 text-xs font-bold">!</span>
                            </div>
                            <span>{error}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-5">
                {/* Email Field */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="space-y-2"
                >
                    <Label htmlFor="username" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Correo Electrónico
                    </Label>
                    <div className="relative group">
                        <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-300 ${focusedField === 'email' || email
                            ? 'text-emerald-500'
                            : 'text-slate-400 group-hover:text-slate-500'
                            }`} />
                        <Input
                            id="username"
                            name="username"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="nombre@empresa.com"
                            className={`pl-12 pr-4 h-12 bg-slate-50 dark:bg-slate-800/50 border-2 transition-all duration-300 rounded-xl
                                ${focusedField === 'email'
                                    ? 'border-emerald-500 ring-4 ring-emerald-500/10 bg-white dark:bg-slate-800'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                            required
                            disabled={isLoading}
                        />
                        <div className={`absolute bottom-0 left-12 right-4 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 ${focusedField === 'email' ? 'opacity-100' : 'opacity-0'
                            }`} />
                    </div>
                </motion.div>

                {/* Password Field */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="space-y-2"
                >
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Contraseña
                        </Label>
                        <Link
                            href="/reset-password"
                            className="text-xs font-medium text-emerald-600 hover:text-emerald-500 transition-colors hover:underline underline-offset-2"
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                    <div className="relative group">
                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-300 ${focusedField === 'password' || password
                            ? 'text-emerald-500'
                            : 'text-slate-400 group-hover:text-slate-500'
                            }`} />
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="••••••••"
                            className={`pl-12 pr-12 h-12 bg-slate-50 dark:bg-slate-800/50 border-2 transition-all duration-300 rounded-xl
                                ${focusedField === 'password'
                                    ? 'border-emerald-500 ring-4 ring-emerald-500/10 bg-white dark:bg-slate-800'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                            required
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-200 hover:scale-110 focus:outline-none"
                            disabled={isLoading}
                        >
                            <motion.div
                                initial={false}
                                animate={{ scale: showPassword ? 1.1 : 1, rotate: showPassword ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </motion.div>
                        </button>
                        <div className={`absolute bottom-0 left-12 right-12 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 ${focusedField === 'password' ? 'opacity-100' : 'opacity-0'
                            }`} />
                    </div>
                </motion.div>

                {/* Remember Me */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="flex items-center"
                >
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="remember"
                            name="remember"
                            className="h-5 w-5 rounded-md border-2 border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 transition-all duration-200"
                        />
                        <label
                            htmlFor="remember"
                            className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none"
                        >
                            Recordarme en este dispositivo
                        </label>
                    </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                >
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="relative w-full h-12 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        {isLoading ? (
                            <span className="flex items-center gap-2 relative z-10">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Iniciando sesión...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 relative z-10">
                                <LogIn className="h-5 w-5" />
                                Ingresar al Sistema
                            </span>
                        )}
                    </Button>
                </motion.div>
            </form>

            {/* Back Link & Social Media */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="text-center pt-4 space-y-4"
            >
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-emerald-600 transition-all duration-200 hover:gap-3 group"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-transform duration-200 group-hover:-translate-x-1"
                    >
                        <path d="m12 19-7-7 7-7" />
                        <path d="M19 12H5" />
                    </svg>
                    Volver al inicio
                </Link>

                {/* Social Media Links */}
                <div className="flex items-center justify-center gap-3 pt-2">
                    <a
                        href="https://www.instagram.com/heavensfruitscol/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all duration-300 hover:scale-110"
                    >
                        <Instagram className="h-4 w-4" />
                    </a>
                    <a
                        href="https://linkedin.com/company/heavens-fruits"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-[#0077b5] hover:text-white transition-all duration-300 hover:scale-110"
                    >
                        <Linkedin className="h-4 w-4" />
                    </a>
                    <a
                        href="https://facebook.com/heavensfruits"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-[#1877f2] hover:text-white transition-all duration-300 hover:scale-110"
                    >
                        <Facebook className="h-4 w-4" />
                    </a>
                </div>
            </motion.div>
        </motion.div>
    )
}
