import React from 'react';
import type { PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import type { Middleware } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, renderHook, waitFor } from '@testing-library/react';
import { toast } from 'react-toastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import purchaseDocumentsReducer from '@/store/slices/procurement/purchaseDocumentsSlice';
import {
	createPurchasableProduct,
	findPurchasableProductBySku,
} from '@/services/procurement/purchasableProducts.service';
import useProcurementProductForm from '../useProcurementProductForm';

/**
 * Alta de producto desde el documento de compra contra el catálogo real.
 *
 * - El SKU se genera en el navegador y el backend lo exige único en la
 *   filial: un 422 sólo en `sku` se reintenta con otro SKU.
 * - El alta no admite `Idempotency-Key`: tras un fallo sin respuesta, el
 *   siguiente envío busca el SKU antes de crear otro producto.
 * - Las marcas son por sucursal: el modal sólo ofrece las de la activa.
 * - El intento incierto vive en el store, por filial: sobrevive al desmontaje
 *   del modal y al cambio de filial.
 */

vi.mock('@/services/procurement/purchasableProducts.service', () => ({
	createPurchasableProduct: vi.fn(),
	findPurchasableProductBySku: vi.fn(),
}));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), info: vi.fn() } }));

const branchContext = vi.hoisted(() => ({ branchId: 1 }));
vi.mock('@/hooks/useCurrentBranch', () => ({ useCurrentBranch: () => ({ ...branchContext }) }));

/** Marcas que responde `GET /branches/{branch}/brands`, por sucursal. */
const brandsByBranch = vi.hoisted(
	(): Record<number, { id: number; name: string; is_active: boolean }[]> => ({
		1: [{ id: 3, name: 'Logitech', is_active: true }],
		2: [{ id: 8, name: 'Kingston', is_active: true }],
	}),
);
const fetchBrandsMock = vi.hoisted(() =>
	vi.fn((args: { branchId: number; search: string }) => ({ type: 'brands/fetch', args })),
);
vi.mock('@/store/slices/brands/brandsSlice', () => ({ fetchBrands: fetchBrandsMock }));
vi.mock('@/store/slices/categories/categoriesSlice', () => ({
	fetchCategories: () => ({ type: 'categories/fetch' }),
}));

vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

const categoriesState = {
	items: [{ id: 12, name: 'Accesorios', is_active: true }],
	loading: false,
};

/** Responde el `fetchBrands` simulado como lo haría su thunk: con `unwrap`. */
const brandsMiddleware: Middleware = () => (next) => (action) => {
	const branchId = (action as { args?: { branchId?: number } }).args?.branchId;
	if (branchId === undefined) return next(action);
	return { unwrap: () => Promise.resolve({ items: brandsByBranch[branchId] ?? [] }) };
};

const createTestStore = () =>
	configureStore({
		reducer: {
			categories: (state = categoriesState) => state,
			purchaseDocuments: purchaseDocumentsReducer,
		},
		middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(brandsMiddleware),
	});

let store = createTestStore();
const wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;

const createMock = vi.mocked(createPurchasableProduct);
const findMock = vi.mocked(findPurchasableProductBySku);

/** Coincide con lo que envía `fill`: nombre, marca 3, tipo general y categoría 12. */
const created = {
	id: 250,
	sku: 'LOGN-MOUS-XXX',
	name: 'Mouse',
	brand_name: 'Logitech',
	serial_tracking: false,
	is_active: true,
	brand_id: 3,
	product_type: 'general',
	category_ids: [12],
};

const validationError = (field: string, message: string) => ({
	isAxiosError: true,
	response: { status: 422, data: { message, errors: { [field]: [message] } } },
});
const networkError = { isAxiosError: true, code: 'ERR_NETWORK', message: 'Network Error' };

type THookResult = { current: ReturnType<typeof useProcurementProductForm> };

