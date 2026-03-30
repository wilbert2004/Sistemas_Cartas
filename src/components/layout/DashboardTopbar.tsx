'use client'

import { Search } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'

type DashboardTopbarProps = {
    userName: string
    userEmail: string
}

const obtenerIniciales = (nombre: string, email: string) => {
    const base = nombre.trim() || email.trim()

    if (!base) return 'SC'

    const partes = base.split(/\s+/).filter(Boolean)
    if (partes.length === 1) {
        return partes[0].slice(0, 2).toUpperCase()
    }

    return `${partes[0][0] ?? ''}${partes[1][0] ?? ''}`.toUpperCase()
}

export default function DashboardTopbar({ userName, userEmail }: DashboardTopbarProps) {
    const iniciales = obtenerIniciales(userName, userEmail)

    return (
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/70 sm:px-5">
            <div className="flex min-w-55 flex-1 items-center gap-3">
                <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 sm:flex">
                    <Search className="h-4 w-4" />
                    <span>Buscar modulo...</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <ThemeToggle />

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                    <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{userName}</p>
                        <p className="max-w-45 truncate text-xs text-slate-500 dark:text-slate-400">{userEmail}</p>
                    </div>
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white shadow-sm">
                        {iniciales}
                    </div>
                </div>
            </div>
        </header>
    )
}
