import { NextResponse } from 'next/server'
import { degradarSuscripcionesExpiradas } from '@/services/backend/suscripciones-admin.service'

export const dynamic = 'force-dynamic'

const validarSecretCron = (request: Request) => {
  const expected = process.env.CRON_SECRET

  if (!expected) {
    throw new Error('Falta configurar CRON_SECRET en el backend.')
  }

  const received = request.headers.get('x-cron-secret')

  if (!received || received !== expected) {
    throw new Error('No autorizado para ejecutar el cron de suscripciones.')
  }
}

const ejecutar = async (request: Request) => {
  validarSecretCron(request)

  const resultado = await degradarSuscripcionesExpiradas()

  return NextResponse.json({
    ok: true,
    actualizadas: resultado.actualizadas,
  })
}

export async function GET(request: Request) {
  try {
    return await ejecutar(request)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error ejecutando cron de expiracion.'
    const status = message.includes('No autorizado') ? 401 : 500
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
