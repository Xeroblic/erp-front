import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listProcurementSuppliers } from '@/services/procurement/procurementSuppliers.service';
import type {
	IApiCollectionEnvelope,
	IProcurementSupplierListRow,
} from '@/interface/procurement.interface';
import useActiveSupplierOptions from '../useActiveSupplierOptions';

vi.mock('@/services/procurement/procurementSuppliers.service', () => ({
	listProcurementSuppliers: vi.fn(),
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
		from: rows.length === 0 ? null : 1,
		last_page: 1,
		links: [],
		path: '/api/subsidiaries/2/procurement/suppliers',
		per_page: 100,
		to: rows.length === 0 ? null : rows.length,
		total: rows.length,
	},
});

describe('useActiveSupplierOptions — alta en línea', () => {
	beforeEach(() => {
		listMock.mockReset();
	});

	it('suma el proveedor creado, ordenado por nombre, y una carga tardía no lo borra', async () => {
		let resolveLoad: (
			value: IApiCollectionEnvelope<IProcurementSupplierListRow>,
		) => void = () => undefined;
		listMock.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveLoad = resolve;
				}),
		);

		const { result } = renderHook(() => useActiveSupplierOptions(2, true));
		act(() => result.current.addSupplier(row(30, 'Beta Ltda')));
		expect(result.current.suppliers.map((supplier) => supplier.id)).toEqual([30]);

		await act(async () => {
			resolveLoad(envelope([row(7, 'PCExpress'), row(15, 'Alfa SpA')]));
			await Promise.resolve();
		});

		expect(result.current.suppliers.map((supplier) => supplier.display_name)).toEqual([
			'Alfa SpA',
			'Beta Ltda',
			'PCExpress',
		]);
	});

	it('lo agregado en una filial no aparece en otra', async () => {
		listMock.mockResolvedValue(envelope([]));
		const { result, rerender } = renderHook(
			({ subsidiaryId }) => useActiveSupplierOptions(subsidiaryId, true),
			{ initialProps: { subsidiaryId: 2 } },
		);
		await waitFor(() => expect(result.current.loading).toBe(false));

		act(() => result.current.addSupplier(row(30, 'Beta Ltda')));
		rerender({ subsidiaryId: 4 });

		expect(result.current.suppliers).toEqual([]);
	});

	it('reload vuelve a pedir la lista', async () => {
		listMock.mockResolvedValueOnce(envelope([]));
		listMock.mockResolvedValueOnce(envelope([row(7, 'PCExpress')]));
		const { result } = renderHook(() => useActiveSupplierOptions(2, true));
		await waitFor(() => expect(result.current.loading).toBe(false));

		act(() => result.current.reload());

		await waitFor(() =>
			expect(result.current.suppliers.map((supplier) => supplier.id)).toEqual([7]),
		);
		expect(listMock).toHaveBeenCalledTimes(2);
	});
});
