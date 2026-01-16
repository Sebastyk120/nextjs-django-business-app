export function DashboardFooter() {
    return (
        <footer className="border-t border-slate-100 bg-white/50 backdrop-blur-sm py-6">
            <div className="container flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-8 text-sm text-slate-400">
                <p>
                    © {new Date().getFullYear()} Heaven&apos;s Fruits SAS. Todos los derechos reservados.
                </p>
                <p className="flex items-center gap-1">
                    Desarrollado por <span className="font-medium text-slate-600">Sebastian Melo</span> v2.5
                </p>
            </div>
        </footer>
    );
}
