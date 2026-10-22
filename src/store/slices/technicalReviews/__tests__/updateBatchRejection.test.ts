/**
 * La UI bloquea las notas sobre 1000 caracteres antes de enviar, así que el 422 del
 * backend (`max:1000`) no se alcanza desde la tarjeta. El cuerpo de abajo es el que
 * devuelve la API local al `PATCH` directo con 1001 caracteres: el thunk debe entregar
 * su `message` tal cual, porque es el texto que la tarjeta muestra bajo el campo.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RootState } from '@/store/rootReducer';
import { updateBatch } from '../thunks/batchesThunks';

const { fetchData } = vi.hoisted(() => ({ fetchData: vi.fn() }));

vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('../technicalReviewsContext', () => ({
	resolveTechnicalReviewsContext: () => ({
		endpointMode: 'subsidiaries' as const,
		entityId: 1,
		branchId: 3,
		subsidiaryId: 1,
	}),
	buildTechnicalReviewsEndpoint: (_context: unknown, path: string) =>
		`/subsidiaries/1/technical-reviews${path}`,
}));

const backendMessage = 'El campo notes no debe ser mayor que 1000 caracteres.';

const runUpdate = (notes: string | null) =>
	updateBatch({ subsidiaryId: 1, batchId: 38, data: { notes } })(
		vi.fn(),
		() => ({}) as RootState,
		undefined,
	);

describe('updateBatch con notas', () => {
	beforeEach(() => {
		fetchData.mockReset();
	});

	it('rechaza con el mensaje del 422 real del backend', async () => {
		fetchData.mockRejectedValue({
			response: {
				status: 422,
				data: { message: backendMessage, errors: { notes: [backendMessage] } },
			},
		});

		const result = await runUpdate('x'.repeat(1001));

		expect(updateBatch.rejected.match(result)).toBe(true);
		expect(result.payload).toBe(backendMessage);
	});

	it('envía sólo { notes } por la ruta por filial', async () => {
		fetchData.mockResolvedValue({ data: { data: { id: 38, notes: null } } });

		await runUpdate(null);

		expect(fetchData).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringContaining('/subsidiaries/1/technical-reviews/batches/38'),
				method: 'patch',
				data: { notes: null },
			}),
		);
	});
});
