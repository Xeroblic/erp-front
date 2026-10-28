/**
 * Configuración plana de ESLint (ESLint 10 ya no lee `.eslintrc*` ni `.eslintignore`).
 *
 * Reproduce la configuración anterior: Airbnb + reglas de TypeScript + Prettier, con las
 * mismas reglas propias del proyecto. Airbnb no publica configuración plana, así que se
 * carga con `FlatCompat`, y sus plugins se envuelven con `fixupConfigRules` porque usan
 * métodos de `context` que ESLint 10 eliminó.
 */

import { fixupConfigRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import airbnbBestPractices from 'eslint-config-airbnb-base/rules/best-practices';
import airbnbVariables from 'eslint-config-airbnb-base/rules/variables';
import airbnbES6 from 'eslint-config-airbnb-base/rules/es6';
import airbnbImports from 'eslint-config-airbnb-base/rules/imports';
import airbnbStyle from 'eslint-config-airbnb-base/rules/style';
import prettierConfig from 'eslint-config-prettier/flat';
import prettierPlugin from 'eslint-plugin-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

// Patrones de devDependencies de Airbnb, duplicados con extensión TypeScript.
const devDependenciesTs = airbnbImports.rules[
	'import/no-extraneous-dependencies'
][1].devDependencies.flatMap((patron) => {
	const conTs = patron.replace(/\bjs(x?)\b/g, 'ts$1');
	return conTs === patron ? [patron] : [patron, conTs];
});

/**
 * Lo que aportaba `eslint-config-airbnb-typescript`, que quedó archivado sin soporte para
 * typescript-eslint 8. Se omiten las reglas de formato (`brace-style`, `indent`, `quotes`,
 * etc.): typescript-eslint 8 las eliminó y `eslint-config-prettier` las apagaba de todos
 * modos. La excepción es `lines-between-class-members`, que Prettier no cubre y pasa a
 * `@stylistic`. `no-throw-literal` pasa a llamarse `only-throw-error` en typescript-eslint 8.
 */
const airbnbTypescript = {
	name: 'zentria/airbnb-typescript',
	plugins: { '@stylistic': stylistic },
	settings: {
		'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx', '.d.ts'] },
		'import/resolver': {
			node: { extensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx', '.d.ts'] },
		},
		'import/extensions': ['.js', '.mjs', '.jsx', '.ts', '.tsx', '.d.ts'],
		'import/external-module-folders': ['node_modules', 'node_modules/@types'],
	},
	rules: {
		camelcase: 'off',
		'@typescript-eslint/naming-convention': [
			'error',
			{ selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE'] },
			{ selector: 'function', format: ['camelCase', 'PascalCase'] },
			{ selector: 'typeLike', format: ['PascalCase'] },
		],
		'default-param-last': 'off',
		'@typescript-eslint/default-param-last': airbnbBestPractices.rules['default-param-last'],
		'dot-notation': 'off',
		'@typescript-eslint/dot-notation': airbnbBestPractices.rules['dot-notation'],
		'no-array-constructor': 'off',
		'@typescript-eslint/no-array-constructor': airbnbStyle.rules['no-array-constructor'],
		'no-dupe-class-members': 'off',
		'@typescript-eslint/no-dupe-class-members': airbnbES6.rules['no-dupe-class-members'],
		'no-empty-function': 'off',
		'@typescript-eslint/no-empty-function': airbnbBestPractices.rules['no-empty-function'],
		'no-implied-eval': 'off',
		'no-new-func': 'off',
		'@typescript-eslint/no-implied-eval': airbnbBestPractices.rules['no-implied-eval'],
		'no-loop-func': 'off',
		'@typescript-eslint/no-loop-func': airbnbBestPractices.rules['no-loop-func'],
		'no-magic-numbers': 'off',
		'@typescript-eslint/no-magic-numbers': airbnbBestPractices.rules['no-magic-numbers'],
		'no-redeclare': 'off',
		'@typescript-eslint/no-redeclare': airbnbBestPractices.rules['no-redeclare'],
		'no-shadow': 'off',
		'@typescript-eslint/no-shadow': airbnbVariables.rules['no-shadow'],
		'no-throw-literal': 'off',
		'@typescript-eslint/only-throw-error': airbnbBestPractices.rules['no-throw-literal'],
		'no-unused-expressions': 'off',
		'@typescript-eslint/no-unused-expressions':
			airbnbBestPractices.rules['no-unused-expressions'],
		'no-unused-vars': 'off',
		// ESLint 9 y typescript-eslint 8 cambiaron `caughtErrors` a `'all'` por defecto; se fija
		// el valor anterior para no empezar a reportar los `catch (error)` sin usar.
		'@typescript-eslint/no-unused-vars': [
			airbnbVariables.rules['no-unused-vars'][0],
			{ ...airbnbVariables.rules['no-unused-vars'][1], caughtErrors: 'none' },
		],
		'lines-between-class-members': 'off',
		'@stylistic/lines-between-class-members': [
			...airbnbStyle.rules['lines-between-class-members'].slice(0, 2),
			{ ...airbnbStyle.rules['lines-between-class-members'][2], exceptAfterOverload: true },
		],
		'no-use-before-define': 'off',
		'@typescript-eslint/no-use-before-define': airbnbVariables.rules['no-use-before-define'],
		'no-useless-constructor': 'off',
		'@typescript-eslint/no-useless-constructor': airbnbES6.rules['no-useless-constructor'],
		'require-await': 'off',
		'@typescript-eslint/require-await': airbnbBestPractices.rules['require-await'],
		'no-return-await': 'off',
		'@typescript-eslint/return-await': [
			airbnbBestPractices.rules['no-return-await'],
			'in-try-catch',
		],
		'import/extensions': [
			airbnbImports.rules['import/extensions'][0],
			airbnbImports.rules['import/extensions'][1],
			{ ...airbnbImports.rules['import/extensions'][2], ts: 'never', tsx: 'never' },
		],
		'import/no-extraneous-dependencies': [
			airbnbImports.rules['import/no-extraneous-dependencies'][0],
			{
				...airbnbImports.rules['import/no-extraneous-dependencies'][1],
				devDependencies: devDependenciesTs,
			},
		],
	},
};

/** Reglas de Airbnb que el compilador de TypeScript ya cubre (mejor) en `.ts`/`.tsx`. */
const airbnbTypescriptOverrides = {
	name: 'zentria/airbnb-typescript-ts',
	files: ['**/*.ts', '**/*.tsx'],
	rules: {
		'constructor-super': 'off',
		'getter-return': 'off',
		'no-const-assign': 'off',
		'no-dupe-args': 'off',
		'no-dupe-class-members': 'off',
		'no-dupe-keys': 'off',
		'no-func-assign': 'off',
		'no-import-assign': 'off',
		'no-new-symbol': 'off',
		'no-obj-calls': 'off',
		'no-redeclare': 'off',
		'no-setter-return': 'off',
		'no-this-before-super': 'off',
		'no-undef': 'off',
		'no-unreachable': 'off',
		'no-unsafe-negation': 'off',
		'valid-typeof': 'off',
		'import/named': 'off',
		'import/no-named-as-default-member': 'off',
		'import/no-unresolved': 'off',
	},
};

/**
 * Equivale al antiguo `.eslintignore` más lo que ESLint 8 ignoraba solo: los archivos y
 * carpetas que empiezan con punto (`.claude/`, que aloja los worktrees, entre otros) y las
 * extensiones que `--ext .js,.jsx,.ts,.tsx` dejaba fuera. Lo reutiliza `eslint.imports.config.mjs`.
 */
export const archivosIgnorados = globalIgnores(
	[
		'**/.*',
		'**/*.{mjs,cjs}',
		'dist/',
		'scripts/',
		'src/components/icon/',
		'src/assets',
		'tailwind.config.js',
		'vite.config.ts',
	],
	'zentria/ignores',
);

export default defineConfig(
	archivosIgnorados,
	...fixupConfigRules(compat.extends('airbnb')),
	airbnbTypescript,
	airbnbTypescriptOverrides,
	tseslint.configs.recommended,
	tseslint.configs.recommendedTypeChecked,
	prettierConfig,
	{
		name: 'zentria/proyecto',
		files: ['**/*.{js,jsx,ts,tsx}'],
		// ESLint 9 empezó a avisar por defecto de los `eslint-disable` que ya no hacen falta; se
		// mantiene apagado como en ESLint 8 para que la actualización no cambie el conteo.
		linterOptions: { reportUnusedDisableDirectives: 'off' },
		languageOptions: {
			parserOptions: {
				project: './tsconfig.eslint.json',
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			prettier: prettierPlugin,
			'react-hooks': reactHooks,
		},
		settings: {
			'import/resolver': {
				typescript: {
					project: './tsconfig.eslint.json',
				},
			},
		},
		rules: {
			'no-use-before-define': 'off',
			'no-case-declarations': 'off',
			'no-underscore-dangle': 'off',
			'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
			'react/react-in-jsx-scope': 'off',
			'no-param-reassign': 'off',
			'no-void': ['error', { allowAsStatement: true }],
			'no-empty': 'warn',
			'import/no-extraneous-dependencies': 'warn',
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
			'react/jsx-props-no-spreading': [
				'warn',
				{
					html: 'ignore',
					custom: 'enforce',
					explicitSpread: 'enforce',
					exceptions: [
						'DropdownItem',
						'Element',
						'FullCalendar',
						'Leaf',
						'NavItem',
						'ReactSelect',
						'CreatableSelect',
						'Route',
						'Table',
						'Td',
						'Th',
						'ThResizer',
					],
				},
			],
			'react/no-unescaped-entities': ['error', { forbid: ['>', '}'] }],
			'jsx-a11y/label-has-associated-control': ['warn', { depth: 3 }],
			// Sólo las dos reglas clásicas de react-hooks 7: las del React Compiler quedan fuera
			// porque el proyecto no compila con él (ver el PR de ESLint 10).
			'react-hooks/exhaustive-deps': 'error',
			'react-hooks/rules-of-hooks': 'error',
			'react/function-component-definition': [
				2,
				{
					namedComponents: 'arrow-function',
					unnamedComponents: 'arrow-function',
				},
			],
			'react/no-arrow-function-lifecycle': 'off',
			'react/no-invalid-html-attribute': 'off',
			'react/no-unused-class-component-methods': 'off',
			'import/no-anonymous-default-export': [
				'error',
				{
					allowArray: true,
					allowArrowFunction: false,
					allowAnonymousClass: false,
					allowAnonymousFunction: false,
					allowCallExpression: true, // The true value here is for backward compatibility
					allowLiteral: false,
					allowObject: true,
				},
			],
			'arrow-body-style': ['off'],
			'react/jsx-key': ['error'],
			'prettier/prettier': ['error'],
			'@typescript-eslint/ban-ts-comment': 'off',
			'@typescript-eslint/no-misused-promises': [
				'error',
				{
					checksVoidReturn: {
						attributes: false,
					},
				},
			],
			// Reemplaza a la regla base de Airbnb, de la que hereda `allowEmptyReject`. Un `catch`
			// tipa el error como `unknown` y reenviarlo con `Promise.reject` equivale a relanzarlo,
			// lo que `only-throw-error` ya admite por defecto.
			'@typescript-eslint/prefer-promise-reject-errors': [
				'error',
				{
					...airbnbBestPractices.rules['prefer-promise-reject-errors'][1],
					allowThrowingAny: true,
					allowThrowingUnknown: true,
				},
			],
			'@typescript-eslint/no-redundant-type-constituents': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'react/require-default-props': ['off'],
		},
	},
	{
		name: 'zentria/pruebas',
		files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
		rules: {
			// Los dobles reproducen el contrato real del rechazo: `unwrap()` de Redux Toolkit
			// rechaza con el payload de `rejectWithValue`, que es un objeto plano.
			'@typescript-eslint/prefer-promise-reject-errors': 'off',
		},
	},
);
