import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProcurementSupplier } from '@/services/procurement/procurementSuppliers.service';
import type {
	IProcurementSupplier,
	TProcurementAllowedAction,
} from '@/interface/procurement.interface';
import useSupplierInlineEdit from '../useSupplierInlineEdit';

vi.mock('@/services/procurement/procurementSuppliers.service', () => ({
	getProcurementSupplier: vi.fn(),
}));

const toastSpies = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('react-toastify', () => ({ toast: toastSpies }));

const getMock = vi.mocked(getProcurementSupplier);
const SUBSIDIARY_ID = 2;

const supplier = (allowedActions: TProcurementAllowedAction[]): IProcurementSupplier => ({
	id: 7,
	rut: '76000007-0',
	company_name: 'Proveedor Siete',
	contact_name: null,
	business_activity: null,
	billing_address: null,
	billing_commune_id: null,
	billing_commune: null,
	shipping_address: null,
	shipping_commune_id: null,
	shipping_commune: null,
	phone: null,
	email: null,
	display_name: 'Proveedor Siete',
	is_active: true,
	created_at: '2026-09-01T12:00:00Z',
	updated_at: '2026-09-01T12:00:00Z',
	deleted_at: null,
	allowed_actions: allowedActions,
	purchase_summary: {
		last_purchase_on: null,
		received_units: 0,
		products_supplied_count: 0,
		receipt_count: 0,
	},
});

describe('useSupplierInlineEdit', () => {
	beforeEach(() => {
		getMock.mockReset();
		toastSpies.error.mockReset();
	});

	it('carga la ficha completa del proveedor elegido para editarla', async () => {
		const full = supplier(['update', 'deactivate']);
		getMock.mockResolvedValue({ data: full });
		const { result } = renderHook(() => useSupplierInlineEdit(SUBSIDIARY_ID));

		await act(() => result.current.openSupplierEdit(7));

		expect(getMock).toHaveBeenCalledWith(SUBSIDIARY_ID, 7);
		expect(result.current.editingSupplier).toEqual(full);
		expect(result.current.isLoadingSupplier).toBe(false);
	});

	it('no abre la edición si el servidor no ofrece update', async () => {
		getMock.mockResolvedValue({ data: supplier(['restore']) });
		const { result } = renderHook(() => useSupplierInlineEdit(SUBSIDIARY_ID));

		await act(() => result.current.openSupplierEdit(7));

		expect(result.current.editingSupplier).toBeNull();
		expect(toastSpies.error).toHaveBeenCalledWith('Este proveedor no se puede editar.');
	});

	it('avisa y no abre la edición si la carga falla', async () => {
		getMock.mockRejectedValue(new Error('404'));
		const { result } = renderHook(() => useSupplierInlineEdit(SUBSIDIARY_ID));

		await act(() => result.current.openSupplierEdit(7));

		expect(result.current.editingSupplier).toBeNull();
		expect(result.current.isLoadingSupplier).toBe(false);
		expect(toastSpies.error).toHaveBeenCalledWith('No se pudo cargar el proveedor.');
	});

	it('sin filial no pide nada', async () => {
		const { result } = renderHook(() => useSupplierInlineEdit(null));

		await act(() => result.current.openSupplierEdit(7));

		expect(getMock).not.toHaveBeenCalled();
	});

	it('cerrar descarta el proveedor en edición', async () => {
		getMock.mockResolvedValue({ data: supplier(['update']) });
		const { result } = renderHook(() => useSupplierInlineEdit(SUBSIDIARY_ID));

		await act(() => result.current.openSupplierEdit(7));
		act(() => result.current.closeSupplierEdit());

		expect(result.current.editingSupplier).toBeNull();
	});
});
