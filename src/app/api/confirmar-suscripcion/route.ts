import { NextResponse } from 'next/server'
import { obtenerUsuarioAutenticadoDesdeRequest } from '@/lib/serverAuth'
import { getMercadoPagoPublicKeyMode, resolveMercadoPagoAccessToken } from '@/lib/mercadopagoEnv'

type ConfirmarBody = {
  paymentId?: string
}

const mapearEstadoPago = (estadoPago: string) => {
  if (estadoPago === 'approved') return 'activo'
  if (estadoPago === 'pending' || estadoPago === 'in_process') return 'pendiente'
  return 'cancelado'
}

export async function POST(request: Request) {
  try {
    const user = await obtenerUsuarioAutenticadoDesdeRequest(request)

    const expectedMode = getMercadoPagoPublicKeyMode()
    const resolvedToken = resolveMercadoPagoAccessToken(expectedMode)
    const accessToken = resolvedToken?.token

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Falta MERCADOPAGO_ACCESS_TOKEN para confirmar pagos.' },
        { status: 500 }
      )
    }

    const body = (await request.json()) as ConfirmarBody
    const paymentIdDirecto = body.paymentId?.trim()

    const usuarioId = user.id

    let pago: {
      id?: number
      status?: string
      metadata?: Record<string, unknown>
      external_reference?: string
    } | null = null

    if (paymentIdDirecto) {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentIdDirecto}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      const data = (await response.json()) as {
        id?: number
        status?: string
        metadata?: Record<string, unknown>
        external_reference?: string
        message?: string
        error?: string
      }

      if (!response.ok) {
        return NextResponse.json(
          { error: data.message ?? data.error ?? 'No se pudo consultar el pago en MercadoPago.' },
          { status: 500 }
        )
      }

      pago = data
    } else {
      const searchUrl = new URL('https://api.mercadopago.com/v1/payments/search')
      searchUrl.searchParams.set('sort', 'date_created')
      searchUrl.searchParams.set('criteria', 'desc')
      searchUrl.searchParams.set('limit', '20')
      searchUrl.searchParams.set('external_reference', usuarioId)

      const response = await fetch(searchUrl.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      const data = (await response.json()) as {
        results?: Array<{
          id?: number
          status?: string
          metadata?: Record<string, unknown>
          external_reference?: string
        }>
        message?: string
        error?: string
      }

      if (!response.ok) {
        return NextResponse.json(
          { error: data.message ?? data.error ?? 'No se pudo consultar pagos en MercadoPago.' },
          { status: 500 }
        )
      }

      const pagos = data.results ?? []
      if (pagos.length === 0) {
        return NextResponse.json({ ok: false, estado: 'sin_pagos' }, { status: 404 })
      }

      const pagoAprobado = pagos.find((item) => item.status === 'approved')
      const pagoPendiente = pagos.find(
        (item) => item.status === 'pending' || item.status === 'in_process'
      )

      pago = pagoAprobado ?? pagoPendiente ?? pagos[0]
    }

    if (!pago) {
      return NextResponse.json({ ok: false, estado: 'sin_pagos' }, { status: 404 })
    }

    const usuarioIdPago =
      (typeof pago.metadata?.usuario_id === 'string' && pago.metadata.usuario_id) ||
      pago.external_reference ||
      ''

    if (usuarioIdPago && usuarioIdPago !== usuarioId) {
      return NextResponse.json(
        { error: 'El pago no corresponde al usuario autenticado.' },
        { status: 400 }
      )
    }

    const estado = mapearEstadoPago(pago.status ?? 'cancelled')

    return NextResponse.json({
      ok: true,
      estado,
      paymentId: pago.id ?? null,
      message:
        estado === 'activo'
          ? 'Pago aprobado. La suscripcion se actualiza exclusivamente desde el webhook.'
          : 'Pago aun no aprobado. La suscripcion no cambia desde este endpoint.',
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message?: unknown }).message)
          : 'Error confirmando suscripcion.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
