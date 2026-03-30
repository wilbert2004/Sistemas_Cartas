'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { actualizarPasswordUsuario } from '@/services/auth.service'

export default function UpdatePasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [puedeActualizar, setPuedeActualizar] = useState(false)

    useEffect(() => {
        if (!supabase) {
            setError('No se encontro configuracion de Supabase en el cliente.')
            return
        }

        const client = supabase

        const inicializar = async () => {
            const {
                data: { session },
            } = await client.auth.getSession()

            if (session) {
                setPuedeActualizar(true)
            }
        }

        inicializar()

        const {
            data: { subscription },
        } = client.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
                setPuedeActualizar(true)
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const handleActualizar = async () => {
        setError('')
        setMensaje('')

        if (password !== confirmPassword) {
            setError('Las contrasenas no coinciden.')
            return
        }

        setLoading(true)

        try {
            await actualizarPasswordUsuario(password)
            setMensaje('Contrasena actualizada correctamente. Redirigiendo a login...')
            setTimeout(() => {
                router.replace('/login')
            }, 1400)
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'No se pudo actualizar la contrasena.'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid min-h-dvh place-items-center bg-slate-100 px-4 py-6 dark:bg-slate-950 sm:px-6">
            <section className="w-full max-w-145 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/50 transition dark:border-white/10 dark:bg-[linear-gradient(160deg,rgba(12,25,42,0.75),rgba(10,21,36,0.92))] dark:shadow-[0_30px_80px_rgba(1,6,12,0.6)] sm:p-10">
                <p className="mb-2.5 text-xs tracking-widest text-cyan-700 uppercase dark:text-teal-300">
                    Seguridad
                </p>
                <h1 className="text-3xl leading-tight font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
                    Define tu nueva contrasena
                </h1>
                <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                    Abre esta pagina desde el enlace enviado a tu correo.
                </p>

                {!puedeActualizar ? (
                    <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-400/50 dark:bg-amber-400/15 dark:text-amber-100">
                        No detectamos una sesion de recuperacion activa. Solicita un nuevo enlace
                        desde olvidaste tu contrasena.
                    </p>
                ) : null}

                <div className="mt-6 grid gap-3.5">
                    <input
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 dark:border-slate-100/20 dark:bg-slate-950/45 dark:text-slate-100 dark:focus:border-teal-300 dark:focus:ring-teal-300/30 sm:text-base"
                        type="password"
                        placeholder="Nueva contrasena"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <input
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 dark:border-slate-100/20 dark:bg-slate-950/45 dark:text-slate-100 dark:focus:border-teal-300 dark:focus:ring-teal-300/30 sm:text-base"
                        type="password"
                        placeholder="Confirmar contrasena"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />

                    <button
                        className="cursor-pointer rounded-xl bg-[linear-gradient(140deg,#f4a70a,#d79208)] px-4 py-3 text-sm font-bold text-amber-950 transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                        onClick={handleActualizar}
                        disabled={loading || !puedeActualizar}
                    >
                        {loading ? 'Actualizando...' : 'Actualizar contrasena'}
                    </button>
                </div>

                <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">
                    Volver a{' '}
                    <Link
                        href="/login"
                        className="font-medium text-cyan-700 underline-offset-4 hover:underline dark:text-teal-300"
                    >
                        iniciar sesion
                    </Link>
                </p>

                {mensaje ? (
                    <p className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-400/50 dark:bg-emerald-400/15 dark:text-emerald-100">
                        {mensaje}
                    </p>
                ) : null}

                {error ? (
                    <p className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/60 dark:bg-rose-400/15 dark:text-rose-100">
                        {error}
                    </p>
                ) : null}
            </section>
        </div>
    )
}
