import { NextResponse } from 'next/server'
import { obtenerUsuarioAutenticadoDesdeRequest } from '@/lib/serverAuth'
import { asegurarSuscripcionGratisUsuario } from '@/services/backend/suscripciones-admin.service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const user = await obtenerUsuarioAutenticadoDesdeRequest(request)
    const resultado = await asegurarSuscripcionGratisUsuario(user.id)

    return NextResponse.json({ ok: true, ...resultado })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo inicializar suscripcion.'
    return NextResponse.json({ ok: false, error: message }, { status: 401 })
  }
}
