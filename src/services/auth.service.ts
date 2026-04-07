import { supabase } from '@/lib/supabaseClient'
import type { Provider, User } from '@supabase/supabase-js'

const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local'
    )
  }

  return supabase
}

export type RegistroPayload = {
  email: string
  password: string
  nombre: string
}

export const obtenerSesion = async () => {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.getSession()

  if (error) throw error

  return data.session
}

export const obtenerUsuarioActual = async () => {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.getUser()

  if (error) throw error

  return data.user
}

export const esUsuarioGitHub = (user: User | null) => {
  if (!user) return false

  const provider = user.app_metadata?.provider
  return provider === 'github'
}

const guardarUsuarioEnTabla = async (payload: {
  id: string
  email: string
  nombre: string
}) => {
  const client = getSupabaseClient()

  const { error } = await client.from('usuarios').upsert(
    {
      id: payload.id,
      email: payload.email,
      nombre: payload.nombre,
      fecha_creacion: new Date().toISOString(),
    },
    {
      onConflict: 'id',
    }
  )

  if (error) throw error
}

const inicializarSuscripcionGratisBackend = async (accessToken?: string | null) => {
  if (!accessToken) {
    return
  }

  const response = await fetch('/api/suscripcion/inicializar', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean
    error?: string
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error ?? 'No se pudo inicializar la suscripcion gratis en backend.')
  }
}

const obtenerNombreDesdeMetadata = (user: User) => {
  const metadata = user.user_metadata as Record<string, unknown> | null

  const fullName = metadata?.full_name
  if (typeof fullName === 'string' && fullName.trim().length > 0) {
    return fullName.trim()
  }

  const userName = metadata?.user_name
  if (typeof userName === 'string' && userName.trim().length > 0) {
    return userName.trim()
  }

  const nombre = metadata?.nombre
  if (typeof nombre === 'string' && nombre.trim().length > 0) {
    return nombre.trim()
  }

  const name = metadata?.name
  if (typeof name === 'string' && name.trim().length > 0) {
    return name.trim()
  }

  const emailBase = user.email?.split('@')[0]?.trim()
  if (emailBase) return emailBase

  return 'Usuario'
}

export const sincronizarUsuarioAutenticado = async (user?: User) => {
  const client = getSupabaseClient()

  const usuarioAuth = user ?? (await obtenerUsuarioActual())
  if (!usuarioAuth?.id || !usuarioAuth.email) {
    return null
  }

  const payload = {
    id: usuarioAuth.id,
    email: usuarioAuth.email,
    nombre: obtenerNombreDesdeMetadata(usuarioAuth),
    fecha_creacion: new Date().toISOString(),
  }

  const { error } = await client.from('usuarios').upsert(payload, {
    onConflict: 'id',
  })

  if (error) throw error

  const {
    data: { session },
    error: sesionError,
  } = await client.auth.getSession()

  if (sesionError) throw sesionError

  await inicializarSuscripcionGratisBackend(session?.access_token)

  return payload
}

export const sincronizarUsuarioGitHub = async (user?: User) => {
  const usuario = user ?? (await obtenerUsuarioActual())

  if (!esUsuarioGitHub(usuario)) {
    return null
  }

  return sincronizarUsuarioAutenticado(usuario)
}

// REGISTRO
export const registrarUsuario = async ({
  email,
  password,
  nombre,
}: RegistroPayload) => {
  const client = getSupabaseClient()

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre,
      },
    },
  })

  if (error) throw error

  const userId = data.user?.id
  if (!userId) {
    throw new Error(
      'No se pudo obtener el ID del usuario. Verifica la configuracion de confirmacion por email en Supabase.'
    )
  }

  await guardarUsuarioEnTabla({
    id: userId,
    email,
    nombre,
  })

  await inicializarSuscripcionGratisBackend(data.session?.access_token)

  return data
}

// LOGIN
export const loginUsuario = async (email: string, password: string) => {
  const client = getSupabaseClient()

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  return data
}

export const loginConProveedor = async (proveedor: Provider) => {
  const client = getSupabaseClient()

  const { data, error } = await client.auth.signInWithOAuth({
    provider: proveedor,
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  })

  if (error) throw error

  return data
}

export const loginConGitHub = async () => {
  return loginConProveedor('github')
}

export const loginConGoogle = async () => {
  return loginConProveedor('google')
}

export const enviarCorreoRecuperacion = async (
  email: string,
  redirectTo?: string
) => {
  const client = getSupabaseClient()

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { data, error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo ?? `${baseUrl}/update-password`,
  })

  if (error) throw error

  return data
}

export const actualizarPasswordUsuario = async (nuevaPassword: string) => {
  const client = getSupabaseClient()

  if (nuevaPassword.trim().length < 6) {
    throw new Error('La nueva contrasena debe tener al menos 6 caracteres.')
  }

  const { data, error } = await client.auth.updateUser({
    password: nuevaPassword,
  })

  if (error) throw error

  return data
}

// LOGOUT
export const logoutUsuario = async () => {
  const client = getSupabaseClient()
  const { error } = await client.auth.signOut()
  if (error) throw error
}