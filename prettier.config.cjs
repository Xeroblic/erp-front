const config = {
	plugins: ['prettier-plugin-tailwindcss'],
	// Tailwind 4 no tiene configuración JS: el plugin lee el tema desde la hoja principal.
	tailwindStylesheet: './src/styles/index.css',
	printWidth: 100,
	tabWidth: 4,
	useTabs: true,
	semi: true,
	singleQuote: true,
	jsxSingleQuote: true,
	trailingComma: 'all',
	bracketSameLine: true,
	arrowParens: 'always',
	endOfLine: 'lf',
};

module.exports = config;
