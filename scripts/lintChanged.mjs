/**
 * Lint acotado a los archivos que cambiaron respecto de la base (por defecto `develop`).
 *
 * `pnpm lint` recorre todo el repositorio y devuelve miles de hallazgos preexistentes:
 * es inservible para saber si un cambio introdujo un problema nuevo, y su salida es
 * demasiado grande para revisarla. Este script mira sólo lo que tocaste.
 *
 * Uso:
 *   pnpm run lint:changed              # contra develop
 *   pnpm run lint:changed origin/main  # contra otra base
 */

import { execFileSync, spawnSync } from 'node:child_process';

const EXTENSIONES = /\.(?:js|jsx|ts|tsx)$/;
const base = process.argv[2] ?? 'develop';

const git = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

let rangoBase;
try {
	rangoBase = git(['merge-base', base, 'HEAD']);
} catch {
	console.error(`No se pudo resolver la base "${base}". ¿Existe esa rama?`);
	process.exit(1);
}

// Cambios ya commiteados en la rama + los que siguen en el worktree + los sin trackear.
const commiteados = git(['diff', '--name-only', '--diff-filter=ACMR', `${rangoBase}...HEAD`]);
const enWorktree = git(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD']);
const sinTrackear = git(['ls-files', '--others', '--exclude-standard']);

const archivos = [
	...new Set(
		[commiteados, enWorktree, sinTrackear]
			.join('\n')
			.split(/\r?\n/)
			.filter((ruta) => ruta && EXTENSIONES.test(ruta)),
	),
];

if (archivos.length === 0) {
	console.log(`Sin archivos JS/TS cambiados respecto de "${base}". Nada que lintear.`);
	process.exit(0);
}

console.log(`Linteando ${archivos.length} archivo(s) cambiado(s) respecto de "${base}":`);
if (archivos.length <= 25) {
	archivos.forEach((ruta) => console.log(`  ${ruta}`));
} else {
	// Con muchos archivos, listarlos todos es puro ruido: basta el conteo.
	archivos.slice(0, 5).forEach((ruta) => console.log(`  ${ruta}`));
	console.log(`  ... y ${archivos.length - 5} más`);
}
console.log('');

/**
 * Windows corta la línea de comandos alrededor de los 8191 caracteres, así que
 * eslint se invoca por lotes. Sin esto, un rango amplio falla con
 * «La línea de comandos es demasiado larga» en vez de lintear.
 */
const LIMITE_LOTE = 6000;
const lotes = [];
let loteActual = [];
let largoActual = 0;

for (const ruta of archivos) {
	const largo = ruta.length + 3; // ruta + comillas + separador
	if (largoActual + largo > LIMITE_LOTE && loteActual.length > 0) {
		lotes.push(loteActual);
		loteActual = [];
		largoActual = 0;
	}
	loteActual.push(ruta);
	largoActual += largo;
}
if (loteActual.length > 0) lotes.push(loteActual);

let salida = 0;
for (const lote of lotes) {
	const resultado = spawnSync(
		'pnpm',
		['exec', 'eslint', '--no-error-on-unmatched-pattern', ...lote],
		{ stdio: 'inherit', shell: true },
	);
	if (resultado.status) salida = resultado.status;
}

process.exit(salida);
