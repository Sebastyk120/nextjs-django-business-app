"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2 } from "lucide-react";
import { Pedido } from "@/types/pedido";

interface ColumnSelectorProps {
    columns: { key: keyof Pedido; label: string }[];
    visibleColumns: (keyof Pedido)[];
    onToggleColumn: (key: keyof Pedido) => void;
}

export function ColumnSelector({
    columns,
    visibleColumns,
    onToggleColumn,
}: ColumnSelectorProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden h-8 lg:flex">
                    <Settings2 className="mr-2 h-4 w-4" />
                    Columnas
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px] h-[300px] overflow-y-auto">
                <DropdownMenuLabel>Mostrar Columnas</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((column) => (
                    <DropdownMenuCheckboxItem
                        key={column.key}
                        checked={visibleColumns.includes(column.key)}
                        onCheckedChange={() => onToggleColumn(column.key)}
                        className="capitalize"
                    >
                        {column.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
