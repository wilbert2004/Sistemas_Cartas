export type Carta = {
  id: string
  titulo: string
  contenido: string
  datos_json: Record<string, unknown> | null
  fecha_creacion: string
  tipo_carta_id: string
}

export type UseCartasReturn = {
  cartas: Carta[]
  loading: boolean
  error: string
  eliminarLoadingId: string | null
  eliminarCarta: (id: string) => Promise<void>
  recargarCartas: () => Promise<void>
}
