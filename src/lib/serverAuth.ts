import { supabaseAdmin } from '@/lib/supabaseAdmin'

const getBearerToken = (request: Request) => {
  const authorization = request.headers.get('authorization')

  if (!authorization) {
    return ''
  }

  const [scheme, token] = authorization.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return ''
  }

  return token
}

export const obtenerUsuarioAutenticadoDesdeRequest = async (request: Request) => {
  if (!supabaseAdmin) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY para validar autenticacion en backend.')
  }

  const token = getBearerToken(request)

  if (!token) {
    throw new Error('Token de acceso no proporcionado.')
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token)

  if (error || !user?.id) {
    throw new Error('Sesion invalida o expirada.')
  }

  return user
}
