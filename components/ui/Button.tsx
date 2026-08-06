import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'dark'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-heading tracking-widest transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-carpi-red focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-carpi-red text-white hover:opacity-90 active:scale-95': variant === 'primary',
            'border-2 border-carpi-red text-carpi-red hover:bg-carpi-red hover:text-white': variant === 'outline',
            'text-gray-700 hover:text-carpi-red hover:bg-gray-100': variant === 'ghost',
            'bg-carpi-ink text-white hover:bg-carpi-charcoal active:scale-95': variant === 'dark',
          },
          {
            'text-sm px-4 py-2': size === 'sm',
            'text-base px-6 py-3': size === 'md',
            'text-lg px-8 py-4': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
