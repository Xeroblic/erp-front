const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Poppins', ...defaultTheme.fontFamily.sans] },
      backgroundImage: {
        chevronDown: '/src/assets/required/chevron-down.svg',
        chevronDownDark: '/src/assets/required/dark:chevron-down.svg',
      },
      transitionProperty: { margin: 'margin' },
      colors: {
        primary: {
          50:  'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
          950: 'var(--color-primary-950)',
        },
      },
    },
  },
  safelist: [
    // bg-<color>-<shade>
    {
      pattern: /bg-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|primary)-(50|100|200|300|400|500|600|700|800|900|950)$/,
      variants: ['hover','active','checked','indeterminate'],
    },
    // bg-<color>-<shade>/<alpha> (ajusta si ocupas más alphas)
    {
      pattern: /bg-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|primary)-(50|100|200|300|400|500|600|700|800|900|950)\/(10)$/,
    },

    // border-<color>-<shade>
    {
      pattern: /border-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|primary)-(50|100|200|300|400|500|600|700|800|900|950)$/,
      variants: ['hover','active','dark:hover','peer-checked'],
    },
    // border-<color>-<shade>/<alpha>
    {
      pattern: /border-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|primary)-(50|100|200|300|400|500|600|700|800|900|950)\/(50)$/,
      variants: ['hover','active'],
    },

    // text-<color>-<shade>
    {
      pattern: /text-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|primary)-(50|100|200|300|400|500|600|700|800|900|950)$/,
      variants: ['hover','active','dark:hover'],
    },

    // fill-<color>-<shade>
    {
      pattern: /fill-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|primary)-(50|100|200|300|400|500|600|700|800|900|950)$/,
      variants: ['hover','active'],
    },
    // fill-<color>-<shade>/<alpha>
    {
      pattern: /fill-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|primary)-(50|100|200|300|400|500|600|700|800|900|950)\/(75|80|90)$/,
      variants: ['hover','active'],
    },
  ],
  plugins: [require('@tailwindcss/typography')],
  darkMode: 'class',
};
