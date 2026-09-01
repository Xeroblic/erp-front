#!/usr/bin/env node
/**
 * Hook PreToolUse (Bash) — Identidad de publicación.
 *
 * Zentria publica en GitHub siempre bajo la cuenta del usuario. Este hook bloquea
 * los comandos que intentarían commitear o publicar con una identidad distinta:
 * tokens de bot/app tomados del entorno, sustitución del autor de git o trailers
 * de herramienta añadidos al commit o al cuerpo del PR.
 *
 * Salida: JSON de PreToolUse. `deny` corta el comando y explica el motivo.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

const leerEntrada = async () => {
	let crudo = '';
	for await (const trozo of process.stdin) crudo += trozo;
	try {
		return JSON.parse(crudo);
	} catch {
		return null;
	}
};

const permitir = () => process.exit(0);

const denegar = (motivo) => {
	process.stdout.write(
		JSON.stringify({
			hookSpecificOutput: {
				hookEventName: 'PreToolUse',
				permissionDecision: 'deny',
				permissionDecisionReason: motivo,
			},
		}),
	);
	process.exit(0);
};

/**
 * El mensaje del commit o el cuerpo del PR pueden llegar por archivo en vez de ir
 * escritos en el comando (`git commit -F`, `gh pr create --body-file`). Sin leerlos,
 * la atribución de herramienta pasaría sin ser vista.
 */
const textoDeArchivosReferenciados = (comando, raiz) => {
	const banderas = /(?:--body-file|--file|--template|-F)[=\s]+(?!-)(['"]?)([^'"\s]+)\1/g;
	const partes = [];
	for (const coincidencia of comando.matchAll(banderas)) {
		const ruta = coincidencia[2];
		// Git Bash entrega rutas MSYS (`/c/Users/...`) que Node en Windows no resuelve.
		const traducida = /^\/[a-z]\//i.test(ruta)
			? `${ruta[1].toUpperCase()}:${ruta.slice(2)}`
			: null;
		const candidatas = [path.resolve(raiz, ruta), path.resolve(ruta)];
		if (traducida) candidatas.unshift(path.resolve(traducida));
		for (const candidata of candidatas) {
			try {
				partes.push(readFileSync(candidata, 'utf8'));
				break;
			} catch {
				// Ruta inexistente o ilegible (p. ej. `gh api -F campo=valor`): se ignora.
			}
		}
	}
	return partes.join('\n');
};

const entrada = await leerEntrada();
if (!entrada || entrada.tool_name !== 'Bash') permitir();

const comando = String(entrada.tool_input?.command ?? '');
if (!comando.trim()) permitir();

const raiz = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
// Texto completo a inspeccionar: el comando más el contenido de los archivos que referencia.
const texto = `${comando}\n${textoDeArchivosReferenciados(comando, raiz)}`;

const esPublicacion =
	/\bgit\s+(-\S+\s+)*push\b/.test(comando) ||
	/\bgh\s+(pr|release|issue|api|workflow)\b/.test(comando);
const esCommit = /\bgit\s+(-\S+\s+)*commit\b/.test(comando);

if (!esPublicacion && !esCommit) permitir();

// 1. Token de entorno: puede pertenecer a una app o a un bot, no al usuario.
const tokenDeEntorno = ['GH_TOKEN', 'GITHUB_TOKEN'].filter((clave) => process.env[clave]);
if (esPublicacion && tokenDeEntorno.length > 0) {
	denegar(
		`Identidad de publicación no verificable: ${tokenDeEntorno.join(' y ')} está definida en el entorno ` +
			'y `gh` la usaría en lugar de la credencial local del usuario. Ese token puede pertenecer a una app o a un bot. ' +
			'Limpia la variable y publica con `gh auth status --active` mostrando la cuenta del usuario.',
	);
}

// 2. Sustitución explícita de la identidad de git.
if (/--author[=\s]/.test(comando) || /--committer[=\s]/.test(comando)) {
	denegar(
		'El comando sustituye el autor del commit con --author/--committer. La autoría debe ser la de ' +
			'`git config user.name` / `user.email` del usuario. Quita el override.',
	);
}
if (/-c\s+user\.(name|email)=/.test(comando)) {
	denegar(
		'El comando redefine user.name o user.email con `git -c`. La identidad debe ser la configurada ' +
			'en el repositorio, no una pasada por línea de comandos.',
	);
}

// 3. Atribución de herramienta en el commit o en el cuerpo del PR.
// Se inspecciona `texto`, no `comando`: cubre también el mensaje pasado por archivo.
if (/co-authored-by:\s*(claude|anthropic)/i.test(texto)) {
	denegar(
		'El mensaje incluye un trailer `Co-Authored-By: Claude`. En este repositorio la autoría es del ' +
			'usuario y de su equipo: los trailers Co-authored-by se reservan para personas reales. Quita esa línea.',
	);
}
if (/--trailer[=\s]+['"]?co-authored-by:\s*(claude|anthropic)/i.test(texto)) {
	denegar(
		'El comando añade un trailer `Co-Authored-By: Claude` con --trailer. La autoría es del usuario ' +
			'y de su equipo: quita ese trailer.',
	);
}
if (
	/generated with \[?claude/i.test(texto) ||
	/🤖 generated with/i.test(texto) ||
	/(created|written|co-?authored)\s+(by|with)\s+claude(\s+code)?\b/i.test(texto) ||
	/\bclaude\.com\/claude-code\b/i.test(texto) ||
	/noreply@anthropic\.com/i.test(texto)
) {
	denegar(
		'El texto incluye una firma o atribución de herramienta (tipo «Generated with Claude Code»). ' +
			'Ni los commits ni el cuerpo del PR llevan atribución de herramienta: el formato válido está en ' +
			'`.claude/skills/pr-publisher/SKILL.md`. Quita esa línea.',
	);
}

permitir();
