import { NextResponse } from 'next/server'

type CrearSuscripcionBody = {
  usuarioId?: string
  planId?: string
}

const PLAN_PRO_ID = '727b8e67-1e00-45c2-9aab-6a8652e7fc92'
const PLAN_GRATIS_ID = 'f02a5d25-a431-48cf-aa34-f82a5ecf45f7'

export const dynamic = 'force-dynamic'

const getBaseUrl = (request: Request) => {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL
  if (fromEnv) return fromEnv

  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

export async function POST(request: Request) {
  try {
    const accessToken =
      process.env.MERCADOPAGO_ACCESS_TOKEN ?? process.env.MERCADO_PAGO_ACCESS_TOKEN

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Falta configurar MERCADOPAGO_ACCESS_TOKEN en el backend.' },
        { status: 500 }
      )
    }

    const body = (await request.json()) as CrearSuscripcionBody
    const usuarioId = body.usuarioId?.trim()
    const planId = body.planId?.trim()

    if (!usuarioId || !planId) {
      return NextResponse.json(
        { error: 'usuarioId y planId son requeridos.' },
        { status: 400 }
      )
    }

    if (planId === PLAN_GRATIS_ID) {
      return NextResponse.json(
        { error: 'El plan gratis no requiere pago en Checkout.' },
        { status: 400 }
      )
    }

    if (planId !== PLAN_PRO_ID) {
      return NextResponse.json(
        { error: 'Solo se permite checkout para el plan Pro.' },
        { status: 400 }
      )
    }

    const baseUrl = getBaseUrl(request)
    const usarHttpsPublica = /^https:\/\//i.test(baseUrl)

    const preferencePayload = {
      items: [
        {
          id: planId,
          title: 'Plan Pro - Generador de Cartas Profesionales',
          quantity: 1,
          currency_id: 'MXN',
          unit_price: 50,
        },
      ],
      metadata: {
        usuario_id: usuarioId,
        plan_id: planId,
      },
      external_reference: usuarioId,
    }

    if (usarHttpsPublica) {
      Object.assign(preferencePayload, {
        back_urls: {
          success: `${baseUrl}/dashboard/suscripcion?payment_status=success`,
          pending: `${baseUrl}/dashboard/suscripcion?payment_status=pending`,
          failure: `${baseUrl}/dashboard/suscripcion?payment_status=failure`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/webhook-mercadopago`,
      })
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferencePayload),
      cache: 'no-store',
    })

    const data = (await mpResponse.json()) as {
      id?: string
      init_point?: string
      sandbox_init_point?: string
      message?: string
      cause?: Array<{ code?: string; description?: string }>
      error?: string
    }

    if (!mpResponse.ok || !data.id) {
      const detalleCausa = data.cause?.map((item) => item.description ?? item.code).filter(Boolean).join(' | ')
      const detalle = detalleCausa || data.message || data.error || 'MercadoPago rechazo la preferencia.'

      return NextResponse.json(
        { error: `No se pudo crear la preferencia en MercadoPago. ${detalle}`, detail: data },
        { status: 500 }
      )
    }

    return NextResponse.json({
      preferenceId: data.id,
      initPoint: data.init_point ?? null,
      sandboxInitPoint: data.sandbox_init_point ?? null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado al crear suscripcion.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
