"use client";

import { useEffect, useState, useMemo } from "react";
import axiosClient from "@/lib/axios";
import {
    TarifaFruta,
    FruitComparison,
    TarifasFrutasOptions,
    TarifaFrutaForm
} from "@/types/tarifa-fruta";
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
    Apple,
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
    ArrowUp,
    ArrowDown,
    Minus,
    TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type ViewMode = "grid" | "table";

export default function TarifasFrutasPage() {
    // State
    const [loading, setLoading] = useState(true);
    const [tarifas, setTarifas] = useState<TarifaFruta[]>([]);
    const [comparisons, setComparisons] = useState<FruitComparison[]>([]);
    const [formOptions, setFormOptions] = useState<TarifasFrutasOptions>({ frutas: [], exportadores: [] });
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFruit, setActiveFruit] = useState<string>("all");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");

    // Permissions
    const [isHeavens, setIsHeavens] = useState(false);

    // Modal States
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingTarifa, setEditingTarifa] = useState<TarifaFruta | null>(null);
    const [deletingTarifa, setDeletingTarifa] = useState<TarifaFruta | null>(null);

    // Form State
    const [formData, setFormData] = useState<TarifaFrutaForm>({
        fruta: 0,
        exportadora: 0,
        precio_kilo: 0,
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
                axiosClient.get('/comercial/api/tarifas-frutas/'),
                axiosClient.get('/comercial/api/tarifas-frutas/comparison/'),
                axiosClient.get('/comercial/api/tarifas-frutas/options/')
            ]);

            setTarifas(tarifasRes.data.data || []);
            setComparisons(compRes.data.data || []);
            setFormOptions(optionsRes.data || { frutas: [], exportadores: [] });
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
    const uniqueFruits = useMemo(() => {
        return [...new Set(tarifas.map(t => t.fruta))].sort();
    }, [tarifas]);

    const filteredTarifas = useMemo(() => {
        return tarifas.filter(t => {
            const matchesSearch =
                t.fruta.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.exportadora.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFruit = activeFruit === "all" || t.fruta === activeFruit;
            return matchesSearch && matchesFruit;
        });
    }, [tarifas, searchTerm, activeFruit]);

    const filteredComparisons = useMemo(() => {
        return comparisons.filter(c =>
            c.fruta.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [comparisons, searchTerm]);

    // Helpers
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Handlers
    const handleOpenCreate = () => {
        setEditingTarifa(null);
        setFormData({
            fruta: formOptions.frutas[0]?.id || 0,
            exportadora: formOptions.exportadores[0]?.id || 0,
            precio_kilo: 0,
        });
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (tarifa: TarifaFruta) => {
        setEditingTarifa(tarifa);
        setFormData({
            fruta: tarifa.fruta_id,
            exportadora: tarifa.exportadora_id,
            precio_kilo: typeof tarifa.precio_kilo === 'string' ? parseFloat(tarifa.precio_kilo) : tarifa.precio_kilo,
        });
        setIsFormModalOpen(true);
    };

    const handleOpenDelete = (tarifa: TarifaFruta) => {
        setDeletingTarifa(tarifa);
        setIsDeleteModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.fruta || !formData.exportadora || !formData.precio_kilo) {
            toast.error("Por favor complete todos los campos");
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingTarifa) {
                await axiosClient.put(`/comercial/api/tarifas-frutas/${editingTarifa.id}/`, formData);
                toast.success("Precio actualizado correctamente");
            } else {
                await axiosClient.post('/comercial/api/tarifas-frutas/', formData);
                toast.success("Precio creado correctamente");
            }
            setIsFormModalOpen(false);
            fetchData();
        } catch (error: any) {
            console.error("Error saving tarifa:", error);
            const errorMsg = error.response?.data?.error || "Error al guardar el precio";
            toast.error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingTarifa) return;

        setIsSubmitting(true);
        try {
            await axiosClient.delete(`/comercial/api/tarifas-frutas/${deletingTarifa.id}/`);
            toast.success("Precio eliminado correctamente");
            setIsDeleteModalOpen(false);
            setDeletingTarifa(null);
            fetchData();
        } catch (error) {
            console.error("Error deleting tarifa:", error);
            toast.error("Error al eliminar el precio");
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
                        <Apple className="h-10 w-10 text-slate-300" />
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
                                <div className="h-10 w-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 transform -rotate-3">
                                    <Apple className="h-6 w-6 text-white" />
                                </div>
                                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-plus-jakarta">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">
                                        Precios de Fruta
                                    </span>
                                </h1>
                                <Badge className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-100 px-3 py-1">
                                    {tarifas.length} Registros
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
                                Nuevo Precio
                            </Button>
                        </motion.div>
                    </div>

                    {/* Controls Bar */}
                    <div className="pb-6">
                        <div className="flex flex-col lg:flex-row gap-4 items-center bg-slate-50 p-2 rounded-2xl border border-slate-200">
                            <div className="relative flex-1 w-full lg:w-auto z-10 max-w-2xl">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-20" />
                                <Input
                                    placeholder="Buscar por fruta, exportador..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 h-14 bg-white border-transparent shadow-sm focus:border-orange-200 focus:ring-2 focus:ring-orange-100 rounded-xl text-lg text-slate-900 placeholder:text-slate-400"
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 px-2 scrollbar-hide">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setActiveFruit("all")}
                                    className={cn(
                                        "h-10 px-5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                                        activeFruit === "all"
                                            ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                                    )}
                                >
                                    Todas
                                </motion.button>
                                {uniqueFruits.map(fruit => (
                                    <motion.button
                                        key={fruit}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setActiveFruit(fruit)}
                                        className={cn(
                                            "h-10 px-5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                                            activeFruit === fruit
                                                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                                                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                                        )}
                                    >
                                        {fruit}
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
                                    className="h-11 w-11 rounded-xl border-slate-200 text-slate-500 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-all"
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
                            <p className="text-slate-500">No hay datos para comparar.</p>
                        </div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {filteredComparisons.map((comp) => {
                                // stats provided by backend
                                const minPrice = comp.stats.min;
                                const maxPrice = comp.stats.max;
                                const sortedRates = [...comp.rates].sort((a, b) => a.precio - b.precio);

                                return (
                                    <motion.div
                                        key={comp.fruta}
                                        variants={itemVariants}
                                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl transition-all duration-300 group"
                                    >
                                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center font-bold text-orange-700 border border-orange-100">
                                                    <Apple className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800">{comp.fruta}</h3>
                                                    <p className="text-xs text-slate-400 font-medium">Avg: {formatCurrency(comp.stats.avg)}</p>
                                                </div>
                                            </div>
                                            <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3" />
                                                Best: {formatCurrency(minPrice)}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            {sortedRates.map((rate, idx) => {
                                                const isBest = rate.precio === minPrice;
                                                const barWidth = maxPrice > 0 ? (rate.precio / maxPrice) * 100 : 0;

                                                return (
                                                    <div key={rate.exportador} className="relative group/bar">
                                                        <div className="flex items-center justify-between mb-1.5 z-10 relative">
                                                            <span className={cn(
                                                                "text-sm font-semibold transition-colors",
                                                                isBest ? "text-slate-900" : "text-slate-500 group-hover/bar:text-slate-700"
                                                            )}>
                                                                {rate.exportador}
                                                            </span>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={cn(
                                                                    "font-bold text-sm",
                                                                    isBest ? "text-emerald-600" : "text-slate-700"
                                                                )}>
                                                                    {formatCurrency(rate.precio)}
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
                                                                        ? "bg-gradient-to-r from-emerald-500 to-teal-400"
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
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Apple className="h-5 w-5 text-orange-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">Listado de Precios</h2>
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
                            <Button
                                onClick={handleOpenCreate}
                                variant="outline"
                                className="mt-6 border-orange-200 text-orange-700 hover:bg-orange-50"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Agregar Precio
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
                                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <Badge variant="outline" className="font-semibold pl-2 pr-3 py-1 rounded-full border-0 bg-orange-50 text-orange-700">
                                            <Apple className="h-3 w-3 mr-1" />
                                            {tarifa.fruta}
                                        </Badge>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-orange-600 rounded-full">
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
                                        <div className="text-xl font-bold text-slate-800 group-hover:text-orange-900 transition-colors">
                                            {tarifa.exportadora}
                                        </div>
                                        <div className="text-xs font-medium text-slate-400 mt-1">Exportador</div>
                                    </motion.div>

                                    <div className="flex items-end justify-center gap-1.5 mb-6">
                                        <div className="text-3xl font-bold text-slate-900">
                                            {formatCurrency(tarifa.precio_kilo)}
                                        </div>
                                        <div className="text-sm font-semibold text-slate-400 mb-1.5">/ Kg</div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-400">
                                        <span>Actualizado: {tarifa.fecha}</span>
                                        {/* Trend logic if needed */}
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
                                        <TableHead className="font-bold text-slate-700">Fruta</TableHead>
                                        <TableHead className="font-bold text-slate-700">Exportador</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-right">Precio (COP/Kg)</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-right">Actualizado</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-right pr-8">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTarifas.map((tarifa) => (
                                        <TableRow key={tarifa.id} className="hover:bg-slate-50 group transition-colors">
                                            <TableCell className="font-semibold text-slate-800">
                                                <Badge variant="outline" className="font-mono bg-orange-50 text-orange-700 border-orange-100">
                                                    {tarifa.fruta}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-800 font-medium">
                                                {tarifa.exportadora}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-slate-900 text-lg">
                                                {formatCurrency(tarifa.precio_kilo)}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-500 text-sm">
                                                {tarifa.fecha}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenEdit(tarifa)}
                                                        className="h-8 w-8 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
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

            {/* Create/Edit Modal */}
            <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden gap-0 border-0 shadow-2xl">
                    <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center shadow-inner">
                                <Apple className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-900">
                                    {editingTarifa ? "Editar Precio" : "Nuevo Precio"}
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 mt-1">
                                    {editingTarifa ? "Actualiza el precio seleccionado." : "Registra un nuevo precio de fruta."}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="fruta" className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1">Fruta</Label>
                                <Select
                                    value={formData.fruta.toString()}
                                    onValueChange={(v) => setFormData({ ...formData, fruta: parseInt(v) })}
                                >
                                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all hover:bg-white text-slate-800 font-medium">
                                        <SelectValue placeholder="Seleccione Fruta..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        {formOptions.frutas.map(f => (
                                            <SelectItem key={f.id} value={f.id.toString()}>
                                                {f.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="exportador" className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1">Exportador</Label>
                                <Select
                                    value={formData.exportadora.toString()}
                                    onValueChange={(v) => setFormData({ ...formData, exportadora: parseInt(v) })}
                                >
                                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all hover:bg-white text-slate-800 font-medium">
                                        <SelectValue placeholder="Seleccione Exportador..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                        {formOptions.exportadores.map(e => (
                                            <SelectItem key={e.id} value={e.id.toString()}>
                                                {e.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="precio" className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1">Precio por Kilos (COP)</Label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium group-focus-within:text-orange-500 transition-colors">$</span>
                                    <Input
                                        id="precio"
                                        type="number"
                                        step="1"
                                        min="0"
                                        value={formData.precio_kilo || ""}
                                        onChange={(e) => setFormData({ ...formData, precio_kilo: parseFloat(e.target.value) || 0 })}
                                        className="pl-8 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-lg font-bold text-slate-900 placeholder:text-slate-300 transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 gap-3">
                        <Button variant="ghost" onClick={() => setIsFormModalOpen(false)} className="rounded-xl h-11 text-slate-500 hover:text-slate-900">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl h-11 px-8 shadow-lg shadow-slate-900/20"
                        >
                            {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : (editingTarifa ? "Guardar Cambios" : "Crear Precio")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
                    <div className="p-8 text-center">
                        <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trash2 className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar Precio?</h2>
                        <p className="text-slate-500 mb-6">
                            Esta acción eliminará el precio de <strong>{deletingTarifa?.fruta}</strong> para <strong>{deletingTarifa?.exportadora}</strong> de forma permanente.
                        </p>

                        <div className="flex gap-3 justify-center">
                            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="rounded-xl h-11 border-slate-200">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleDelete}
                                disabled={isSubmitting}
                                className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-11 px-6 shadow-lg shadow-red-500/20 border-0"
                            >
                                {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Sí, Eliminar"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
