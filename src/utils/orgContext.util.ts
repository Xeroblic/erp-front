/**
 * Núcleo puro para resolver el contexto organizacional (empresa / subsidiaria /
 * sucursal) a partir del `user` y la personalización ya presentes en el store.
 *
 * Centraliza la lógica que antes estaba DUPLICADA en:
 *  - `src/hooks/useCurrentBranch.ts`
 *  - `src/store/selectors/subsidiarySelectors.ts`
 *
 * Es intencionalmente agnóstico de React y de Redux (funciones puras) para poder
 * consumirse tanto desde hooks como desde selectores y testearse aislado.
 */

/** Convierte un valor desconocido a un id numérico entero o `null`. */
export const toContextId = (value: unknown): number | null => {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number.parseInt(value, 10);
		return Number.isNaN(parsed) ? null : parsed;
	}
	return null;
};

/**
 * Forma de una sucursal según el contrato real de `/perfil`. Existen dos variantes:
 *  - `user.branch` (principal):      { id, branch_name, subsidiary_id, subsidiary: { id, subsidiary_name, ... } }
 *  - `access/visible.branches[]`:    { id, name,        subsidiary: { id, name, ... } }
 *
 * Por eso el id de la sucursal es SIEMPRE `id`, y la subsidiaria llega como objeto
 * (`subsidiary.id`) o, sólo en la principal, como campo plano (`subsidiary_id`).
 */
export interface BranchLike {
	id?: number | string | null;
	name?: string | null; // access/visible branches
	branch_name?: string | null; // user.branch (principal)
	subsidiary_id?: number | string | null; // user.branch (plano)
	subsidiary?: {
		id?: number | string | null;
		name?: string | null; // access/visible
		subsidiary_name?: string | null; // user.branch
	} | null;
}

/** Forma estructural mínima del usuario (`/perfil`) que necesita el resolver. */
export interface ContextUser {
	branch?: BranchLike | null;
	access?: { branches?: BranchLike[] | null } | null;
	visible?: { branches?: BranchLike[] | null } | null;
}

const inspectBranchForSubsidiary = (
	branch: BranchLike | null | undefined,
	targetBranchId: number,
): number | null => {
	if (!branch) return null;

	if (toContextId(branch.id) !== targetBranchId) return null;

	// Objeto `subsidiary.id` (access/visible/principal) o plano `subsidiary_id` (principal).
	return toContextId(branch.subsidiary?.id) ?? toContextId(branch.subsidiary_id);
};

/**
 * Deriva el `subsidiaryId` recorriendo las colecciones de sucursales del usuario
 * (branch principal, `access.branches`, `visible.branches`) hasta encontrar la que
 * coincide con `branchId`.
 */
export const resolveSubsidiaryFromBranch = (
	branchId: number | null | undefined,
	user: ContextUser | null | undefined,
): number | null => {
	const normalizedBranchId = toContextId(branchId);
	if (normalizedBranchId === null || !user) return null;

	const candidateBranches: Array<BranchLike | null | undefined> = [
		user.branch,
		...(user.access?.branches ?? []),
		...(user.visible?.branches ?? []),
	];

	let resolved: number | null = null;
	candidateBranches.some((branch) => {
		const match = inspectBranchForSubsidiary(branch, normalizedBranchId);
		if (match !== null) {
			resolved = match;
			return true;
		}
		return false;
	});

	return resolved;
};
