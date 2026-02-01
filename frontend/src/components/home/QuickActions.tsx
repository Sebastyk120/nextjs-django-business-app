import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface QuickAction {
    label: string;
    icon: LucideIcon;
    href: string;
    color?: string;
}

interface QuickActionsProps {
    actions: QuickAction[];
}

const COLOR_STYLES: Record<string, { bg: string; gradient: string; shadow: string }> = {
    "bg-blue-600": { bg: "bg-blue-600", gradient: "from-blue-500 to-blue-600", shadow: "shadow-blue-200" },
    "bg-indigo-600": { bg: "bg-indigo-600", gradient: "from-indigo-500 to-indigo-600", shadow: "shadow-indigo-200" },
    "bg-emerald-600": { bg: "bg-emerald-600", gradient: "from-emerald-500 to-emerald-600", shadow: "shadow-emerald-200" },
    "bg-amber-600": { bg: "bg-amber-600", gradient: "from-amber-500 to-amber-600", shadow: "shadow-amber-200" },
    "bg-cyan-600": { bg: "bg-cyan-600", gradient: "from-cyan-500 to-cyan-600", shadow: "shadow-cyan-200" },
    "bg-rose-600": { bg: "bg-rose-600", gradient: "from-rose-500 to-rose-600", shadow: "shadow-rose-200" },
    "bg-purple-600": { bg: "bg-purple-600", gradient: "from-purple-500 to-purple-600", shadow: "shadow-purple-200" },
};

export function QuickActions({ actions }: QuickActionsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {actions.map((action) => {
                const styles = COLOR_STYLES[action.color || "bg-emerald-600"];
                return (
                    <Link
                        key={action.label}
                        href={action.href}
                        className="group relative flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-transparent"
                    >
                        {/* Hover gradient background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-5`} />

                        <div className={`relative p-4 rounded-2xl mb-3 bg-gradient-to-br ${styles.gradient} text-white shadow-lg ${styles.shadow} transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}>
                            <action.icon className="h-6 w-6" />
                        </div>

                        <span className="relative text-sm font-semibold text-slate-700 text-center group-hover:text-slate-900 transition-colors">
                            {action.label}
                        </span>

                        {/* Arrow indicator on hover */}
                        <div className="absolute top-3 right-3 opacity-0 -translate-x-2 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0">
                            <ArrowUpRight className="h-4 w-4 text-slate-400" />
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
