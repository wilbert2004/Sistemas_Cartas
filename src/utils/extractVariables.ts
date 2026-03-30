export const extractVariables = (template: string): string[] => {
  if (!template) return []

  const regex = /\[([^\[\]]+)\]/g
  const resultados: string[] = []
  const vistos = new Set<string>()

  for (const match of template.matchAll(regex)) {
    const variable = match[1]?.trim()

    if (!variable || vistos.has(variable)) {
      continue
    }

    vistos.add(variable)
    resultados.push(variable)
  }

  return resultados
}
