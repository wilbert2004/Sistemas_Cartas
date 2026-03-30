'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Sparkles, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import {
    guardarSuscripcion,
    obtenerPlanesDisponibles,
    obtenerSuscripcion,
    type PlanSuscripcion,
} from '@/services/suscripciones.service'

type EstadoCarga = 'idle' | 'loading' | 'ready' | 'error'

const formatearPrecio = (precio: string) => {
    const valor = Number(precio)

    if (Number.isNaN(valor) || valor <= 0) {
        return 'Gratis'
    }

    return `S/ ${valor.toFixed(2)}`
}

const formatearLimite = (limite: number) => {
    if (limite <= 0 || limite >= 9999) {
        return 'Cartas ilimitadas'
    }

    return `${limite} cartas por mes`
}

const esPlanPago = (plan: PlanSuscripcion) => Number(plan.precio) > 0

const capitalizar = (texto: string) => {
    if (!texto) return ''
    return `${texto.charAt(0).toUpperCase()}${texto.slice(1).toLowerCase()}`
}

const descripcionPlan = (plan: PlanSuscripcion) => {
    return esPlanPago(plan) ? 'Para usuarios frecuentes' : 'Perfecto para empezar'
}

const beneficiosPlan = (plan: PlanSuscripcion) => {
    if (esPlanPago(plan)) {
        return [
            `${formatearLimite(plan.limite_cartas)}`,
            'Todas las plantillas',
            'Exportar en PDF y DOCX',
            'Generacion avanzada con IA',
            'Soporte prioritario',
        ]
    }

    return [
        `${formatearLimite(plan.limite_cartas)}`,
        'Plantillas basicas',
        'Exportar en TXT',
        'Exportar en PDF y DOCX',
        'Soporte por email',
    ]
}

