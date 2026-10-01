import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createPurchasableProduct,
	findPurchasableProductBySku,
} from '@/services/procurement/purchasableProducts.service';
import { reconcileProductAttempt } from '../productAttemptReconciliation';

/**
 * Conciliación de un alta de producto cuyo resultado no se supo. La regla
 * que importa: el SKU del intento original nunca se regenera, así que un
 * reintento no puede crear un segundo producto.
 */

vi.mock('@/services/procurement/purchasableProducts.service', () => ({
	createPurchasableProduct: vi.fn(),
	findPurchasableProductBySku: vi.fn(),
}));

const createMock = vi.mocked(createPurchasableProduct);
const findMock = vi.mocked(findPurchasableProductBySku);

const attempt = {
	subsidiaryId: 4,
	payload: {
		name: 'Mouse',
		sku: 'LOGN-MOUS-A1B',
		brand_id: 3,
		product_type: 'general',
		serial_tracking: false,
		is_active: true,
		category_ids: [12],
	},
};

/** Lo que habría creado `attempt`: mismo SKU, nombre, marca, tipo, serie, estado y categorías. */
const product = {
	id: 250,
	sku: 'LOGN-MOUS-A1B',
	name: 'Mouse',
	brand_name: 'Logitech',
	serial_tracking: false,
	is_active: true,
	brand_id: 3,
	product_type: 'general',
	category_ids: [12],
};

/** Con el SKU del intento pero otros datos: otro producto, o el mismo editado o a medias. */
const otherProduct = { ...product, id: 99, name: 'Teclado', brand_id: 5, category_ids: [] };

const httpError = (status: number, errors?: Record<string, string[]>) => ({
	isAxiosError: true,
	response: { status, data: { message: `Error ${status}`, ...(errors ? { errors } : {}) } },
});
const networkError = { isAxiosError: true, code: 'ERR_NETWORK', message: 'Network Error' };
const skuTaken = httpError(422, { sku: ['El sku ya ha sido tomado.'] });

beforeEach(() => {
	createMock.mockReset();
	findMock.mockReset();
});

describe('reconcileProductAttempt', () => {
	it('si el SKU ya existe, lo usa sin volver a enviar el alta', async () => {
		findMock.mockResolvedValueOnce(product);

		await expect(reconcileProductAttempt(attempt)).resolves.toEqual({
			kind: 'found',
			product,
		});
		expect(findMock).toHaveBeenCalledWith(4, 'LOGN-MOUS-A1B');
		expect(createMock).not.toHaveBeenCalled();
	});

	it('si no existe, reenvía el payload original a la filial original', async () => {
		findMock.mockResolvedValueOnce(null);
		createMock.mockResolvedValueOnce(product);

		await expect(reconcileProductAttempt(attempt)).resolves.toEqual({
			kind: 'created',
			product,
		});
		expect(createMock).toHaveBeenCalledWith(4, attempt.payload);
	});

	it('si el primer alta termina después de la búsqueda, el 422 en sku se concilia sin regenerar', async () => {
		findMock.mockResolvedValueOnce(null).mockResolvedValueOnce(product);
		createMock.mockRejectedValueOnce(skuTaken);

		await expect(reconcileProductAttempt(attempt)).resolves.toEqual({
			kind: 'found',
			product,
		});
		expect(createMock).toHaveBeenCalledTimes(1);
		expect(findMock).toHaveBeenCalledTimes(2);
	});

	it('sin view-product reenvía el alta: si se crea, se usa', async () => {
		findMock.mockRejectedValueOnce(httpError(403));
		createMock.mockResolvedValueOnce(product);

		await expect(reconcileProductAttempt(attempt)).resolves.toEqual({
			kind: 'created',
			product,
		});
	});

	it('sin view-product y con el SKU tomado sigue incierto: no puede saber de quién es', async () => {
		findMock.mockRejectedValueOnce(httpError(403));
		createMock.mockRejectedValueOnce(skuTaken);

		const outcome = await reconcileProductAttempt(attempt);

		expect(outcome.kind).toBe('still_uncertain');
		expect(findMock).toHaveBeenCalledTimes(1);
		expect(createMock).toHaveBeenCalledTimes(1);
	});

	it('un producto con ese SKU pero otros datos no se entrega ni se reenvía: sigue incierto', async () => {
		findMock.mockResolvedValueOnce(otherProduct);

		const outcome = await reconcileProductAttempt(attempt);

		expect(outcome.kind).toBe('still_uncertain');
		expect(createMock).not.toHaveBeenCalled();
	});

	it('si tras el 422 en sku el producto tiene otros datos, sigue incierto en vez de entregarlo', async () => {
		findMock.mockResolvedValueOnce(null).mockResolvedValueOnce(otherProduct);
		createMock.mockRejectedValueOnce(skuTaken);

		const outcome = await reconcileProductAttempt(attempt);

		expect(outcome.kind).toBe('still_uncertain');
		expect(createMock).toHaveBeenCalledTimes(1);
	});

	it('un alta que guardó el producto pero no sus categorías sigue incierta: liberarla lo duplicaría', async () => {
		// El backend crea el producto y después sincroniza las categorías, sin
		// una transacción: si lo segundo falla, queda el producto sin ellas.
		findMock.mockResolvedValueOnce({ ...product, category_ids: [] });

		const outcome = await reconcileProductAttempt(attempt);

		expect(outcome.kind).toBe('still_uncertain');
		expect(createMock).not.toHaveBeenCalled();
	});

	it.each([
		['nombre', { name: 'Mouse gamer' }],
		['marca', { brand_id: 4 }],
		['tipo', { product_type: 'notebook' }],
		['serie', { serial_tracking: true }],
		['estado', { is_active: false }],
		['categorías', { category_ids: [12, 13] }],
	])(
		'una diferencia de %s basta para no entregarlo, sin dar el alta por fallida',
		async (_field, change) => {
			findMock.mockResolvedValueOnce({ ...product, ...change });

			const outcome = await reconcileProductAttempt(attempt);

			expect(outcome.kind).toBe('still_uncertain');
			expect(createMock).not.toHaveBeenCalled();
		},
	);

	it('si la búsqueda falla, no envía nada y sigue pendiente', async () => {
		findMock.mockRejectedValueOnce(networkError);

		const outcome = await reconcileProductAttempt(attempt);

		expect(outcome.kind).toBe('still_uncertain');
		expect(createMock).not.toHaveBeenCalled();
	});

	it('un 422 en sku que no se puede leer después sigue pendiente, sin regenerar', async () => {
		findMock.mockResolvedValueOnce(null).mockRejectedValueOnce(networkError);
		createMock.mockRejectedValueOnce(skuTaken);

		const outcome = await reconcileProductAttempt(attempt);

		expect(outcome.kind).toBe('still_uncertain');
		expect(createMock).toHaveBeenCalledTimes(1);
	});

	it('otro fallo incierto al reenviar sigue pendiente', async () => {
		findMock.mockResolvedValueOnce(null);
		createMock.mockRejectedValueOnce(networkError);

		const outcome = await reconcileProductAttempt(attempt);

		expect(outcome.kind).toBe('still_uncertain');
	});

	it('un 422 sin error de sku prueba que nada se creó', async () => {
		findMock.mockResolvedValueOnce(null);
		createMock.mockRejectedValueOnce(httpError(422, { brand_id: ['La marca no existe.'] }));

		const outcome = await reconcileProductAttempt(attempt);

		expect(outcome.kind).toBe('not_created');
		expect(outcome.kind === 'not_created' && outcome.error.fieldErrors).toEqual({
			brand_id: ['La marca no existe.'],
		});
	});
});
