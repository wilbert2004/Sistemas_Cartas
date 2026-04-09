import { NextResponse } from 'next/server'
import { obtenerUsuarioAutenticadoDesdeRequest } from '@/lib/serverAuth'
import { getBaseUrl } from '@/lib/getBaseUrl'
import { getMercadoPagoPublicKeyMode, resolveMercadoPagoAccessToken } from '@/lib/mercadopagoEnv'

type CreatePreferenceBody = {
  planCode?: 'pro'
}

const PLAN_PRO = {
  code: 'pro',
  title: 'Plan Pro - Generador de Cartas',
  unitPrice: 100,
} as const

export const dynamic = 'force-dynamic'

const normalizarBaseUrl = (url: string) => url.trim().replace(/\/+$/, '')

const validarUrlAbsoluta = (value: string, fieldName: string) => {
  if (!value || !value.trim()) {
    throw new Error(`La URL ${fieldName} es obligatoria y no puede estar vacia.`)
  }

  try {
    const parsed = new URL(value)
    if (!parsed.protocol || !parsed.host) {
      throw new Error(`La URL ${fieldName} no es valida.`)
    }
  } catch {
    throw new Error(`La URL ${fieldName} no es valida.`)
  }
}

const construirBackUrls = (baseUrl: string) => {
  const backUrls = {
    success: `${baseUrl}/pago/success`,
    failure: `${baseUrl}/pago/failure`,
    pending: `${baseUrl}/pago/pending`,
  }

  validarUrlAbsoluta(backUrls.success, 'back_urls.success')
  validarUrlAbsoluta(backUrls.failure, 'back_urls.failure')
  validarUrlAbsoluta(backUrls.pending, 'back_urls.pending')

  return backUrls
}

const shouldEnableAutoReturn = (url: string) => {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    const isLocalHost = host === 'localhost' || host === '127.0.0.1'
    return parsed.protocol === 'https:' && !isLocalHost
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const expectedMode = getMercadoPagoPublicKeyMode()
  const resolvedToken = resolveMercadoPagoAccessToken(expectedMode)
  const mpMode = resolvedToken?.mode ?? 'unknown'
  const accessTokenSource = resolvedToken?.source ?? 'unknown'
  const walletOnlyInTest = process.env.MP_TEST_WALLET_ONLY !== 'false'

  try {
    const user = await obtenerUsuarioAutenticadoDesdeRequest(request)
    const accessToken = resolvedToken?.token

    if (!accessToken) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Falta configurar MP_ACCESS_TOKEN o MERCADOPAGO_ACCESS_TOKEN en backend.',
          mpMode,
          accessTokenSource,
        },
        { status: 500 }
      )
    }

    if (expectedMode !== 'unknown' && expectedMode !== mpMode) {
      return NextResponse.json(
        {
          ok: false,
          error: `Credenciales de Mercado Pago desalineadas. Public key: ${expectedMode}, access token: ${mpMode}.`,
          mpMode,
          expectedMode,
          accessTokenSource,
        },
        { status: 500 }
      )
    }

    const body = (await request.json()) as CreatePreferenceBody

    if (body.planCode && body.planCode !== PLAN_PRO.code) {
      return NextResponse.json(
        { ok: false, error: 'planCode invalido. Solo se permite pro.' },
        { status: 400 }
      )
    }

    const baseUrl = normalizarBaseUrl(process.env.NEXT_PUBLIC_SITE_URL?.trim() || getBaseUrl(request))
    const backUrls = construirBackUrls(baseUrl)

    const preferencePayload: Record<string, unknown> = {
      items: [
        {
          id: PLAN_PRO.code,
          title: PLAN_PRO.title,
          quantity: 1,
          currency_id: 'MXN',
          unit_price: PLAN_PRO.unitPrice,
        },
      ],
      metadata: {
        usuario_id: user.id,
        plan_code: PLAN_PRO.code,
      },
      external_reference: user.id,
      back_urls: backUrls,
    }

    // Evita el card-form en sandbox cuando hay errores intermitentes de Secure Fields.
    if (mpMode === 'test' && walletOnlyInTest) {
      preferencePayload.purpose = 'wallet_purchase'
    }

    const autoReturnEnabled = shouldEnableAutoReturn(backUrls.success)
    const canUseWebhookUrl = shouldEnableAutoReturn(baseUrl)

    if (autoReturnEnabled) {
      preferencePayload.auto_return = 'approved'
    }

    if (canUseWebhookUrl) {
      preferencePayload.notification_url = `${baseUrl}/api/webhook-mercadopago`
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
      const detalle = detalleCausa || data.message || data.error || 'Mercado Pago rechazo la preferencia.'

      return NextResponse.json(
        {
          ok: false,
          error: `No se pudo crear la preferencia. ${detalle}`,
          detail: data,
          debug: {
            baseUrl,
            backUrls,
            autoReturnEnabled,
            canUseWebhookUrl,
            walletOnlyInTest,
            appliedPurpose: preferencePayload.purpose ?? null,
          },
          mpMode,
          expectedMode,
          accessTokenSource,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      preferenceId: data.id,
      initPoint: data.init_point ?? null,
      sandboxInitPoint: data.sandbox_init_point ?? null,
      debug: {
        baseUrl,
        backUrls,
        autoReturnEnabled,
        canUseWebhookUrl,
        walletOnlyInTest,
        appliedPurpose: preferencePayload.purpose ?? null,
      },
      mpMode,
      expectedMode,
      accessTokenSource,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado al crear preferencia.'

    return NextResponse.json(
      {
        ok: false,
        error: message,
        mpMode,
        expectedMode,
        accessTokenSource,
      },
      { status: 500 }
    )
  }
}
