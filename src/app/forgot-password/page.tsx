'use client'

import Link from 'next/link'
import { useState } from 'react'
import { enviarCorreoRecuperacion } from '@/services/auth.service'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    const handleSubmit = async () => {
        setError('')
        setMensaje('')
        setLoading(true)

        try {
            await enviarCorreoRecuperacion(email)
            setMensaje(
                'Si el correo existe, te enviamos un enlace para restablecer tu contrasena.'
            )
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'No se pudo enviar el correo de recuperacion.'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid min-h-dvh place-items-center px-4 py-6 sm:px-6">
            <section className="w-full max-w-145 rounded-3xl border border-white/10 bg-[linear-gradient(160deg,rgba(12,25,42,0.75),rgba(10,21,36,0.92))] p-6 shadow-[0_30px_80px_rgba(1,6,12,0.6)] backdrop-blur-sm sm:p-10">
                <p className="mb-2.5 text-xs tracking-widest text-teal-300 uppercase">
                    Recuperacion de acceso
                </p>
                <h1 className="text-3xl leading-tight font-bold sm:text-4xl">
                    Olvidaste tu contrasena?
                </h1>
                <p className="mt-2.5 text-sm text-slate-300 sm:text-base">
                    Ingresa tu correo y te enviaremos un enlace para cambiarla.
                </p>

                <div className="mt-6 grid gap-3.5">
                    <input
                        className="w-full rounded-xl border border-slate-100/20 bg-slate-950/45 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-teal-300 focus:ring-4 focus:ring-teal-300/30 sm:text-base"
                        type="email"
                        placeholder="Correo"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <button
                        className="cursor-pointer rounded-xl bg-[linear-gradient(140deg,#f4a70a,#d79208)] px-4 py-3 text-sm font-bold text-amber-950 transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                        onClick={handleSubmit}
                        disabled={loading || !email.trim()}
                    >
                        {loading ? 'Enviando...' : 'Enviar enlace'}
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
