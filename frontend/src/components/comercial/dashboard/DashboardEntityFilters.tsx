import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, Truck, Apple, Building2, Filter } from "lucide-react";
import { FilterOption } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface DashboardEntityFiltersProps {
    filters: {
        cliente_id: string;
        intermediario_id: string;
        fruta_id: string;
        exportador_id: string;
    };
    options: {
        clientes: FilterOption[];
        intermediarios: FilterOption[];
        frutas: FilterOption[];
        exportadores: FilterOption[];
    };
    onFilterChange: (key: string, value: string) => void;
}

export function DashboardEntityFilters({
    filters,
    options,
    onFilterChange
}: DashboardEntityFiltersProps) {

    const FilterItem = ({
        id,
        label,
        value,
        items,
        icon: Icon,
        placeholder,
        colorClass
    }: {
        id: string;
        label: string;
        value: string;
        items: FilterOption[];
        icon: React.ElementType;
        placeholder: string;
        colorClass: string;
    }) => (
        <div className="space-y-2">
            <Label 
                htmlFor={id} 
                className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5"
            >
                <div className={cn("w-5 h-5 rounded-md flex items-center justify-center", colorClass)}>
                    <Icon className="h-3 w-3 text-white" />
                </div>
                {label}
            </Label>
            <Select
                value={value || "all"}
                onValueChange={(val) => onFilterChange(id, val === "all" ? "" : val)}
            >
                <SelectTrigger 
                    id={id} 
                    className="h-10 text-sm bg-slate-50 border-slate-200 rounded-xl hover:bg-white hover:border-slate-300 transition-all focus:ring-2 focus:ring-slate-200"
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="all" className="text-sm">
                        <span className="text-slate-500">Todos los {label.toLowerCase()}s</span>
                    </SelectItem>
                    {items.map((item) => (
                        <SelectItem 
                            key={item.id} 
                            value={item.id.toString()}
                            className="text-sm"
                        >
                            {item.nombre}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <Filter className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">
                            Filtros de Entidad
                        </h3>
                        <p className="text-[11px] text-slate-400">
                            Filtra por cliente, intermediario, fruta o exportador
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters Grid */}
            <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <FilterItem
                        id="cliente_id"
                        label="Cliente"
                        value={filters.cliente_id}
                        items={options.clientes}
                        icon={Users}
                        placeholder="Seleccionar cliente"
                        colorClass="bg-blue-500"
                    />
                    <FilterItem
                        id="intermediario_id"
                        label="Intermediario"
                        value={filters.intermediario_id}
                        items={options.intermediarios}
                        icon={Truck}
                        placeholder="Seleccionar intermediario"
                        colorClass="bg-amber-500"
                    />
                    <FilterItem
                        id="fruta_id"
                        label="Fruta"
                        value={filters.fruta_id}
                        items={options.frutas}
                        icon={Apple}
                        placeholder="Seleccionar fruta"
                        colorClass="bg-emerald-500"
                    />
                    <FilterItem
                        id="exportador_id"
                        label="Exportador"
                        value={filters.exportador_id}
                        items={options.exportadores}
                        icon={Building2}
                        placeholder="Seleccionar exportador"
                        colorClass="bg-purple-500"
                    />
                </div>
            </div>
        </div>
    );
}
