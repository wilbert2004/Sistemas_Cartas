import { supabase } from '@/lib/supabaseClient'

export type PlanSuscripcion = {
  id: string
  nombre: string
  limite_cartas: number
  precio: string
  activo: boolean
}

export type SuscripcionConPlan = {
  usuario_id: string
  plan_id: string | null
  estado: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  plan: PlanSuscripcion | null
}

type SuscripcionRow = {
  usuario_id: string
  plan_id: string
  estado: string
  fecha_inicio: string
  fecha_fin: string | null
}

export const PLANES_REFERENCIA: PlanSuscripcion[] = [
  {
    id: '727b8e67-1e00-45c2-9aab-6a8652e7fc92',
    nombre: 'pro',
    limite_cartas: 9999,
    precio: '50',
    activo: true,
  },
  {
    id: 'f02a5d25-a431-48cf-aa34-f82a5ecf45f7',
    nombre: 'gratis',
    limite_cartas: 10,
    precio: '0',
    activo: true,
  },
]

const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local')
  }

  return supabase
}

const mapPlan = (plan: Partial<PlanSuscripcion>): PlanSuscripcion => {
  const fallback = PLANES_REFERENCIA.find((item) => item.id === plan.id)
  const nombre = String(plan.nombre ?? fallback?.nombre ?? '').toLowerCase()
  const limiteCartasOriginal = Number(plan.limite_cartas ?? fallback?.limite_cartas ?? 0)
  const precioOriginal = String(plan.precio ?? fallback?.precio ?? '0')

  return {
    id: String(plan.id ?? fallback?.id ?? ''),
    nombre,
    limite_cartas: Number.isFinite(limiteCartasOriginal) ? limiteCartasOriginal : 0,
    precio: precioOriginal,
    activo: typeof plan.activo === 'boolean' ? plan.activo : (fallback?.activo ?? true),
  }
}

export const obtenerPlanesDisponibles = async (): Promise<PlanSuscripcion[]> => {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('planes')
    .select('id, nombre, limite_cartas, precio, activo')
    .order('precio', { ascending: true })

  if (error) {
    // Fallback seguro para que el modulo siga funcionando con el JSON de referencia.
    return PLANES_REFERENCIA
  }

  const planes = (data ?? []).map((plan) => mapPlan(plan as Partial<PlanSuscripcion>))

  if (planes.length === 0) {
    return PLANES_REFERENCIA
  }

  return planes
}

const obtenerSuscripcionRow = async (usuario_id: string): Promise<SuscripcionRow | null> => {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('suscripciones')
    .select('usuario_id, plan_id, estado, fecha_inicio, fecha_fin')
    .eq('usuario_id', usuario_id)
    .maybeSingle()

  if (error) throw error

  return (data as SuscripcionRow | null) ?? null
}

export const obtenerSuscripcion = async (usuario_id: string): Promise<SuscripcionConPlan | null> => {
  const [suscripcion, planes] = await Promise.all([
    obtenerSuscripcionRow(usuario_id),
    obtenerPlanesDisponibles(),
  ])

  if (!suscripcion) {
    return null
  }

  const plan = planes.find((item) => item.id === suscripcion.plan_id) ?? null

  return {
    usuario_id: suscripcion.usuario_id,
    plan_id: suscripcion.plan_id,
    estado: suscripcion.estado,
    fecha_inicio: suscripcion.fecha_inicio,
    fecha_fin: suscripcion.fecha_fin,
    plan,
  }
}

export const obtenerEstadoSuscripcionSeguro = async (): Promise<SuscripcionConPlan | null> => {
  const client = getSupabaseClient()

  const {
    data: { session },
    error: sesionError,
  } = await client.auth.getSession()

  if (sesionError) {
    throw sesionError
  }

  const token = session?.access_token

  if (!token) {
    throw new Error('No hay sesion activa para validar la suscripcion.')
  }

  const response = await fetch('/api/suscripcion/estado', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  const data = (await response.json()) as {
    ok?: boolean
    suscripcion?: SuscripcionConPlan | null
    error?: string
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error ?? 'No se pudo validar la suscripcion en backend.')
  }

  return data.suscripcion ?? null
}
