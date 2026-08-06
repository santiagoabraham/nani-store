import { Star, Quote, BadgeCheck } from 'lucide-react'
import { reviews } from '@/lib/data'

export function Reviews() {
  return (
    <section className="py-20 bg-carpi-ink overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="font-body text-carpi-red text-sm uppercase tracking-widest mb-3">
            Opiniones verificadas
          </p>
          <h2 className="font-heading text-5xl sm:text-6xl text-white tracking-wider mb-4">
            LO QUE DICEN NUESTROS CLIENTES
          </h2>
          {/* Overall rating */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={20} className="text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="font-heading text-3xl text-white">4.9</span>
            <span className="font-body text-gray-400 text-sm">/ 5 — basado en 1.200+ reseñas</span>
          </div>
        </div>

        {/* Reviews grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white/5 border border-white/10 p-6 hover:border-carpi-red/40 transition-colors duration-300 relative group"
            >
              <Quote
                size={40}
                className="absolute top-4 right-4 text-white/5 group-hover:text-carpi-red/10 transition-colors"
              />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i < review.rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-600 fill-gray-600'
                    }
                  />
                ))}
              </div>

              <p className="font-body text-gray-300 text-sm leading-relaxed mb-5">
                &quot;{review.text}&quot;
              </p>

              {/* Reviewer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-carpi-navy flex items-center justify-center font-heading text-white text-lg border border-carpi-red/30">
                    {review.initials}
                  </div>
                  <div>
                    <p className="font-heading text-white text-base tracking-wide">
                      {review.name}
                    </p>
                    <p className="font-body text-gray-500 text-xs">{review.product}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {review.verified && (
                    <div className="flex items-center gap-1 text-emerald-500">
                      <BadgeCheck size={13} />
                      <span className="font-body text-xs">Verificado</span>
                    </div>
                  )}
                  <span className="font-body text-xs text-gray-500">{review.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="font-body text-gray-400 text-sm">
            ¿Ya compraste? Dejanos tu reseña y obtené{' '}
            <span className="text-carpi-red font-medium">10% OFF</span> en tu próximo pedido.
          </p>
        </div>
      </div>
    </section>
  )
}
