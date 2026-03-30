export default function PerfilPage() {
    return (
        <section className="space-y-4">
            <header className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold tracking-widest text-cyan-700 uppercase dark:text-cyan-300">Modulo</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">Perfil</h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Actualiza tus datos de cuenta, informacion de contacto y preferencias.
                </p>
            </header>

            <article className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                Formulario de perfil pendiente: nombre, email y configuraciones del usuario.
            </article>
        </section>
    )
}
