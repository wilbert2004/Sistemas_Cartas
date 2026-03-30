'use client'

import { MonitorCog, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                aria-label="Cambiar tema"
            >
                <MonitorCog className="h-4 w-4" />
            </button>
        )
    }

    const current = theme === 'system' ? resolvedTheme : theme

    return (
        <div className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <button
                type="button"
                onClick={() => setTheme('light')}
                aria-label="Modo claro"
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${current === 'light'
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
            >
                <Sun className="h-4 w-4" />
            </button>

            <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-label="Modo oscuro"
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${current === 'dark'
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
            >
                <Moon className="h-4 w-4" />
            </button>

            <button
                type="button"
                onClick={() => setTheme('system')}
                aria-label="Modo sistema"
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${theme === 'system'
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
            >
                <MonitorCog className="h-4 w-4" />
            </button>
        </div>
    )
}
