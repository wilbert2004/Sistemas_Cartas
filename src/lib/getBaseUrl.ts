/**
 * Construye la URL base del sitio de forma segura
 * - En cliente (browser): usa window.location.origin
 * - En servidor/SSR: usa NEXT_PUBLIC_SITE_URL o extrae del request
 *
 * @param request - Request opcional del servidor Next.js
 * @returns URL base completa (ej: http://localhost:3000 o https://sistemas-cartas.vercel.app)
 */
export const getBaseUrl = (request?: Request): string => {
  // En ambiente cliente
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // En servidor, priorizamos el host real del request para evitar
  // callbacks/webhooks apuntando a localhost por una variable mal configurada.
  if (request) {
    const url = new URL(request.url)
    return `${url.protocol}//${url.host}`
  }

  // Fallback por variable de entorno (cuando no hay request disponible)
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    return process.env.NEXT_PUBLIC_SITE_URL.trim()
  }

  // Fallback comun en Vercel
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim()}`
  }

  // Fallback (debe evitarse en producción)
  return 'http://localhost:3000'
}