const renderForm = async (onSuccess = vi.fn()) => {
	const rendered = renderHook(
		() => useProcurementProductForm({ isOpen: true, subsidiaryId: 4, onSuccess }),
		{ wrapper },
	);
	await waitFor(() => expect(rendered.result.current.brandOptions.length).toBeGreaterThan(0));
	return rendered;
};

const fill = async (result: THookResult, brandId = '3') => {
	await act(async () => {
		await result.current.formik.setValues({
			...result.current.formik.values,
			name: 'Mouse',
			brand_id: brandId,
			category_ids: ['12'],
		});
	});
};

/** Como el botón del modal: crea, concilia o usa el producto ya creado. */
const submit = async (result: THookResult) => {
	await act(async () => {
		await result.current.submit();
	});
};

/** Promesa que el test resuelve o rechaza cuando quiere. */
const deferred = <T,>() => {
	let resolve: (value: T) => void = () => undefined;
	let reject: (reason: unknown) => void = () => undefined;
	const promise = new Promise<T>((onResolve, onReject) => {
		resolve = onResolve;
		reject = onReject;
	});
	return { promise, resolve, reject };
};

beforeEach(() => {
	createMock.mockReset();
	findMock.mockReset();
	vi.mocked(toast.info).mockClear();
	store = createTestStore();
	branchContext.branchId = 1;
});

describe('useProcurementProductForm — alta', () => {
	it('crea el producto en la filial con marca y categorías como ids', async () => {
		createMock.mockResolvedValueOnce(created);
		const onSuccess = vi.fn();
		const { result } = await renderForm(onSuccess);

		await fill(result);
		await submit(result);

		expect(createMock).toHaveBeenCalledTimes(1);
		expect(createMock).toHaveBeenCalledWith(
			4,
			expect.objectContaining({
				name: 'Mouse',
				brand_id: 3,
				category_ids: [12],
				product_type: 'general',
				serial_tracking: false,
				is_active: true,
				sku: expect.any(String),
			}),
		);
		expect(onSuccess).toHaveBeenCalledWith(created);
	});

	it('un SKU repetido se reintenta con otro SKU sin volver a enviar', async () => {
		createMock
			.mockRejectedValueOnce(validationError('sku', 'El sku ya ha sido tomado.'))
			.mockResolvedValueOnce(created);
		const onSuccess = vi.fn();
		const { result } = await renderForm(onSuccess);

		await fill(result);
		await submit(result);

		expect(createMock).toHaveBeenCalledTimes(2);
		expect(createMock.mock.calls[1][1].sku).not.toBe(createMock.mock.calls[0][1].sku);
		expect(onSuccess).toHaveBeenCalledWith(created);
	});

	it('otro error de validación se pinta en el campo y no se reintenta', async () => {
		createMock.mockRejectedValueOnce(validationError('name', 'El nombre es muy largo.'));
		const onSuccess = vi.fn();
		const { result } = await renderForm(onSuccess);

		await fill(result);
		await submit(result);

		expect(createMock).toHaveBeenCalledTimes(1);
		await waitFor(() =>
			expect(result.current.formik.errors.name).toBe('El nombre es muy largo.'),
		);
		expect(onSuccess).not.toHaveBeenCalled();
	});
});

