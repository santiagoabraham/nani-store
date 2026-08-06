import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'carpi-red':      '#029CDC',    // primary accent blue (Racing Club)
        'carpi-blue':     '#029CDC',    // secondary accent
        'carpi-navy':     '#00273E',    // primary dark blue
        'carpi-dark':     '#00273E',    // alias
        'carpi-ink':      '#0D0D0D',
        'carpi-charcoal': '#1A1A1A',
        'carpi-gray':     '#F5F5F5',
        'carpi-muted':    '#6B7280',
      },
      fontFamily: {
        heading: ['var(--font-bebas)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
      },
      keyframes: {
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
