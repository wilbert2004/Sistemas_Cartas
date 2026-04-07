'use client'

import { FormEvent, useEffect, useState } from 'react'
import { AlertCircle, Building2, BriefcaseBusiness, CheckCircle2, Loader2, Phone, UserCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { guardarPerfil, obtenerPerfil } from '@/services/perfil.service'

type EstadoFormulario = {
  telefono: string
  empresa: string
  cargo: string
}

const FORMULARIO_INICIAL: EstadoFormulario = {
  telefono: '',
  empresa: '',
  cargo: '',
}

export const PerfilPage = () => {
  const [usuarioId, setUsuarioId] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [formulario, setFormulario] = useState<EstadoFormulario>(FORMULARIO_INICIAL)
  const [cargando, setCargando] = useState<boolean>(true)
  const [guardando, setGuardando] = useState<boolean>(false)
  const [mensaje, setMensaje] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        setCargando(true)
        setError('')
        setMensaje('')

        if (!supabase) {
          throw new Error('No se pudo inicializar Supabase. Revisa variables de entorno.')
        }

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) throw authError
        if (!user?.id) throw new Error('Usuario no autenticado')

        setUsuarioId(user.id)
        setEmail(user.email ?? '')

        const perfil = await obtenerPerfil(user.id)

        if (perfil) {
          setFormulario({
            telefono: perfil.telefono ?? '',
            empresa: perfil.empresa ?? '',
            cargo: perfil.cargo ?? '',
          })
        }
      } catch (e) {
        const detalle = e instanceof Error ? e.message : 'No se pudo cargar tu perfil.'
        setError(detalle)
      } finally {
        setCargando(false)
      }
    }

    void cargarPerfil()
  }, [])

  const manejarCambio = (campo: keyof EstadoFormulario, valor: string) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }))

    if (mensaje) setMensaje('')
    if (error) setError('')
  }

  const manejarGuardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      if (!usuarioId) {
        throw new Error('No hay usuario autenticado para guardar el perfil.')
      }

      setGuardando(true)
      setError('')
      setMensaje('')

      const perfilGuardado = await guardarPerfil({
        usuario_id: usuarioId,
        telefono: formulario.telefono,
        empresa: formulario.empresa,
        cargo: formulario.cargo,
      })

      // Asegura que el formulario conserve siempre el valor persistido.
      setFormulario({
        telefono: perfilGuardado.telefono ?? '',
        empresa: perfilGuardado.empresa ?? '',
        cargo: perfilGuardado.cargo ?? '',
      })

      setMensaje('Perfil guardado ✅')
    } catch (e) {
      const detalle = e instanceof Error ? e.message : 'No se pudo guardar tu perfil.'
      setError(detalle)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando perfil...
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-r from-white via-cyan-50 to-blue-50 p-8 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20">
        <div className="absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-cyan-200/50 blur-2xl dark:bg-cyan-500/15" />
        <div className="relative">
          <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase dark:text-cyan-300">PERFIL</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Tu información profesional</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Mantén tus datos actualizados para personalizar cartas, firma y flujo de trabajo.
          </p>
        </div>
      </header>

      <form
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8"
        onSubmit={manejarGuardar}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="email" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <UserCircle2 className="h-4 w-4" />
              Correo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />
          </div>

          <div>
            <label htmlFor="telefono" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Phone className="h-4 w-4" />
              Telefono
            </label>
            <input
              id="telefono"
              type="tel"
              value={formulario.telefono}
              onChange={(event) => manejarCambio('telefono', event.target.value)}
              placeholder="+52 55 1234 5678"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
            />
          </div>

          <div>
            <label htmlFor="empresa" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Building2 className="h-4 w-4" />
              Empresa
            </label>
            <input
              id="empresa"
              type="text"
              value={formulario.empresa}
              onChange={(event) => manejarCambio('empresa', event.target.value)}
              placeholder="Nombre de tu empresa"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="cargo" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <BriefcaseBusiness className="h-4 w-4" />
              Cargo
            </label>
            <input
              id="cargo"
              type="text"
              value={formulario.cargo}
              onChange={(event) => manejarCambio('cargo', event.target.value)}
              placeholder="Ejemplo: Coordinador de Marketing"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
            />
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={guardando}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
          >
            {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {guardando ? 'Guardando cambios...' : 'Guardar cambios'}
          </button>

          <div className="min-h-6">
            {mensaje ? (
              <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                {mensaje}
              </p>
            ) : null}

            {!mensaje && error ? (
              <p className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-300">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </form>
    </section>
  )
}

export default PerfilPage