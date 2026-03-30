'use client'

import CartaItem from '@/modules/cartas/components/CartaItem'
import { useCartas } from '@/modules/cartas/hooks/useCartas'

export default function CartasList() {
    const { cartas, loading, error, eliminarLoadingId, eliminarCarta, recargarCartas } = useCartas()

    return (
        <section className="space-y-5">
            <header className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold tracking-widest text-cyan-700 uppercase dark:text-cyan-300">
                    Modulo
                </p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">Mis cartas</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Consulta y gestiona todas tus cartas guardadas.
                </p>
            </header>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {cartas.length === 1 ? '1 carta' : `${cartas.length} cartas`}
                    </p>

                    <button
                        onClick={recargarCartas}
                        disabled={loading}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                    >
                        {loading ? 'Actualizando...' : 'Actualizar'}
                    </button>
                </div>

                {loading ? (
                    <article className="rounded-2xl border border-slate-200/80 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                        Cargando cartas...
                    </article>
                ) : null}

                {error ? (
                    <article className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-400/60 dark:bg-rose-500/15 dark:text-rose-100">
                        {error}
                    </article>
                ) : null}

                {!loading && !error && cartas.length === 0 ? (
                    <article className="rounded-2xl border border-slate-200/80 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                        Aun no tienes cartas guardadas.
                    </article>
                ) : null}

                {!loading && !error && cartas.length > 0 ? (
                    <div className="grid gap-4">
                        {cartas.map((carta) => (
                            <CartaItem
                                key={carta.id}
                                carta={carta}
                                onEliminar={eliminarCarta}
                                eliminando={eliminarLoadingId === carta.id}
                            />
                        ))}
                    </div>
                ) : null}
            </div>
        </section>
    )
}
