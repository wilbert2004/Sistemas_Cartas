'use client'

import { useGeneradorCarta } from '@/modules/generar-carta/hooks/useGeneradorCarta'

const toLabel = (value: string) => {
    return value
        .replace(/[_-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^./, (char) => char.toUpperCase())
}

export default function GeneradorCartaView() {
    const {
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
    } = useGeneradorCarta()

    return (
        <section className="space-y-5">
            <header className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold tracking-widest text-cyan-700 uppercase dark:text-cyan-300">
                    Modulo
                </p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                    Generar cartas dinamicas
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Selecciona un tipo de carta, completa los campos detectados desde la plantilla y genera
                    el resultado final.
                </p>
            </header>

            <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
                <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Formulario dinamico
                    </h2>

                    {loadingTipos ? (
                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                            Cargando tipos de carta...
                        </p>
                    ) : null}

                    {error ? (
                        <p className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/60 dark:bg-rose-500/15 dark:text-rose-100">
                            {error}
                        </p>
                    ) : null}

                    {!loadingTipos ? (
                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    Tipo de carta
                                </label>
                                <select
                                    value={tipoSeleccionadoId}
                                    onChange={(e) => setTipoSeleccionadoId(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                >
                                    <option value="">Selecciona un tipo...</option>
                                    {tiposCarta.map((tipo) => (
                                        <option key={String(tipo.id)} value={String(tipo.id)}>
                                            {typeof tipo.nombre === 'string' && tipo.nombre.trim()
                                                ? tipo.nombre
                                                : `Tipo ${tipo.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {variables.length > 0 ? (
                                <div className="grid gap-3">
                                    {variables.map((variable) => (
                                        <div key={variable}>
                                            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                                {toLabel(variable)}
                                            </label>
                                            <input
                                                value={formData[variable] ?? ''}
                                                onChange={(e) => handleInputChange(variable, e.target.value)}
                                                onBlur={() => handleInputBlur(variable)}
                                                placeholder={`Ingresa ${toLabel(variable).toLowerCase()}`}
                                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                            />
                                            {erroresForm[variable] ? (
                                                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                                                    {erroresForm[variable]}
                                                </p>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            ) : tipoSeleccionadoId ? (
                                <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-400/50 dark:bg-amber-500/15 dark:text-amber-100">
                                    Esta plantilla no contiene variables entre corchetes.
                                </p>
                            ) : null}

                            <button
                                onClick={handleGenerar}
                                disabled={!tipoSeleccionadoId}
                                className="w-full cursor-pointer rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
                            >
                                Generar Carta
                            </button>

                            <button
                                onClick={handleGuardarCarta}
                                disabled={guardando || !resultadoCarta || !tipoSeleccionadoId}
                                className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                            >
                                {guardando ? 'Guardando...' : 'Guardar Carta'}
                            </button>

                            {errorFormulario ? (
                                <p className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/60 dark:bg-rose-500/15 dark:text-rose-100">
                                    {errorFormulario}
                                </p>
                            ) : null}

                            {mensajeGuardado ? (
                                <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-400/60 dark:bg-emerald-500/15 dark:text-emerald-100">
                                    {`✔ ${mensajeGuardado}`}
                                </p>
                            ) : null}

                            {errorGuardado ? (
                                <p className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/60 dark:bg-rose-500/15 dark:text-rose-100">
                                    {`❌ ${errorGuardado}`}
                                </p>
                            ) : null}
                        </div>
                    ) : null}
                </article>

                <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Preview</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        La carta final aparecera aqui con los placeholders reemplazados.
                    </p>

                    <div className="mt-4 min-h-105 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                        {resultadoCarta ? (
                            <div className="rounded-lg border border-slate-200 bg-white p-8 font-serif text-[15px] leading-8 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                                <pre className="whitespace-pre-wrap">{resultadoCarta}</pre>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 dark:text-slate-500">
                                Completa el formulario y presiona &quot;Generar Carta&quot;.
                            </p>
                        )}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <button
                            onClick={downloadPDF}
                            disabled={!resultadoCarta || !guardado || descargandoPDF}
                            className="w-full cursor-pointer rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {descargandoPDF ? 'Generando PDF...' : 'Descargar PDF'}
                        </button>

                        <button
                            onClick={downloadWord}
                            disabled={!resultadoCarta || !guardado || descargandoWord}
                            className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                        >
                            {descargandoWord ? 'Generando archivo...' : 'Descargar Word'}
                        </button>
                    </div>

                    {resultadoCarta ? (
                        <p
                            className={`mt-3 rounded-xl border px-3 py-2 text-sm ${guardado
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/60 dark:bg-emerald-500/15 dark:text-emerald-100'
                                    : 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-400/50 dark:bg-amber-500/15 dark:text-amber-100'
                                }`}
                        >
                            {guardado ? 'Carta guardada correctamente' : 'Guarda la carta para poder descargarla'}
                        </p>
                    ) : null}

                    {errorExportacion ? (
                        <p className="mt-3 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/60 dark:bg-rose-500/15 dark:text-rose-100">
                            {`❌ ${errorExportacion}`}
                        </p>
                    ) : null}
                </article>
            </div>
        </section>
    )
}
