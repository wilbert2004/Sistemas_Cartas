'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    loginConGitHub,
    loginConGoogle,
    loginUsuario,
    obtenerSesion,
    sincronizarUsuarioGitHub,
} from '@/services/auth.service'

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
        <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.8-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.8 2.4 2.6 6.6 2.6 11.8S6.8 21.2 12 21.2c6.9 0 9.1-4.8 9.1-7.3 0-.5-.1-.9-.1-1.3H12z"
        />
        <path
            fill="#34A853"
            d="M3.7 7.3l3.2 2.3c.9-1.8 2.8-3 5.1-3 1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 8.3 2.4 5.2 4.5 3.7 7.3z"
        />
        <path
            fill="#4A90E2"
            d="M12 21.2c2.5 0 4.7-.8 6.3-2.3l-2.9-2.4c-.8.6-1.8 1.1-3.4 1.1-3.9 0-5.2-2.6-5.5-3.8l-3.1 2.4C4.9 19.1 8.2 21.2 12 21.2z"
        />
        <path
            fill="#FBBC05"
            d="M6.5 13.8c-.1-.4-.2-.8-.2-1.2 0-.4.1-.8.2-1.2L3.4 9C3 9.9 2.8 10.9 2.8 12s.2 2.1.6 3l3.1-2.4z"
        />
    </svg>
)

const GitHubIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M12 .5A11.5 11.5 0 0 0 .5 12.2c0 5.2 3.3 9.6 7.9 11.2.6.1.8-.3.8-.6v-2.1c-3.2.7-3.9-1.4-3.9-1.4-.5-1.4-1.3-1.7-1.3-1.7-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.8 1.4 3.5 1.1.1-.8.4-1.4.8-1.7-2.6-.3-5.4-1.3-5.4-6.1 0-1.4.5-2.6 1.2-3.5-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.7 1.3a12.4 12.4 0 0 1 6.8 0c2.6-1.6 3.7-1.3 3.7-1.3.6 1.6.2 2.9.1 3.2.8.9 1.2 2.1 1.2 3.5 0 4.8-2.8 5.8-5.4 6.1.4.4.8 1.1.8 2.3v3.4c0 .4.2.8.8.6a11.7 11.7 0 0 0 7.9-11.2A11.5 11.5 0 0 0 12 .5z" />
    </svg>
)

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const validarSesion = async () => {
            try {
                const session = await obtenerSesion()
                if (session) {
                    await sincronizarUsuarioGitHub()
                    router.replace('/dashboard')
                }
            } catch {
                // No hacemos nada aqui para permitir login manual.
            }
        }

        validarSesion()
    }, [router])

    const handleLogin = async () => {
        setError('')
        setLoading(true)

        try {
            await loginUsuario(email, password)
            router.replace('/dashboard')
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'No fue posible iniciar sesion.'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setError('')
        setLoading(true)

        try {
            await loginConGoogle()
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'No fue posible iniciar con OAuth.'
            setError(message)
            setLoading(false)
        }
    }

    const handleGitHubLogin = async () => {
        setError('')
        setLoading(true)

        try {
            await loginConGitHub()
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'No fue posible iniciar con GitHub.'
            setError(message)
            setLoading(false)
        }
    }

    return (
        <div className="grid min-h-dvh place-items-center bg-slate-100 px-4 py-6 dark:bg-slate-950 sm:px-6">
            <section className="w-full max-w-145 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900 sm:p-10">
                <p className="mb-2.5 text-xs tracking-widest text-slate-600 uppercase dark:text-slate-400">
                    Bienvenido de vuelta
                </p>
                <h1 className="text-3xl leading-tight font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
                    Inicia sesion en tu panel
                </h1>
                <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                    Entra con tu correo o utiliza un proveedor externo.
                </p>

                <div className="mt-6 grid gap-3.5">
                    <input
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 dark:border-slate-100/20 dark:bg-slate-950/45 dark:text-slate-100 dark:focus:border-teal-300 dark:focus:ring-teal-300/30 sm:text-base"
                        type="email"
                        placeholder="Correo"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <input
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 dark:border-slate-100/20 dark:bg-slate-950/45 dark:text-slate-100 dark:focus:border-teal-300 dark:focus:ring-teal-300/30 sm:text-base"
                        type="password"
                        placeholder="Contrasena"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button
                        className="cursor-pointer rounded-xl bg-[linear-gradient(140deg,#f4a70a,#d79208)] px-4 py-3 text-sm font-bold text-amber-950 transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        {loading ? 'Cargando...' : 'Iniciar sesion'}
                    </button>
                </div>

                <p className="mt-3 text-right text-sm text-slate-500 dark:text-slate-300">
                    <Link
                        href="/forgot-password"
                        className="font-medium text-slate-600 underline-offset-4 hover:underline dark:text-slate-300"
                    >
                        Olvidaste tu contrasena?
                    </Link>
                </p>

                <div className="my-4 border-t border-dashed border-slate-300 dark:border-slate-200/20" />

                <div className="grid gap-2.5 sm:grid-cols-2">
                    <button
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        <GoogleIcon />
                        Continuar con Google
                    </button>

                    <button
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        onClick={handleGitHubLogin}
                        disabled={loading}
                    >
                        <GitHubIcon />
                        Continuar con GitHub
                    </button>
                </div>

                <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">
                    No tienes cuenta?{' '}
                    <Link
                        href="/register"
                        className="font-medium text-slate-700 underline-offset-4 hover:underline dark:text-slate-200"
                    >
                        Registrate aqui
                    </Link>
                </p>

                {error ? (
                    <p className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/60 dark:bg-rose-400/15 dark:text-rose-100">
                        {error}
                    </p>
                ) : null}
            </section>
        </div>
    )
}