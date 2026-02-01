'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { BarChart3, Package, FileText, ShoppingCart, TrendingUp, ClipboardList, Leaf, Globe } from 'lucide-react'

interface Particle {
    id: number
    x: number
    y: number
    size: number
    duration: number
    delay: number
}

function FloatingParticles() {
    const [particles, setParticles] = useState<Particle[]>([])

    useEffect(() => {
        const newParticles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 2,
            duration: Math.random() * 20 + 15,
            delay: Math.random() * 10,
        }))
        setParticles(newParticles)
    }, [])

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute rounded-full bg-emerald-400/30"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: particle.size,
                        height: particle.size,
                    }}
                    animate={{
                        y: [0, -100, 0],
                        x: [0, Math.random() * 50 - 25, 0],
                        opacity: [0.2, 0.6, 0.2],
                    }}
                    transition={{
                        duration: particle.duration,
                        delay: particle.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    )
}

interface FeatureCardProps {
    icon: React.ReactNode
    title: string
    description: string
    delay: number
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300 group"
        >
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 text-emerald-200 group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-emerald-200/70">{description}</p>
            </div>
        </motion.div>
    )
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen w-full lg:grid lg:grid-cols-2 h-screen overflow-hidden bg-slate-950">
            {/* Left Visual Panel */}
            <div className="hidden lg:flex relative h-full flex-col overflow-hidden">
                {/* Animated Background Layers */}
                <div className="absolute inset-0 z-0">
                    {/* Base Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950/90 to-slate-900" />

                    {/* Animated Gradient Orbs */}
                    <motion.div
                        className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)',
                        }}
                        animate={{
                            scale: [1, 1.2, 1],
                            x: [0, 50, 0],
                            y: [0, -30, 0],
                        }}
                        transition={{
                            duration: 15,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                    <motion.div
                        className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(20, 184, 166, 0.25) 0%, transparent 70%)',
                        }}
                        animate={{
                            scale: [1.2, 1, 1.2],
                            x: [0, -40, 0],
                            y: [0, 40, 0],
                        }}
                        transition={{
                            duration: 18,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(5, 150, 105, 0.15) 0%, transparent 60%)',
                        }}
                        animate={{
                            rotate: [0, 360],
                        }}
                        transition={{
                            duration: 60,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />

                    {/* Grid Pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: `
                                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                            `,
                            backgroundSize: '60px 60px',
                        }}
                    />

                    {/* Floating Particles */}
                    <FloatingParticles />
                </div>

                {/* Content */}
                <div className="relative z-20 flex flex-col h-full p-12 justify-between">
                    {/* Logo Section */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="inline-flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                            <Image
                                src="/landing/logowhite.webp"
                                alt="Heaven's Fruits Logo"
                                width={160}
                                height={50}
                                className="drop-shadow-lg"
                                style={{ height: 'auto' }}
                            />
                        </div>
                    </motion.div>

                    {/* Main Content */}
                    <div className="space-y-8 max-w-lg">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="space-y-4"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 text-emerald-300 text-sm font-medium">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Sistema Activo
                            </div>

                            <h1 className="text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1]">
                                Tu portal<br />
                                <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                                    Heaven's Connect
                                </span>
                            </h1>

                            <p className="text-lg text-slate-300/80 leading-relaxed max-w-md">
                                Portal exclusivo para socios y equipo. Gestiona tu operación,
                                accede a reportes en tiempo real.
                            </p>
                        </motion.div>

                        {/* Portal Features Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <FeatureCard
                                icon={<BarChart3 className="h-5 w-5" />}
                                title="Dashboard"
                                description="Métricas en tiempo real"
                                delay={0.4}
                            />
                            <FeatureCard
                                icon={<ShoppingCart className="h-5 w-5" />}
                                title="Pedidos"
                                description="Gestión de exportaciones"
                                delay={0.5}
                            />
                            <FeatureCard
                                icon={<Package className="h-5 w-5" />}
                                title="Inventario"
                                description="Control de stock"
                                delay={0.6}
                            />
                            <FeatureCard
                                icon={<FileText className="h-5 w-5" />}
                                title="Reportes"
                                description="Estado de cuenta"
                                delay={0.7}
                            />
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-emerald-200/60 text-sm">
                                <Leaf className="h-4 w-4" />
                                <span>Sostenible</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-200/60 text-sm">
                                <TrendingUp className="h-4 w-4" />
                                <span>Innovador</span>
                            </div>
                        </div>
                        <span className="text-emerald-200/40 text-sm">
                            © {new Date().getFullYear()} Heaven's Fruits
                        </span>
                    </motion.div>
                </div>
            </div>

            {/* Right Form Panel */}
            <div className="relative flex items-center justify-center h-full bg-slate-50 dark:bg-slate-950 p-6 lg:p-12 overflow-y-auto">
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-[0.02]">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(16, 185, 129, 0.5) 1px, transparent 0)`,
                            backgroundSize: '40px 40px',
                        }}
                    />
                </div>

                <div className="w-full max-w-md relative z-10">
                    {/* Mobile Logo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="lg:hidden flex justify-center mb-8"
                    >
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                            <Image
                                src="/landing/heavens.webp"
                                alt="Heaven's Fruits Logo"
                                width={70}
                                height={70}
                                className="drop-shadow-lg"
                            />
                        </div>
                    </motion.div>

                    {/* Form Container */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200/50 dark:border-slate-800/50 p-8 lg:p-10 backdrop-blur-xl"
                    >
                        {children}
                    </motion.div>

                    {/* Mobile Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="lg:hidden mt-8 text-center"
                    >
                        <p className="text-slate-400 text-xs">
                            © {new Date().getFullYear()} Heaven's Fruits. Todos los derechos reservados.
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
