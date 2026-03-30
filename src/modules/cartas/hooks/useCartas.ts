import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Carta, UseCartasReturn } from '@/modules/cartas/types/cartas.types'

export const useCartas = (): UseCartasReturn => {
  const [cartas, setCartas] = useState<Carta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [eliminarLoadingId, setEliminarLoadingId] = useState<string | null>(null)

  const recargarCartas = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      if (!supabase) {
        throw new Error(
          'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local'
        )
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) {
        throw new Error('No hay una sesion activa para listar cartas.')
      }

      const { data, error: cartasError } = await supabase
        .from('cartas')
        .select('*')
        .eq('usuario_id', user.id)
        .order('fecha_creacion', { ascending: false })

      if (cartasError) throw cartasError

      setCartas((data ?? []) as Carta[])
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'No se pudieron cargar las cartas.'
      setError(mensaje)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    recargarCartas()
  }, [recargarCartas])

  const eliminarCarta = useCallback(async (id: string) => {
    if (!id) return

    setEliminarLoadingId(id)
    setError('')

    try {
      if (!supabase) {
        throw new Error(
          'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local'
        )
      }

      const { error: deleteError } = await supabase.from('cartas').delete().eq('id', id)

      if (deleteError) throw deleteError

      setCartas((prev) => prev.filter((carta) => carta.id !== id))
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo eliminar la carta.'
      setError(mensaje)
    } finally {
      setEliminarLoadingId(null)
    }
  }, [])

  return {
    cartas,
    loading,
    error,
    eliminarLoadingId,
    eliminarCarta,
    recargarCartas,
  }
}
