'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
    AlertCircle,
    Check,
    CheckCircle2,
    CreditCard,
    Loader2,
    Sparkles,
    Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import {
    obtenerEstadoSuscripcionSeguro,
    obtenerPlanesDisponibles,
    type PlanSuscripcion,
} from '@/services/suscripciones.service'

type EstadoCarga = 'idle' | 'loading' | 'ready' | 'error'

type WalletBrick = {
    unmount: () => void
}

type BricksBuilder = {
    create: (
        brickType: string,
        containerId: string,
        settings: {
            initialization: { preferenceId: string }
            customization?: Record<string, unknown>
            callbacks?: {
                onReady?: () => void
                onError?: (error: unknown) => void
            }
        }
    ) => Promise<WalletBrick>
}

declare global {
    interface Window {
        MercadoPago?: new (publicKey: string, options?: { locale?: string }) => {
            bricks: () => BricksBuilder
        }
    }
}

const formatearPrecio = (precio: string) => {
    const valor = Number(precio)

    if (Number.isNaN(valor) || valor <= 0) {
        return 'Gratis'
    }

    return `$${valor.toFixed(2)} MXN`
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
        'Soporte por email',
    ]
}

const extraerDetalleMercadoPago = (error: unknown) => {
    if (error instanceof Error) {
        return error.message
    }

    if (typeof error === 'string') {
        return error
    }

    if (error && typeof error === 'object') {
        const record = error as Record<string, unknown>
        const cause = record.cause
        const message = record.message
        const status = record.status

        if (typeof message === 'string' && message.trim()) {
            return message
        }

        if (Array.isArray(cause) && cause.length > 0) {
            const causas = cause
                .map((item) => {
                    if (!item || typeof item !== 'object') return null
                    const obj = item as Record<string, unknown>
                    return obj.description ?? obj.code ?? null
                })
                .filter(Boolean)
                .join(' | ')

            if (causas) return causas
        }

        if (typeof status === 'number') {
            return `Error de MercadoPago (status ${status}).`
        }

        try {
            return JSON.stringify(record)
        } catch {
            return 'Error desconocido de MercadoPago.'
        }
    }

    return 'Error desconocido de MercadoPago.'
}

