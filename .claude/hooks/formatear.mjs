#!/usr/bin/env node
/**
 * Hook PostToolUse (Edit | Write) — Prettier sobre el archivo tocado.
 *
 * El repositorio tiene `prettier:check` dentro de `quality:style` y un workflow de
 * estilo en CI. Formatear al escribir evita que un cambio funcional llegue al PR
 * con ruido de formato o con finales de línea equivocados.
 *
 * Nunca bloquea: si prettier falla o el archivo está en .prettierignore, sale en 0.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';

const EXTENSIONES = new Set([
	'.ts',
	'.tsx',
	'.js',
	'.jsx',
	'.mjs',
	'.cjs',
	'.json',
	'.md',
	'.css',
	'.html',
	'.yml',
	'.yaml',
]);

const leerEntrada = async () => {
	let crudo = '';
	for await (const trozo of process.stdin) crudo += trozo;
	try {
		return JSON.parse(crudo);
	} catch {
		return null;
	}
};

const entrada = await leerEntrada();
const archivo = entrada?.tool_input?.file_path;
if (!archivo) process.exit(0);

const raiz = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const absoluto = path.resolve(archivo);

// Sólo archivos del proyecto y de tipos que prettier entiende.
if (!absoluto.startsWith(path.resolve(raiz))) process.exit(0);
if (!EXTENSIONES.has(path.extname(absoluto).toLowerCase())) process.exit(0);

const proceso = spawn(
	'pnpm',
	['exec', 'prettier', '--write', '--ignore-unknown', '--log-level', 'warn', absoluto],
	{ cwd: raiz, shell: true, stdio: ['ignore', 'ignore', 'pipe'] },
);

let errores = '';
proceso.stderr.on('data', (trozo) => {
	errores += trozo;
});

proceso.on('close', (codigo) => {
	if (codigo !== 0 && errores.trim()) {
		process.stderr.write(
			`prettier no pudo formatear ${path.relative(raiz, absoluto)}: ${errores}`,
		);
	}
	process.exit(0);
});

proceso.on('error', () => process.exit(0));
