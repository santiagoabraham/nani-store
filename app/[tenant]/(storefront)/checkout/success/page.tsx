import Link from 'next/link'
import { Check, Clock } from 'lucide-react'
import { requireTenant } from '@/lib/tenant'
import { getOrderById } from '@/lib/db/orders'
import { Button } from '@/components/ui/Button'

interface Props {
  params: { tenant: string }
  searchParams: { order?: string; pending?: string }
}

export default async function CheckoutSuccessPage({ params, searchParams }: Props) {
  const { tenant } = await requireTenant(params.tenant)

  // MercadoPago redirects here with ?order=<uuid>&pending=1 (pending) or without pending (approved)
  const orderId = searchParams.order
  const isPending = searchParams.pending === '1'

  const order = orderId ? await getOrderById(orderId, tenant.id) : null

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-heading text-2xl tracking-wider text-gray-400">PEDIDO NO ENCONTRADO</p>
        <Link href={`/${tenant.slug}`}>
          <Button variant="primary">VOLVER AL INICIO</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className={`w-16 h-16 flex items-center justify-center rounded-full ${isPending ? 'bg-amber-400' : 'bg-emerald-500'}`}>
        {isPending ? <Clock size={32} className="text-white" /> : <Check size={32} className="text-white" />}
      </div>

      <div>
        {isPending ? (
          <>
            <h1 className="font-heading text-4xl text-gray-900 tracking-wider">PAGO EN PROCESO</h1>
            <p className="font-body text-gray-500 mt-2">
              Tu pedido <strong>{order.number}</strong> fue recibido. El pago está siendo procesado.
            </p>
            <p className="font-body text-gray-400 text-sm mt-1">
              Te notificaremos por email cuando se confirme.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-heading text-4xl text-gray-900 tracking-wider">¡PEDIDO CONFIRMADO!</h1>
            <p className="font-body text-gray-500 mt-2">
              Tu pedido <strong>{order.number}</strong> fue recibido y el pago fue acreditado.
            </p>
            <p className="font-body text-gray-400 text-sm mt-1">
              Recibirás un email de confirmación en <strong>{order.customer_email}</strong>.
            </p>
          </>
        )}
      </div>

      <Link href={`/${tenant.slug}`}>
        <Button variant="primary" size="lg">SEGUIR COMPRANDO</Button>
      </Link>
    </div>
  )
}