describe('useProcurementProductForm — respuesta perdida', () => {
	it('bloquea el formulario con el intento original y lo concilia usando el existente', async () => {
		createMock.mockRejectedValueOnce(networkError);
		const onSuccess = vi.fn();
		const { result } = await renderForm(onSuccess);
		await fill(result);

		await submit(result);
		const original = createMock.mock.calls[0];
		expect(result.current.isReconciling).toBe(true);
		expect(result.current.sku).toBe(original[1].sku);

		findMock.mockResolvedValueOnce({ ...created, sku: original[1].sku });
		await submit(result);

		expect(findMock).toHaveBeenCalledWith(4, original[1].sku);
		expect(createMock).toHaveBeenCalledTimes(1);
		expect(onSuccess).toHaveBeenCalledWith({ ...created, sku: original[1].sku });
		expect(result.current.isReconciling).toBe(false);
	});

	it('el reintento reenvía el payload original aunque el formulario haya cambiado', async () => {
		createMock.mockRejectedValueOnce(networkError).mockResolvedValueOnce(created);
		const { result } = await renderForm();
		await fill(result);
		await submit(result);
		const [originalSubsidiaryId, originalPayload] = createMock.mock.calls[0];

		await act(async () => {
			await result.current.formik.setValues({
				...result.current.formik.values,
				name: 'Teclado',
				category_ids: [],
			});
		});
		findMock.mockResolvedValueOnce(null);
		await submit(result);

		expect(createMock).toHaveBeenCalledTimes(2);
		expect(createMock.mock.calls[1]).toEqual([originalSubsidiaryId, originalPayload]);
	});

	it('si la filial cambia mientras concilia, no entrega el producto a la nueva', async () => {
		createMock.mockRejectedValueOnce(networkError);
		const onSuccess = vi.fn();
		const { result, rerender } = renderHook(
			({ subsidiaryId }: { subsidiaryId: number }) =>
				useProcurementProductForm({ isOpen: true, subsidiaryId, onSuccess }),
			{ initialProps: { subsidiaryId: 4 }, wrapper },
		);
		await waitFor(() => expect(result.current.brandOptions.length).toBeGreaterThan(0));
		await fill(result);
		await submit(result);
		const originalSku = createMock.mock.calls[0][1].sku;

		let resolveLookup: (product: typeof created) => void = () => undefined;
		findMock.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveLookup = resolve;
			}),
		);
		let reconciling: Promise<void> = Promise.resolve();
		act(() => {
			reconciling = result.current.submit();
		});
		// La filial cambia con la búsqueda ya en vuelo.
		await waitFor(() => expect(findMock).toHaveBeenCalledWith(4, originalSku));
		rerender({ subsidiaryId: 7 });
		await act(async () => {
			resolveLookup({ ...created, sku: originalSku });
			await reconciling;
		});

		expect(findMock).toHaveBeenCalledWith(4, originalSku);
		expect(onSuccess).not.toHaveBeenCalled();
		expect(toast.info).toHaveBeenCalledWith(
			'El producto se creó en la filial anterior; no se agrega a esta línea.',
		);
		expect(store.getState().purchaseDocuments.pendingProductAttempts).toEqual({});
	});

	it('desmontar el modal no descarta el intento: al volver sigue bloqueado', async () => {
		createMock.mockRejectedValueOnce(networkError);
		const first = await renderForm();
		await fill(first.result);
		await submit(first.result);
		const [, originalPayload] = createMock.mock.calls[0];

		// La ficha desmonta el modal al cambiar de filial; salir de la página, también.
		first.unmount();
		const onSuccess = vi.fn();
		const { result } = await renderForm(onSuccess);

		expect(result.current.isReconciling).toBe(true);
		expect(result.current.sku).toBe(originalPayload.sku);
		expect(result.current.formik.values.name).toBe('Mouse');
		expect(result.current.formik.values.category_ids).toEqual(['12']);

		findMock.mockResolvedValueOnce({ ...created, sku: originalPayload.sku });
		await submit(result);

		expect(createMock).toHaveBeenCalledTimes(1);
		expect(onSuccess).toHaveBeenCalledWith({ ...created, sku: originalPayload.sku });
		expect(result.current.isReconciling).toBe(false);
	});

	it('«Reintentar» concilia el intento aunque el formulario no pase la validación', async () => {
		createMock.mockRejectedValueOnce(networkError);
		const { result } = await renderForm();
		await fill(result);
		await submit(result);
		const [, originalPayload] = createMock.mock.calls[0];

		await act(async () => {
			await result.current.formik.setValues({ ...result.current.formik.values, name: '' });
		});
		findMock.mockResolvedValueOnce({ ...created, sku: originalPayload.sku });
		await submit(result);

		expect(findMock).toHaveBeenCalledWith(4, originalPayload.sku);
		expect(result.current.isReconciling).toBe(false);
	});

	it('cerrar el modal no descarta el intento: vuelve con sus valores', async () => {
		createMock.mockRejectedValueOnce(networkError);
		const { result } = await renderForm();
		await fill(result);
		await submit(result);

		act(() => result.current.reset());

		expect(result.current.isReconciling).toBe(true);
		expect(result.current.formik.values.name).toBe('Mouse');
	});

	it('si el SKU era de otro producto, libera el formulario con otro SKU sin entregarlo', async () => {
		createMock.mockRejectedValueOnce(networkError);
		const onSuccess = vi.fn();
		const { result } = await renderForm(onSuccess);
		await fill(result);
		await submit(result);
		const collidingSku = createMock.mock.calls[0][1].sku;

		findMock.mockResolvedValueOnce({ ...created, sku: collidingSku, name: 'Teclado' });
		await submit(result);

		expect(onSuccess).not.toHaveBeenCalled();
		expect(result.current.isReconciling).toBe(false);
		expect(result.current.sku).not.toBe(collidingSku);
		expect(result.current.formik.values.name).toBe('Mouse');
	});

	it('si nada se creó, libera el formulario con los errores del backend', async () => {
		createMock
			.mockRejectedValueOnce(networkError)
			.mockRejectedValueOnce(validationError('name', 'El nombre es muy largo.'));
		const { result } = await renderForm();
		await fill(result);
		await submit(result);

		findMock.mockResolvedValueOnce(null);
		await submit(result);

		expect(result.current.isReconciling).toBe(false);
		await waitFor(() =>
			expect(result.current.formik.errors.name).toBe('El nombre es muy largo.'),
		);
	});
});

