"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DateTimePickerProps {
    value?: string | Date | null
    onChange: (value: string) => void
    label?: string
    showTime?: boolean
    fromYear?: number
    toYear?: number
}

export function DateTimePicker({ value, onChange, label, showTime = true, fromYear = 2015, toYear = new Date().getFullYear() }: DateTimePickerProps) {
    const dateValue = value ? new Date(value) : undefined

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return

        // Create a new date using local time components to avoid timezone issues
        // react-day-picker returns dates at midnight UTC which can shift days
        const year = date.getFullYear()
        const month = date.getMonth()
        const day = date.getDate()

        let newDate: Date

        if (dateValue && showTime) {
            // Preserve existing time when selecting a new date
            newDate = new Date(year, month, day, dateValue.getHours(), dateValue.getMinutes())
        } else {
            // Create date at noon to avoid any edge cases with midnight
            newDate = new Date(year, month, day, 12, 0, 0)
        }

        if (showTime) {
            onChange(newDate.toISOString())
        } else {
            // YYYY-MM-DD format using local date components
            const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            onChange(formattedDate)
        }
    }

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const [hours, minutes] = e.target.value.split(':').map(Number)
        const newDate = dateValue ? new Date(dateValue) : new Date()
        newDate.setHours(hours)
        newDate.setMinutes(minutes)
        onChange(newDate.toISOString())
    }

    return (
        <div className="flex flex-col gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal h-10 px-3 border-input bg-background hover:bg-slate-50 transition-colors",
                            !value && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                        <span className="truncate">
                            {dateValue ? (
                                format(dateValue, showTime ? "PPP HH:mm" : "PPP", { locale: es })
                            ) : (
                                `Seleccionar ${showTime ? 'fecha y hora' : 'fecha'}`
                            )}
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white shadow-2xl border border-slate-200 rounded-xl" align="start" sideOffset={8}>
                    <div className="p-1">
                        <Calendar
                            mode="single"
                            selected={dateValue}
                            defaultMonth={dateValue}
                            onSelect={handleDateSelect}
                            initialFocus
                            captionLayout="dropdown"
                            fromYear={fromYear}
                            toYear={toYear}
                        />
                    </div>
                    {showTime && (
                        <div className="p-4 border-t border-slate-100 flex items-center gap-3 bg-slate-50/50 rounded-b-xl">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Clock className="h-4 w-4" />
                                <span className="text-xs font-medium">Hora:</span>
                            </div>
                            <Input
                                type="time"
                                className="h-10 py-1 text-sm bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all rounded-lg"
                                value={dateValue ? format(dateValue, "HH:mm") : "00:00"}
                                onChange={handleTimeChange}
                            />
                        </div>
                    )}
                </PopoverContent>
            </Popover>
        </div>
    )
}
