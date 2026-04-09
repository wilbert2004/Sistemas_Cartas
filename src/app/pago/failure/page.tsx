import Link from 'next/link'

export default function PagoFailurePage() {
    return (
        <main className="mx-auto max-w-2xl p-6">
            <section className="rounded-2xl border border-rose-300 bg-rose-50 p-6">
                <h1 className="text-2xl font-bold text-rose-800">Pago no completado</h1>
                <p className="mt-2 text-sm text-rose-700">
                    El pago fue cancelado o rechazado. Puedes intentarlo de nuevo desde tu panel.
                </p>
                <div className="mt-5">
                    <Link
                        href="/dashboard/suscripcion"
                        className="inline-flex rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white"
                    >
                        Volver a suscripcion
                    </Link>
                </div>
            </section>
        </main>
    )
}
