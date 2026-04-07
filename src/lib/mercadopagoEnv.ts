export type MercadoPagoMode = 'live' | 'test' | 'unknown'

type TokenCandidate = {
  name: string
  value: string
  mode: MercadoPagoMode
}

const detectMode = (value?: string | null): MercadoPagoMode => {
  const token = value?.trim() ?? ''

  if (!token) return 'unknown'
  if (token.startsWith('APP_USR-')) return 'live'
  if (token.startsWith('TEST-')) return 'test'

  return 'unknown'
}

export const getMercadoPagoPublicKeyMode = (): MercadoPagoMode => {
  const publicKey =
    process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ??
    process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ??
    ''

  return detectMode(publicKey)
}

export const resolveMercadoPagoAccessToken = (
  preferredMode?: MercadoPagoMode
): { token: string; mode: MercadoPagoMode; source: string } | null => {
  const candidates: TokenCandidate[] = [
    {
      name: 'MERCADOPAGO_ACCESS_TOKEN',
      value: process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() ?? '',
      mode: detectMode(process.env.MERCADOPAGO_ACCESS_TOKEN),
    },
    {
      name: 'MERCADO_PAGO_ACCESS_TOKEN',
      value: process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim() ?? '',
      mode: detectMode(process.env.MERCADO_PAGO_ACCESS_TOKEN),
    },
  ].filter((item) => item.value.length > 0)

  if (candidates.length === 0) {
    return null
  }

  if (preferredMode && preferredMode !== 'unknown') {
    const byPreferredMode = candidates.find((item) => item.mode === preferredMode)
    if (byPreferredMode) {
      return {
        token: byPreferredMode.value,
        mode: byPreferredMode.mode,
        source: byPreferredMode.name,
      }
    }
  }

  const fallback = candidates[0]
  return {
    token: fallback.value,
    mode: fallback.mode,
    source: fallback.name,
  }
}
