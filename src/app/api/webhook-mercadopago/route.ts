import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const PLAN_PRO_ID = '727b8e67-1e00-45c2-9aab-6a8652e7fc92'
const PLAN_GRATIS_ID = 'f02a5d25-a431-48cf-aa34-f82a5ecf45f7'

const mapearEstado = (estadoPago: string): 'activo' | 'pendiente' | 'cancelado' => {
  if (estadoPago === 'approved') return 'activo'
  if (estadoPago === 'pending' || estadoPago === 'in_process') return 'pendiente'
  return 'cancelado'
}

const actualizarSuscripcion = async (params: {
  usuarioId: string
  planId: string
  estado: 'activo' | 'pendiente' | 'cancelado'
}) => {
  if (!supabaseAdmin) {
    throw new Error('Falta configurar SUPABASE_SERVICE_ROLE_KEY para procesar webhooks.')
  }

  const { error } = await supabaseAdmin.from('suscripciones').upsert(
    {
      usuario_id: params.usuarioId,
      plan_id: params.planId,
      estado: params.estado,
      fecha_inicio: new Date().toISOString(),
    },
    { onConflict: 'usuario_id' }
  )

  if (error) throw error
}

const procesarEventoPago = async (paymentId: string) => {
  const accessToken =
    process.env.MERCADOPAGO_ACCESS_TOKEN ?? process.env.MERCADO_PAGO_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error('Falta configurar MERCADOPAGO_ACCESS_TOKEN.')
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  const pago = (await response.json()) as {
    status?: string
    external_reference?: string
    metadata?: Record<string, unknown>
  }

  if (!response.ok) {
    throw new Error(`MercadoPago devolvio error al consultar pago ${paymentId}.`)
  }

  const usuarioId =
    (typeof pago.metadata?.usuario_id === 'string' && pago.metadata.usuario_id) ||
    pago.external_reference ||
    ''

  if (!usuarioId) {
    throw new Error('No se encontro usuario_id en el pago de MercadoPago.')
  }

  const planIdMetadata =
    typeof pago.metadata?.plan_id === 'string' ? pago.metadata.plan_id : PLAN_PRO_ID

  const estado = mapearEstado(pago.status ?? 'cancelled')
  const planId = estado === 'activo' || estado === 'pendiente' ? planIdMetadata : PLAN_GRATIS_ID

  await actualizarSuscripcion({
    usuarioId,
    planId,
    estado,
  })
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Webhook MercadoPago activo.' })
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url)
    const searchType = url.searchParams.get('type') ?? url.searchParams.get('topic')
    const searchPaymentId = url.searchParams.get('data.id')

    const body = (await request.json().catch(() => ({}))) as {
      type?: string
      action?: string
      data?: { id?: string }
    }

    const type = body.type ?? searchType ?? ''
    const paymentId = body.data?.id ?? searchPaymentId ?? ''

    if (type !== 'payment' || !paymentId) {
      return NextResponse.json({ ok: true, ignored: true })
    }

    await procesarEventoPago(paymentId)

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error procesando webhook.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
