import { useEffect, useMemo, useState } from 'react'
import { formatearValorCampoCarta } from '@/utils/formatearCamposCarta'
import { extractVariables } from '@/utils/extractVariables'
import {
  cargarTiposCarta,
  exportarCartaPDF,
  exportarCartaWord,
  generarCartaDesdePlantilla,
  guardarCartaGenerada,
} from '@/modules/generar-carta/services/generarCarta.service'
import type {
  FormDataMap,
  TipoCarta,
  UseGeneradorCartaReturn,
} from '@/modules/generar-carta/types/generarCarta.types'

export const useGeneradorCarta = (): UseGeneradorCartaReturn => {
  const [tiposCarta, setTiposCarta] = useState<TipoCarta[]>([])
  const [loadingTipos, setLoadingTipos] = useState(true)
  const [error, setError] = useState('')

  const [tipoSeleccionadoId, setTipoSeleccionadoId] = useState('')
  const [formData, setFormData] = useState<FormDataMap>({})
  const [erroresForm, setErroresForm] = useState<Record<string, string>>({})
  const [errorFormulario, setErrorFormulario] = useState('')
  const [resultadoCarta, setResultadoCarta] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [mensajeGuardado, setMensajeGuardado] = useState('')
  const [errorGuardado, setErrorGuardado] = useState('')
  const [descargandoPDF, setDescargandoPDF] = useState(false)
  const [descargandoWord, setDescargandoWord] = useState(false)
  const [errorExportacion, setErrorExportacion] = useState('')

  useEffect(() => {
    const cargarTipos = async () => {
      setLoadingTipos(true)
      setError('')

      try {
        const data = await cargarTiposCarta()
        setTiposCarta(data)
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'No se pudieron cargar los tipos de carta.'
        setError(message)
      } finally {
        setLoadingTipos(false)
      }
    }

    cargarTipos()
  }, [])

  const tipoSeleccionado = useMemo(
    () => tiposCarta.find((tipo) => String(tipo.id) === tipoSeleccionadoId),
    [tiposCarta, tipoSeleccionadoId]
  )

  const plantillaBase =
    typeof tipoSeleccionado?.plantilla_base === 'string' ? tipoSeleccionado.plantilla_base : ''

  const variables = useMemo(() => extractVariables(plantillaBase), [plantillaBase])

  useEffect(() => {
    const nuevoEstado: FormDataMap = {}

    for (const variable of variables) {
      nuevoEstado[variable] = formData[variable] ?? ''
    }

    setFormData(nuevoEstado)
    setErroresForm({})
    setErrorFormulario('')
    setResultadoCarta('')
    setGuardado(false)
    setMensajeGuardado('')
    setErrorGuardado('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoSeleccionadoId, variables.join('|')])

  const construirTituloCarta = () => {
    const nombreTipo =
      typeof tipoSeleccionado?.nombre === 'string' && tipoSeleccionado.nombre.trim()
        ? tipoSeleccionado.nombre.trim()
        : 'Carta'

    const empresa = (formData.empresa ?? '').trim()
    if (empresa) {
      return `${nombreTipo} - ${empresa}`
    }

    return `${nombreTipo} - ${new Date().toLocaleDateString('es-PE')}`
  }

  const construirNombreArchivo = () => {
    const titulo = construirTituloCarta()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .trim()
      .replace(/\s+/g, '_')

    return titulo || 'carta_generada'
  }

  const limpiarCartaActual = () => {
    const estadoLimpio: FormDataMap = {}

    for (const variable of variables) {
      estadoLimpio[variable] = ''
    }

    setFormData(estadoLimpio)
    setErroresForm({})
    setErrorFormulario('')
    setResultadoCarta('')
    setGuardado(false)
    setMensajeGuardado('')
    setErrorGuardado('')
    setErrorExportacion('')
  }

  const handleInputChange = (campo: string, valor: string) => {
    setFormData((prev) => ({
      ...prev,
      [campo]: valor,
    }))

    setErroresForm((prev) => {
      const siguiente = { ...prev }
      delete siguiente[campo]
      return siguiente
    })

    setErrorFormulario('')
    setGuardado(false)
    setMensajeGuardado('')
    setErrorGuardado('')
  }

  const handleInputBlur = (campo: string) => {
    setFormData((prev) => ({
      ...prev,
      [campo]: formatearValorCampoCarta(campo, prev[campo] ?? ''),
    }))
  }

  const handleGenerar = () => {
    if (!plantillaBase) return

    const salida = generarCartaDesdePlantilla(plantillaBase, variables, formData)

    setErroresForm(salida.errores)
    setErrorFormulario('')

    if (!salida.valido || !salida.resultado) {
      setErrorFormulario('Completa todos los campos obligatorios antes de generar la carta.')
      setResultadoCarta('')
      return
    }

    setFormData(salida.resultado.datosFormateados)
    setResultadoCarta(salida.resultado.cartaFormal)
    setGuardado(false)
    setMensajeGuardado('')
    setErrorGuardado('')
  }

  const handleGuardarCarta = async () => {
    if (!tipoSeleccionadoId || !resultadoCarta) {
      setErrorGuardado('Genera una carta antes de guardarla.')
      setMensajeGuardado('')
      return
    }

    setGuardando(true)
    setMensajeGuardado('')
    setErrorGuardado('')

    try {
      await guardarCartaGenerada({
        tipoCartaId: tipoSeleccionadoId,
        titulo: construirTituloCarta(),
        contenido: resultadoCarta,
        datos: formData,
      })

      setGuardado(true)
      setMensajeGuardado('Carta guardada correctamente')
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al guardar la carta.'
      setGuardado(false)
      setErrorGuardado(mensaje)
    } finally {
      setGuardando(false)
    }
  }

  const downloadPDF = async () => {
    if (!resultadoCarta) {
      setErrorExportacion('Genera una carta antes de descargar el PDF.')
      return
    }

    setErrorExportacion('')
    setDescargandoPDF(true)

    try {
      await exportarCartaPDF(resultadoCarta, construirNombreArchivo())
      limpiarCartaActual()
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo generar el PDF de la carta.'
      setErrorExportacion(mensaje)
    } finally {
      setDescargandoPDF(false)
    }
  }

  const downloadWord = async () => {
    if (!resultadoCarta) {
      setErrorExportacion('Genera una carta antes de descargar el archivo Word.')
      return
    }

    setErrorExportacion('')
    setDescargandoWord(true)

    try {
      await exportarCartaWord(resultadoCarta, construirNombreArchivo())
      limpiarCartaActual()
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo generar el archivo Word.'
      setErrorExportacion(mensaje)
    } finally {
      setDescargandoWord(false)
    }
  }

  return {
    tiposCarta,
    loadingTipos,
    error,
    tipoSeleccionadoId,
    setTipoSeleccionadoId,
    variables,
    formData,
    erroresForm,
    errorFormulario,
    resultadoCarta,
    guardando,
    guardado,
    mensajeGuardado,
    errorGuardado,
    descargandoPDF,
    descargandoWord,
    errorExportacion,
    handleInputChange,
    handleInputBlur,
    handleGenerar,
    handleGuardarCarta,
    downloadPDF,
    downloadWord,
  }
}
