import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPurchasableProduct } from '@/services/procurement/purchasableProducts.service';
import useProcurementProductForm from '../useProcurementProductForm';

/**
 * Alta de producto desde el documento de compra contra el catálogo real. El
 * SKU se genera en el navegador y el backend lo exige único en la filial: un
 * 422 sólo en `sku` se reintenta con otro SKU sin que el usuario reenvíe.
 */

vi.mock('@/services/procurement/purchasableProducts.service', () => ({
	createPurchasableProduct: vi.fn(),
}));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn() } }));
vi.mock('@/hooks/useCurrentBranch', () => ({ useCurrentBranch: () => ({ branchId: 1 }) }));

const storeState = vi.hoisted(() => ({
	brands: {
		items: [{ id: 3, name: 'Logitech', is_active: true }],
		loading: false,
		lastBranchId: 1,
	},
	categories: { items: [{ id: 12, name: 'Accesorios', is_active: true }], loading: false },
}));
vi.mock('@/store', () => ({
	useAppDispatch: () => vi.fn(),
	useAppSelector: (selector: (state: typeof storeState) => unknown) => selector(storeState),
}));

const createMock = vi.mocked(createPurchasableProduct);

const created = {
	id: 250,
	sku: 'LOGN-MOUS-XXX',
	name: 'Mouse',
	brand_name: 'Logitech',
	serial_tracking: false,
	is_active: true,
};

const validationError = (field: string, message: string) => ({
	isAxiosError: true,
	response: { status: 422, data: { message, errors: { [field]: [message] } } },
});

const fillAndSubmit = async (result: { current: ReturnType<typeof useProcurementProductForm> }) => {
	await act(async () => {
		await result.current.formik.setValues({
			...result.current.formik.values,
			name: 'Mouse',
			brand_id: '3',
			category_ids: ['12'],
		});
	});
	await act(async () => {
		await result.current.formik.submitForm();
	});
};

beforeEach(() => {
	createMock.mockReset();
});

describe('useProcurementProductForm', () => {
	it('crea el producto en la filial con marca y categorías como ids', async () => {
		createMock.mockResolvedValueOnce(created);
		const onSuccess = vi.fn();
		const { result } = renderHook(() =>
			useProcurementProductForm({ isOpen: true, subsidiaryId: 4, onSuccess }),
		);

		await fillAndSubmit(result);

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
		const { result } = renderHook(() =>
			useProcurementProductForm({ isOpen: true, subsidiaryId: 4, onSuccess }),
		);

		await fillAndSubmit(result);

		expect(createMock).toHaveBeenCalledTimes(2);
		const firstSku = createMock.mock.calls[0][1].sku;
		const secondSku = createMock.mock.calls[1][1].sku;
		expect(secondSku).not.toBe(firstSku);
		expect(onSuccess).toHaveBeenCalledWith(created);
	});

	it('otro error de validación se pinta en el campo y no se reintenta', async () => {
		createMock.mockRejectedValueOnce(validationError('brand_id', 'La marca no existe.'));
		const onSuccess = vi.fn();
		const { result } = renderHook(() =>
			useProcurementProductForm({ isOpen: true, subsidiaryId: 4, onSuccess }),
		);

		await fillAndSubmit(result);

		expect(createMock).toHaveBeenCalledTimes(1);
		await waitFor(() =>
			expect(result.current.formik.errors.brand_id).toBe('La marca no existe.'),
		);
		expect(onSuccess).not.toHaveBeenCalled();
	});
});
