'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { guardarPerfil, obtenerPerfil } from '@/services/perfiles.service'

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
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-300">Cargando perfil...</p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Mi perfil</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Completa tus datos para personalizar tu experiencia en la plataforma.
        </p>
      </header>

      <form className="space-y-5" onSubmit={manejarGuardar}>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
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
          <label htmlFor="telefono" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Telefono
          </label>
          <input
            id="telefono"
            type="tel"
            value={formulario.telefono}
            onChange={(event) => manejarCambio('telefono', event.target.value)}
            placeholder="+52 55 1234 5678"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div>
          <label htmlFor="empresa" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Empresa
          </label>
          <input
            id="empresa"
            type="text"
            value={formulario.empresa}
            onChange={(event) => manejarCambio('empresa', event.target.value)}
            placeholder="Nombre de tu empresa"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div>
          <label htmlFor="cargo" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Cargo
          </label>
          <input
            id="cargo"
            type="text"
            value={formulario.cargo}
            onChange={(event) => manejarCambio('cargo', event.target.value)}
            placeholder="Ejemplo: Coordinador de Marketing"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>

        <div className="min-h-6">
          {mensaje ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{mensaje}</p> : null}
          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        </div>
      </form>
    </section>
  )
}

export default PerfilPage