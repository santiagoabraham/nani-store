import { requireTenant } from '@/lib/tenant'
import { getProductsByTenant } from '@/lib/db/products'
import { ProductsTable } from '@/components/admin/ProductsTable'
import Link from 'next/link'

interface Props { params: { tenant: string } }

export default async function AdminProductsPage({ params }: Props) {
  const { tenant } = await requireTenant(params.tenant)
  const products = await getProductsByTenant(tenant.id)
  const base = `/${params.tenant}/admin`

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl text-gray-900 tracking-wider">PRODUCTOS</h1>
          <p className="font-body text-sm text-gray-500 mt-1">{products.length} productos</p>
        </div>
        <Link
          href={`${base}/products/new`}
          className="bg-[#029CDC] text-white font-heading tracking-wider text-sm px-6 py-3 hover:opacity-90 transition-opacity"
        >
          + NUEVO PRODUCTO
        </Link>
      </div>

      <ProductsTable products={products} tenantSlug={params.tenant} />
    </div>
  )
}
