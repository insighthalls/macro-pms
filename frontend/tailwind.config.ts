import type { Config } from 'tailwindcss';

/**
 * MACRO PMS design tokens — extracted from the HTML prototype.
 * Brand blue #1F4E79, Plus Jakarta Sans for UI, JetBrains Mono for codes.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1F4E79',
          50:  '#EEF4FB',
          100: '#D7E5F2',
          200: '#A9C4DF',
          300: '#7BA3CC',
          400: '#4D82B9',
          500: '#1F4E79',
          600: '#1A4267',
          700: '#143654',
          800: '#0F2A41',
          900: '#091E2F',
        },
        ink: {
          DEFAULT: '#0E1726',
          muted: '#5B6678',
          soft:  '#8A95A8',
        },
        canvas: {
          DEFAULT: '#F6F7FB',
          card:    '#FFFFFF',
          rail:    '#0E1726',
        },
        line: {
          DEFAULT: '#E4E7EE',
          strong:  '#CBD2DD',
        },
        // Semantic
        ok:   { DEFAULT: '#15803D', soft: '#DCFCE7' },
        warn: { DEFAULT: '#B45309', soft: '#FEF3C7' },
        bad:  { DEFAULT: '#B91C1C', soft: '#FEE2E2' },
        info: { DEFAULT: '#1F4E79', soft: '#D7E5F2' },
        // Stage palette
        stage: {
          draft:    '#64748B',
          submit:   '#1F4E79',
          recommend:'#7C3AED',
          approve:  '#15803D',
          disburse: '#0F766E',
          liq:      '#B45309',
          done:     '#334155',
          returned: '#B91C1C',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', '14px'],
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
      },
      boxShadow: {
        card:  '0 1px 0 rgba(14,23,38,0.04), 0 1px 2px rgba(14,23,38,0.04)',
        rise:  '0 1px 0 rgba(14,23,38,0.04), 0 6px 16px rgba(14,23,38,0.08)',
        focus: '0 0 0 3px rgba(31,78,121,0.18)',
      },
      keyframes: {
        flash: {
          '0%':   { backgroundColor: '#FEF3C7' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      animation: {
        flash: 'flash 2.5s ease-out 1',
      },
    },
  },
  plugins: [],
};

export default config;
