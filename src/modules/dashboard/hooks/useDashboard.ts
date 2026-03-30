import { useEffect, useState } from 'react'
import { obtenerDashboardStats } from '@/modules/dashboard/services/dashboard.service'
import type { DashboardStats, UseDashboardReturn } from '@/modules/dashboard/types/dashboard.types'

export const useDashboard = (): UseDashboardReturn => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    const cargar = async () => {
      setLoading(true)
      setError('')

      try {
        const data = await obtenerDashboardStats()
        setStats(data)
      } catch (err: unknown) {
        const mensaje = err instanceof Error ? err.message : 'No se pudo cargar el dashboard.'
        setError(mensaje)
      } finally {
        setLoading(false)
      }
    }

    cargar()
  }, [])

  return { loading, error, stats }
}
