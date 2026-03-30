import { supabase } from '@/lib/supabaseClient'
import type { DashboardPlan, DashboardStats } from '@/modules/dashboard/types/dashboard.types'

const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local'
    )
  }

  return supabase
}

const obtenerNombreUsuario = (email: string, metadata: Record<string, unknown> | null) => {
  const nombreDesdeMetadata =
    (typeof metadata?.full_name === 'string' && metadata.full_name.trim()) ||
    (typeof metadata?.name === 'string' && metadata.name.trim()) ||
    (typeof metadata?.user_name === 'string' && metadata.user_name.trim()) ||
    (typeof metadata?.nombre === 'string' && metadata.nombre.trim())

  if (nombreDesdeMetadata) {
    return nombreDesdeMetadata
  }

  const fallback = email.split('@')[0]?.trim()
  return fallback || 'Usuario'
}

const normalizarPlan = (rawPlan: unknown): DashboardPlan | null => {
  if (!rawPlan) return null

  const plan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan
  if (!plan || typeof plan !== 'object') return null

  const nombre = typeof (plan as { nombre?: unknown }).nombre === 'string'
    ? (plan as { nombre: string }).nombre
    : 'Gratis'

  const limiteRaw = (plan as { limite_cartas?: unknown }).limite_cartas
  const limiteCartas = typeof limiteRaw === 'number' ? limiteRaw : limiteRaw === null ? null : null

  return {
    nombre,
    limite_cartas: limiteCartas,
  }
}

export const obtenerDashboardStats = async (): Promise<DashboardStats> => {
  const client = getSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser()

  if (userError) throw userError
  if (!user) {
    throw new Error('No hay una sesion activa para cargar el dashboard.')
  }

  const metadata = user.user_metadata as Record<string, unknown> | null
  const userName = obtenerNombreUsuario(user.email ?? '', metadata)

  const [{ count: totalCartas, error: cartasError }, { data: suscripcion, error: suscripcionError }] =
    await Promise.all([
      client.from('cartas').select('*', { count: 'exact', head: true }).eq('usuario_id', user.id),
      client
        .from('suscripciones')
        .select(
          `
            plan_id,
            estado,
            planes (nombre, limite_cartas)
          `
        )
        .eq('usuario_id', user.id)
        .eq('estado', 'activo')
        .maybeSingle(),
    ])

  if (cartasError) throw cartasError
  if (suscripcionError) throw suscripcionError

  const plan = normalizarPlan(suscripcion?.planes)
  const total = totalCartas ?? 0

  return {
    userName,
    totalCartas: total,
    planActual: plan?.nombre || 'Gratis',
    limiteCartas: plan?.limite_cartas ?? 3,
    cantidadUsada: total,
  }
}
