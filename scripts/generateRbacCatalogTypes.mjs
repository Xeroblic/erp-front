import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDirectory = fileURLToPath(new URL('.', import.meta.url));
const projectDirectory = resolve(scriptsDirectory, '..');
const catalogPath = resolve(projectDirectory, 'resources/rbac/catalog.json');
const outputPath = resolve(
	projectDirectory,
	'src/authorization/rbac/catalogPermissions.generated.ts',
);

const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));

if (
	!Array.isArray(catalog.permissions) ||
	!catalog.permissions.every(({ name }) => typeof name === 'string')
) {
	throw new Error('resources/rbac/catalog.json no contiene permissions[].name válidos.');
}

const permissionNames = catalog.permissions.map(({ name }) => name);
const formattedPermissions = permissionNames
	.map((name) => `\t'${name.replaceAll("'", "\\\\'")}',`)
	.join('\n');
const output = `/** Archivo generado por scripts/generateRbacCatalogTypes.mjs. No editar manualmente. */\nexport const knownPermissions = [\n${formattedPermissions}\n] as const;\n\nexport type KnownPermission = (typeof knownPermissions)[number];\n`;

await writeFile(outputPath, output, 'utf8');
