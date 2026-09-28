import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const storeState = vi.hoisted(() => ({
	categories: { items: [{ id: 12, name: 'Accesorios', is_active: true }], loading: false },
}));
const dispatchMock = vi.hoisted(() =>
	vi.fn((action: { type: string; args?: { branchId: number } }) => ({
		unwrap: () =>
			Promise.resolve({ items: action.args ? brandsByBranch[action.args.branchId] : [] }),
	})),
);
vi.mock('@/store', () => ({
	useAppDispatch: () => dispatchMock,
	useAppSelector: (selector: (state: typeof storeState) => unknown) => selector(storeState),
}));

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
	const rendered = renderHook(() =>
		useProcurementProductForm({ isOpen: true, subsidiaryId: 4, onSuccess }),
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

const submit = async (result: THookResult) => {
	await act(async () => {
		await result.current.formik.submitForm();
	});
};

beforeEach(() => {
	createMock.mockReset();
	findMock.mockReset();
	dispatchMock.mockClear();
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

	it('concilia en la filial original y no entrega el producto a otra', async () => {
		createMock.mockRejectedValueOnce(networkError);
		const onSuccess = vi.fn();
		const { result, rerender } = renderHook(
			({ subsidiaryId }: { subsidiaryId: number }) =>
				useProcurementProductForm({ isOpen: true, subsidiaryId, onSuccess }),
			{ initialProps: { subsidiaryId: 4 } },
		);
		await waitFor(() => expect(result.current.brandOptions.length).toBeGreaterThan(0));
		await fill(result);
		await submit(result);

		rerender({ subsidiaryId: 7 });
		findMock.mockResolvedValueOnce({ ...created, sku: createMock.mock.calls[0][1].sku });
		await submit(result);

		expect(findMock).toHaveBeenCalledWith(4, createMock.mock.calls[0][1].sku);
		expect(onSuccess).not.toHaveBeenCalled();
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

describe('useProcurementProductForm — cambio de filial', () => {
	it('descarta el borrador de la filial anterior', async () => {
		const { result, rerender } = renderHook(
			({ subsidiaryId }: { subsidiaryId: number }) =>
				useProcurementProductForm({ isOpen: true, subsidiaryId }),
			{ initialProps: { subsidiaryId: 4 } },
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
