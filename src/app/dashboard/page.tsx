'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    logoutUsuario,
    obtenerSesion,
    obtenerUsuarioActual,
    sincronizarUsuarioAutenticado,
    sincronizarUsuarioGitHub,
} from '@/services/auth.service'

export default function DashboardPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const validarSesion = async () => {
            try {
                const session = await obtenerSesion()
                if (!session) {
                    router.replace('/login')
                    return
                }

                const user = await obtenerUsuarioActual()
                if (user) {
                    const sincronizadoGitHub = await sincronizarUsuarioGitHub(user)
                    if (!sincronizadoGitHub) {
                        await sincronizarUsuarioAutenticado(user)
                    }
                }
                setEmail(user?.email ?? '')
            } catch {
                router.replace('/login')
            } finally {
                setLoading(false)
            }
        }

        validarSesion()
    }, [router])

    const handleLogout = async () => {
        try {
            await logoutUsuario()
            router.replace('/login')
        } catch {
            router.replace('/login')
        }
    }

    if (loading) {
        return (
            <div className="grid min-h-dvh place-items-center px-4 py-6 sm:px-6">
                <section className="w-full max-w-145 rounded-3xl border border-white/10 bg-[linear-gradient(160deg,rgba(12,25,42,0.75),rgba(10,21,36,0.92))] p-6 shadow-[0_30px_80px_rgba(1,6,12,0.6)] backdrop-blur-sm sm:p-10">
                    <p className="text-center text-sm font-semibold tracking-wide text-slate-300">
                        Cargando dashboard...
                    </p>
                </section>
            </div>
        )
    }

    return (
        <div className="grid min-h-dvh place-items-center px-4 py-6 sm:px-6">
            <section className="w-full max-w-145 rounded-3xl border border-white/10 bg-[linear-gradient(160deg,rgba(12,25,42,0.75),rgba(10,21,36,0.92))] p-6 shadow-[0_30px_80px_rgba(1,6,12,0.6)] backdrop-blur-sm sm:p-10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="mb-2.5 text-xs tracking-widest text-teal-300 uppercase">
                            Panel Principal
                        </p>
                        <h1 className="text-3xl leading-tight font-bold sm:text-4xl">
                            Dashboard
                        </h1>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-teal-300/40 bg-teal-300/15 px-3 py-1 text-sm text-teal-100 before:h-2 before:w-2 before:rounded-full before:bg-teal-300">
                        Sesion activa
                    </span>
                </div>

                <p className="mt-2.5 text-sm text-slate-300 sm:text-base">
                    Este es tu espacio de trabajo autenticado.
                </p>

                <div className="my-4 border-t border-dashed border-slate-200/20" />

                <p className="font-mono text-sm text-slate-200/85">Usuario: {email}</p>

                <div className="mt-6 grid gap-3.5">
                    <button
                        className="cursor-pointer rounded-xl border border-rose-400/45 bg-rose-500/15 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:-translate-y-0.5 hover:bg-rose-500/20"
                        onClick={handleLogout}
                    >
                        Cerrar sesion
                    </button>
                </div>
            </section>
        </div>
    )
}
