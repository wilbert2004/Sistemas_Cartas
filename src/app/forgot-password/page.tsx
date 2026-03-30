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
        <div className="grid min-h-dvh place-items-center bg-slate-100 px-4 py-6 dark:bg-slate-950 sm:px-6">
            <section className="w-full max-w-145 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900 sm:p-10">
                <p className="mb-2.5 text-xs tracking-widest text-slate-600 uppercase dark:text-slate-400">
                    Recuperacion de acceso
                </p>
                <h1 className="text-3xl leading-tight font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
                    Olvidaste tu contrasena?
                </h1>
                <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                    Ingresa tu correo y te enviaremos un enlace para cambiarla.
                </p>

                <div className="mt-6 grid gap-3.5">
                    <input
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 dark:border-slate-100/20 dark:bg-slate-950/45 dark:text-slate-100 dark:focus:border-teal-300 dark:focus:ring-teal-300/30 sm:text-base"
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

                <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">
                    Volver a{' '}
                    <Link
                        href="/login"
                        className="font-medium text-slate-700 underline-offset-4 hover:underline dark:text-slate-200"
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