export default function SuscripcionPage() {
    const [estado, setEstado] = useState<EstadoCarga>('idle')
    const [usuarioId, setUsuarioId] = useState<string>('')
    const [planes, setPlanes] = useState<PlanSuscripcion[]>([])
    const [planActualId, setPlanActualId] = useState<string | null>(null)
    const [guardandoPlanId, setGuardandoPlanId] = useState<string | null>(null)
    const [mensaje, setMensaje] = useState<string>('')
    const [error, setError] = useState<string>('')

    useEffect(() => {
        const cargarSuscripcion = async () => {
            try {
                setEstado('loading')
                setError('')
                setMensaje('')

                if (!supabase) {
                    throw new Error('No se pudo inicializar Supabase. Revisa variables de entorno.')
                }

                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser()

                if (authError) throw authError
                if (!user?.id) throw new Error('Usuario no autenticado')

                setUsuarioId(user.id)

                const [planesData, suscripcionActual] = await Promise.all([
                    obtenerPlanesDisponibles(),
                    obtenerSuscripcion(user.id),
                ])

                setPlanes(planesData)
                setPlanActualId(suscripcionActual?.plan_id ?? null)
                setEstado('ready')
            } catch (e) {
                const detalle = e instanceof Error ? e.message : 'No se pudo cargar el modulo de suscripcion.'
                setError(detalle)
                setEstado('error')
            }
        }

        void cargarSuscripcion()
    }, [])

    const planActual = useMemo(() => {
        return planes.find((plan) => plan.id === planActualId) ?? null
    }, [planes, planActualId])

    const seleccionarPlan = async (plan: PlanSuscripcion) => {
        if (!usuarioId) {
            setError('No hay usuario autenticado para actualizar la suscripcion.')
            return
        }

        if (!plan.activo) {
            setError('Este plan esta inactivo y no se puede seleccionar.')
            return
        }

        try {
            setGuardandoPlanId(plan.id)
            setError('')
            setMensaje('')

            const suscripcion = await guardarSuscripcion({
                usuario_id: usuarioId,
                plan_id: plan.id,
            })

            setPlanActualId(suscripcion.plan_id)
            setMensaje('Suscripcion actualizada')
        } catch (e) {
            const detalle = e instanceof Error ? e.message : 'No se pudo actualizar la suscripcion.'
            setError(detalle)
        } finally {
            setGuardandoPlanId(null)
        }
    }

    if (estado === 'loading' || estado === 'idle') {
        return (
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm text-slate-600 dark:text-slate-300">Cargando planes y suscripcion...</p>
            </section>
        )
    }

    return (
        <section className="space-y-8">
            <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-r from-white via-sky-50 to-cyan-100/60 p-8 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20">
                <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-cyan-200/50 blur-2xl dark:bg-cyan-500/20" />
                <div className="absolute -bottom-14 -left-10 h-36 w-36 rounded-full bg-blue-200/50 blur-2xl dark:bg-sky-500/20" />

                <div className="relative">
                    <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase dark:text-cyan-300">SUSCRIPCION</p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Elige el plan ideal para tu equipo</h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                        Cambia de plan cuando quieras y mantén control total de límites, costos y beneficios.
                    </p>

                    {planActual ? (
                        <div className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                            <span className="font-medium text-slate-500 dark:text-slate-400">Plan actual:</span>
                            <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200">
                                {capitalizar(planActual.nombre)}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatearPrecio(planActual.precio)} / mes</span>
                            <span className="text-slate-500 dark:text-slate-400">{formatearLimite(planActual.limite_cartas)}</span>
                        </div>
                    ) : null}
                </div>
            </header>

            {estado === 'error' ? (
                <article className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-400/50 dark:bg-rose-500/10 dark:text-rose-100">
                    {error}
                </article>
            ) : null}

            <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
                {planes.map((plan) => {
                    const actual = plan.id === planActualId
                    const cargandoEstePlan = guardandoPlanId === plan.id
                    const inactivo = !plan.activo
                    const planPago = esPlanPago(plan)
                    const beneficios = beneficiosPlan(plan)

                    return (
                        <article
                            key={plan.id}
                            className={`relative overflow-hidden rounded-3xl border p-7 shadow-sm transition duration-300 ${planPago
                                ? 'border-indigo-400/70 bg-white dark:border-indigo-400/50 dark:bg-slate-900'
                                : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                                } ${inactivo ? 'opacity-70 saturate-50' : 'hover:-translate-y-1 hover:shadow-md'}`}
                        >
                            {actual ? (
                                <span className="absolute top-4 right-4 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold tracking-wide text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                                    PLAN ACTUAL
                                </span>
                            ) : null}

                            {!actual && planPago ? (
                                <span className="absolute top-4 right-4 rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-semibold tracking-wide text-white">
                                    MAS POPULAR
                                </span>
                            ) : null}

                            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                {planPago ? <Zap className="h-7 w-7" /> : <Sparkles className="h-7 w-7" />}
                            </div>

                            <h3 className="text-4xl font-semibold leading-none text-slate-900 dark:text-slate-100">
                                {capitalizar(plan.nombre)}
                            </h3>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{descripcionPlan(plan)}</p>

                            <p className="mt-5 text-5xl font-bold text-slate-900 dark:text-white">
                                ${Number(plan.precio).toFixed(2)}
                                <span className="ml-1 text-2xl font-medium text-slate-500 dark:text-slate-400">/mes</span>
                            </p>

                            <ul className="mt-7 space-y-3">
                                {beneficios.map((beneficio) => (
                                    <li key={beneficio} className="flex items-center gap-3 text-base text-slate-700 dark:text-slate-200">
                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                                            <Check className="h-3.5 w-3.5" />
                                        </span>
                                        <span>{beneficio}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                type="button"
                                onClick={() => seleccionarPlan(plan)}
                                disabled={inactivo || actual || cargandoEstePlan}
                                className={`mt-8 w-full rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${planPago
                                    ? 'bg-slate-950 text-white hover:bg-slate-800 dark:bg-indigo-500 dark:text-white dark:hover:bg-indigo-400'
                                    : 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white'
                                    }`}
                            >
                                {inactivo
                                    ? 'Plan inactivo'
                                    : actual
                                        ? 'Plan actual'
                                        : cargandoEstePlan
                                            ? 'Guardando...'
                                            : 'Seleccionar plan'}
                            </button>
                        </article>
                    )
                })}
            </div>

            <div className="min-h-8">
                {mensaje ? (
                    <p className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {mensaje}
                    </p>
                ) : null}
                {!mensaje && error ? (
                    <p className="inline-flex rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-300">
                        {error}
                    </p>
                ) : null}
            </div>
        </section>
    )
}
