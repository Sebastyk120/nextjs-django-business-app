import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface QuickAction {
    label: string;
    icon: LucideIcon;
    href: string;
    color?: string; // Tailwind bg color class (e.g., "bg-blue-500")
}

interface QuickActionsProps {
    actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {actions.map((action) => (
                <Link
                    key={action.label}
                    href={action.href}
                    className="group flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1"
                >
                    <div className={`p-3 rounded-full mb-3 text-white transition-transform group-hover:scale-110 ${action.color || 'bg-emerald-600'}`}>
                        <action.icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 text-center group-hover:text-emerald-700 transition-colors">
                        {action.label}
                    </span>
                </Link>
            ))}
        </div>
    );
}
