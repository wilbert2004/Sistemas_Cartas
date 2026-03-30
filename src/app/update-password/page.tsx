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
        <div className="grid min-h-dvh place-items-center px-4 py-6 sm:px-6">
            <section className="w-full max-w-145 rounded-3xl border border-white/10 bg-[linear-gradient(160deg,rgba(12,25,42,0.75),rgba(10,21,36,0.92))] p-6 shadow-[0_30px_80px_rgba(1,6,12,0.6)] backdrop-blur-sm sm:p-10">
                <p className="mb-2.5 text-xs tracking-widest text-teal-300 uppercase">
                    Seguridad
                </p>
                <h1 className="text-3xl leading-tight font-bold sm:text-4xl">
                    Define tu nueva contrasena
                </h1>
                <p className="mt-2.5 text-sm text-slate-300 sm:text-base">
                    Abre esta pagina desde el enlace enviado a tu correo.
                </p>

                {!puedeActualizar ? (
                    <p className="mt-4 rounded-xl border border-amber-400/50 bg-amber-400/15 px-3 py-2 text-sm text-amber-100">
                        No detectamos una sesion de recuperacion activa. Solicita un nuevo enlace
                        desde olvidaste tu contrasena.
                    </p>
                ) : null}

                <div className="mt-6 grid gap-3.5">
                    <input
                        className="w-full rounded-xl border border-slate-100/20 bg-slate-950/45 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-teal-300 focus:ring-4 focus:ring-teal-300/30 sm:text-base"
                        type="password"
                        placeholder="Nueva contrasena"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <input
                        className="w-full rounded-xl border border-slate-100/20 bg-slate-950/45 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-teal-300 focus:ring-4 focus:ring-teal-300/30 sm:text-base"
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

                <p className="mt-4 text-sm text-slate-300">
                    Volver a{' '}
                    <Link
                        href="/login"
                        className="font-medium text-teal-300 underline-offset-4 hover:underline"
                    >
                        iniciar sesion
                    </Link>
                </p>

                {mensaje ? (
                    <p className="mt-4 rounded-xl border border-emerald-400/50 bg-emerald-400/15 px-3 py-2 text-sm text-emerald-100">
                        {mensaje}
                    </p>
                ) : null}

                {error ? (
                    <p className="mt-4 rounded-xl border border-rose-400/60 bg-rose-400/15 px-3 py-2 text-sm text-rose-100">
                        {error}
                    </p>
                ) : null}
            </section>
        </div>
    )
}
