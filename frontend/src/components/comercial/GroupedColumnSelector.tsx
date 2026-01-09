"use client";

import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Settings2, Check, X } from "lucide-react";
import { Pedido } from "@/types/pedido";
import { Badge } from "@/components/ui/badge";

export type ColumnGroup = "General" | "Logística" | "Fechas" | "Cantidades" | "Facturación" | "Financiero" | "Estado" | "Tracking";

export interface GroupedColumn {
    key: keyof Pedido;
    label: string;
    group: ColumnGroup;
}

interface GroupedColumnSelectorProps {
    columns: GroupedColumn[];
    visibleColumns: (keyof Pedido)[];
    onToggleColumn: (key: keyof Pedido) => void;
    onToggleGroup: (group: ColumnGroup, show: boolean) => void;
}

const GROUP_Colors: Record<ColumnGroup, string> = {
    "General": "bg-slate-200 text-slate-800 border-slate-300",
    "Logística": "bg-blue-200 text-blue-800 border-blue-300",
    "Fechas": "bg-indigo-200 text-indigo-800 border-indigo-300",
    "Cantidades": "bg-orange-200 text-orange-800 border-orange-300",
    "Facturación": "bg-emerald-200 text-emerald-800 border-emerald-300",
    "Financiero": "bg-amber-200 text-amber-800 border-amber-300",
    "Estado": "bg-zinc-200 text-zinc-800 border-zinc-300",
    "Tracking": "bg-cyan-200 text-cyan-800 border-cyan-300",
};

export function GroupedColumnSelector({
    columns,
    visibleColumns,
    onToggleColumn,
    onToggleGroup,
}: GroupedColumnSelectorProps) {
    // Group columns by their group property
    const groupedColumns = columns.reduce((acc, col) => {
        if (!acc[col.group]) {
            acc[col.group] = [];
        }
        acc[col.group].push(col);
        return acc;
    }, {} as Record<ColumnGroup, GroupedColumn[]>);

    const groups = Object.keys(groupedColumns) as ColumnGroup[];

    // Helper to check if all columns in a group are visible
    const isGroupVisible = (group: ColumnGroup) => {
        const groupCols = groupedColumns[group];
        return groupCols.every(col => visibleColumns.includes(col.key));
    };

    // Helper to check if some columns in a group are visible
    const isGroupPartial = (group: ColumnGroup) => {
        const groupCols = groupedColumns[group];
        const visibleCount = groupCols.filter(col => visibleColumns.includes(col.key)).length;
        return visibleCount > 0 && visibleCount < groupCols.length;
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="hidden h-8 lg:flex">
                    <Settings2 className="mr-2 h-4 w-4" />
                    Vista de Columnas
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[1200px] p-0">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h4 className="font-semibold text-sm text-slate-900 mb-1">Configuración de Visualización</h4>
                    <p className="text-xs text-slate-500">Selecciona las columnas que deseas ver en la tabla, organizadas por grupos.</p>
                </div>
                <ScrollArea className="h-[550px] p-4">
                    <div className="grid grid-cols-5 gap-x-5 gap-y-10">
                        {/* Column 1: General & Fechas */}
                        <div className="space-y-10">
                            {["General", "Fechas"].map(g => (
                                <GroupSection
                                    key={g}
                                    group={g as ColumnGroup}
                                    columns={groupedColumns[g as ColumnGroup] || []}
                                    visibleColumns={visibleColumns}
                                    onToggleColumn={onToggleColumn}
                                    onToggleGroup={onToggleGroup}
                                />
                            ))}
                        </div>

                        {/* Column 2: Logística */}
                        <div>
                            {groupedColumns["Logística"] && (
                                <GroupSection
                                    group="Logística"
                                    columns={groupedColumns["Logística"]}
                                    visibleColumns={visibleColumns}
                                    onToggleColumn={onToggleColumn}
                                    onToggleGroup={onToggleGroup}
                                />
                            )}
                        </div>

                        {/* Column 3: Facturación & Cantidades */}
                        <div className="space-y-10">
                            {["Facturación", "Cantidades"].map(g => (
                                <GroupSection
                                    key={g}
                                    group={g as ColumnGroup}
                                    columns={groupedColumns[g as ColumnGroup] || []}
                                    visibleColumns={visibleColumns}
                                    onToggleColumn={onToggleColumn}
                                    onToggleGroup={onToggleGroup}
                                />
                            ))}
                        </div>

                        {/* Column 4: Financiero (muchos campos) */}
                        <div className="border-l border-slate-200 pl-5">
                            {groupedColumns["Financiero"] && (
                                <GroupSection
                                    group="Financiero"
                                    columns={groupedColumns["Financiero"]}
                                    visibleColumns={visibleColumns}
                                    onToggleColumn={onToggleColumn}
                                    onToggleGroup={onToggleGroup}
                                />
                            )}
                        </div>

                        {/* Column 5: Tracking (muchos campos) */}
                        <div className="border-l border-slate-200 pl-5">
                            {groupedColumns["Tracking"] && (
                                <GroupSection
                                    group="Tracking"
                                    columns={groupedColumns["Tracking"]}
                                    visibleColumns={visibleColumns}
                                    onToggleColumn={onToggleColumn}
                                    onToggleGroup={onToggleGroup}
                                />
                            )}
                        </div>
                    </div>
                </ScrollArea>
                <div className="p-3 border-t border-slate-100 bg-slate-50/80 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => { }} className="text-xs text-slate-500 hover:text-slate-900">
                        Restablecer vista por defecto
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

// Sub-component for clarity
function GroupSection({ group, columns, visibleColumns, onToggleColumn, onToggleGroup }: {
    group: ColumnGroup,
    columns: GroupedColumn[],
    visibleColumns: (keyof Pedido)[],
    onToggleColumn: (key: keyof Pedido) => void,
    onToggleGroup: (group: ColumnGroup, show: boolean) => void
}) {
    if (!columns.length) return null;
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <Badge variant="secondary" className={`font-semibold rounded-md px-2 py-1 ${GROUP_Colors[group]}`}>
                    {group}
                </Badge>
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-green-50"
                        onClick={() => onToggleGroup(group, true)}
                        title="Mostrar Todos"
                    >
                        <Check className="h-3 w-3 text-green-600" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-red-50"
                        onClick={() => onToggleGroup(group, false)}
                        title="Ocultar Todos"
                    >
                        <X className="h-3 w-3 text-red-600" />
                    </Button>
                </div>
            </div>
            <div className="space-y-2">
                {columns.map((col) => (
                    <div key={col.key} className="flex items-start space-x-2">
                        <Checkbox
                            id={`col-${col.key}`}
                            checked={visibleColumns.includes(col.key)}
                            onCheckedChange={() => onToggleColumn(col.key)}
                        />
                        <label
                            htmlFor={`col-${col.key}`}
                            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer pt-0.5 text-slate-600 transition-colors hover:text-slate-900"
                        >
                            {col.label}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
}
