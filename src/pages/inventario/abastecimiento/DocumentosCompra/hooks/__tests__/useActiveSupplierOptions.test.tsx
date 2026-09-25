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

/** Carga que nunca responde: deja la petición en vuelo durante la prueba. */
const neverResolves = (): Promise<IApiCollectionEnvelope<IProcurementSupplierListRow>> =>
	new Promise(() => {
		// Sin resolver a propósito.
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

describe('useActiveSupplierOptions — propiedad de filial', () => {
	beforeEach(() => {
		listMock.mockReset();
	});

	it('oculta los proveedores de la filial anterior desde el primer render del cambio', async () => {
		listMock.mockResolvedValueOnce(envelope([row(7, 'PCExpress')]));
		listMock.mockImplementationOnce(neverResolves);
		const renders: number[][] = [];
		const { result, rerender } = renderHook(
			({ subsidiaryId }) => {
				const options = useActiveSupplierOptions(subsidiaryId, true);
				renders.push(options.suppliers.map((supplier) => supplier.id));
				return options;
			},
			{ initialProps: { subsidiaryId: 2 } },
		);
		await waitFor(() => expect(result.current.suppliers.map((s) => s.id)).toEqual([7]));

		renders.length = 0;
		rerender({ subsidiaryId: 4 });

		expect(renders.every((ids) => ids.length === 0)).toBe(true);
		expect(result.current.suppliers).toEqual([]);
		expect(result.current.loading).toBe(true);
	});

	it('al reabrir en otra filial no muestra la lista de la anterior mientras carga', async () => {
		listMock.mockResolvedValueOnce(envelope([row(7, 'PCExpress')]));
		listMock.mockImplementationOnce(neverResolves);
		const { result, rerender } = renderHook(
			({ subsidiaryId, isOpen }) => useActiveSupplierOptions(subsidiaryId, isOpen),
			{ initialProps: { subsidiaryId: 2, isOpen: true } },
		);
		await waitFor(() => expect(result.current.suppliers.map((s) => s.id)).toEqual([7]));

		rerender({ subsidiaryId: 2, isOpen: false });
		rerender({ subsidiaryId: 4, isOpen: false });
		rerender({ subsidiaryId: 4, isOpen: true });

		expect(result.current.suppliers).toEqual([]);
		expect(result.current.loading).toBe(true);
	});

	it('una respuesta tardía de la filial anterior no se muestra en la nueva', async () => {
		let resolveFirst: (
			value: IApiCollectionEnvelope<IProcurementSupplierListRow>,
		) => void = () => undefined;
		listMock.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveFirst = resolve;
				}),
		);
		listMock.mockImplementationOnce(neverResolves);
		const { result, rerender } = renderHook(
			({ subsidiaryId }) => useActiveSupplierOptions(subsidiaryId, true),
			{ initialProps: { subsidiaryId: 2 } },
		);

		rerender({ subsidiaryId: 4 });
		await act(async () => {
			resolveFirst(envelope([row(7, 'PCExpress')]));
			await Promise.resolve();
		});

		expect(result.current.suppliers).toEqual([]);
		expect(result.current.loading).toBe(true);
	});
});

describe('useActiveSupplierOptions — lista no disponible', () => {
	beforeEach(() => {
		listMock.mockReset();
	});

	it('distingue un 403 de una lista vacía', async () => {
		listMock.mockRejectedValue({ response: { status: 403, data: { message: 'Forbidden' } } });
		const { result } = renderHook(() => useActiveSupplierOptions(2, true));

		await waitFor(() => expect(result.current.unavailableReason).toBe('forbidden'));
		expect(result.current.suppliers).toEqual([]);
		expect(result.current.loading).toBe(false);
	});

	it('marca como fallo cualquier otro error y reload lo recupera', async () => {
		listMock.mockRejectedValueOnce({ response: { status: 500, data: {} } });
		listMock.mockResolvedValueOnce(envelope([row(7, 'PCExpress')]));
		const { result } = renderHook(() => useActiveSupplierOptions(2, true));
		await waitFor(() => expect(result.current.unavailableReason).toBe('failed'));

		act(() => result.current.reload());
		expect(result.current.unavailableReason).toBeNull();

		await waitFor(() =>
			expect(result.current.suppliers.map((supplier) => supplier.id)).toEqual([7]),
		);
		expect(result.current.unavailableReason).toBeNull();
	});

	it('el 403 de una filial no se arrastra a otra', async () => {
		listMock.mockRejectedValueOnce({ response: { status: 403, data: {} } });
		listMock.mockImplementationOnce(neverResolves);
		const { result, rerender } = renderHook(
			({ subsidiaryId }) => useActiveSupplierOptions(subsidiaryId, true),
			{ initialProps: { subsidiaryId: 2 } },
		);
		await waitFor(() => expect(result.current.unavailableReason).toBe('forbidden'));

		rerender({ subsidiaryId: 4 });

		expect(result.current.unavailableReason).toBeNull();
		expect(result.current.loading).toBe(true);
	});
});
