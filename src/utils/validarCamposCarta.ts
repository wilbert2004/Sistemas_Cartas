const normalizeKey = (key: string) =>
  key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const esCampoCorreo = (key: string) => {
  const k = normalizeKey(key)
  return k.includes('correo') || k.includes('email')
}

const esCampoTelefono = (key: string) => {
  const k = normalizeKey(key)
  return k.includes('telefono') || k.includes('celular') || k.includes('movil')
}

export type ValidacionResultado = {
  valido: boolean
  errores: Record<string, string>
}

export const validarCamposCarta = (
  variables: string[],
  values: Record<string, string>
): ValidacionResultado => {
  const errores: Record<string, string> = {}

  for (const variable of variables) {
    const valor = (values[variable] ?? '').trim()

    if (!valor) {
      errores[variable] = 'Este campo es obligatorio.'
      continue
    }

    if (esCampoCorreo(variable)) {
      const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
      if (!correoValido) {
        errores[variable] = 'Ingresa un correo valido.'
      }
    }

    if (esCampoTelefono(variable)) {
      const soloNumeros = valor.replace(/\D/g, '')
      if (soloNumeros.length < 7) {
        errores[variable] = 'Ingresa un telefono valido.'
      }
    }
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores,
  }
}
