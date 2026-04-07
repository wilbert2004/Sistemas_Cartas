import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type ConfirmarBody = {
  usuarioId?: string
  paymentId?: string
}

type EstadoSuscripcion = 'activo' | 'pendiente' | 'cancelado'

const PLAN_PRO_ID = '727b8e67-1e00-45c2-9aab-6a8652e7fc92'
const PLAN_GRATIS_ID = 'f02a5d25-a431-48cf-aa34-f82a5ecf45f7'

const mapearEstado = (estadoPago: string): EstadoSuscripcion => {
  if (estadoPago === 'approved') return 'activo'
  if (estadoPago === 'pending' || estadoPago === 'in_process') return 'pendiente'
  return 'cancelado'
}

const actualizarSuscripcion = async (params: {
  usuarioId: string
  planId: string
  estado: EstadoSuscripcion
}) => {
  if (!supabaseAdmin) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY para confirmar la suscripcion.')
  }

  const { data: existente, error: consultaError } = await supabaseAdmin
    .from('suscripciones')
    .select('id')
    .eq('usuario_id', params.usuarioId)
    .limit(1)

  if (consultaError) {
    throw new Error(`No se pudo consultar suscripcion actual: ${consultaError.message}`)
  }

  if ((existente?.length ?? 0) > 0) {
    const { error: updateError } = await supabaseAdmin
      .from('suscripciones')
      .update({
        plan_id: params.planId,
        estado: params.estado,
      })
      .eq('usuario_id', params.usuarioId)

    if (updateError) {
      throw new Error(`No se pudo actualizar suscripcion: ${updateError.message}`)
    }

    return
  }

  const { error: insertError } = await supabaseAdmin.from('suscripciones').insert({
    usuario_id: params.usuarioId,
    plan_id: params.planId,
    estado: params.estado,
    fecha_inicio: new Date().toISOString(),
  })

  if (insertError) {
    throw new Error(`No se pudo crear suscripcion: ${insertError.message}`)
  }
}

export async function POST(request: Request) {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN ?? process.env.MERCADO_PAGO_ACCESS_TOKEN

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Falta MERCADOPAGO_ACCESS_TOKEN para confirmar pagos.' },
        { status: 500 }
      )
    }

    const body = (await request.json()) as ConfirmarBody
    const usuarioId = body.usuarioId?.trim()
    const paymentIdDirecto = body.paymentId?.trim()

    if (!usuarioId) {
      return NextResponse.json({ error: 'usuarioId es requerido.' }, { status: 400 })
    }

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

    const estado = mapearEstado(pago.status ?? 'cancelled')
    const planIdMetadata =
      typeof pago.metadata?.plan_id === 'string' ? String(pago.metadata.plan_id) : PLAN_PRO_ID
    const planId = estado === 'activo' || estado === 'pendiente' ? planIdMetadata : PLAN_GRATIS_ID

    // No degradamos automaticamente a plan gratis por pagos rechazados de pruebas.
    // Si el usuario ya era Pro, conserva su plan hasta una accion explicita del negocio.
    if (estado === 'cancelado') {
      return NextResponse.json({
        ok: true,
        estado,
        planId: null,
        paymentId: pago.id ?? null,
      })
    }

    await actualizarSuscripcion({
      usuarioId,
      planId,
      estado,
    })

    return NextResponse.json({
      ok: true,
      estado,
      planId,
      paymentId: pago.id ?? null,
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
