'use client'

import { useEffect, useState } from 'react'
import type { Perfil, GuardarPerfilPayload, UsePerfilReturn } from '@/modules/perfil/types/perfil.types'
import {
  obtenerUsuarioAutenticado,
  obtenerOCrearPerfil,
  actualizarPerfil,
} from '@/modules/perfil/services/perfil.service'

export const usePerfil = (): UsePerfilReturn => {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [guardando, setGuardando] = useState<boolean>(false)

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        setLoading(true)
        setError('')

        const usuario = await obtenerUsuarioAutenticado()

        if (!usuario.id) {
          throw new Error('Usuario no autenticado')
        }

        setEmail(usuario.email ?? null)

        const perfilCargado = await obtenerOCrearPerfil(usuario.id)

        setPerfil(perfilCargado)
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'Error al cargar el perfil'
        setError(mensaje)
      } finally {
        setLoading(false)
      }
    }

    cargarPerfil()
  }, [])

  const guardarCambios = async (payload: GuardarPerfilPayload) => {
    try {
      setGuardando(true)
      setError('')
      setSuccess('')

      const usuario = await obtenerUsuarioAutenticado()

      if (!usuario.id) {
        throw new Error('Usuario no autenticado')
      }

      const perfilActualizado = await actualizarPerfil(usuario.id, payload)

      setPerfil(perfilActualizado)
      setSuccess('✔ Perfil actualizado correctamente')

      // Limpiar mensaje de éxito después de 4 segundos
      setTimeout(() => {
        setSuccess('')
      }, 4000)
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al guardar el perfil'
      setError(mensaje)
    } finally {
      setGuardando(false)
    }
  }

  const limpiarMensajeExito = () => {
    setSuccess('')
  }

  return {
    perfil,
    email,
    loading,
    error,
    success,
    guardando,
    guardarCambios,
    limpiarMensajeExito,
  }
}
