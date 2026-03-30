import { supabase } from '@/lib/supabaseClient'
import type { Perfil, GuardarPerfilPayload } from '@/modules/perfil/types/perfil.types'

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

export const obtenerPerfilPorUsuarioId = async (usuarioId: string): Promise<Perfil | null> => {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('perfiles')
    .select('id, usuario_id, telefono, empresa, cargo, creado_en')
    .eq('usuario_id', usuarioId)
    .maybeSingle()

  if (error) throw error

  return (data as Perfil | null) ?? null
}

export const crearPerfilAutomatico = async (usuarioId: string): Promise<Perfil> => {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('perfiles')
    .insert([
      {
        usuario_id: usuarioId,
        telefono: null,
        empresa: null,
        cargo: null,
      },
    ])
    .select('id, usuario_id, telefono, empresa, cargo, creado_en')
    .single()

  if (error) {
    // Si ya existe (error de unique constraint), lo obtenemos
    if (error.code === '23505') {
      const perfil = await obtenerPerfilPorUsuarioId(usuarioId)
      if (perfil) return perfil
      throw new Error('Error al crear el perfil automático')
    }

    throw error
  }

  return data as Perfil
}

export const obtenerOCrearPerfil = async (usuarioId: string): Promise<Perfil> => {
  const perfil = await obtenerPerfilPorUsuarioId(usuarioId)

  if (perfil) {
    return perfil
  }

  return await crearPerfilAutomatico(usuarioId)
}

export const actualizarPerfil = async (
  usuarioId: string,
  payload: GuardarPerfilPayload
): Promise<Perfil> => {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('perfiles')
    .update({
      telefono: payload.telefono,
      empresa: payload.empresa,
      cargo: payload.cargo,
    })
    .eq('usuario_id', usuarioId)
    .select('id, usuario_id, telefono, empresa, cargo, creado_en')
    .single()

  if (error) throw error

  return data as Perfil
}
