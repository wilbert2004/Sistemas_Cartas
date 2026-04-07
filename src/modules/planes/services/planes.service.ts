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

export const obtenerSuscripcionSegura = async (): Promise<Suscripcion | null> => {
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
    error?: string
    suscripcion?: {
      usuario_id?: string
      plan_id?: string | null
      estado?: string | null
      fecha_inicio?: string | null
    } | null
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error ?? 'No se pudo validar la suscripcion en backend.')
  }

  const suscripcion = data.suscripcion
  if (!suscripcion) return null

  return {
    id: `${suscripcion.usuario_id ?? ''}:${suscripcion.plan_id ?? ''}`,
    usuario_id: suscripcion.usuario_id ?? '',
    plan_id: suscripcion.plan_id ?? '',
    estado: suscripcion.estado ?? '',
    fecha_inicio: suscripcion.fecha_inicio ?? '',
  }
}
