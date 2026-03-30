const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const generarCarta = (
  template: string,
  values: Record<string, string>
): string => {
  if (!template) return ''

  let resultado = template

  for (const [key, rawValue] of Object.entries(values)) {
    const valor = rawValue ?? ''
    const placeholder = new RegExp(`\\[${escapeRegex(key)}\\]`, 'g')
    resultado = resultado.replace(placeholder, valor)
  }

  return resultado
}

export const asegurarEstructuraFormal = (
  carta: string,
  values: Record<string, string>
) => {
  const contenido = carta.trim()
  if (!contenido) return ''

  const tieneSaludo = /estimad|senor|señor|cordial saludo/i.test(contenido)
  const tieneCierre = /atentamente|cordialmente|saludos cordiales/i.test(contenido)

  const nombre =
    values.nombre ?? values.NOMBRE ?? values['nombre completo'] ?? 'Nombre del remitente'

  let resultado = contenido

  if (!tieneSaludo) {
    resultado = `Estimado/a destinatario:\n\n${resultado}`
  }

  if (!tieneCierre) {
    resultado = `${resultado}\n\nAtentamente,\n${nombre}`
  }

  return resultado
}
