'use client'

import Link from 'next/link'
import { CreditCard, FileText, Sparkles, UserRound } from 'lucide-react'
import { useDashboard } from '@/modules/dashboard/hooks/useDashboard'

const formatearLimite = (limite: number | null) => {
    if (limite === null || limite <= 0) return 'Ilimitado'
    return `${limite} cartas`
}

const formatearUso = (usadas: number, limite: number | null) => {
    if (limite === null || limite <= 0) return `${usadas} / Ilimitado`
    return `${usadas} / ${limite}`
}

export default function DashboardView() {
    const { loading, error, stats } = useDashboard()

    if (loading) {
        return (
            <section className="space-y-5">
                <article className="rounded-2xl border border-slate-200/80 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    Cargando dashboard...
                </article>
            </section>
        )
    }

    if (error || !stats) {
        return (
            <section className="space-y-5">
                <article className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-400/60 dark:bg-rose-500/15 dark:text-rose-100">
                    {error || 'No se pudo cargar la informacion del dashboard.'}
                </article>
            </section>
        )
    }

    return (
        <section className="space-y-6">
            <header className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold tracking-widest text-cyan-700 uppercase dark:text-cyan-300">
                    Dashboard
                </p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">Hola, {stats.userName}</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                    Aqui tienes un resumen rapido de tu cuenta y uso del generador.
                </p>
            </header>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Usuario</p>
                        <span className="rounded-lg bg-cyan-500/10 p-2 text-cyan-700 ring-1 ring-cyan-200 dark:text-cyan-300 dark:ring-cyan-500/25">
                            <UserRound className="h-4 w-4" />
                        </span>
                    </div>
                    <p className="mt-5 text-xl font-bold text-slate-900 dark:text-slate-100">{stats.userName}</p>
                </article>

                <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cartas creadas</p>
                        <span className="rounded-lg bg-violet-500/10 p-2 text-violet-700 ring-1 ring-violet-200 dark:text-violet-300 dark:ring-violet-500/25">
                            <FileText className="h-4 w-4" />
                        </span>
                    </div>
                    <p className="mt-5 text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.totalCartas}</p>
                </article>

                <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Plan actual</p>
                        <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-700 ring-1 ring-emerald-200 dark:text-emerald-300 dark:ring-emerald-500/25">
                            <CreditCard className="h-4 w-4" />
                        </span>
                    </div>
                    <p className="mt-5 text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.planActual}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Limite: {formatearLimite(stats.limiteCartas)}
                    </p>
                </article>

                <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cantidad usada</p>
                        <span className="rounded-lg bg-amber-500/10 p-2 text-amber-700 ring-1 ring-amber-200 dark:text-amber-300 dark:ring-amber-500/25">
                            <Sparkles className="h-4 w-4" />
                        </span>
                    </div>
                    <p className="mt-5 text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {formatearUso(stats.cantidadUsada, stats.limiteCartas)}
                    </p>
                </article>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <Link
                    href="/dashboard/generar"
                    className="rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
                >
                    Crear carta
                </Link>

                <Link
                    href="/dashboard/cartas"
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                >
                    Ver mis cartas
                </Link>

                <Link
                    href="/dashboard/planes"
                    className="rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-3 text-center text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100 dark:border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-200 dark:hover:bg-cyan-500/20"
                >
                    Mejorar a PRO
                </Link>
            </div>
        </section>
    )
}
