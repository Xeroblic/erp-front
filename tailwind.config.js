const defaultTheme = require('tailwindcss/defaultTheme');

const dynamicColorPalette =
	'slate|gray|zinc|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|primary';
const dynamicShadeScale = '50|100|200|300|400|500|600|700|800|900|950';

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
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
					50: 'var(--color-primary-50)',
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
			pattern: new RegExp(`bg-(${dynamicColorPalette})-(${dynamicShadeScale})$`),
			variants: ['hover', 'active', 'checked', 'indeterminate'],
		},
		// bg-<color>-<shade>/<alpha>
		{
			pattern: new RegExp(`bg-(${dynamicColorPalette})-(${dynamicShadeScale})\/(10|15|20)$`),
			variants: ['hover', 'dark:hover'],
		},

		// border-<color>-<shade>
		{
			pattern: new RegExp(`border-(${dynamicColorPalette})-(${dynamicShadeScale})$`),
			variants: ['hover', 'active', 'dark:hover', 'peer-checked'],
		},
		// border-<color>-<shade>/<alpha>
		{
			pattern: new RegExp(`border-(${dynamicColorPalette})-(${dynamicShadeScale})\/(30|50)$`),
			variants: ['hover', 'active', 'dark:hover'],
		},

		// text-<color>-<shade>
		{
			pattern: new RegExp(`text-(${dynamicColorPalette})-(${dynamicShadeScale})$`),
			variants: ['hover', 'active', 'dark:hover'],
		},

		// ring-<color>-<shade>/<alpha> (usado en Calendar/TutorialModal)
		{
			pattern: new RegExp(
				`ring-(${dynamicColorPalette})-(${dynamicShadeScale})\/(30|40|50)$`,
			),
		},

		// shadow-<color>-<shade>/<alpha> (usado en Calendar)
		{
			pattern: new RegExp(`shadow-(${dynamicColorPalette})-(${dynamicShadeScale})\/(40)$`),
		},

		// stroke-<color>-<shade> (usado en FloatingInfo)
		{
			pattern: new RegExp(`stroke-(${dynamicColorPalette})-(${dynamicShadeScale})$`),
		},
	],
	plugins: [require('@tailwindcss/typography')],
	darkMode: 'class',
};
