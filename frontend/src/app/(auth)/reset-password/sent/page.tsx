import Link from 'next/link'
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function ResetPasswordSentPage() {
    return (
        <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center animate-bounce duration-1000">
                    <Mail className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                    <div className="absolute bg-emerald-600 rounded-full p-1.5 bottom-0 right-0 border-4 border-white dark:border-slate-900">
                        <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-plus-jakarta">
                    ¡Correo Enviado!
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
                    Hemos enviado las instrucciones para restablecer tu contraseña a tu correo electrónico.
                </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg text-left text-sm text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                <p className="font-semibold mb-2">¿No recibiste el correo?</p>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                    <li>Revisa tu carpeta de spam o correo no deseado.</li>
                    <li>Asegúrate de haber escrito correctamente tu email.</li>
                    <li>Puede tardar unos minutos en llegar.</li>
                </ul>
            </div>

            <div className="pt-4 space-y-3">
                <Link href="/login">
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-6 transition-all">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Iniciar Sesión
                    </Button>
                </Link>
                <Link href="/reset-password">
                    <Button variant="ghost" className="w-full text-slate-500 hover:text-emerald-600">
                        Intentar con otro correo
                    </Button>
                </Link>
            </div>
        </div>
    )
}
