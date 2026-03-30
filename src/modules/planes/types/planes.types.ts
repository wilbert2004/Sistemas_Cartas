export type Plan = {
  id: string
  nombre: string
  limite_cartas: number | null
  precio: number | null
}

export type Suscripcion = {
  id: string
  usuario_id: string
  plan_id: string
  estado: string
  fecha_inicio: string
}

export type UsePlanesReturn = {
  planes: Plan[]
  loading: boolean
  error: string
  success: string
  planActualId: string | null
  actualizandoPlanId: string | null
  elegirPlan: (planId: string) => Promise<void>
}
