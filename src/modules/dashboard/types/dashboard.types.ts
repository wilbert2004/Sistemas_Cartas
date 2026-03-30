export type DashboardPlan = {
  nombre: string
  limite_cartas: number | null
}

export type DashboardStats = {
  userName: string
  totalCartas: number
  planActual: string
  limiteCartas: number | null
  cantidadUsada: number
}

export type UseDashboardReturn = {
  loading: boolean
  error: string
  stats: DashboardStats | null
}
