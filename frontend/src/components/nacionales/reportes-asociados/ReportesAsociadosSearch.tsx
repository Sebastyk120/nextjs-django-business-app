'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Loader2, Receipt, Hash, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getGuiasAutocomplete, getFacturasAutocomplete, getRemisionesAutocomplete } from '@/services/nacionalesService';
import type { GuiaAutocompleteItem, AutocompleteItem } from '@/types/nacionales';

interface ReportesAsociadosSearchProps {
    onSearch: (params: { factura?: string; numero_guia?: string; remision?: string }) => void;
    loading?: boolean;
}

interface AutocompleteFieldProps {
    label: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    onSelect: (value: string) => void;
    fetchSuggestions: (query: string) => Promise<AutocompleteItem[] | GuiaAutocompleteItem[]>;
    icon: React.ElementType;
}

function AutocompleteField({
    label,
    placeholder,
    value,
    onChange,
    onSelect,
    fetchSuggestions,
    icon: Icon,
}: AutocompleteFieldProps) {
    const [open, setOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<(AutocompleteItem | GuiaAutocompleteItem)[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    const handleFetch = useCallback(async (query: string) => {
        if (query.length < 1) {
            setSuggestions([]);
            return;
        }

        setLoadingSuggestions(true);
        try {
            const results = await fetchSuggestions(query);
            setSuggestions(results);
            if (results.length > 0) setOpen(true);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            setSuggestions([]);
        } finally {
            setLoadingSuggestions(false);
        }
    }, [fetchSuggestions]);

    useEffect(() => {
        if (debounceTimer) clearTimeout(debounceTimer);

        if (value.length >= 1) {
            const timer = setTimeout(() => handleFetch(value), 300);
            setDebounceTimer(timer);
        } else {
            setSuggestions([]);
            setOpen(false);
        }

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    }, [value, handleFetch]);

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">{label}</label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Icon className="h-4 w-4" />
                        </div>
                        <Input
                            type="text"
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="pl-10 pr-10"
                            autoComplete="off"
                        />
                        {loadingSuggestions && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                        )}
                    </div>
                </PopoverTrigger>
                {suggestions.length > 0 && (
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                            <CommandList>
                                <CommandEmpty>No se encontraron resultados</CommandEmpty>
                                <CommandGroup>
                                    {suggestions.map((item, index) => (
                                        <CommandItem
                                            key={`${item.value}-${index}`}
                                            value={item.value}
                                            onSelect={() => {
                                                onSelect(item.value);
                                                setOpen(false);
                                            }}
                                            className="cursor-pointer"
                                        >
                                            {item.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                )}
            </Popover>
        </div>
    );
}

export default function ReportesAsociadosSearch({ onSearch, loading }: ReportesAsociadosSearchProps) {
    const [factura, setFactura] = useState('');
    const [numeroGuia, setNumeroGuia] = useState('');
    const [remision, setRemision] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!factura.trim() && !numeroGuia.trim() && !remision.trim()) {
            return;
        }

        onSearch({
            factura: factura.trim() || undefined,
            numero_guia: numeroGuia.trim() || undefined,
            remision: remision.trim() || undefined,
        });
    };

    const hasSearchCriteria = factura.trim() || numeroGuia.trim() || remision.trim();

    return (
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 ring-1 ring-slate-200">
            <CardHeader className="pb-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-xl border-b border-slate-100">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <Search className="h-5 w-5 text-emerald-600" />
                    </div>
                    Buscar Reportes
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <AutocompleteField
                            label="Número de Factura"
                            placeholder="Buscar por factura..."
                            value={factura}
                            onChange={setFactura}
                            onSelect={setFactura}
                            fetchSuggestions={getFacturasAutocomplete}
                            icon={Receipt}
                        />

                        <AutocompleteField
                            label="Número de Guía"
                            placeholder="Buscar por guía..."
                            value={numeroGuia}
                            onChange={setNumeroGuia}
                            onSelect={setNumeroGuia}
                            fetchSuggestions={getGuiasAutocomplete}
                            icon={Hash}
                        />

                        <AutocompleteField
                            label="Número de Remisión/Reporte"
                            placeholder="Buscar por remisión..."
                            value={remision}
                            onChange={setRemision}
                            onSelect={setRemision}
                            fetchSuggestions={getRemisionesAutocomplete}
                            icon={FileText}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={loading || !hasSearchCriteria}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Buscando...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    Buscar
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
