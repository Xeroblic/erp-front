import { describe, it, expect } from 'vitest';
import {
	toContextId,
	resolveSubsidiaryFromBranch,
	type ContextUser,
} from '@/utils/orgContext.util';

describe('orgContext.util', () => {
	describe('toContextId', () => {
		it('acepta números finitos', () => {
			expect(toContextId(12)).toBe(12);
			expect(toContextId(0)).toBe(0);
		});

		it('parsea strings numéricos y descarta el resto', () => {
			expect(toContextId('45')).toBe(45);
			expect(toContextId('  7 ')).toBe(7);
			expect(toContextId('')).toBeNull();
			expect(toContextId('abc')).toBeNull();
			expect(toContextId(null)).toBeNull();
			expect(toContextId(undefined)).toBeNull();
			expect(toContextId(Number.NaN)).toBeNull();
		});
	});

	describe('resolveSubsidiaryFromBranch', () => {
		it('devuelve null sin branchId o sin user', () => {
			expect(resolveSubsidiaryFromBranch(null, { branch: null })).toBeNull();
			expect(resolveSubsidiaryFromBranch(5, null)).toBeNull();
		});

		it('resuelve desde la branch principal (subsidiary objeto o subsidiary_id plano)', () => {
			expect(
				resolveSubsidiaryFromBranch(3, { branch: { id: 3, subsidiary: { id: 99 } } }),
			).toBe(99);
			expect(
				resolveSubsidiaryFromBranch(3, {
					branch: { id: 3, branch_name: 'X', subsidiary_id: 99 },
				}),
			).toBe(99);
		});

		it('resuelve desde access.branches y visible.branches', () => {
			const user: ContextUser = {
				branch: { id: 1, subsidiary: { id: 10 } },
				access: { branches: [{ id: 2, name: 'B2', subsidiary: { id: 20 } }] },
				visible: { branches: [{ id: 4, name: 'B4', subsidiary: { id: 40 } }] },
			};
			expect(resolveSubsidiaryFromBranch(2, user)).toBe(20);
			expect(resolveSubsidiaryFromBranch(4, user)).toBe(40);
		});

		it('continúa en fuentes posteriores si una coincidencia no trae subsidiaria', () => {
			const user: ContextUser = {
				branch: { id: 12 },
				branches: [{ id: 12, subsidiary: { id: 7 } }],
			};

			expect(resolveSubsidiaryFromBranch(12, user)).toBe(7);
		});

		it('acepta los alias de subsidiaria como IDs escalares', () => {
			expect(resolveSubsidiaryFromBranch(2, { branch: { id: 2, subsidiary: '20' } })).toBe(
				20,
			);
			expect(resolveSubsidiaryFromBranch(3, { branch: { id: 3, subsidiary_info: 30 } })).toBe(
				30,
			);
		});

		it('resuelve sobre el payload real de /perfil', () => {
			const user: ContextUser = {
				branch: {
					id: 1,
					branch_name: 'Ecopc',
					subsidiary_id: 1,
					subsidiary: { id: 1, subsidiary_name: 'Ecopc' },
				},
				access: {
					branches: [
						{ id: 1, name: 'Ecopc', subsidiary: { id: 1, name: 'Ecopc' } },
						{ id: 3, name: 'test subsidiaria', subsidiary: { id: 2, name: 'Test' } },
					],
				},
				visible: {
					branches: [
						{ id: 1, name: 'Ecopc', subsidiary: { id: 1, name: 'Ecopc' } },
						{ id: 3, name: 'test subsidiaria', subsidiary: { id: 2, name: 'Test' } },
					],
				},
			};
			expect(resolveSubsidiaryFromBranch(1, user)).toBe(1);
			expect(resolveSubsidiaryFromBranch(3, user)).toBe(2);
		});

		it('devuelve null si ninguna branch coincide', () => {
			const user: ContextUser = { branch: { id: 1, subsidiary: { id: 10 } } };
			expect(resolveSubsidiaryFromBranch(999, user)).toBeNull();
		});
	});
});
