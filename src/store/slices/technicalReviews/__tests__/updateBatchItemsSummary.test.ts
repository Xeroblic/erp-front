/**
 * El backend sólo incluye `items_summary` cuando la relación `items` está cargada, y el
 * PATCH del lote no la carga. Si el reducer reemplazaba el lote entero, guardar las notas
 * (o la cantidad esperada) borraba la «Distribución por Tipo de Equipo» del detalle, y un
 * filtro ya aplicado quedaba sin forma de quitarse hasta recargar.
 */
import { describe, expect, it } from 'vitest';
import type { IBatch, TechnicalReviewsState } from '@/interface/technicalReviews.interface';
import reducer from '../slice/technicalReviewsSlice';
import { updateBatch } from '../thunks/batchesThunks';

const summary: NonNullable<IBatch['items_summary']> = {
	total: 3,
	by_equipment_type: { notebook: 2, desktop: 1, docking: 0, aio: 0, monitor: 0 },
};

const storedBatch = {
	id: 7,
	notes: null,
	items_summary: summary,
} as unknown as IBatch;

const stateWith = (batch: IBatch): TechnicalReviewsState => ({
	...reducer(undefined, { type: '@@init' }),
	batches: [batch],
	selectedBatch: batch,
});

const fulfilled = (payload: IBatch) =>
	updateBatch.fulfilled(payload, 'req', { batchId: payload.id, data: { notes: 'x' } });

describe('updateBatch.fulfilled', () => {
	it('conserva items_summary cuando la respuesta del PATCH no lo trae', () => {
		const response = { id: 7, notes: 'Revisar cargadores' } as unknown as IBatch;
		const next = reducer(stateWith(storedBatch), fulfilled(response));

		expect(next.selectedBatch?.notes).toBe('Revisar cargadores');
		expect(next.selectedBatch?.items_summary).toEqual(summary);
		expect(next.batches[0]?.items_summary).toEqual(summary);
	});

	it('usa el items_summary de la respuesta cuando viene', () => {
		const fresh = {
			total: 1,
			by_equipment_type: { notebook: 1, desktop: 0, docking: 0, aio: 0, monitor: 0 },
		};
		const response = { id: 7, notes: null, items_summary: fresh } as unknown as IBatch;
		const next = reducer(stateWith(storedBatch), fulfilled(response));

		expect(next.selectedBatch?.items_summary).toEqual(fresh);
		expect(next.batches[0]?.items_summary).toEqual(fresh);
	});
});
