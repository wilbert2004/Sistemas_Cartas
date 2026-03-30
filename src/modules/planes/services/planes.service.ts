import { supabase } from '@/lib/supabaseClient'
import type { Plan, Suscripcion } from '@/modules/planes/types/planes.types'

const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local'
    )
  }

  return supabase
}

export const obtenerUsuarioAutenticado = async () => {
  const client = getSupabaseClient()

  const {
    data: { user },
    error,
  } = await client.auth.getUser()

  if (error) throw error
  if (!user) throw new Error('No hay una sesion activa.')

  return user
}

export const obtenerPlanesDisponibles = async (): Promise<Plan[]> => {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('planes')
    .select('id, nombre, limite_cartas, precio')
    .order('precio', { ascending: true, nullsFirst: true })

  if (error) throw error

  return (data ?? []) as Plan[]
}

export const obtenerSuscripcionActiva = async (
  usuarioId: string
): Promise<Suscripcion | null> => {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('suscripciones')
    .select('id, usuario_id, plan_id, estado, fecha_inicio')
    .eq('usuario_id', usuarioId)
    .eq('estado', 'activo')
    .maybeSingle()

  if (error) throw error

  return (data as Suscripcion | null) ?? null
}

export const actualizarPlanSuscripcion = async (usuarioId: string, planId: string) => {
  const client = getSupabaseClient()

  const suscripcionActiva = await obtenerSuscripcionActiva(usuarioId)

  if (suscripcionActiva) {
    const { data, error } = await client
      .from('suscripciones')
      .update({
        plan_id: planId,
        estado: 'activo',
      })
      .eq('id', suscripcionActiva.id)
      .select('id, usuario_id, plan_id, estado, fecha_inicio')
      .single()

    if (error) throw error

    return data as Suscripcion
  }

  const { data, error } = await client
    .from('suscripciones')
    .insert({
      usuario_id: usuarioId,
      plan_id: planId,
      estado: 'activo',
      fecha_inicio: new Date().toISOString(),
    })
    .select('id, usuario_id, plan_id, estado, fecha_inicio')
    .single()

  if (error) throw error

  return data as Suscripcion
}
