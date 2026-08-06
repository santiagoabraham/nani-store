import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect(`/${process.env.DEFAULT_TENANT_SLUG ?? 'my-store'}`)
}