export default function SuscripcionPage() {
    const searchParams = useSearchParams()
    const [estado, setEstado] = useState<EstadoCarga>('idle')
    const [usuarioId, setUsuarioId] = useState<string>('')
    const [planes, setPlanes] = useState<PlanSuscripcion[]>([])
    const [planActualId, setPlanActualId] = useState<string | null>(null)
    const [guardandoPlanId, setGuardandoPlanId] = useState<string | null>(null)
    const [creandoCheckout, setCreandoCheckout] = useState<boolean>(false)
    const [confirmandoPago, setConfirmandoPago] = useState<boolean>(false)
    const [sdkListo, setSdkListo] = useState<boolean>(false)
    const [preferenceId, setPreferenceId] = useState<string>('')
    const [checkoutUrl, setCheckoutUrl] = useState<string>('')
    const [mensaje, setMensaje] = useState<string>('')
    const [error, setError] = useState<string>('')

    const mpPublicKey =
        process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ??
        process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ??
        ''
    const mpPublicKeyLimpia = mpPublicKey.trim()
    const modoPublicKey = mpPublicKeyLimpia.startsWith('APP_USR-')
        ? 'live'
        : mpPublicKeyLimpia.startsWith('TEST-')
            ? 'test'
            : 'unknown'
    const bricksBuilderRef = useRef<BricksBuilder | null>(null)
    const walletBrickRef = useRef<WalletBrick | null>(null)
    const sincronizacionInicialHechaRef = useRef<boolean>(false)

    const obtenerTokenSesion = useCallback(async () => {
        if (!supabase) {
            throw new Error('No se pudo inicializar Supabase para obtener sesion.')
        }

        const {
            data: { session },
            error: sesionError,
        } = await supabase.auth.getSession()

        if (sesionError) {
            throw sesionError
        }

        if (!session?.access_token) {
            throw new Error('No hay sesion activa para validar suscripcion.')
        }

        return session.access_token
    }, [])

    const cargarSuscripcionData = useCallback(async () => {
        const [planesData, suscripcionActual] = await Promise.all([
            obtenerPlanesDisponibles(),
            obtenerEstadoSuscripcionSeguro(),
        ])

        setPlanes(planesData)
        setPlanActualId(suscripcionActual?.plan_id ?? null)
    }, [])

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
                await cargarSuscripcionData()
                setEstado('ready')
            } catch (e) {
                const detalle = e instanceof Error ? e.message : 'No se pudo cargar el modulo de suscripcion.'
                setError(detalle)
                setEstado('error')
            }
        }

        void cargarSuscripcion()
    }, [cargarSuscripcionData])

    useEffect(() => {
        const keyPreview = mpPublicKeyLimpia ? `${mpPublicKeyLimpia.slice(0, 12)}...` : '(vacia)'
        console.log('MP PUBLIC KEY:', keyPreview)

        if (!mpPublicKeyLimpia) {
            setError('Falta NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY en el entorno actual.')
            return
        }

        const iniciarSDK = () => {
            try {
                if (!window.MercadoPago) {
                    throw new Error('window.MercadoPago no esta disponible despues de cargar el SDK.')
                }

                const mercadoPago = new window.MercadoPago(mpPublicKeyLimpia, { locale: 'es-MX' })
                bricksBuilderRef.current = mercadoPago.bricks()
                setSdkListo(true)
                console.log('MercadoPago SDK inicializado. Modo key:', modoPublicKey)
            } catch (sdkError) {
                const detalle =
                    sdkError instanceof Error
                        ? sdkError.message
                        : 'Error desconocido inicializando MercadoPago SDK.'
                setError(`No se pudo inicializar MercadoPago: ${detalle}`)
                setSdkListo(false)
            }
        }

        if (window.MercadoPago) {
            iniciarSDK()
            return
        }

        const existing = document.getElementById('mercadopago-sdk-v2') as HTMLScriptElement | null

        if (existing) {
            if (window.MercadoPago) {
                iniciarSDK()
            } else {
                existing.addEventListener('load', iniciarSDK, { once: true })
            }
            return
        }

        const script = document.createElement('script')
        script.id = 'mercadopago-sdk-v2'
        script.src = 'https://sdk.mercadopago.com/js/v2'
        script.async = true
        script.onload = iniciarSDK
        script.onerror = () => {
            setError('No se pudo cargar el SDK de MercadoPago. Verifica red/CORS y la key publica.')
            setSdkListo(false)
        }
        document.body.appendChild(script)

        return () => {
            script.onload = null
            script.onerror = null
        }
    }, [mpPublicKeyLimpia, modoPublicKey])

    const confirmarPagoDesdeUI = useCallback(async (silencioso = false, paymentId?: string) => {
        if (!usuarioId) return

        try {
            setConfirmandoPago(true)
            setError('')

            const paymentIdNormalizado = paymentId?.trim()
            const payload = paymentIdNormalizado ? { paymentId: paymentIdNormalizado } : {}
            const token = await obtenerTokenSesion()

            const response = await fetch('/api/confirmar-suscripcion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            })

            const data = (await response.json()) as {
                ok?: boolean
                estado?: string
                error?: string
                paymentId?: number | null
            }

            if (!response.ok || !data.ok) {
                if (data.estado === 'sin_pagos') {
                    throw new Error(
                        'No se encontraron pagos para este usuario. Usa "Confirmar con ID de operacion" y pega el numero de operacion de MercadoPago.'
                    )
                }

                throw new Error(data.error ?? 'No se pudo confirmar el estado del pago.')
            }

            await cargarSuscripcionData()

            if (silencioso && data.estado !== 'activo') {
                return
            }

            if (data.estado === 'activo') {
                setMensaje('Suscripcion Pro activada correctamente ')
            } else if (data.estado === 'pendiente') {
                setMensaje('El pago aun esta pendiente de confirmacion.')
            } else {
                setMensaje('El ultimo pago no fue aprobado. Puedes volver a intentarlo.')
            }
        } catch (e) {
            const detalle = e instanceof Error ? e.message : 'No se pudo confirmar el pago.'
            setError(detalle)
        } finally {
            setConfirmandoPago(false)
        }
    }, [cargarSuscripcionData, obtenerTokenSesion, usuarioId])

    useEffect(() => {
        const paymentStatus = searchParams.get('payment_status')
        const paymentId = searchParams.get('payment_id') ?? searchParams.get('collection_id')

        if (!paymentStatus) return

        if (paymentStatus === 'success') {
            setMensaje('Pago recibido. Tu suscripcion se actualizara automaticamente en unos segundos. ✅')
        }

        if (paymentStatus === 'pending') {
            setMensaje('Tu pago esta pendiente. Te avisaremos cuando sea confirmado.')
        }

        if (paymentStatus === 'failure') {
            setError('El pago no pudo completarse. Puedes intentarlo de nuevo.')
        }

        if ((paymentStatus === 'success' || paymentStatus === 'pending') && usuarioId) {
            void confirmarPagoDesdeUI(false, paymentId ?? undefined)
        }
    }, [confirmarPagoDesdeUI, searchParams, usuarioId])

    useEffect(() => {
        if (!usuarioId || sincronizacionInicialHechaRef.current) return

        sincronizacionInicialHechaRef.current = true
        void confirmarPagoDesdeUI(true)
    }, [confirmarPagoDesdeUI, usuarioId])

    useEffect(() => {
        const renderWalletBrick = async () => {
            if (!preferenceId || !sdkListo || !bricksBuilderRef.current) return

            const container = document.getElementById('walletBrick_container')
            if (!container) {
                setError('No se encontro el contenedor del Brick de MercadoPago.')
                return
            }

            if (walletBrickRef.current) {
                walletBrickRef.current.unmount()
                walletBrickRef.current = null
            }

            try {
                walletBrickRef.current = await bricksBuilderRef.current.create(
                    'wallet',
                    'walletBrick_container',
                    {
                        initialization: { preferenceId },
                        callbacks: {
                            onReady: () => {
                                console.log('Wallet Brick listo para interactuar.')
                            },
                            onError: (sdkError: unknown) => {
                                console.error('MercadoPago Wallet Brick onError:', sdkError)
                                const detalle = extraerDetalleMercadoPago(sdkError)
                                setError(`Checkout Bricks devolvio un error: ${detalle}`)
                                if (checkoutUrl) {
                                    setMensaje('Puedes continuar con el boton directo de MercadoPago mientras validamos el Brick.')
                                }
                            },
                        },
                    }
                )
                console.log('Wallet Brick renderizado correctamente con preferenceId:', preferenceId)
            } catch (brickError) {
                console.error('Error al renderizar Wallet Brick:', brickError)
                const detalle = extraerDetalleMercadoPago(brickError)
                setError(`No se pudo iniciar Checkout Bricks: ${detalle}`)
            }
        }

        void renderWalletBrick()

        return () => {
            if (walletBrickRef.current) {
                walletBrickRef.current.unmount()
                walletBrickRef.current = null
            }
        }
    }, [checkoutUrl, preferenceId, sdkListo])

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
            setPreferenceId('')

            if (esPlanPago(plan)) {
                if (!mpPublicKeyLimpia) {
                    throw new Error('Falta NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY en .env.local')
                }

                setCreandoCheckout(true)
                const token = await obtenerTokenSesion()

                const response = await fetch('/api/crear-suscripcion', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        planId: plan.id,
                    }),
                })

                const data = (await response.json()) as {
                    preferenceId?: string
                    initPoint?: string | null
                    sandboxInitPoint?: string | null
                    error?: string
                    mpMode?: 'live' | 'test' | 'unknown'
                    accessTokenSource?: string
                }

                console.log('Respuesta /api/crear-suscripcion:', {
                    ok: response.ok,
                    mpMode: data.mpMode,
                    accessTokenSource: data.accessTokenSource,
                    hasPreferenceId: Boolean(data.preferenceId),
                    hasInitPoint: Boolean(data.initPoint),
                })

                if (!response.ok || !data.preferenceId) {
                    throw new Error(data.error ?? 'No se pudo crear la sesion de checkout.')
                }

                const modoBackend = data.mpMode ?? 'unknown'
                if (modoBackend !== 'unknown' && modoPublicKey !== 'unknown' && modoBackend !== modoPublicKey) {
                    throw new Error(
                        `Tus credenciales de MercadoPago no coinciden (frontend: ${modoPublicKey}, backend: ${modoBackend}).`
                    )
                }

                setPreferenceId(data.preferenceId)
                setCheckoutUrl(data.initPoint ?? data.sandboxInitPoint ?? '')
                setMensaje('Continua el pago en MercadoPago para activar tu plan Pro.')
                return
            }

            setMensaje('El plan gratis se asigna automaticamente por backend cuando expira la suscripcion.')
        } catch (e) {
            const detalle = e instanceof Error ? e.message : 'No se pudo actualizar la suscripcion.'
            setError(detalle)
        } finally {
            setCreandoCheckout(false)
            setGuardandoPlanId(null)

            if (usuarioId) {
                await cargarSuscripcionData()
            }
        }
    }

    if (estado === 'loading' || estado === 'idle') {
        return (
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando planes y suscripcion...
                </div>
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
                        Cambia de plan cuando quieras y manten control total de limites, costos y beneficios.
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

                    {confirmandoPago ? (
                        <p className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-800 dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-200">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Validando pago y sincronizando tu plan...
                        </p>
                    ) : null}
                </div>
            </header>

            {estado === 'error' ? (
                <article className="inline-flex items-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/50 dark:bg-rose-500/10 dark:text-rose-100">
                    <AlertCircle className="h-4 w-4" />
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
                                            ? planPago && creandoCheckout
                                                ? 'Preparando checkout...'
                                                : 'Guardando...'
                                            : planPago
                                                ? 'Comprar Pro'
                                                : 'Seleccionar plan'}
                            </button>
                        </article>
                    )
                })}
            </div>

            {preferenceId ? (
                <section className="rounded-3xl border border-indigo-200 bg-indigo-50/70 p-6 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Checkout seguro de MercadoPago</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Completa el pago y, al aprobarse, el webhook actualizara tu suscripcion automaticamente.
                    </p>
                    <div id="walletBrick_container" className="mt-4 min-h-14" />

                    {checkoutUrl ? (
                        <a
                            href={checkoutUrl}
                            target="_self"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
                        >
                            Pagar directo en MercadoPago
                        </a>
                    ) : null}

                    <p className="mt-4 text-xs text-slate-500 dark:text-slate-300">
                        Si el Brick no aparece, usa el boton directo para continuar el pago.
                    </p>
                </section>
            ) : null}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Pagos proximamente</h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            Ya se integra Checkout Bricks en sandbox. El siguiente paso sera activar renovacion automatica y portal de facturas.
                        </p>
                    </div>
                </div>
            </section>

            <div className="min-h-8">
                {mensaje ? (
                    <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" />
                        {mensaje}
                    </p>
                ) : null}
                {!mensaje && error ? (
                    <p className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-300">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </p>
                ) : null}
            </div>
        </section>
    )
}
