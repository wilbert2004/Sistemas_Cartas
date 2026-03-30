'use client'

import { useMemo, useState } from 'react'
import {
    exportarCartaPDF,
    exportarCartaWord,
} from '@/modules/generar-carta/services/generarCarta.service'
import type { Carta } from '@/modules/cartas/types/cartas.types'

type CartaItemProps = {
    carta: Carta
    onEliminar: (id: string) => Promise<void>
    eliminando: boolean
}

const formatearFecha = (isoDate: string) => {
    if (!isoDate) return '-'

    return new Date(isoDate).toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const construirNombreArchivo = (titulo: string, fechaCreacion: string) => {
    const base = (titulo || 'carta')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s-_]/g, '')
        .trim()
        .replace(/\s+/g, '_')

    const fecha = fechaCreacion ? fechaCreacion.slice(0, 10) : ''
    return `${base || 'carta'}${fecha ? `_${fecha}` : ''}`
}

export default function CartaItem({ carta, onEliminar, eliminando }: CartaItemProps) {
    const [expandida, setExpandida] = useState(false)
    const [descargandoPDF, setDescargandoPDF] = useState(false)
    const [descargandoWord, setDescargandoWord] = useState(false)
    const [errorExportacion, setErrorExportacion] = useState('')

    const preview = useMemo(() => {
        if (!carta.contenido) return ''
        return carta.contenido.length > 180
            ? `${carta.contenido.slice(0, 180).trim()}...`
            : carta.contenido
    }, [carta.contenido])

    const nombreArchivo = useMemo(
        () => construirNombreArchivo(carta.titulo, carta.fecha_creacion),
        [carta.fecha_creacion, carta.titulo]
    )

    const handleDownloadPDF = async () => {
        setErrorExportacion('')
        setDescargandoPDF(true)

        try {
            await exportarCartaPDF(carta.contenido, nombreArchivo)
        } catch (err: unknown) {
            const mensaje =
                err instanceof Error ? err.message : 'No se pudo descargar la carta en PDF.'
            setErrorExportacion(mensaje)
        } finally {
            setDescargandoPDF(false)
        }
    }

    const handleDownloadWord = async () => {
        setErrorExportacion('')
        setDescargandoWord(true)

        try {
            await exportarCartaWord(carta.contenido, nombreArchivo)
        } catch (err: unknown) {
            const mensaje =
                err instanceof Error ? err.message : 'No se pudo descargar la carta en Word.'
            setErrorExportacion(mensaje)
        } finally {
            setDescargandoWord(false)
        }
    }

    const handleConfirmarEliminar = async () => {
        if (eliminando) return

        const confirmado = window.confirm(
            'Estas seguro de eliminar esta carta? Esta accion no se puede deshacer.'
        )

        if (!confirmado) return

        await onEliminar(carta.id)
    }

    return (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{carta.titulo}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatearFecha(carta.fecha_creacion)}</p>
                    {!expandida ? (
                        <p className="pt-1 text-sm text-slate-600 dark:text-slate-300">{preview}</p>
                    ) : null}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setExpandida((prev) => !prev)}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                    >
                        Ver
                    </button>

                    <button
                        onClick={handleConfirmarEliminar}
                        disabled={eliminando}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {eliminando ? 'Eliminando...' : 'Eliminar'}
                    </button>
                </div>
            </div>

            {expandida ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 transition-opacity">
                    <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                            <div>
                                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    {carta.titulo}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {formatearFecha(carta.fecha_creacion)}
                                </p>
                            </div>

                            <button
                                onClick={() => setExpandida(false)}
                                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="max-h-[calc(90vh-152px)] overflow-y-auto p-6">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-700 dark:bg-slate-950">
                                <pre className="whitespace-pre-wrap font-serif text-[15px] leading-8 text-slate-700 dark:text-slate-200">
                                    {carta.contenido}
                                </pre>
                            </div>

                            {errorExportacion ? (
                                <p className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/60 dark:bg-rose-500/15 dark:text-rose-100">
                                    {`❌ ${errorExportacion}`}
                                </p>
                            ) : null}
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
                            <button
                                onClick={handleDownloadPDF}
                                disabled={descargandoPDF}
                                className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {descargandoPDF ? 'Generando PDF...' : 'Descargar PDF'}
                            </button>

                            <button
                                onClick={handleDownloadWord}
                                disabled={descargandoWord}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
                            >
                                {descargandoWord ? 'Generando Word...' : 'Descargar Word'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </article>
    )
}
