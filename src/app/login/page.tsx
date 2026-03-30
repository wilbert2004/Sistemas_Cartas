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
        <div className="grid min-h-dvh place-items-center px-4 py-6 sm:px-6">
            <section className="w-full max-w-145 rounded-3xl border border-white/10 bg-[linear-gradient(160deg,rgba(12,25,42,0.75),rgba(10,21,36,0.92))] p-6 shadow-[0_30px_80px_rgba(1,6,12,0.6)] backdrop-blur-sm sm:p-10">
                <p className="mb-2.5 text-xs tracking-widest text-teal-300 uppercase">
                    Bienvenido de vuelta
                </p>
                <h1 className="text-3xl leading-tight font-bold sm:text-4xl">
                    Inicia sesion en tu panel
                </h1>
                <p className="mt-2.5 text-sm text-slate-300 sm:text-base">
                    Entra con tu correo o utiliza un proveedor externo.
                </p>

                <div className="mt-6 grid gap-3.5">
                    <input
                        className="w-full rounded-xl border border-slate-100/20 bg-slate-950/45 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-teal-300 focus:ring-4 focus:ring-teal-300/30 sm:text-base"
                        type="email"
                        placeholder="Correo"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <input
                        className="w-full rounded-xl border border-slate-100/20 bg-slate-950/45 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-teal-300 focus:ring-4 focus:ring-teal-300/30 sm:text-base"
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

                <p className="mt-3 text-right text-sm text-slate-300">
                    <Link
                        href="/forgot-password"
                        className="font-medium text-teal-300 underline-offset-4 hover:underline"
                    >
                        Olvidaste tu contrasena?
                    </Link>
                </p>

                <div className="my-4 border-t border-dashed border-slate-200/20" />

                <div className="grid gap-2.5 sm:grid-cols-2">
                    <button
                        className="cursor-pointer rounded-xl border border-slate-100/25 bg-slate-50/8 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:bg-slate-50/12 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        Continuar con Google
                    </button>

                    <button
                        className="cursor-pointer rounded-xl border border-slate-100/25 bg-slate-50/8 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:bg-slate-50/12 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={handleGitHubLogin}
                        disabled={loading}
                    >
                        Continuar con GitHub
                    </button>
                </div>

                <p className="mt-4 text-sm text-slate-300">
                    No tienes cuenta?{' '}
                    <Link
                        href="/register"
                        className="font-medium text-teal-300 underline-offset-4 hover:underline"
                    >
                        Registrate aqui
                    </Link>
                </p>

                {error ? (
                    <p className="mt-4 rounded-xl border border-rose-400/60 bg-rose-400/15 px-3 py-2 text-sm text-rose-100">
                        {error}
                    </p>
                ) : null}
            </section>
        </div>
    )
}