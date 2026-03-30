'use client'

import type { ReactNode } from 'react'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import DashboardTopbar from '@/components/layout/DashboardTopbar'
import { useDashboardGuard } from '@/hooks/useDashboardGuard'

type DashboardLayoutProps = {
    children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { loading, userEmail, userName } = useDashboardGuard()

    if (loading) {
        return (
            <div className="grid min-h-dvh place-items-center bg-slate-100 px-4 dark:bg-slate-950">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        Validando acceso al dashboard...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-dvh bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <div className="grid min-h-dvh md:grid-cols-[280px_1fr]">
                <DashboardSidebar userEmail={userEmail} userName={userName} />

                <main className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                    <div className="mx-auto w-full max-w-7xl">
                        <DashboardTopbar userName={userName} userEmail={userEmail} />
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
