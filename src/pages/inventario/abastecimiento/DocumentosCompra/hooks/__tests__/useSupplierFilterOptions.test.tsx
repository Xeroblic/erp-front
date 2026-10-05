import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listProcurementSuppliers } from '@/services/procurement/procurementSuppliers.service';
import type {
	IApiCollectionEnvelope,
	IProcurementSupplierListRow,
} from '@/interface/procurement.interface';
import useSupplierFilterOptions from '../useSupplierFilterOptions';

vi.mock('@/services/procurement/procurementSuppliers.service', () => ({
	listProcurementSuppliers: vi.fn(),
}));

const authorizeMock = vi.hoisted(() => vi.fn<() => boolean>(() => true));
vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ authorize: authorizeMock }),
}));

const listMock = vi.mocked(listProcurementSuppliers);

const row = (id: number, displayName: string, isActive = true): IProcurementSupplierListRow => ({
	id,
	rut: `7600000${id}-0`,
	display_name: displayName,
	company_name: displayName,
	contact_name: null,
	business_activity: null,
	email: null,
	phone: null,
	is_active: isActive,
});

const envelope = (
	rows: IProcurementSupplierListRow[],
): IApiCollectionEnvelope<IProcurementSupplierListRow> => ({
	data: rows,
	links: { first: '?page=1', last: '?page=1', prev: null, next: null },
	meta: {
		current_page: 1,
		from: 1,
		last_page: 1,
		links: [],
		path: '/api/subsidiaries/4/procurement/suppliers',
		per_page: 100,
		to: rows.length,
		total: rows.length,
	},
});

describe('useSupplierFilterOptions', () => {
	beforeEach(() => {
		listMock.mockReset();
		authorizeMock.mockReturnValue(true);
	});

	it('incluye los inactivos, marcados, porque sus documentos siguen siendo historia', async () => {
		listMock.mockResolvedValue(envelope([row(2, 'Zeta'), row(5, 'Alfa', false)]));

		const { result } = renderHook(() => useSupplierFilterOptions(4, null));

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(listMock).toHaveBeenCalledWith(4, { per_page: 100, include_inactive: 1 });
		expect(result.current.options).toEqual([
			{ value: '5', label: 'Alfa (inactivo)' },
			{ value: '2', label: 'Zeta' },
		]);
	});

	it('muestra el proveedor elegido aunque no venga en la lista', async () => {
		listMock.mockResolvedValue(envelope([row(2, 'Zeta')]));

		const { result } = renderHook(() => useSupplierFilterOptions(4, 99));

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.options[0]).toEqual({ value: '99', label: 'Proveedor #99' });
	});

	it('sin view-procurement-supplier no pide la lista', () => {
		authorizeMock.mockReturnValue(false);

		const { result } = renderHook(() => useSupplierFilterOptions(4, null));

		expect(listMock).not.toHaveBeenCalled();
		expect(result.current).toMatchObject({ canList: false, loading: false, options: [] });
	});
});
