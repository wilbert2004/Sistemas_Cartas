import { CreditCard, FileText, Sparkles, TrendingUp } from 'lucide-react'

export default function DashboardHomePage() {
    return (
        <section className="space-y-6">
            <header className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold tracking-widest text-cyan-700 uppercase dark:text-cyan-300">
                    Dashboard
                </p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                    Panel de control
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                    Revisa tus modulos y accede rapido a generar cartas, gestionarlas,
                    actualizar perfil y revisar suscripcion.
                </p>
            </header>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Generaciones
                        </p>
                        <span className="rounded-lg bg-cyan-500/10 p-2 text-cyan-700 ring-1 ring-cyan-200 dark:text-cyan-300 dark:ring-cyan-500/25">
                            <Sparkles className="h-4 w-4" />
                        </span>
                    </div>

                    <p className="mt-5 text-3xl font-bold text-slate-900 dark:text-slate-100">128</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="h-3.5 w-3.5" />
                        +12% vs mes anterior
                    </p>
                </article>

                <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Cartas
                        </p>
                        <span className="rounded-lg bg-violet-500/10 p-2 text-violet-700 ring-1 ring-violet-200 dark:text-violet-300 dark:ring-violet-500/25">
                            <FileText className="h-4 w-4" />
                        </span>
                    </div>

                    <p className="mt-5 text-3xl font-bold text-slate-900 dark:text-slate-100">74</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Ultima actualizacion hoy
                    </p>
                </article>

                <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Plan
                        </p>
                        <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-700 ring-1 ring-emerald-200 dark:text-emerald-300 dark:ring-emerald-500/25">
                            <CreditCard className="h-4 w-4" />
                        </span>
                    </div>

                    <p className="mt-5 text-3xl font-bold text-slate-900 dark:text-slate-100">Pro</p>
                    <p className="mt-1 text-xs text-cyan-700 dark:text-cyan-300">
                        Listo para facturacion
                    </p>
                </article>

                <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Estado
                        </p>
                        <span className="rounded-lg bg-amber-500/10 p-2 text-amber-700 ring-1 ring-amber-200 dark:text-amber-300 dark:ring-amber-500/25">
                            <TrendingUp className="h-4 w-4" />
                        </span>
                    </div>

                    <p className="mt-5 text-3xl font-bold text-slate-900 dark:text-slate-100">Activo</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Renovacion en 12 dias
                    </p>
                </article>
            </div>
        </section>
    )
}
