export type TipoCarta = {
  id: string
  nombre: string
  plantilla_base: string
  [key: string]: unknown
}

export type FormDataMap = Record<string, string>

export type GuardarCartaPayload = {
  tipoCartaId: string
  titulo: string
  contenido: string
  datos: FormDataMap
}

export type GenerarCartaResult = {
  cartaFormal: string
  datosFormateados: FormDataMap
}

export type UseGeneradorCartaReturn = {
  tiposCarta: TipoCarta[]
  loadingTipos: boolean
  error: string
  tipoSeleccionadoId: string
  setTipoSeleccionadoId: (value: string) => void
  variables: string[]
  formData: FormDataMap
  erroresForm: Record<string, string>
  errorFormulario: string
  resultadoCarta: string
  guardando: boolean
  guardado: boolean
  mensajeGuardado: string
  errorGuardado: string
  descargandoPDF: boolean
  descargandoWord: boolean
  errorExportacion: string
  handleInputChange: (campo: string, valor: string) => void
  handleInputBlur: (campo: string) => void
  handleGenerar: () => void
  handleGuardarCarta: () => Promise<void>
  downloadPDF: () => Promise<void>
  downloadWord: () => Promise<void>
}
