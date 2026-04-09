import Link from 'next/link'

export default function PagoPendingPage() {
    return (
        <main className="mx-auto max-w-2xl p-6">
            <section className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
                <h1 className="text-2xl font-bold text-amber-800">Pago pendiente</h1>
                <p className="mt-2 text-sm text-amber-700">
                    Mercado Pago reporto el pago como pendiente. Te avisaremos cuando se confirme.
                </p>
                <div className="mt-5">
                    <Link
                        href="/dashboard/suscripcion"
                        className="inline-flex rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white"
                    >
                        Volver a suscripcion
                    </Link>
                </div>
            </section>
        </main>
    )
}
