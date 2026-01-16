import { Company } from "@/types/companies";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CompanyCardProps {
    company: Company;
    onClick: (company: Company) => void;
    className?: string; // Allow custom classes
}

export function CompanyCard({ company, onClick, className }: CompanyCardProps) {
    return (
        <div
            onClick={() => onClick(company)}
            className={cn(
                "group relative bg-white rounded-3xl p-6 cursor-pointer transition-all duration-300 ease-out border border-transparent",
                "hover:shadow-soft-xl hover:-translate-y-2 hover:border-slate-100",
                "shadow-soft-sm",
                className // Merge custom classes
            )}
        >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                    </svg>
                </div>
            </div>

            <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative w-28 h-28 p-4 rounded-full bg-slate-50 group-hover:bg-white group-hover:shadow-soft-md transition-all duration-300">
                    <div className="relative w-full h-full">
                        <Image
                            src={company.logo}
                            alt={company.name}
                            fill
                            className="object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                        {company.name}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                        {company.description}
                    </p>
                </div>

                <div className="w-12 h-1 rounded-full bg-slate-100 group-hover:bg-emerald-500/30 transition-all duration-300" />
            </div>
        </div>
    );
}
