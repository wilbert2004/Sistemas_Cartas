import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { activarPlanProPorPagoAprobado } from '@/services/backend/suscripciones-admin.service'

const parseSignatureHeader = (raw: string) => {
  const pairs = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  const bag: Record<string, string> = {}

  for (const pair of pairs) {
    const [key, value] = pair.split('=')
    if (!key || !value) continue
    bag[key.trim()] = value.trim()
  }

  return {
    ts: bag.ts ?? '',
    v1: bag.v1 ?? '',
  }
}

const hashSeguroIgual = (expected: string, received: string) => {
  const left = Buffer.from(expected, 'utf8')
  const right = Buffer.from(received, 'utf8')

  if (left.length !== right.length) {
    return false
  }

  return timingSafeEqual(left, right)
}

const validarFirmaWebhookMercadoPago = (request: Request, paymentId: string) => {
  const secret =
    process.env.MERCADOPAGO_WEBHOOK_SECRET ?? process.env.MERCADO_PAGO_WEBHOOK_SECRET

  if (!secret) {
    throw new Error('Falta configurar MERCADOPAGO_WEBHOOK_SECRET para validar webhook.')
  }

  const signatureHeader = request.headers.get('x-signature') ?? ''
  const requestId = request.headers.get('x-request-id') ?? ''

  if (!signatureHeader || !requestId) {
    return false
  }

  const { ts, v1 } = parseSignatureHeader(signatureHeader)

  if (!ts || !v1) {
    return false
  }

  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`
  const digest = createHmac('sha256', secret).update(manifest).digest('hex')

  return hashSeguroIgual(digest.toLowerCase(), v1.toLowerCase())
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
    typeof pago.metadata?.plan_id === 'string' ? pago.metadata.plan_id : ''

  if (pago.status === 'approved') {
    await activarPlanProPorPagoAprobado(usuarioId)
  }

  return {
    status: pago.status ?? 'unknown',
    usuarioId,
    planIdMetadata,
  }
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

    if (!validarFirmaWebhookMercadoPago(request, paymentId)) {
      return NextResponse.json({ ok: false, error: 'Firma webhook invalida.' }, { status: 401 })
    }

    const resultado = await procesarEventoPago(paymentId)

    return NextResponse.json({ ok: true, ...resultado })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error procesando webhook.'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
