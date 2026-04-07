import { NextResponse } from 'next/server'
import { obtenerUsuarioAutenticadoDesdeRequest } from '@/lib/serverAuth'
import { getMercadoPagoPublicKeyMode } from '@/lib/mercadopagoEnv'
import { activarPlanProPorPagoAprobado } from '@/services/backend/suscripciones-admin.service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const user = await obtenerUsuarioAutenticadoDesdeRequest(request)
    const mode = getMercadoPagoPublicKeyMode()

    if (mode !== 'test') {
      return NextResponse.json(
        {
          ok: false,
          error:
            'La activacion de prueba solo esta disponible con credenciales TEST de MercadoPago.',
          mode,
        },
        { status: 400 }
      )
    }

    await activarPlanProPorPagoAprobado(user.id)

    return NextResponse.json({
      ok: true,
      estado: 'activo',
      message: 'Suscripcion Pro activada en modo prueba.',
      mode,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo activar Pro en modo prueba.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
