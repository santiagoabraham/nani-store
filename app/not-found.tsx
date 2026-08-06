import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <p className="font-body text-carpi-red text-sm uppercase tracking-widest mb-4">Error 404</p>
      <h1 className="font-heading text-8xl text-carpi-ink tracking-wider mb-4">FUERA DE JUEGO</h1>
      <p className="font-body text-gray-400 mb-10 max-w-sm">
        La página que buscás no existe. Volvé al inicio y seguí explorando nuestra colección.
      </p>
      <Link href="/">
        <Button variant="primary" size="lg">VOLVER AL INICIO</Button>
      </Link>
    </div>
  )
}
