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
  plan: PlanSuscripcion | null
}

type GuardarSuscripcionInput = {
  usuario_id: string
  plan_id: string
}

type SuscripcionRow = {
  usuario_id: string
  plan_id: string
  estado: string
  fecha_inicio: string
}

export const PLANES_REFERENCIA: PlanSuscripcion[] = [
  {
    id: '727b8e67-1e00-45c2-9aab-6a8652e7fc92',
    nombre: 'pro',
    limite_cartas: 9999,
    precio: '99',
    activo: true,
  },
  {
    id: 'f02a5d25-a431-48cf-aa34-f82a5ecf45f7',
    nombre: 'gratis',
    limite_cartas: 3,
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

  return {
    id: String(plan.id ?? fallback?.id ?? ''),
    nombre: String(plan.nombre ?? fallback?.nombre ?? ''),
    limite_cartas: Number(plan.limite_cartas ?? fallback?.limite_cartas ?? 0),
    precio: String(plan.precio ?? fallback?.precio ?? '0'),
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
    .select('usuario_id, plan_id, estado, fecha_inicio')
    .eq('usuario_id', usuario_id)
    .eq('estado', 'activo')
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
    plan,
  }
}

const guardarSuscripcionConFallback = async (
  input: GuardarSuscripcionInput
): Promise<SuscripcionRow> => {
  const client = getSupabaseClient()

  const existente = await obtenerSuscripcionRow(input.usuario_id)

  if (existente) {
    const { data, error } = await client
      .from('suscripciones')
      .update({
        plan_id: input.plan_id,
        estado: 'activo',
      })
      .eq('usuario_id', input.usuario_id)
      .select('usuario_id, plan_id, estado, fecha_inicio')
      .single()

    if (error) throw error

    return data as SuscripcionRow
  }

  const { data, error } = await client
    .from('suscripciones')
    .insert({
      usuario_id: input.usuario_id,
      plan_id: input.plan_id,
      estado: 'activo',
      fecha_inicio: new Date().toISOString(),
    })
    .select('usuario_id, plan_id, estado, fecha_inicio')
    .single()

  if (error) throw error

  return data as SuscripcionRow
}

export const guardarSuscripcion = async (
  input: GuardarSuscripcionInput
): Promise<SuscripcionConPlan> => {
  const planes = await obtenerPlanesDisponibles()
  const planSeleccionado = planes.find((item) => item.id === input.plan_id)

  if (!planSeleccionado) {
    throw new Error('El plan seleccionado no existe.')
  }

  if (!planSeleccionado.activo) {
    throw new Error('No se puede seleccionar un plan inactivo.')
  }

  const client = getSupabaseClient()

  const { data, error } = await client
    .from('suscripciones')
    .upsert(
      {
        usuario_id: input.usuario_id,
        plan_id: input.plan_id,
        estado: 'activo',
        fecha_inicio: new Date().toISOString(),
      },
      { onConflict: 'usuario_id' }
    )
    .select('usuario_id, plan_id, estado, fecha_inicio')
    .single()

  let suscripcion: SuscripcionRow

  if (error) {
    // Si onConflict no esta soportado por constraint, usamos update/insert manual.
    suscripcion = await guardarSuscripcionConFallback(input)
  } else {
    suscripcion = data as SuscripcionRow
  }

  return {
    usuario_id: suscripcion.usuario_id,
    plan_id: suscripcion.plan_id,
    estado: suscripcion.estado,
    fecha_inicio: suscripcion.fecha_inicio,
    plan: planSeleccionado,
  }
}
