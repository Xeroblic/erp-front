/**
 * La ruta de sucursal valida con `Arr::only`: persiste los campos que pasaron, descarta
 * los que no y responde 200 con la lista de rechazos en `warnings`. Mientras el thunk
 * devolvía sólo `data`, el autosave tomaba ese 200 como éxito, congelaba el snapshot con
 * el valor inválido dentro —de modo que no volvía a intentarlo— y el badge mostraba
 * «Guardado» sobre un dato que el backend nunca guardó.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { RootState } from '@/store/rootReducer';
import { updateItemDetails } from '../thunks/reviewThunks';

const { fetchData } = vi.hoisted(() => ({ fetchData: vi.fn() }));

vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('../technicalReviewsContext', () => ({
	resolveTechnicalReviewsContext: () => ({
		endpointMode: 'branches' as const,
		entityId: 5,
		branchId: 5,
		subsidiaryId: 9,
	}),
	buildTechnicalReviewsEndpoint: (_context: unknown, path: string) =>
		`/branches/5/technical-reviews${path}`,
}));

const runThunk = async () => {
	const thunk = updateItemDetails({
		branchId: 5,
		itemId: 12,
		data: { hinge_condition: 'missing_pieces' },
		equipmentType: 'notebook',
	});

	return thunk(vi.fn(), (() => ({}) as RootState) as () => RootState, undefined);
};

describe('updateItemDetails', () => {
	beforeEach(() => {
		fetchData.mockReset();
	});

	it('rechaza el guardado cuando la respuesta 200 trae warnings', async () => {
		fetchData.mockResolvedValue({
			data: {
				success: true,
				message: 'Detalles técnicos actualizados exitosamente',
				data: { id: 12 },
				warnings: {
					message: 'El campo hinge condition seleccionado es inválido.',
					errors: {
						hinge_condition: ['El campo hinge condition seleccionado es inválido.'],
					},
				},
			},
		});

		const result = await runThunk();

		expect(result.type).toBe('technicalReviews/updateItemDetails/rejected');
		expect(result.payload).toBe('El campo hinge condition seleccionado es inválido.');
	});

	it('rechaza con un mensaje propio cuando warnings no trae texto', async () => {
		fetchData.mockResolvedValue({
			data: { success: true, data: { id: 12 }, warnings: { errors: {} } },
		});

		const result = await runThunk();

		expect(result.type).toBe('technicalReviews/updateItemDetails/rejected');
		expect(result.payload).toBe('El backend no aceptó algunos campos de la revisión');
	});

	it('resuelve con el item cuando la respuesta no trae warnings', async () => {
		fetchData.mockResolvedValue({ data: { success: true, data: { id: 12 } } });

		const result = await runThunk();

		expect(result.type).toBe('technicalReviews/updateItemDetails/fulfilled');
		expect(result.payload).toEqual({ id: 12 });
	});
});
