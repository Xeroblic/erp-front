/**
 * Configuración mínima para `pnpm run lint:imports`: sólo valida las extensiones de los
 * imports. Es la que corre en el workflow «Calidad de PR».
 */

import { defineConfig } from 'eslint/config';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importX from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

import { archivosIgnorados } from './eslint.config.mjs';

export default defineConfig(archivosIgnorados, {
	name: 'zentria/imports',
	files: ['**/*.{js,jsx,ts,tsx}'],
	languageOptions: {
		parser: tseslint.parser,
		ecmaVersion: 'latest',
		sourceType: 'module',
		parserOptions: {
			ecmaFeatures: { jsx: true },
		},
	},
	// El mismo prefijo `import` que en `eslint.config.mjs`.
	plugins: { import: importX },
	settings: {
		'import-x/resolver-next': [
			createTypeScriptImportResolver({ project: './tsconfig.eslint.json' }),
		],
	},
	rules: {
		'import/extensions': [
			'error',
			'ignorePackages',
			{
				js: 'never',
				jsx: 'never',
				ts: 'never',
				tsx: 'never',
			},
		],
	},
});
