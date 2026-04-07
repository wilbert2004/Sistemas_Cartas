import { supabaseAdmin } from '@/lib/supabaseAdmin'

export type EstadoSuscripcion = 'activo' | 'pendiente' | 'cancelado' | 'expirado'

export type PlanResumen = {
  id: string
  nombre: string
  limite_cartas: number
  precio: string
  activo: boolean
}

export type SuscripcionVigente = {
  usuario_id: string
  plan_id: string | null
  estado: EstadoSuscripcion | null
  fecha_inicio: string | null
  fecha_fin: string | null
  plan: PlanResumen | null
}

const getAdminClient = () => {
  if (!supabaseAdmin) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY para gestionar suscripciones en backend.')
  }

  return supabaseAdmin
}

const addMonths = (baseDate: Date, months: number) => {
  const nextDate = new Date(baseDate)
  nextDate.setMonth(nextDate.getMonth() + months)
  return nextDate
}

const obtenerPlanPorNombre = async (nombre: 'pro' | 'gratis') => {
  const client = getAdminClient()

  const { data, error } = await client
    .from('planes')
    .select('id, nombre, limite_cartas, precio, activo')
    .ilike('nombre', nombre)
    .eq('activo', true)
    .limit(1)

  if (error) {
    throw new Error(`No se pudo consultar el plan ${nombre}: ${error.message}`)
  }

  const plan = data?.[0]

  if (!plan?.id) {
    throw new Error(`No se encontro el plan ${nombre} activo en la base de datos.`)
  }

  return {
    id: String(plan.id),
    nombre: String(plan.nombre).toLowerCase(),
    limite_cartas: Number(plan.limite_cartas ?? 0),
    precio: String(plan.precio ?? '0'),
    activo: Boolean(plan.activo),
  } as PlanResumen
}

export const asegurarSuscripcionGratisUsuario = async (usuarioId: string) => {
  const client = getAdminClient()
  const planGratis = await obtenerPlanPorNombre('gratis')

  const { data: existente, error: consultaError } = await client
    .from('suscripciones')
    .select('usuario_id')
    .eq('usuario_id', usuarioId)
    .limit(1)

  if (consultaError) {
    throw new Error(`No se pudo consultar suscripcion existente: ${consultaError.message}`)
  }

  if ((existente?.length ?? 0) > 0) {
    return { creada: false }
  }

  const { error: insertError } = await client.from('suscripciones').insert({
    usuario_id: usuarioId,
    plan_id: planGratis.id,
    estado: 'activo',
    fecha_inicio: new Date().toISOString(),
    fecha_fin: null,
  })

  if ((insertError as { code?: string } | null)?.code === '23505') {
    return { creada: false }
  }

  if (insertError) {
    throw new Error(`No se pudo crear suscripcion gratis: ${insertError.message}`)
  }

  return { creada: true }
}

const obtenerSuscripcionRaw = async (usuarioId: string) => {
  const client = getAdminClient()

  const { data, error } = await client
    .from('suscripciones')
    .select(
      `
      usuario_id,
      plan_id,
      estado,
      fecha_inicio,
      fecha_fin,
      planes (id, nombre, limite_cartas, precio, activo)
    `
    )
    .eq('usuario_id', usuarioId)
    .maybeSingle()

  if (error) {
    throw new Error(`No se pudo obtener la suscripcion del usuario: ${error.message}`)
  }

  return data
}

const mapSuscripcion = (raw: unknown): SuscripcionVigente | null => {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const row = raw as {
    usuario_id?: string
    plan_id?: string | null
    estado?: EstadoSuscripcion | null
    fecha_inicio?: string | null
    fecha_fin?: string | null
    planes?:
      | {
          id?: string
          nombre?: string
          limite_cartas?: number
          precio?: string
          activo?: boolean
        }
      | Array<{
          id?: string
          nombre?: string
          limite_cartas?: number
          precio?: string
          activo?: boolean
        }>
      | null
  }

  const planRaw = Array.isArray(row.planes) ? row.planes[0] : row.planes
  const plan = planRaw?.id
    ? {
        id: String(planRaw.id),
        nombre: String(planRaw.nombre ?? '').toLowerCase(),
        limite_cartas: Number(planRaw.limite_cartas ?? 0),
        precio: String(planRaw.precio ?? '0'),
        activo: Boolean(planRaw.activo),
      }
    : null

  return {
    usuario_id: String(row.usuario_id ?? ''),
    plan_id: row.plan_id ?? null,
    estado: row.estado ?? null,
    fecha_inicio: row.fecha_inicio ?? null,
    fecha_fin: row.fecha_fin ?? null,
    plan,
  }
}

export const activarPlanProPorPagoAprobado = async (usuarioId: string) => {
  const client = getAdminClient()
  const planPro = await obtenerPlanPorNombre('pro')

  const fechaInicio = new Date()
  const fechaFin = addMonths(fechaInicio, 2)

  const payload = {
    usuario_id: usuarioId,
    plan_id: planPro.id,
    estado: 'activo',
    fecha_inicio: fechaInicio.toISOString(),
    fecha_fin: fechaFin.toISOString(),
  }

  const { data: updatedRows, error: updateError } = await client
    .from('suscripciones')
    .update(payload)
    .eq('usuario_id', usuarioId)
    .select('usuario_id')

  if (updateError) {
    throw new Error(`No se pudo activar plan Pro (update): ${updateError.message}`)
  }

  if ((updatedRows?.length ?? 0) > 0) {
    return
  }

  const { error: insertError } = await client.from('suscripciones').insert(payload)

  if (insertError) {
    throw new Error(`No se pudo activar plan Pro (insert): ${insertError.message}`)
  }
}

export const degradarSuscripcionesExpiradas = async () => {
  const client = getAdminClient()
  const planGratis = await obtenerPlanPorNombre('gratis')

  const ahoraIso = new Date().toISOString()

  const { data, error } = await client
    .from('suscripciones')
    .update({
      plan_id: planGratis.id,
      estado: 'expirado',
    })
    .lt('fecha_fin', ahoraIso)
    .eq('estado', 'activo')
    .select('usuario_id')

  if (error) {
    throw new Error(`No se pudieron degradar suscripciones expiradas: ${error.message}`)
  }

  return {
    actualizadas: data?.length ?? 0,
  }
}

export const degradarSuscripcionSiExpirada = async (usuarioId: string) => {
  const client = getAdminClient()
  const planGratis = await obtenerPlanPorNombre('gratis')
  const ahoraIso = new Date().toISOString()

  const { data, error } = await client
    .from('suscripciones')
    .update({
      plan_id: planGratis.id,
      estado: 'expirado',
    })
    .eq('usuario_id', usuarioId)
    .lt('fecha_fin', ahoraIso)
    .eq('estado', 'activo')
    .select('usuario_id')

  if (error) {
    throw new Error(`No se pudo validar expiracion de suscripcion: ${error.message}`)
  }

  return {
    degradada: (data?.length ?? 0) > 0,
  }
}

export const obtenerSuscripcionVigenteUsuario = async (usuarioId: string) => {
  await asegurarSuscripcionGratisUsuario(usuarioId)
  await degradarSuscripcionSiExpirada(usuarioId)

  const raw = await obtenerSuscripcionRaw(usuarioId)
  return mapSuscripcion(raw)
}
