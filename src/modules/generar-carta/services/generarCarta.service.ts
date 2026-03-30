import html2pdf from 'html2pdf.js'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { supabase } from '@/lib/supabaseClient'
import { formatearDatosCarta } from '@/utils/formatearCamposCarta'
import { asegurarEstructuraFormal, generarCarta } from '@/utils/generarCarta'
import { validarCamposCarta } from '@/utils/validarCamposCarta'
import type {
  FormDataMap,
  GenerarCartaResult,
  GuardarCartaPayload,
  TipoCarta,
} from '@/modules/generar-carta/types/generarCarta.types'

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local'
    )
  }

  return supabase
}

const getTiposCarta = async (): Promise<TipoCarta[]> => {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('tipos_carta')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) throw error

  return (data ?? []) as TipoCarta[]
}

const normalizarLimiteCartas = (raw: unknown): number => {
  if (raw === null || raw === undefined) return Number.POSITIVE_INFINITY

  const limite = Number(raw)

  if (!Number.isFinite(limite)) return Number.POSITIVE_INFINITY
  if (limite <= 0) return Number.POSITIVE_INFINITY

  return Math.trunc(limite)
}

const obtenerLimiteCartasUsuario = async (usuarioId: string) => {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('suscripciones')
    .select(
      `
        *,
        planes (limite_cartas)
      `
    )
    .eq('usuario_id', usuarioId)
    .eq('estado', 'activo')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('No se encontro una suscripcion activa para el usuario.')
    }

    throw error
  }

  const relacionPlan = Array.isArray(data?.planes) ? data.planes[0] : data?.planes
  return normalizarLimiteCartas(relacionPlan?.limite_cartas)
}

const validarLimiteCartasUsuario = async (usuarioId: string) => {
  const client = getSupabaseClient()

  const limiteCartas = await obtenerLimiteCartasUsuario(usuarioId)

  if (!Number.isFinite(limiteCartas)) {
    return
  }

  const { count, error } = await client
    .from('cartas')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId)

  if (error) throw error

  const cantidadActual = count ?? 0

  if (cantidadActual >= limiteCartas) {
    throw new Error(
      `Alcanzaste el limite de ${limiteCartas} cartas de tu suscripcion actual.`
    )
  }
}

const guardarCarta = async ({
  tipo_carta_id,
  titulo,
  contenido,
  datos_json,
  fecha_creacion,
}: {
  tipo_carta_id: string
  titulo: string
  contenido: string
  datos_json: Record<string, string>
  fecha_creacion?: string
}) => {
  const client = getSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser()

  if (userError) throw userError
  if (!user) {
    throw new Error('No hay una sesion activa para guardar la carta.')
  }

  await validarLimiteCartasUsuario(user.id)

  const payload = {
    usuario_id: user.id,
    tipo_carta_id,
    titulo,
    contenido,
    datos_json,
    fecha_creacion: fecha_creacion ?? new Date().toISOString(),
  }

  const { data, error } = await client.from('cartas').insert(payload).select().single()

  if (error) throw error

  return data
}

export const cargarTiposCarta = async (): Promise<TipoCarta[]> => {
  return getTiposCarta()
}

export const generarCartaDesdePlantilla = (
  plantillaBase: string,
  variables: string[],
  formData: FormDataMap
): { valido: boolean; errores: Record<string, string>; resultado?: GenerarCartaResult } => {
  const datosFormateados = formatearDatosCarta(formData)
  const validacion = validarCamposCarta(variables, datosFormateados)

  if (!validacion.valido) {
    return {
      valido: false,
      errores: validacion.errores,
    }
  }

  const cartaBase = generarCarta(plantillaBase, datosFormateados)
  const cartaFormal = asegurarEstructuraFormal(cartaBase, datosFormateados)

  return {
    valido: true,
    errores: {},
    resultado: {
      cartaFormal,
      datosFormateados,
    },
  }
}

export const guardarCartaGenerada = async ({
  tipoCartaId,
  titulo,
  contenido,
  datos,
}: GuardarCartaPayload) => {
  return guardarCarta({
    tipo_carta_id: tipoCartaId,
    titulo,
    contenido,
    datos_json: datos,
  })
}

export const exportarCartaPDF = async (resultadoCarta: string, nombreArchivo: string) => {
  const margenesPDF: [number, number, number, number] = [24, 24, 24, 24]

  const contenidoHTML = resultadoCarta
    .split('\n')
    .map((linea) => (linea.trim() ? escapeHtml(linea) : '&nbsp;'))
    .join('<br />')

  const plantillaExportacion = `
    <div style="
      background:#ffffff;
      color:#1f2937;
      font-family:'Times New Roman',serif;
      font-size:15px;
      line-height:1.9;
      padding:40px;
      white-space:normal;
    ">
      ${contenidoHTML}
    </div>
  `

  const opcionesPDF = {
    margin: margenesPDF,
    filename: `${nombreArchivo}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    },
    jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' as const },
  }

  await html2pdf().set(opcionesPDF).from(plantillaExportacion).save()
}

export const exportarCartaWord = async (resultadoCarta: string, nombreArchivo: string) => {
  const parrafos = resultadoCarta
    .split('\n')
    .map((linea) => new Paragraph({ children: [new TextRun(linea || ' ')] }))

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: parrafos,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${nombreArchivo}.docx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
