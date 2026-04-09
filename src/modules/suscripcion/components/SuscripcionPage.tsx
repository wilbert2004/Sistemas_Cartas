'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type EstadoCarga = 'idle' | 'loading' | 'ready' | 'error'

const extraerError = (error: unknown) => {
    if (error instanceof Error) return error.message
    if (typeof error === 'string') return error
    return 'Error inesperado.'
}

export default function SuscripcionPage() {
    const [estado, setEstado] = useState<EstadoCarga>('idle')
    const [usuarioId, setUsuarioId] = useState<string>('')
    const [procesando, setProcesando] = useState(false)
    const [mensaje, setMensaje] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        const cargar = async () => {
            try {
                setEstado('loading')
                setError('')

                if (!supabase) {
                    throw new Error('No se pudo inicializar Supabase. Revisa variables de entorno.')
                }

                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser()

                if (authError) throw authError
                if (!user?.id) throw new Error('Usuario no autenticado.')

                setUsuarioId(user.id)
                setEstado('ready')
            } catch (e) {
                setError(extraerError(e))
                setEstado('error')
            }
        }

        void cargar()
    }, [])

    const iniciarCheckout = useCallback(async () => {
        if (!usuarioId) {
            setError('No hay usuario autenticado.')
            return
        }

        try {
            setProcesando(true)
            setError('')
            setMensaje('')

            if (!supabase) {
                throw new Error('No se pudo inicializar Supabase.')
            }

            const {
                data: { session },
                error: sesionError,
            } = await supabase.auth.getSession()

            if (sesionError) throw sesionError
            if (!session?.access_token) {
                throw new Error('No hay sesion activa para iniciar el pago.')
            }

            const response = await fetch('/api/create-preference', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ planCode: 'pro' }),
            })

            const data = (await response.json()) as {
                ok?: boolean
                initPoint?: string | null
                sandboxInitPoint?: string | null
                error?: string
            }

            if (!response.ok || !data.ok) {
                throw new Error(data.error ?? 'No se pudo crear la preferencia de pago.')
            }

            const checkoutUrl = data.initPoint

            if (!checkoutUrl) {
                throw new Error('Mercado Pago no devolvio init_point. Evitamos sandbox_init_point para prevenir fallos de Secure Fields.')
            }

            window.location.href = checkoutUrl
        } catch (e) {
            setError(extraerError(e))
        } finally {
            setProcesando(false)
        }
    }, [usuarioId])

    if (estado === 'idle' || estado === 'loading') {
        return (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                <p className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando suscripcion...
                </p>
            </section>
        )
    }

    return (
        <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <header>
                <p className="text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase dark:text-cyan-300">SUSCRIPCION</p>
                <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Checkout Pro de Mercado Pago</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Flujo sin SDK: tu app crea la preferencia en backend y redirige al checkout oficial.
                    En modo TEST usamos checkout de wallet para evitar fallos de Secure Fields del sandbox.
                </p>
            </header>

            <button
                type="button"
                onClick={() => void iniciarCheckout()}
                disabled={procesando || estado === 'error'}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
                {procesando ? 'Redirigiendo a Mercado Pago...' : 'Pagar ahora'}
            </button>

            {mensaje ? <p className="text-sm text-slate-600 dark:text-slate-300">{mensaje}</p> : null}

            {error ? (
                <p className="inline-flex items-center gap-2 rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-300">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </p>
            ) : null}
        </section>
    )
}