describe('useProcurementProductForm — desmontaje con el alta en vuelo', () => {
	const startInFlight = async () => {
		const request = deferred<typeof created>();
		createMock.mockReturnValueOnce(request.promise);
		const first = await renderForm();
		await fill(first.result);
		act(() => {
			void first.result.current.submit();
		});
		await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
		const [, payload] = createMock.mock.calls[0];
		// Cambio de filial en la ficha o salida de la página: el modal se desmonta.
		first.unmount();
		return { request, payload };
	};

	it('al volver, el formulario sigue bloqueado y no deja enviar otra', async () => {
		const { payload } = await startInFlight();
		const { result } = await renderForm();

		expect(result.current.isSubmitting).toBe(true);
		expect(result.current.isAwaitingAttempt).toBe(true);
		expect(result.current.isLocked).toBe(true);
		expect(result.current.formik.values.name).toBe('Mouse');
		expect(result.current.sku).toBe(payload.sku);

		await submit(result);
		await act(async () => {
			await result.current.formik.submitForm();
		});

		expect(createMock).toHaveBeenCalledTimes(1);
	});

	it('si se crea después de volver, se entrega con «Usar producto» y sin otro POST', async () => {
		const { request, payload } = await startInFlight();
		const onSuccess = vi.fn();
		const { result } = await renderForm(onSuccess);

		await act(async () => {
			request.resolve({ ...created, sku: payload.sku });
			await request.promise;
		});
		await waitFor(() => expect(result.current.recoveredProduct).not.toBeNull());
		expect(result.current.isSubmitting).toBe(false);
		expect(onSuccess).not.toHaveBeenCalled();

		await submit(result);

		expect(onSuccess).toHaveBeenCalledWith({ ...created, sku: payload.sku });
		expect(createMock).toHaveBeenCalledTimes(1);
		expect(store.getState().purchaseDocuments.pendingProductAttempts).toEqual({});
	});

	it('si el error llega después de volver, «Reintentar» concilia con los valores del intento', async () => {
		const { request, payload } = await startInFlight();
		const onSuccess = vi.fn();
		const { result } = await renderForm(onSuccess);

		await act(async () => {
			request.reject(networkError);
			await request.promise.catch(() => undefined);
		});
		await waitFor(() => expect(result.current.isReconciling).toBe(true));
		expect(result.current.formik.values.name).toBe('Mouse');

		findMock.mockResolvedValueOnce({ ...created, sku: payload.sku });
		await submit(result);

		expect(findMock).toHaveBeenCalledWith(4, payload.sku);
		expect(createMock).toHaveBeenCalledTimes(1);
		expect(onSuccess).toHaveBeenCalledWith({ ...created, sku: payload.sku });
	});

	it('cerrar sin usar el producto ya creado lo descarta y libera el formulario', async () => {
		const { request, payload } = await startInFlight();
		const { result } = await renderForm();
		await act(async () => {
			request.resolve({ ...created, sku: payload.sku });
			await request.promise;
		});
		await waitFor(() => expect(result.current.recoveredProduct).not.toBeNull());

		act(() => result.current.reset());

		expect(result.current.recoveredProduct).toBeNull();
		expect(result.current.isLocked).toBe(false);
		expect(result.current.formik.values.name).toBe('');
	});
});

