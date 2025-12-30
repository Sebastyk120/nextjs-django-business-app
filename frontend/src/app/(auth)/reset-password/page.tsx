'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Loader2, ArrowLeft, Send } from 'lucide-react'
import { auth } from '@/lib/auth'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ResetPasswordPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(event.currentTarget)
        const email = formData.get('email') as string

        const response = await auth.requestPasswordReset(email)

        if (response.success) {
            router.push('/reset-password/sent')
        } else {
            setError(response.message || 'Error al procesar la solicitud. Verifica el correo e inténtalo de nuevo.')
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 text-center">
                <Link href="/login" className="inline-flex items-center text-sm text-slate-500 hover:text-emerald-600 mb-4 transition-colors">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Volver al login
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-plus-jakarta">
                    Recuperar Contraseña
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Te enviaremos las instrucciones a tu correo
                </p>
            </div>

            {error && (
                <Alert variant="destructive" className="animate-in fade-in zoom-in duration-300">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="nombre@empresa.com"
                            className="pl-10"
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando instrucciones...
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            Enviar enlace de recuperación
                        </>
                    )}
                </Button>
            </form>

            <div className="text-center pt-2">
                <p className="text-xs text-slate-400">
                    Si no encuentras el correo, recuerda revisar tu carpeta de spam o correo no deseado.
                </p>
            </div>
        </div>
    )
}
