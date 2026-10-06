import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { IWorkItem } from '../../types';

const { fetchData, toastError, toastSuccess } = vi.hoisted(() => ({
	fetchData: vi.fn(),
	toastError: vi.fn(),
	toastSuccess: vi.fn(),
}));

vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('react-toastify', () => ({
	toast: { error: toastError, success: toastSuccess },
}));

import { useStockAdjustment } from '../useStockAdjustment';

const item: IWorkItem = {
	productId: 7,
	name: 'Cable HDMI',
	sku: 'HDMI-1',
	stock: 10,
	price: 1000,
	quantity: '3',
	branchId: 2,
	subsidiaryId: 4,
};

const denied = () => {
	throw new DOMException('Storage disabled', 'SecurityError');
};

describe('useStockAdjustment con sessionStorage no disponible', () => {
	beforeEach(() => {
		fetchData.mockReset().mockResolvedValue({ status: 202, data: { batch_id: 'b-1' } });
		toastError.mockReset();
		toastSuccess.mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('monta el hook sin lanzar cuando leer el storage falla', () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(denied);
		const { result } = renderHook(() => useStockAdjustment());
		expect(result.current.lastBatchId).toBeNull();
	});

	it('informa éxito cuando el backend aceptó el lote aunque no se pueda persistir', async () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(denied);
		const { result } = renderHook(() => useStockAdjustment());
		const onSuccess = vi.fn();

		let ok = false;
		await act(async () => {
			ok = await result.current.submitBatchAdjustment(
				[item],
				'2',
				'Compra factura 123',
				'',
				4,
				'ingreso',
				onSuccess,
			);
		});

		expect(ok).toBe(true);
		expect(onSuccess).toHaveBeenCalledTimes(1);
		expect(toastError).not.toHaveBeenCalled();
		expect(result.current.lastBatchId).toBe('b-1');
	});
});
