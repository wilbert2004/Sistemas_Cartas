const normalizeKey = (key: string) =>
  key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const esCampoNombre = (key: string) => {
  const k = normalizeKey(key)
  return k.includes('nombre') || k.includes('apellido')
}

const esCampoEmpresa = (key: string) => normalizeKey(key).includes('empresa')
const esCampoPuesto = (key: string) => normalizeKey(key).includes('puesto')
const esCampoCorreo = (key: string) => {
  const k = normalizeKey(key)
  return k.includes('correo') || k.includes('email')
}

export const formatearValorCampoCarta = (key: string, value: string) => {
  const raw = value.trim()
  if (!raw) return ''

  if (esCampoNombre(key) || esCampoEmpresa(key) || esCampoPuesto(key)) {
    return titleCase(raw)
  }

  if (esCampoCorreo(key)) {
    return raw.toLowerCase()
  }

  return raw
}

export const formatearDatosCarta = (values: Record<string, string>) => {
  const resultado: Record<string, string> = {}

  for (const [key, value] of Object.entries(values)) {
    resultado[key] = formatearValorCampoCarta(key, value)
  }

  return resultado
}
