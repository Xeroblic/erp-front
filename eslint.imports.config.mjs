/**
 * Configuración mínima para `pnpm run lint:imports`: sólo valida las extensiones de los
 * imports. Es la que corre en el workflow «Calidad de PR».
 */

import { fixupPluginRules } from '@eslint/compat';
import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
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
	plugins: { import: fixupPluginRules(importPlugin) },
	settings: {
		'import/resolver': {
			typescript: {
				project: './tsconfig.eslint.json',
			},
		},
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
