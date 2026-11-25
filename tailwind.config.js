/** @type {import('tailwindcss').Config} */
const c = (v) => `rgb(var(--${v}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        bg: c('bg'),
        surface: c('surface'),
        'surface-2': c('surface-2'),
        'surface-3': c('surface-3'),
        line: c('line'),
        ink: c('ink'),
        'ink-2': c('ink-2'),
        muted: c('muted'),
        accent: c('accent'),
        'accent-ink': c('accent-ink'),
        success: c('success'),
        warning: c('warning'),
        danger: c('danger'),
        info: c('info'),
        violet: c('violet'),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
      },
      borderRadius: { xl: '14px', '2xl': '18px', '3xl': '24px', '4xl': '32px' },
      boxShadow: {
        card: '0 1px 2px rgb(var(--shadow) / 0.04), 0 4px 16px -4px rgb(var(--shadow) / 0.06)',
        lift: '0 2px 4px rgb(var(--shadow) / 0.05), 0 16px 40px -12px rgb(var(--shadow) / 0.18)',
        cover: '0 1px 2px rgb(0 0 0 / 0.12), 0 8px 20px -6px rgb(0 0 0 / 0.28)',
        glow: '0 8px 24px -8px rgb(var(--accent) / 0.55)',
      },
      fontSize: { '2xs': ['11px', '14px'] },
      opacity: { 8: '0.08', 12: '0.12', 15: '0.15', 85: '0.85' },
      transitionTimingFunction: { spring: 'cubic-bezier(.2,.8,.2,1)' },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: { shimmer: 'shimmer 1.4s infinite' },
    },
  },
  plugins: [],
};
