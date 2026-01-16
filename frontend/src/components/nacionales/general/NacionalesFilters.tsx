"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, RotateCcw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function NacionalesFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [showCompleted, setShowCompleted] = useState(searchParams.get("completed") === "true");

    // Debounce effect for automatic search
    useEffect(() => {
        const timer = setTimeout(() => {
            // Only update if search term changed in URL or state
            const currentSearch = searchParams.get("search") || "";
            if (searchTerm !== currentSearch) {
                updateFilters(searchTerm, showCompleted);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Update URL function
    const updateFilters = (term: string, completed: boolean) => {
        const params = new URLSearchParams();
        if (term) params.set("search", term);
        if (completed) params.set("completed", "true");

        router.push(`?${params.toString()}`);
    };

    // Handle Search Input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Handle Toggle
    const handleToggle = (checked: boolean) => {
        setShowCompleted(checked);
        updateFilters(searchTerm, checked);
    };

    // Handle Clear
    const handleClear = () => {
        setSearchTerm("");
        setShowCompleted(false);
        router.push("?");
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm items-center justify-between">
            <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Buscar por # Guía, Proveedor..."
                    className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>

            <div className="flex items-center gap-6 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="completed-mode"
                        checked={showCompleted}
                        onCheckedChange={(checked) => handleToggle(checked as boolean)}
                    />

                    <Label htmlFor="completed-mode" className="text-slate-600 font-medium cursor-pointer">
                        Solo Completados
                    </Label>
                </div>

                {(searchTerm || showCompleted) && (
                    <Button variant="ghost" size="icon" onClick={handleClear} className="text-slate-400 hover:text-red-500">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
