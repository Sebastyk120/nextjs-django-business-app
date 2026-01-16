'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Loader2 } from 'lucide-react';
import { getGuiasAutocomplete } from '@/services/nacionalesService';
import type { GuiaAutocompleteItem } from '@/types/nacionales';

interface ReporteIndividualSearchProps {
    onSearch: (numeroGuia: string) => void;
    loading?: boolean;
}

export default function ReporteIndividualSearch({ onSearch, loading }: ReporteIndividualSearchProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<GuiaAutocompleteItem[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    const fetchSuggestions = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setSuggestions([]);
            return;
        }

        setLoadingSuggestions(true);
        try {
            const results = await getGuiasAutocomplete(searchQuery);
            setSuggestions(results);
            setOpen(true);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            setSuggestions([]);
        } finally {
            setLoadingSuggestions(false);
        }
    }, []);

    useEffect(() => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        if (query.length >= 2) {
            const timer = setTimeout(() => {
                fetchSuggestions(query);
            }, 300);
            setDebounceTimer(timer);
        } else {
            setSuggestions([]);
            setOpen(false);
        }

        return () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
        };
    }, [query, fetchSuggestions]);

    const handleSelect = (value: string) => {
        setQuery(value);
        setOpen(false);
        onSearch(value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setOpen(false);
            onSearch(query.trim());
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="flex items-center justify-center gap-3 text-center text-slate-900 mb-6 text-2xl font-bold tracking-tight font-plus-jakarta">
                    <Search className="h-8 w-8 text-blue-600" />
                    Buscar Reporte Individual
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative">
                        <label htmlFor="numero_guia" className="block mb-2 font-medium text-gray-700 text-sm">
                            Número de Guía
                        </label>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <div className="relative">
                                    <Input
                                        id="numero_guia"
                                        type="text"
                                        placeholder="Buscar por número de guía..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="pr-10"
                                        autoComplete="off"
                                    />
                                    {loadingSuggestions && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                                    )}
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command>
                                    <CommandList>
                                        <CommandEmpty>No se encontraron guías</CommandEmpty>
                                        <CommandGroup>
                                            {suggestions.map((item) => (
                                                <CommandItem
                                                    key={item.value}
                                                    value={item.value}
                                                    onSelect={() => handleSelect(item.value)}
                                                    className="cursor-pointer"
                                                >
                                                    {item.label}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Buscando...
                            </>
                        ) : (
                            <>
                                <Search className="mr-2 h-4 w-4" />
                                Buscar Reporte
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
