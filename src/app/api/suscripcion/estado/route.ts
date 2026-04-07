import { NextResponse } from 'next/server'
import { obtenerUsuarioAutenticadoDesdeRequest } from '@/lib/serverAuth'
import { obtenerSuscripcionVigenteUsuario } from '@/services/backend/suscripciones-admin.service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const user = await obtenerUsuarioAutenticadoDesdeRequest(request)
    const suscripcion = await obtenerSuscripcionVigenteUsuario(user.id)

    return NextResponse.json({ ok: true, suscripcion })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo validar la suscripcion.'
    return NextResponse.json({ ok: false, error: message }, { status: 401 })
  }
}
