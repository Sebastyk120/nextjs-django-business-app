import Image from 'next/image';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen w-full lg:grid lg:grid-cols-2 h-screen overflow-hidden font-outfit">
            {/* Panel Visual Izquierdo */}
            <div className="hidden lg:flex relative h-full flex-col justify-between p-12 overflow-hidden">
                {/* Background Gradient & Image Overlay */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900 opacity-100 z-10" />
                    <Image
                        src="/landing/auth-bg.webp"
                        alt="Background"
                        fill
                        className="object-cover opacity-20 mix-blend-overlay grayscale"
                        priority
                    />
                    {/* Abstract Shapes for Texture */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4" />
                </div>

                {/* Content */}
                <div className="relative z-20 flex flex-col h-full justify-between">
                    <div>
                        <Image
                            src="/landing/logowhite.webp"
                            alt="Heaven's Fruits Logo"
                            width={180}
                            height={60}
                            className="mb-8 drop-shadow-lg"
                            style={{ height: 'auto' }}
                        />
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-3xl lg:text-5xl font-bold text-white tracking-tight leading-tight drop-shadow-sm font-plus-jakarta">
                            Bienvenido a <br />
                            <span className="text-emerald-200">
                                Heaven&apos;s Fruits Connect
                            </span>
                        </h2>
                        <p className="text-emerald-100/80 text-lg max-w-md leading-relaxed font-light">
                            El portal exclusivo para nuestros socios y equipo. Gestiona, conecta y crece con nosotros.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-emerald-200/60 text-sm">
                        <span>© {new Date().getFullYear()} Heaven&apos;s Fruits</span>
                    </div>
                </div>
            </div>

            {/* Panel de Formulario Derecho */}
            <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900 p-8 overflow-y-auto">
                <div className="w-full max-w-md space-y-8 relative z-10">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <Image
                            src="/landing/heavens.webp"
                            alt="Heaven's Fruits Logo"
                            width={80}
                            height={80}
                            className="drop-shadow-sm"
                        />
                    </div>

                    {/* Form Container with Glass Effect */}
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 dark:border-slate-800/50 p-8 lg:p-10">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
