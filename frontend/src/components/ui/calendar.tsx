"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                months: "relative flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                month_caption: "flex justify-center pt-1 relative items-center mb-4",
                caption_label: cn("text-sm font-semibold", props.captionLayout?.includes("dropdown") && "sr-only"),
                caption_dropdowns: "flex justify-center gap-2",
                dropdown: "bg-background cursor-pointer ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md border border-input h-7 px-2 py-0 text-sm font-medium",
                dropdown_month: "",
                dropdown_year: "",
                nav: "flex items-center justify-between absolute w-full z-10 px-1 top-1 pointer-events-none",
                button_previous: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-0 pointer-events-auto"
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-0 pointer-events-auto"
                ),
                month_grid: "w-full border-collapse space-y-1",
                weekdays: "flex w-full mb-2",
                weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
                week: "flex w-full mt-1",
                day: "h-9 w-9 p-0 relative",
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-full w-full p-0 font-normal hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                ),
                range_end: "day-range-end",
                selected:
                    "bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white focus:bg-emerald-600 focus:text-white rounded-md",
                today: "bg-slate-100 text-slate-900 rounded-md",
                outside:
                    "day-outside text-muted-foreground opacity-30 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
                disabled: "text-muted-foreground opacity-50",
                range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                hidden: "invisible",
                vhidden: "sr-only",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }) => orientation === "left"
                    ? <ChevronLeft className="h-4 w-4" />
                    : <ChevronRight className="h-4 w-4" />,
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
