'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerSesion } from '@/services/auth.service'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const validarSesion = async () => {
      try {
        const session = await obtenerSesion()
        router.replace(session ? '/dashboard' : '/login')
      } catch {
        router.replace('/login')
      }
    }

    validarSesion()
  }, [router])

  return (
    <div className="grid min-h-dvh place-items-center bg-slate-100 px-4 py-6 dark:bg-slate-950 sm:px-6">
      <section className="w-full max-w-145 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/50 transition dark:border-white/10 dark:bg-[linear-gradient(160deg,rgba(12,25,42,0.75),rgba(10,21,36,0.92))] dark:shadow-[0_30px_80px_rgba(1,6,12,0.6)] sm:p-10">
        <p className="mb-2.5 text-xs tracking-widest text-cyan-700 uppercase dark:text-teal-300">
          Sistemas Cartas
        </p>
        <h1 className="text-3xl leading-tight font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
          Comprobando tu sesion
        </h1>
        <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
          En segundos te enviamos a la pantalla correcta.
        </p>
        <p className="mt-6 text-center text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-300">
          Validando sesion...
        </p>
      </section>
    </div>
  )
}