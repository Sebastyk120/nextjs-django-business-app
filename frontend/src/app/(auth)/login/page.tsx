'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, Loader2, LogIn } from 'lucide-react'
import { auth } from '@/lib/auth'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)

    // Check if user is already authenticated on mount
    useEffect(() => {
        const checkAuthentication = async () => {
            const authStatus = await auth.checkAuth()
            if (authStatus.authenticated) {
                // User is already logged in, redirect to home
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
            // Hard redirect to ensure minimal client-side state issues with Django session
            window.location.href = response.redirect_url || '/home/'
        } else {
            setError(response.message || 'Credenciales incorrectas. Por favor, inténtalo de nuevo.')
            setIsLoading(false)
        }
    }

    // Show loading state while checking authentication
    if (isCheckingAuth) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    <p className="text-sm text-slate-500">Verificando sesión...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-plus-jakarta">
                    Iniciar Sesión
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Ingresa tus credenciales para acceder al sistema
                </p>
            </div>

            {error && (
                <Alert variant="destructive" className="animate-in fade-in zoom-in duration-300">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="username">Correo Electrónico</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                        <Input
                            id="username"
                            name="username"
                            type="email"
                            placeholder="nombre@empresa.com"
                            className="pl-10"
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Contraseña</Label>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            required
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="remember" name="remember" />
                        <label
                            htmlFor="remember"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600 dark:text-slate-400"
                        >
                            Recordarme
                        </label>
                    </div>
                    <Link
                        href="/reset-password"
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
                    >
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>

                <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-6 shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Iniciando sesión...
                        </>
                    ) : (
                        <>
                            <LogIn className="mr-2 h-4 w-4" />
                            Ingresar
                        </>
                    )}
                </Button>
            </form>

            <div className="text-center pt-8">
                <Link href="/" className="text-xs text-slate-400 hover:text-emerald-600 flex items-center justify-center gap-1 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                    Volver a la página principal
                </Link>
            </div>
        </div>
    )
}
