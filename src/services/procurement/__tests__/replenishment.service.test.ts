import { beforeEach, describe, expect, it, vi } from 'vitest';
import listReplenishmentCandidates from '@/services/procurement/replenishment.service';

/**
 * Cableado HTTP de la reposición contra el contrato del backend (§13,
 * `ReplenishmentController`): URL por filial, `GET`, filtros y paginación.
 * El orden y los conteos los decide el backend y no se prueban aquí.
 */

const apiSpies = vi.hoisted(() => ({ fetchData: vi.fn() }));

vi.mock('@/services/ApiService', () => ({ default: apiSpies }));

const URL = '/subsidiaries/2/procurement/replenishment-candidates';

beforeEach(() => {
	apiSpies.fetchData.mockReset();
	apiSpies.fetchData.mockResolvedValue({
		data: {
			data: [],
			meta: { current_page: 1, last_page: 1, total: 0 },
			context: { status_counts: { suggested: 2 } },
		},
	});
});

describe('listReplenishmentCandidates', () => {
	it('manda los filtros del contrato y la paginación', async () => {
		const controller = new AbortController();

		await listReplenishmentCandidates(
			2,
			{
				search: 'mouse',
				brand_id: 3,
				category_id: 8,
				supplier_id: 7,
				recommendation_status: 'no_comparable_cost',
				page: 2,
				per_page: 50,
			},
			controller.signal,
		);

		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: URL,
			method: 'get',
			params: {
				search: 'mouse',
				brand_id: 3,
				category_id: 8,
				supplier_id: 7,
				recommendation_status: 'no_comparable_cost',
				page: 2,
				per_page: 50,
			},
			signal: controller.signal,
		});
	});

	it('los filtros vacíos no viajan', async () => {
		await listReplenishmentCandidates(2, {
			search: '',
			recommendation_status: undefined,
			page: 1,
		});

		expect(apiSpies.fetchData).toHaveBeenCalledWith(
			expect.objectContaining({ url: URL, params: { page: 1 } }),
		);
	});

	it('devuelve la página leída del cuerpo, con los conteos por estado', async () => {
		const result = await listReplenishmentCandidates(2, {});

		expect(result.statusCounts).toEqual({
			suggested: 2,
			without_supplier_history: 0,
			no_active_suppliers: 0,
			no_comparable_cost: 0,
		});
	});
});
