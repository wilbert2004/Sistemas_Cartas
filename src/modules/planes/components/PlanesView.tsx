'use client'

import { usePlanes } from '@/modules/planes/hooks/usePlanes'

const formatearPrecio = (precio: number | null) => {
    if (precio === null || precio === undefined) {
        return 'Gratis'
    }

    return `S/ ${precio.toFixed(2)}`
}

const formatearLimite = (limite: number | null) => {
    if (limite === null || limite === undefined || limite <= 0) {
        return 'Ilimitado'
    }

    return `${limite} cartas`
}

export default function PlanesView() {
    const {
        planes,
        loading,
        error,
        success,
        planActualId,
        actualizandoPlanId,
        elegirPlan,
    } = usePlanes()

    return (
        <section className="space-y-5">
            <header className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold tracking-widest text-cyan-700 uppercase dark:text-cyan-300">
                    Modulo
                </p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                    Mejorar a Pro
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Elige el plan que mejor se adapte a tu ritmo de generacion de cartas.
                </p>
            </header>

            {loading ? (
                <article className="rounded-2xl border border-slate-200/80 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    Cargando planes...
                </article>
            ) : null}

            {error ? (
                <article className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-400/60 dark:bg-rose-500/15 dark:text-rose-100">
                    {error}
                </article>
            ) : null}

            {success ? (
                <article className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-400/60 dark:bg-emerald-500/15 dark:text-emerald-100">
                    {`✔ ${success}`}
                </article>
            ) : null}

            {!loading && !error ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {planes.map((plan) => {
                        const esPro = (plan.nombre ?? '').toLowerCase().includes('pro')
                        const esActual = planActualId === plan.id
                        const actualizando = actualizandoPlanId === plan.id

                        return (
                            <article
                                key={plan.id}
                                className={`rounded-2xl border p-6 shadow-sm transition ${esPro
                                        ? 'border-cyan-300 bg-cyan-50/60 ring-1 ring-cyan-200 dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:ring-cyan-500/20'
                                        : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900'
                                    }`}
                            >
                                {esPro ? (
                                    <p className="mb-2 inline-flex rounded-full bg-cyan-600 px-2.5 py-1 text-xs font-semibold text-white">
                                        Recomendado
                                    </p>
                                ) : null}

                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{plan.nombre}</h2>
                                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                                    {formatearPrecio(plan.precio)}
                                </p>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Limite: {formatearLimite(plan.limite_cartas)}
                                </p>

                                <button
                                    onClick={() => elegirPlan(plan.id)}
                                    disabled={actualizando || esActual}
                                    className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
                                >
                                    {esActual
                                        ? 'Plan actual'
                                        : actualizando
                                            ? 'Actualizando...'
                                            : 'Elegir plan'}
                                </button>
                            </article>
                        )
                    })}
                </div>
            ) : null}
        </section>
    )
}
