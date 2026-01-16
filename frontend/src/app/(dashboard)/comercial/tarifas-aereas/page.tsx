"use client";

import { useEffect, useState, useMemo } from "react";
import axiosClient from "@/lib/axios";
import {
    TarifaAerea,
    DestinationComparison,
    TarifasFormOptions,
    TarifaAereaForm
} from "@/types/tarifa-aerea";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Plane,
    Search,
    RefreshCw,
    Plus,
    LayoutGrid,
    TableIcon,
    ChartLine,
    MoreVertical,
    Pencil,
    Trash2,
    Medal,
    CircleDot,
    TrendingDown,
    ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type ViewMode = "grid" | "table";

export default function TarifasAereasPage() {
    // State
    const [loading, setLoading] = useState(true);
    const [tarifas, setTarifas] = useState<TarifaAerea[]>([]);
    const [comparisons, setComparisons] = useState<DestinationComparison[]>([]);
    const [formOptions, setFormOptions] = useState<TarifasFormOptions>({ aerolineas: [], destinos: [] });
    const [searchTerm, setSearchTerm] = useState("");
    const [activeAirline, setActiveAirline] = useState<string>("all");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");

    // Permissions
    const [isHeavens, setIsHeavens] = useState(false);

    // Modal States
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingTarifa, setEditingTarifa] = useState<TarifaAerea | null>(null);
    const [deletingTarifa, setDeletingTarifa] = useState<TarifaAerea | null>(null);

    // Form State
    const [formData, setFormData] = useState<TarifaAereaForm>({
        aerolinea: 0,
        destino: 0,
        tarifa_por_kilo: 0,
        es_activa: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Permissions check
    useEffect(() => {
        const checkPermissions = async () => {
            const authStatus = await auth.checkAuth();
            if (authStatus.authenticated && authStatus.user) {
                const groups = authStatus.user.groups || [];
                setIsHeavens(groups.includes("Heavens") || groups.includes("Administradores"));
            }
        };
        checkPermissions();
    }, []);

    // Fetch data
    const fetchData = async () => {
        setLoading(true);
        try {
            const [tarifasRes, compRes, optionsRes] = await Promise.all([
                axiosClient.get('/comercial/api/tarifas-aereas/'),
                axiosClient.get('/comercial/api/tarifas-aereas/comparison/'),
                axiosClient.get('/comercial/api/tarifas-aereas/options/')
            ]);

            setTarifas(tarifasRes.data.data || []);
            setComparisons(compRes.data.data || []);
            setFormOptions(optionsRes.data || { aerolineas: [], destinos: [] });
        } catch (error) {
            console.error("Error fetching tarifas:", error);
            toast.error("Error al cargar las tarifas");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Derived data
    const airlines = useMemo(() => {
        return [...new Set(tarifas.map(t => t.aerolinea))].sort();
    }, [tarifas]);

    const filteredTarifas = useMemo(() => {
        return tarifas.filter(t => {
            const matchesSearch =
                t.aerolinea.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.destino_ciudad.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesAirline = activeAirline === "all" || t.aerolinea === activeAirline;
            return matchesSearch && matchesAirline;
        });
    }, [tarifas, searchTerm, activeAirline]);

    const filteredComparisons = useMemo(() => {
        return comparisons.filter(c =>
            c.destino.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [comparisons, searchTerm]);

    // Helpers
    const formatCurrency = (value: number | string) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(num || 0);
    };

    const toNumber = (value: number | string) => {
        return typeof value === 'string' ? parseFloat(value) : value;
    };

    // Handlers
    const handleOpenCreate = () => {
        setEditingTarifa(null);
        setFormData({
            aerolinea: formOptions.aerolineas[0]?.id || 0,
            destino: formOptions.destinos[0]?.id || 0,
            tarifa_por_kilo: 0,
            es_activa: true,
        });
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (tarifa: TarifaAerea) => {
        setEditingTarifa(tarifa);
        setFormData({
            aerolinea: tarifa.aerolinea_id,
            destino: tarifa.destino_id,
            tarifa_por_kilo: typeof tarifa.tarifa_por_kilo === 'string' ? parseFloat(tarifa.tarifa_por_kilo) : tarifa.tarifa_por_kilo,
            es_activa: tarifa.es_activa,
        });
        setIsFormModalOpen(true);
    };

    const handleOpenDelete = (tarifa: TarifaAerea) => {
        setDeletingTarifa(tarifa);
        setIsDeleteModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.aerolinea || !formData.destino || !formData.tarifa_por_kilo) {
            toast.error("Por favor complete todos los campos");
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingTarifa) {
                await axiosClient.put(`/comercial/api/tarifas-aereas/${editingTarifa.id}/`, formData);
                toast.success("Tarifa actualizada correctamente");
            } else {
                await axiosClient.post('/comercial/api/tarifas-aereas/', formData);
                toast.success("Tarifa creada correctamente");
            }
            setIsFormModalOpen(false);
            fetchData();
        } catch (error: any) {
            console.error("Error saving tarifa:", error);
            const errorMsg = error.response?.data?.error || "Error al guardar la tarifa";
            toast.error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingTarifa) return;

        setIsSubmitting(true);
        try {
            await axiosClient.delete(`/comercial/api/tarifas-aereas/${deletingTarifa.id}/`);
            toast.success("Tarifa eliminada correctamente");
            setIsDeleteModalOpen(false);
            setDeletingTarifa(null);
            fetchData();
        } catch (error) {
            console.error("Error deleting tarifa:", error);
            toast.error("Error al eliminar la tarifa");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render restricted access
    if (!isHeavens && !loading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Plane className="h-10 w-10 text-slate-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Acceso Restringido</h2>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto">
                        Esta sección es exclusiva para el equipo comercial de exportación.
                        Por favor contacte a su administrador.
                    </p>
                </motion.div>
            </div>
        );
    }

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 font-outfit pb-20">
            {/* Hero Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 bg-opacity-80 backdrop-blur-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between py-6 gap-6">
                        <div>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3"
                            >
                                <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 transform rotate-3">
                                    <Plane className="h-6 w-6 text-white" />
                                </div>
                                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-plus-jakarta">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-500">
                                        Tarifas Aéreas
                                    </span>
                                </h1>
                                <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100 px-3 py-1">
                                    {tarifas.length} Rutas
                                </Badge>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3"
                        >
                            <Button
                                onClick={handleOpenCreate}
                                className="bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all hover:scale-105 active:scale-95 rounded-xl h-12 px-6"
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                Nueva Tarifa
                            </Button>
                        </motion.div>
                    </div>

                    {/* Controls Bar */}
                    <div className="pb-6">
                        <div className="flex flex-col lg:flex-row gap-4 items-center bg-slate-50 p-2 rounded-2xl border border-slate-200">
                            <div className="relative flex-1 w-full lg:w-auto z-10 max-w-2xl">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-20" />
                                <Input
                                    placeholder="Buscar por aerolínea, destino, ciudad..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 h-14 bg-white border-transparent shadow-sm focus:border-indigo-200 focus:ring-2 focus:ring-indigo-100 rounded-xl text-lg text-slate-900 placeholder:text-slate-400"
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 px-2 scrollbar-hide">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setActiveAirline("all")}
                                    className={cn(
                                        "h-10 px-5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                                        activeAirline === "all"
                                            ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                                    )}
                                >
                                    Todas
                                </motion.button>
                                {airlines.map(airline => (
                                    <motion.button
                                        key={airline}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setActiveAirline(airline)}
                                        className={cn(
                                            "h-10 px-5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                                            activeAirline === airline
                                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                                                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                                        )}
                                    >
                                        {airline}
                                    </motion.button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                                <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setViewMode("grid")}
                                        className={cn(
                                            "h-9 px-3 rounded-lg transition-all",
                                            viewMode === "grid" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setViewMode("table")}
                                        className={cn(
                                            "h-9 px-3 rounded-lg transition-all",
                                            viewMode === "table" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        <TableIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={fetchData}
                                    className="h-11 w-11 rounded-xl border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
                                >
                                    <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

                {/* Comparison Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <ChartLine className="h-5 w-5 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Comparativa de Precios</h2>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-48 rounded-2xl bg-slate-200" />
                            ))}
                        </div>
                    ) : filteredComparisons.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                            <p className="text-slate-500">No hay datos suficientes para comparar.</p>
                        </div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            {filteredComparisons.map((comp) => {
                                const sortedRates = [...comp.rates].sort((a, b) => toNumber(a.tarifa) - toNumber(b.tarifa));
                                const minPrice = toNumber(sortedRates[0]?.tarifa || 0);
                                const maxPrice = toNumber(sortedRates[sortedRates.length - 1]?.tarifa || 1);

                                return (
                                    <motion.div
                                        key={comp.destino}
                                        variants={itemVariants}
                                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl transition-all duration-300 group"
                                    >
                                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center font-bold text-slate-700 border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    {comp.destino.substring(0, 3)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800">{comp.destino.split('-')[1] || comp.destino}</h3>
                                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Mejor: {formatCurrency(minPrice)}</p>
                                                </div>
                                            </div>
                                            <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                                <TrendingDown className="h-3 w-3" />
                                                Low
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            {sortedRates.map((rate, idx) => {
                                                const isBest = toNumber(rate.tarifa) === minPrice;
                                                const barWidth = maxPrice > 0 ? (toNumber(rate.tarifa) / maxPrice) * 100 : 0;

                                                return (
                                                    <div key={rate.aerolinea} className="relative group/bar">
                                                        <div className="flex items-center justify-between mb-1.5 z-10 relative">
                                                            <span className={cn(
                                                                "text-sm font-semibold transition-colors",
                                                                isBest ? "text-slate-900" : "text-slate-500 group-hover/bar:text-slate-700"
                                                            )}>
                                                                {rate.aerolinea}
                                                            </span>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={cn(
                                                                    "font-bold text-sm",
                                                                    isBest ? "text-emerald-600" : "text-slate-700"
                                                                )}>
                                                                    {formatCurrency(rate.tarifa)}
                                                                </span>
                                                                {isBest && (
                                                                    <Medal className="h-4 w-4 text-emerald-500 fill-emerald-100" />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden w-full">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${barWidth}%` }}
                                                                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                                                className={cn(
                                                                    "h-full rounded-full",
                                                                    isBest
                                                                        ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                                                        : "bg-slate-300"
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </section>

                {/* Catalog Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Plane className="h-5 w-5 text-indigo-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Catálogo de Tarifas</h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <Skeleton key={i} className="h-64 rounded-2xl bg-slate-200" />
                            ))}
                        </div>
                    ) : filteredTarifas.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 flex flex-col items-center justify-center text-center">
                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Search className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No se encontraron resultados</h3>
                            <p className="text-slate-500 max-w-sm mt-2">Prueba ajustando tus filtros o agrega una nueva tarifa para comenzar.</p>
                            <Button
                                onClick={handleOpenCreate}
                                variant="outline"
                                className="mt-6 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Agregar Tarifa
                            </Button>
                        </div>
                    ) : viewMode === "grid" ? (
                        <motion.div
                            key="grid"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            exit="hidden"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                        >
                            {filteredTarifas.map((tarifa) => (
                                <motion.div
                                    key={tarifa.id}
                                    variants={itemVariants}
                                    className={cn(
                                        "bg-white rounded-2xl border p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden",
                                        tarifa.es_activa
                                            ? "border-slate-200 hover:border-indigo-100"
                                            : "border-red-200 bg-red-50/10"
                                    )}
                                >
                                    {/* Background Decor */}
                                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-slate-50 group-hover:bg-indigo-50/50 transition-colors z-0" />

                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <Badge variant="outline" className={cn(
                                                "font-semibold pl-2 pr-3 py-1 rounded-full border-0",
                                                tarifa.es_activa ? "bg-indigo-50 text-indigo-700" : "bg-red-50 text-red-700"
                                            )}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full mr-2", tarifa.es_activa ? "bg-indigo-500" : "bg-red-500")} />
                                                {tarifa.aerolinea}
                                            </Badge>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-indigo-600 rounded-full">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                                    <DropdownMenuItem onClick={() => handleOpenEdit(tarifa)} className="font-medium">
                                                        <Pencil className="h-4 w-4 mr-2 text-slate-500" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleOpenDelete(tarifa)} className="text-red-600 font-medium focus:text-red-600 focus:bg-red-50">
                                                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <motion.div
                                            className="mb-6 text-center py-2"
                                            whileHover={{ scale: 1.05 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                        >
                                            <div className="text-4xl font-black text-slate-800 tracking-tight font-plus-jakarta group-hover:text-indigo-900 transition-colors">
                                                {tarifa.destino}
                                            </div>
                                            <div className="text-sm font-medium text-slate-400 uppercase tracking-widest mt-1">
                                                {tarifa.destino_ciudad}
                                            </div>
                                        </motion.div>

                                        <div className="flex items-end justify-center gap-1.5 mb-6">
                                            <div className="text-3xl font-bold text-slate-900">
                                                {formatCurrency(tarifa.tarifa_por_kilo).replace('$', '')}
                                            </div>
                                            <div className="text-sm font-semibold text-slate-400 mb-1.5">USD / Kg</div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-400">
                                            <span>Actualizado: {tarifa.fecha}</span>
                                            {tarifa.es_activa && (
                                                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="table"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                        >
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                        <TableHead className="font-bold text-slate-700">Aerolínea</TableHead>
                                        <TableHead className="font-bold text-slate-700">Destino</TableHead>
                                        <TableHead className="font-bold text-slate-700">Ciudad</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-right">Tarifa (USD/Kg)</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-center">Estado</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-right pr-8">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTarifas.map((tarifa) => (
                                        <TableRow key={tarifa.id} className="hover:bg-slate-50 group transition-colors">
                                            <TableCell className="font-semibold text-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                                        {tarifa.aerolinea.substring(0, 1)}
                                                    </div>
                                                    {tarifa.aerolinea}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono bg-slate-50 text-slate-600 border-slate-200">
                                                    {tarifa.destino}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-600 font-medium">{tarifa.destino_ciudad}</TableCell>
                                            <TableCell className="text-right font-bold text-slate-900 text-lg">
                                                {formatCurrency(tarifa.tarifa_por_kilo)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    className={cn(
                                                        "px-3 py-1 rounded-full border-0",
                                                        tarifa.es_activa
                                                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                                            : "bg-red-100 text-red-700 hover:bg-red-100"
                                                    )}
                                                >
                                                    {tarifa.es_activa ? "Activa" : "Inactiva"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenEdit(tarifa)}
                                                        className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenDelete(tarifa)}
                                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </motion.div>
                    )}
                </section>
            </div>

            {/* Create/Edit Modal - Modernized */}
            <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden gap-0 border-0 shadow-2xl">
                    <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center shadow-inner">
                                <Plane className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-900">
                                    {editingTarifa ? "Editar Tarifa" : "Nueva Tarifa"}
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 mt-1">
                                    {editingTarifa ? "Actualiza los valores de la tarifa seleccionada." : "Registra una nueva tarifa en el sistema."}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="aerolinea" className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1">Aerolínea</Label>
                                <Select
                                    value={formData.aerolinea.toString()}
                                    onValueChange={(v) => setFormData({ ...formData, aerolinea: parseInt(v) })}
                                >
                                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all hover:bg-white text-slate-800 font-medium">
                                        <SelectValue placeholder="Seleccione..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        {formOptions.aerolineas.map(a => (
                                            <SelectItem key={a.id} value={a.id.toString()}>
                                                {a.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="destino" className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1">Destino (IATA)</Label>
                                <Select
                                    value={formData.destino.toString()}
                                    onValueChange={(v) => setFormData({ ...formData, destino: parseInt(v) })}
                                >
                                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all hover:bg-white text-slate-800 font-medium">
                                        <SelectValue placeholder="Seleccione..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        {formOptions.destinos.map(d => (
                                            <SelectItem key={d.id} value={d.id.toString()}>
                                                <span className="font-mono font-bold text-slate-900 mr-2">{d.codigo}</span>
                                                <span className="text-slate-500">{d.ciudad}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="tarifa" className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1">Tarifa USD / Kg</Label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium group-focus-within:text-indigo-500 transition-colors">$</span>
                                    <Input
                                        id="tarifa"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.tarifa_por_kilo || ""}
                                        onChange={(e) => setFormData({ ...formData, tarifa_por_kilo: parseFloat(e.target.value) || 0 })}
                                        className="pl-8 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-lg font-bold text-slate-900 placeholder:text-slate-300 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1">Estado</Label>
                                <div className="h-12 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center px-4 hover:bg-white transition-all">
                                    <div className="flex items-center gap-3 w-full">
                                        <Switch
                                            id="es_activa"
                                            checked={formData.es_activa}
                                            onCheckedChange={(v) => setFormData({ ...formData, es_activa: v })}
                                        />
                                        <Label htmlFor="es_activa" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">
                                            {formData.es_activa ? (
                                                <span className="text-emerald-600 flex items-center gap-1.5"><CircleDot className="h-3 w-3" /> Activa</span>
                                            ) : (
                                                <span className="text-slate-400">Inactiva</span>
                                            )}
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 gap-3">
                        <Button variant="outline" onClick={() => setIsFormModalOpen(false)} disabled={isSubmitting} className="h-11 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 px-6">
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="h-11 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 px-8 transition-all hover:scale-105 active:scale-95">
                            {isSubmitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isSubmitting ? "Guardando..." : "Guardar Tarifa"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal - Modernized */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
                    <div className="bg-red-50 p-8 flex flex-col items-center justify-center text-center">
                        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <Trash2 className="h-8 w-8 text-red-500" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-slate-900 mb-2">¿Eliminar esta Tarifa?</DialogTitle>
                        <DialogDescription className="text-slate-500 max-w-xs mx-auto">
                            Esta acción eliminará permanentemente la tarifa y no se puede deshacer.
                        </DialogDescription>
                    </div>

                    {deletingTarifa && (
                        <div className="px-8 py-6 space-y-4 bg-white">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Aerolínea</span>
                                    <span className="font-bold text-slate-800">{deletingTarifa.aerolinea}</span>
                                </div>
                                <div className="h-px bg-slate-200" />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Destino</span>
                                    <div className="text-right">
                                        <div className="font-bold text-slate-800">{deletingTarifa.destino}</div>
                                        <div className="text-xs text-slate-500">{deletingTarifa.destino_ciudad}</div>
                                    </div>
                                </div>
                                <div className="h-px bg-slate-200" />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Tarifa</span>
                                    <span className="font-bold text-slate-900 text-lg">{formatCurrency(deletingTarifa.tarifa_por_kilo)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="p-6 pt-2 bg-white flex flex-col gap-3">
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30"
                        >
                            {isSubmitting ? "Eliminando..." : "Sí, Eliminar Tarifa"}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isSubmitting}
                            className="w-full h-11 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        >
                            Cancelar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
