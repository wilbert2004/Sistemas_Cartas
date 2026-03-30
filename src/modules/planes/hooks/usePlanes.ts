import { useEffect, useMemo, useState } from 'react'
import {
  actualizarPlanSuscripcion,
  obtenerPlanesDisponibles,
  obtenerSuscripcionActiva,
  obtenerUsuarioAutenticado,
} from '@/modules/planes/services/planes.service'
import type { Plan, UsePlanesReturn } from '@/modules/planes/types/planes.types'

export const usePlanes = (): UsePlanesReturn => {
  const [planes, setPlanes] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [planActualId, setPlanActualId] = useState<string | null>(null)
  const [actualizandoPlanId, setActualizandoPlanId] = useState<string | null>(null)

  useEffect(() => {
    const cargar = async () => {
      setLoading(true)
      setError('')

      try {
        const user = await obtenerUsuarioAutenticado()
        setUsuarioId(user.id)

        const [planesData, suscripcionActiva] = await Promise.all([
          obtenerPlanesDisponibles(),
          obtenerSuscripcionActiva(user.id),
        ])

        setPlanes(planesData)
        setPlanActualId(suscripcionActiva?.plan_id ?? null)
      } catch (err: unknown) {
        const mensaje = err instanceof Error ? err.message : 'No se pudieron cargar los planes.'
        setError(mensaje)
      } finally {
        setLoading(false)
      }
    }

    cargar()
  }, [])

  const planesOrdenados = useMemo(() => {
    return [...planes].sort((a, b) => {
      const aEsPro = (a.nombre ?? '').toLowerCase().includes('pro')
      const bEsPro = (b.nombre ?? '').toLowerCase().includes('pro')
      if (aEsPro === bEsPro) return 0
      return aEsPro ? -1 : 1
    })
  }, [planes])

  const elegirPlan = async (planId: string) => {
    if (!usuarioId) {
      setError('No se encontro un usuario autenticado.')
      return
    }

    setError('')
    setSuccess('')
    setActualizandoPlanId(planId)

    try {
      const suscripcion = await actualizarPlanSuscripcion(usuarioId, planId)
      setPlanActualId(suscripcion.plan_id)
      setSuccess('Plan actualizado correctamente')
    } catch (err: unknown) {
      const mensaje =
        err instanceof Error ? err.message : 'No se pudo actualizar el plan de suscripcion.'
      setError(mensaje)
    } finally {
      setActualizandoPlanId(null)
    }
  }

  return {
    planes: planesOrdenados,
    loading,
    error,
    success,
    planActualId,
    actualizandoPlanId,
    elegirPlan,
  }
}
