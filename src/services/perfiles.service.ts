import { supabase } from '@/lib/supabaseClient'

export type PerfilFormulario = {
  telefono: string | null
  empresa: string | null
  cargo: string | null
}

export type GuardarPerfilInput = PerfilFormulario & {
  usuario_id: string
}

const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local')
  }

  return supabase
}

const normalizarTexto = (valor: string | null | undefined) => {
  if (!valor) return null

  const limpio = valor.trim()
  return limpio.length > 0 ? limpio : null
}

export const obtenerPerfil = async (usuario_id: string): Promise<PerfilFormulario | null> => {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('perfiles')
    .select('telefono, empresa, cargo')
    .eq('usuario_id', usuario_id)
    .maybeSingle()

  if (error) throw error

  if (!data) return null

  return {
    telefono: data.telefono ?? null,
    empresa: data.empresa ?? null,
    cargo: data.cargo ?? null,
  }
}

export const guardarPerfil = async (perfil: GuardarPerfilInput): Promise<PerfilFormulario> => {
  const client = getSupabaseClient()

  const payload = {
    usuario_id: perfil.usuario_id,
    telefono: normalizarTexto(perfil.telefono),
    empresa: normalizarTexto(perfil.empresa),
    cargo: normalizarTexto(perfil.cargo),
  }

  const { data, error } = await client
    .from('perfiles')
    .upsert(payload, { onConflict: 'usuario_id' })
    .select('telefono, empresa, cargo')
    .single()

  if (error) throw error

  return {
    telefono: data.telefono ?? null,
    empresa: data.empresa ?? null,
    cargo: data.cargo ?? null,
  }
}