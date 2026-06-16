import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#050506',
        panel: 'rgba(255,255,255,0.07)',
        'panel-strong': 'rgba(255,255,255,0.12)',
        gold: {
          DEFAULT: '#D8A84E',
          light: '#FFE7A3',
          dark: '#9C7732',
        },
        // Theme accents — bound to CSS variables so they swap per event_type
        // (bat_mitzvah → magenta/purple, bar_mitzvah → royal/electric blue)
        magenta: 'rgb(var(--accent-rgb) / <alpha-value>)',
        purple: {
          neon: 'rgb(var(--accent-2-rgb) / <alpha-value>)',
        },
        muted: 'rgba(255,255,255,0.68)',
        danger: '#FF3B6B',
        success: '#47FFB2',
      },
      fontFamily: {
        sans: ['var(--font-heebo)', 'system-ui', 'sans-serif'],
        display: ['var(--font-rubik)', 'var(--font-heebo)', 'sans-serif'],
        // Editorial serif for hero headlines + final-screen marquee.
        // Falls back gracefully to the display sans so nothing breaks if the
        // Google font hasn't loaded yet.
        editorial: ['var(--font-editorial)', 'var(--font-rubik)', 'serif'],
        // Handcrafted Hebrew display — chips, winner labels, hero accents.
        accent: ['var(--font-accent)', 'var(--font-rubik)', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 40px rgba(216, 168, 78, 0.45), 0 0 80px rgba(216, 168, 78, 0.18)',
        'magenta-glow':
          '0 0 40px rgb(var(--accent-rgb) / 0.45), 0 0 100px rgb(var(--accent-2-rgb) / 0.25)',
        'panel': '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
        // Premium dimensional shadows — layered for real depth perception.
        // Pattern: ambient (large soft) + contact (small dark) + rim (top highlight).
        'depth-1':
          '0 1px 2px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)',
        'depth-2':
          '0 2px 4px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.45), 0 16px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)',
        'depth-3':
          '0 4px 8px rgba(0,0,0,0.5), 0 16px 32px rgba(0,0,0,0.55), 0 32px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
        'gold-rim':
          '0 0 0 1px rgba(255,231,163,0.35), 0 0 30px rgba(216,168,78,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #FFE7A3 0%, #D8A84E 45%, #9C7732 100%)',
        'magenta-gradient':
          'linear-gradient(135deg, rgb(var(--accent-rgb)) 0%, rgb(var(--accent-2-rgb)) 100%)',
        'stage-vignette':
          'radial-gradient(ellipse at center, rgb(var(--accent-rgb) / 0.08) 0%, rgba(5,5,6,1) 60%)',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'pulse-gold': 'pulseGold 2.4s ease-in-out infinite',
        'pop-in': 'popIn 0.5s cubic-bezier(0.18,0.89,0.32,1.28)',
        'fade-up': 'fadeUp 0.5s ease forwards',
        'beam': 'beam 6s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 30px rgba(216,168,78,0.4)' },
          '50%': { boxShadow: '0 0 60px rgba(216,168,78,0.8)' },
        },
        popIn: {
          '0%': { transform: 'scale(0.7) translateY(20px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        fadeUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        beam: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
