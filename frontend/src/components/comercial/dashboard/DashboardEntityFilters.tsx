import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, Truck, Apple, Building2 } from "lucide-react";
import { FilterOption } from "@/types/dashboard";

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
        placeholder
    }: {
        id: string;
        label: string;
        value: string;
        items: FilterOption[];
        icon: any;
        placeholder: string;
    }) => (
        <div className="space-y-1.5">
            <Label htmlFor={id} className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {label}
            </Label>
            <Select
                value={value || "all"}
                onValueChange={(val) => onFilterChange(id, val === "all" ? "" : val)}
            >
                <SelectTrigger id={id} className="h-9 text-sm bg-white border-slate-200">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {items.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                            {item.nombre}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Filtros de Entidad</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <FilterItem
                    id="cliente_id"
                    label="Cliente"
                    value={filters.cliente_id}
                    items={options.clientes}
                    icon={Users}
                    placeholder="Todos los clientes"
                />
                <FilterItem
                    id="intermediario_id"
                    label="Intermediario"
                    value={filters.intermediario_id}
                    items={options.intermediarios}
                    icon={Truck}
                    placeholder="Todos los intermediarios"
                />
                <FilterItem
                    id="fruta_id"
                    label="Fruta"
                    value={filters.fruta_id}
                    items={options.frutas}
                    icon={Apple}
                    placeholder="Todas las frutas"
                />
                <FilterItem
                    id="exportador_id"
                    label="Exportador"
                    value={filters.exportador_id}
                    items={options.exportadores}
                    icon={Building2}
                    placeholder="Todos los exportadores"
                />
            </div>
        </div>
    );
}
