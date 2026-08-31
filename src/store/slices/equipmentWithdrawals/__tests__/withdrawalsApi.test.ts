import { describe, expect, it } from 'vitest';
import type { RootState } from '@/store/rootReducer';
import {
	WITHDRAWALS_USE_MOCKS,
	buildWithdrawalsEndpoint,
	resolveWithdrawalsContext,
	withdrawalsFiltersFromSearchParams,
} from '../withdrawalsApi';
import getWithdrawalsErrorMessage from '../errors';

it('mantiene los mocks desactivados si el entorno no los habilita explícitamente', () => {
	expect(WITHDRAWALS_USE_MOCKS).toBe(false);
});

it('prioriza el mensaje del backend ante un error Axios', () => {
	expect(
		getWithdrawalsErrorMessage({
			message: 'Request failed with status code 403',
			response: { data: { message: 'No tienes permisos para ver los retiros' } },
		}),
	).toBe('No tienes permisos para ver los retiros');
});

const buildState = (
	options: {
		sucursalPrincipal?: number;
		userBranch?: { id: number; subsidiary?: { id: number } };
	} = {},
): RootState =>
	({
		auth: { user: options.userBranch ?? null },
		personalizacion: options.sucursalPrincipal
			? { personalizacionUsuario: { sucursal_principal: options.sucursalPrincipal } }
			: undefined,
	}) as unknown as RootState;

describe('resolveWithdrawalsContext', () => {
	it('prioriza el modo branches cuando hay branchId explícito', () => {
		const context = resolveWithdrawalsContext(buildState(), {
			branchId: 12,
			subsidiaryId: 3,
		});

		expect(context.endpointMode).toBe('branches');
		expect(context.entityId).toBe(12);
		expect(context.branchId).toBe(12);
	});

	it('usa modo subsidiaries solo con subsidiaryId sin branchId', () => {
		const context = resolveWithdrawalsContext(buildState({ sucursalPrincipal: 12 }), {
			subsidiaryId: 3,
		});

		expect(context.endpointMode).toBe('subsidiaries');
		expect(context.entityId).toBe(3);
		expect(context.branchId).toBe(12);
		expect(context.subsidiaryId).toBe(3);
	});

	it('respeta el prefijo explícito subsidiaries aun cuando recibe ambos IDs', () => {
		const context = resolveWithdrawalsContext(buildState(), {
			branchId: 12,
			subsidiaryId: 3,
			endpointMode: 'subsidiaries',
		});

		expect(buildWithdrawalsEndpoint(context, '')).toBe('/subsidiaries/3/withdrawals');
	});

	it('resuelve la sucursal desde la personalización cuando no hay input', () => {
		const context = resolveWithdrawalsContext(buildState({ sucursalPrincipal: 12 }));

		expect(context.endpointMode).toBe('branches');
		expect(context.branchId).toBe(12);
	});

	it('deriva la subsidiaria desde las sucursales del usuario', () => {
		const state = buildState({
			userBranch: { id: 12, subsidiary: { id: 7 } },
		});
		const context = resolveWithdrawalsContext(state, { branchId: 12 });

		expect(context.subsidiaryId).toBe(7);
	});

	it('falla si no puede resolver ningún contexto', () => {
		expect(() => resolveWithdrawalsContext(buildState())).toThrow(
			'No se pudo resolver el contexto de retiros de equipos',
		);
	});
});

describe('prefijo único del módulo', () => {
	it('construye endpoints bajo /branches/{id}/withdrawals', () => {
		const context = resolveWithdrawalsContext(buildState(), { branchId: 12 });
		expect(buildWithdrawalsEndpoint(context, '')).toBe('/branches/12/withdrawals');
		expect(buildWithdrawalsEndpoint(context, '/eligible-serials')).toBe(
			'/branches/12/withdrawals/eligible-serials',
		);
	});

	it('construye endpoints bajo /subsidiaries/{id}/withdrawals', () => {
		const context = resolveWithdrawalsContext(buildState(), { subsidiaryId: 3 });
		expect(buildWithdrawalsEndpoint(context, '/845/items')).toBe(
			'/subsidiaries/3/withdrawals/845/items',
		);
	});
});

describe('withdrawalsFiltersFromSearchParams (§9)', () => {
	it('mapea "Qué hay afuera" (?status=confirmed&type=loan)', () => {
		const params = withdrawalsFiltersFromSearchParams(
			new URLSearchParams('status=confirmed&type=loan'),
		);

		expect(params.status).toBe('confirmed');
		expect(params.type).toBe('loan');
	});

	it('mapea "Borradores estancados" (?stale=true)', () => {
		const params = withdrawalsFiltersFromSearchParams(new URLSearchParams('stale=true'));

		expect(params.stale).toBe(true);
	});

	it('acepta stale=false y lo distingue de ausente', () => {
		const explicitFalse = withdrawalsFiltersFromSearchParams(
			new URLSearchParams('stale=false'),
		);
		expect(explicitFalse.stale).toBe(false);

		const absent = withdrawalsFiltersFromSearchParams(new URLSearchParams());
		expect(absent.stale).toBeUndefined();
	});

	it('ignora valores fuera del contrato en lugar de romper', () => {
		const params = withdrawalsFiltersFromSearchParams(
			new URLSearchParams('status=hack&type=todos&stale=yes&page=0'),
		);

		expect(params.status).toBeUndefined();
		expect(params.type).toBeUndefined();
		expect(params.stale).toBeUndefined();
		expect(params.page).toBeUndefined();
	});

	it('mapea búsqueda, filtros de cliente-proveedor y paginación', () => {
		const params = withdrawalsFiltersFromSearchParams(
			new URLSearchParams(
				'q=lenovo&customer_supplier_id=7&customer_supplier_contact_id=31&page=2&per_page=50',
			),
		);

		expect(params.q).toBe('lenovo');
		expect(params.customer_supplier_id).toBe(7);
		expect(params.customer_supplier_contact_id).toBe(31);
		expect(params.page).toBe(2);
		expect(params.per_page).toBe(50);
	});
});
