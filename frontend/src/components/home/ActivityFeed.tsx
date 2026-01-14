import { ActivityItem } from "@/types/home-dashboard";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
    CheckCircle2,
    ShoppingCart,
    AlertCircle,
    Info
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const ICONS = {
    new_order: ShoppingCart,
    my_order: ShoppingCart,
    system: Info,
    alert: AlertCircle
};

const COLORS = {
    new_order: "bg-blue-100 text-blue-600",
    my_order: "bg-emerald-100 text-emerald-600",
    system: "bg-slate-100 text-slate-600",
    alert: "bg-rose-100 text-rose-600"
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
    if (items.length === 0) {
        return (
            <div className="text-center py-10 text-slate-500 border border-dashed rounded-xl bg-slate-50">
                <p>No hay actividad reciente</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 font-plus-jakarta">Actividad Reciente</h3>
            </div>
            <ScrollArea className="h-[300px]">
                <div className="divide-y divide-slate-100">
                    {items.map((item) => {
                        const Icon = ICONS[item.type] || Info;
                        const colorClass = COLORS[item.type] || COLORS.system;

                        return (
                            <div key={item.id} className="p-4 flex gap-4 hover:bg-slate-50/50 transition-colors">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate">
                                        {item.title}
                                    </p>
                                    <p className="text-sm text-slate-500 line-clamp-1">
                                        {item.description}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: es })}
                                    </p>
                                </div>
                                {item.status && (
                                    <div className="flex flex-col items-end justify-center">
                                        <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                                            {item.status}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
