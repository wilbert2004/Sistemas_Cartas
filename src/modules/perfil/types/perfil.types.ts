export type Perfil = {
  id: string
  usuario_id: string
  telefono: string | null
  empresa: string | null
  cargo: string | null
  creado_en: string
}

export type GuardarPerfilPayload = {
  telefono: string | null
  empresa: string | null
  cargo: string | null
}

export type UsePerfilReturn = {
  perfil: Perfil | null
  email: string | null
  loading: boolean
  error: string
  success: string
  guardando: boolean
  guardarCambios: (payload: GuardarPerfilPayload) => Promise<void>
  limpiarMensajeExito: () => void
}
