'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
    BadgeDollarSign,
    FileStack,
    House,
    LogOut,
    Sparkles,
    UserRound,
} from 'lucide-react'
import { logoutUsuario } from '@/services/auth.service'

type DashboardSidebarProps = {
    userName: string
    userEmail: string
}

const items = [
    { href: '/dashboard', label: 'Inicio', icon: House },
    { href: '/dashboard/generar', label: 'Generar', icon: Sparkles },
    { href: '/dashboard/cartas', label: 'Cartas', icon: FileStack },
    { href: '/dashboard/perfil', label: 'Perfil', icon: UserRound },
    { href: '/dashboard/suscripcion', label: 'Suscripcion', icon: BadgeDollarSign },
]

const obtenerIniciales = (nombre: string, email: string) => {
    const base = nombre.trim() || email.trim()
    if (!base) return 'SC'

    const partes = base.split(/\s+/).filter(Boolean)
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()

    return `${partes[0][0] ?? ''}${partes[1][0] ?? ''}`.toUpperCase()
}

export default function DashboardSidebar({ userName, userEmail }: DashboardSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [loadingLogout, setLoadingLogout] = useState(false)
    const iniciales = obtenerIniciales(userName, userEmail)

    const handleLogout = async () => {
        setLoadingLogout(true)

        try {
            await logoutUsuario()
            router.replace('/login')
        } catch {
            router.replace('/login')
        } finally {
            setLoadingLogout(false)
        }
    }

    return (
        <aside className="h-full border-r border-slate-200 bg-white/80 text-slate-800 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-200">
            <div className="flex h-full flex-col">
                <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800">
                    <div className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 px-3 py-2 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-500/25">
                        <Sparkles className="h-4 w-4" />
                        <p className="text-xs font-semibold tracking-widest uppercase">Sistemas Cartas</p>
                    </div>

                    <h2 className="mt-4 text-lg font-semibold">Workspace</h2>
                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                        {userEmail || 'usuario@correo.com'}
                    </p>
                </div>

                <nav className="flex-1 space-y-1.5 p-3">
                    {items.map((item) => {
                        const activo =
                            pathname === item.href ||
                            (item.href !== '/dashboard' && pathname.startsWith(item.href))

                        const Icon = item.icon

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${activo
                                    ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:ring-slate-300'
                                    : 'text-slate-600 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                                    }`}
                            >
                                <Icon
                                    className={`h-4 w-4 transition ${activo
                                        ? 'text-cyan-300 dark:text-cyan-600'
                                        : 'text-slate-400 group-hover:text-cyan-600 dark:text-slate-500 dark:group-hover:text-cyan-300'
                                        }`}
                                />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                    <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white shadow-sm">
                            {iniciales}
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {userName}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {userEmail || 'usuario@correo.com'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        disabled={loadingLogout}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-300/70 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/35 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/20"
                    >
                        <LogOut className="h-4 w-4" />
                        {loadingLogout ? 'Cerrando...' : 'Cerrar sesion'}
                    </button>
                </div>
            </div>
        </aside>
    )
}