describe('useProcurementProductForm — cambio de filial', () => {
	it('la otra filial abre libre y al volver reaparece el intento pendiente', async () => {
		createMock.mockRejectedValueOnce(networkError);
		const { result, rerender } = renderHook(
			({ subsidiaryId }: { subsidiaryId: number }) =>
				useProcurementProductForm({ isOpen: true, subsidiaryId }),
			{ initialProps: { subsidiaryId: 4 }, wrapper },
		);
		await waitFor(() => expect(result.current.brandOptions.length).toBeGreaterThan(0));
		await fill(result);
		await submit(result);
		const originalSku = createMock.mock.calls[0][1].sku;

		rerender({ subsidiaryId: 7 });
		await waitFor(() => expect(result.current.formik.values.name).toBe(''));
		expect(result.current.isReconciling).toBe(false);

		rerender({ subsidiaryId: 4 });
		await waitFor(() => expect(result.current.formik.values.name).toBe('Mouse'));
		expect(result.current.isReconciling).toBe(true);
		expect(result.current.sku).toBe(originalSku);
	});

	it('descarta el borrador de la filial anterior', async () => {
		const { result, rerender } = renderHook(
			({ subsidiaryId }: { subsidiaryId: number }) =>
				useProcurementProductForm({ isOpen: true, subsidiaryId }),
			{ initialProps: { subsidiaryId: 4 }, wrapper },
		);
		await waitFor(() => expect(result.current.brandOptions.length).toBeGreaterThan(0));
		await fill(result);

		rerender({ subsidiaryId: 7 });

		await waitFor(() => expect(result.current.formik.values.name).toBe(''));
		expect(result.current.formik.values.brand_id).toBe('');
		expect(result.current.sku).toBe('');
	});
});

describe('useProcurementProductForm — marcas por sucursal', () => {
	it('sólo ofrece las marcas de la sucursal activa', async () => {
		const { result, rerender } = await renderForm();
		expect(result.current.brandOptions).toEqual([{ value: '3', label: 'Logitech' }]);

		branchContext.branchId = 2;
		rerender();

		// Desde el primer render: nada de la sucursal anterior mientras carga la nueva.
		expect(result.current.brandOptions).toEqual([]);
		expect(result.current.loadingBrands).toBe(true);
		await waitFor(() =>
			expect(result.current.brandOptions).toEqual([{ value: '8', label: 'Kingston' }]),
		);
	});

	it('una marca elegida en otra sucursal no se envía', async () => {
		const { result, rerender } = await renderForm();
		await fill(result, '3');

		branchContext.branchId = 2;
		rerender();
		await waitFor(() => expect(result.current.brandOptions.length).toBeGreaterThan(0));
		await submit(result);

		expect(createMock).not.toHaveBeenCalled();
		await waitFor(() =>
			expect(result.current.formik.errors.brand_id).toBe(
				'Selecciona una marca de la sucursal activa.',
			),
		);
	});
});
