'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { obtenerSesion, registrarUsuario } from '@/services/auth.service'

export default function RegisterPage() {
    const router = useRouter()
    const [nombre, setNombre] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const validarSesion = async () => {
            try {
                const session = await obtenerSesion()
                if (session) {
                    router.replace('/dashboard')
                }
            } catch {
                // No hacemos nada aqui para permitir registro manual.
            }
        }

        validarSesion()
    }, [router])

    const handleRegister = async () => {
        setError('')
        setLoading(true)

        try {
            const data = await registrarUsuario({
                email,
                password,
                nombre,
            })

            if (data.session) {
                router.replace('/dashboard')
            } else {
                router.replace('/login')
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'No fue posible completar el registro.'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid min-h-dvh place-items-center bg-slate-100 px-4 py-6 dark:bg-slate-950 sm:px-6">
            <section className="w-full max-w-145 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900 sm:p-10">
                <p className="mb-2.5 text-xs tracking-widest text-slate-600 uppercase dark:text-slate-400">
                    Tu primer paso
                </p>
                <h1 className="text-3xl leading-tight font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
                    Crea tu cuenta
                </h1>
                <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                    Registrate para entrar al dashboard y gestionar tu SaaS.
                </p>

                <div className="mt-6 grid gap-3.5">
                    <input
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 dark:border-slate-100/20 dark:bg-slate-950/45 dark:text-slate-100 dark:focus:border-teal-300 dark:focus:ring-teal-300/30 sm:text-base"
                        type="text"
                        placeholder="Nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                    />

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
                        onClick={handleRegister}
                        disabled={loading}
                    >
                        {loading ? 'Cargando...' : 'Registrarse'}
                    </button>
                </div>

                <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">
                    Ya tienes cuenta?{' '}
                    <Link
                        href="/login"
                        className="font-medium text-slate-700 underline-offset-4 hover:underline dark:text-slate-200"
                    >
                        Inicia sesion
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