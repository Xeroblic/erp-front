import { describe, expect, it } from 'vitest';
import { PROCUREMENT_ERROR_DEFINITIONS } from '@/utils/procurementErrors.util';
import {
	SALE_CLOSE_FORBIDDEN_MESSAGE,
	isSerialsRequiredError,
	resolveSaleCloseError,
	toSaleCloseError,
} from '@/utils/saleCloseErrors.util';

const axiosError = (status: number, data: unknown) => ({
	isAxiosError: true,
	response: { status, data },
});

const shortage409 = axiosError(409, {
	message: 'No hay stock suficiente para cerrar la venta: falta stock en 3 ítems.',
	code: 'SALE_STOCK_INSUFFICIENT',
	context: {
		items: [
			{ sale_item_id: 201, product_id: 31, branch_id: 4, requested: 4, available: 3 },
			{ sale_item_id: 202, product_id: 31, branch_id: 4, requested: 4, available: 3 },
			{ sale_item_id: 203, product_id: 40, branch_id: null, requested: 1, available: 0 },
		],
	},
});

describe('resolveSaleCloseError', () => {
	it('conserva status, code y context del 409 y parsea cada ítem que falta', () => {
		const error = resolveSaleCloseError(shortage409);

		expect(error.status).toBe(409);
		expect(error.code).toBe('SALE_STOCK_INSUFFICIENT');
		expect(error.context).not.toBeNull();
		expect(error.message).toBe(
			'No hay stock suficiente para cerrar la venta: falta stock en 3 ítems.',
		);
		expect(error.shortages).toEqual([
			{ sale_item_id: 201, product_id: 31, branch_id: 4, requested: 4, available: 3 },
			{ sale_item_id: 202, product_id: 31, branch_id: 4, requested: 4, available: 3 },
			{ sale_item_id: 203, product_id: 40, branch_id: null, requested: 1, available: 0 },
		]);
		expect(isSerialsRequiredError(error)).toBe(false);
	});

	it('el 403 por sucursal no pide series y explica el acceso en español', () => {
		const error = resolveSaleCloseError(
			axiosError(403, { message: 'No tienes permiso para realizar esta acción.' }),
		);

		expect(error.status).toBe(403);
		expect(error.message).toBe(SALE_CLOSE_FORBIDDEN_MESSAGE);
		expect(error.shortages).toEqual([]);
		expect(isSerialsRequiredError(error)).toBe(false);
	});

	it('sólo el 422 con `required` pide series', () => {
		const error = resolveSaleCloseError(
			axiosError(422, {
				message: 'Debes indicar las series para los items con seguimiento por serie.',
				required: [{ sale_item_id: 301, product_id: 9, sku: 'NB-1', quantity: 1 }],
			}),
		);

		expect(error.requiredSerialItemIds).toEqual([301]);
		expect(isSerialsRequiredError(error)).toBe(true);
	});

	it('el 422 legado de stock insuficiente se muestra por su message y no pide series', () => {
		const message =
			'Stock insuficiente para el producto Notebook (SKU: NB-1). Disponible: 0, Solicitado: 1';
		const error = resolveSaleCloseError(axiosError(422, { message }));

		expect(error.message).toBe(message);
		expect(error.shortages).toEqual([]);
		expect(isSerialsRequiredError(error)).toBe(false);
	});

	it('ignora `context.items` cuando el código no es el de stock insuficiente', () => {
		const error = resolveSaleCloseError(
			axiosError(409, {
				message: 'Otro conflicto',
				code: 'SALE_ALREADY_CLOSED',
				context: {
					items: [{ sale_item_id: 1, product_id: 1, requested: 1, available: 0 }],
				},
			}),
		);

		expect(error.shortages).toEqual([]);
	});
});

describe('toSaleCloseError', () => {
	it('devuelve tal cual el rechazo tipado del thunk', () => {
		const resolved = resolveSaleCloseError(shortage409);
		expect(toSaleCloseError(resolved)).toBe(resolved);
	});

	it('convierte un SerializedError en un error del cierre con su mensaje', () => {
		const error = toSaleCloseError({ name: 'Error', message: 'Falló algo' });
		expect(error.message).toBe('Falló algo');
		expect(error.shortages).toEqual([]);
	});
});

describe('catálogo de códigos', () => {
	it('reemplaza INSUFFICIENT_BRANCH_STOCK por SALE_STOCK_INSUFFICIENT sin reintento', () => {
		expect(PROCUREMENT_ERROR_DEFINITIONS.INSUFFICIENT_BRANCH_STOCK).toBeUndefined();
		expect(PROCUREMENT_ERROR_DEFINITIONS.SALE_STOCK_INSUFFICIENT).toMatchObject({
			status: 409,
			action: 'blocked',
		});
	});
});
