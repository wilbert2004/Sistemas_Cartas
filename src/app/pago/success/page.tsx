import Link from 'next/link'

export default function PagoSuccessPage() {
    return (
        <main className="mx-auto max-w-2xl p-6">
            <section className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6">
                <h1 className="text-2xl font-bold text-emerald-800">Pago aprobado</h1>
                <p className="mt-2 text-sm text-emerald-700">
                    Recibimos tu pago. En breve se reflejara tu plan Pro cuando el webhook confirme la operacion.
                </p>
                <div className="mt-5">
                    <Link
                        href="/dashboard/suscripcion"
                        className="inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
                    >
                        Volver a suscripcion
                    </Link>
                </div>
            </section>
        </main>
    )
}
