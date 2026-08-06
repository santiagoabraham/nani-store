import { requireTenant } from '@/lib/tenant'
import { getCouponsByTenant } from '@/lib/db/coupons'
import { CouponsManager } from '@/components/admin/CouponsManager'

interface Props { params: { tenant: string } }

export default async function AdminCouponsPage({ params }: Props) {
  const { tenant } = await requireTenant(params.tenant)
  const coupons = await getCouponsByTenant(tenant.id)

  return (
    <div className="p-8">
      <h1 className="font-heading text-4xl text-gray-900 tracking-wider mb-8">CUPONES</h1>
      <CouponsManager
        initialCoupons={coupons}
        tenantSlug={params.tenant}
      />
    </div>
  )
}
