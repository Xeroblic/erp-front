import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProductPurchases from '@/pages/inventario/Inventario/InventarioProducto/components/ProductPurchases';
import type {
	IApiPaginationMeta,
	IProcurementCost,
	IProductPurchaseHistoryResponse,
	IProductPurchaseHistoryRow,
	IProductSupplierPurchasesRow,
	IProductSuppliersResponse,
} from '@/interface/procurement.interface';

const service = vi.hoisted(() => ({
	listProductSuppliers: vi.fn(),
	listProductPurchaseHistory: vi.fn(),
}));
vi.mock('@/services/procurement/productPurchases.service', () => service);
// Recepciones lee la API real: el ID de la recepción enlaza a su ficha.
vi.mock('@/config/inventoryReceipts.config', () => ({ default: false }));
const granted = { perms: new Set<string>() };
// `Icon` lee la personalización del store (sin slice usa la de fábrica) y
// `DetailLink` los permisos de `auth`.
vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return { useAppDispatch: redux.useDispatch, useAppSelector: redux.useSelector };
});
const knownCost = (effective: string): IProcurementCost => ({
	currency_code: 'CLP',
	entered_unit_amount: effective,
	entered_basis: 'net',
	vat_rate_percent: '19.00',
	net_unit_amount: effective,
	vat_unit_amount: null,
	gross_unit_amount: null,
	effective_unit_amount: effective,
	effective_basis: 'net',
	source: 'document',
	calculation: 'single_price',
});

const unknownCost: IProcurementCost = {
	currency_code: 'CLP',
	entered_unit_amount: null,
	entered_basis: 'unknown',
	vat_rate_percent: null,
	net_unit_amount: null,
	vat_unit_amount: null,
	gross_unit_amount: null,
	effective_unit_amount: null,
	effective_basis: 'unknown',
	source: 'unknown',
	calculation: 'unknown',
};

const supplierRow = (
	id: number,
	name: string,
	overrides: Partial<IProductSupplierPurchasesRow> = {},
): IProductSupplierPurchasesRow => ({
	supplier: { id, display_name: name, rut: `76.000.00${id}-K`, is_active: true },
	last_purchase: {
		stock_receipt_id: 80 + id,
		received_on: '2026-09-04',
		days_since_purchase: 3,
		quantity: 15,
		cost: knownCost('4800.00'),
		purchase_document: {
			id: 20 + id,
			document_type: 'invoice',
			document_number: `12${id}`,
			issue_date: '2026-09-04',
		},
	},
	receipt_count: 2,
	total_units_received: 30,
	is_suggested: false,
	exclusion_reason: null,
	...overrides,
});

const meta = (total: number): IApiPaginationMeta => ({
	current_page: 1,
	from: total > 0 ? 1 : null,
	last_page: 1,
	links: [],
	path: '',
	per_page: 15,
	to: total > 0 ? total : null,
	total,
});

const suppliersResponse = (
	rows: IProductSupplierPurchasesRow[],
	suggestedId: number | null,
): IProductSuppliersResponse => ({
	data: rows,
	context: {
		subsidiary_id: 2,
		product_id: 31,
		comparison_basis: 'last_received_effective_unit_cost_clp',
		suggested_supplier_id: suggestedId,
	},
	links: { first: null, last: null, prev: null, next: null },
	meta: meta(rows.length),
});

const historyRow = (
	receiptId: number,
	overrides: Partial<IProductPurchaseHistoryRow> = {},
): IProductPurchaseHistoryRow => ({
	stock_receipt_id: receiptId,
	received_on: '2026-09-04',
	days_since_purchase: 3,
	quantity: 5,
	cost: knownCost('4800.00'),
	purchase_document: null,
	supplier: null,
	warehouse: { id: 3, name: 'Bodega central' },
	branch_id: 4,
	...overrides,
});

const historyResponse = (rows: IProductPurchaseHistoryRow[]): IProductPurchaseHistoryResponse => ({
	data: rows,
	links: { first: null, last: null, prev: null, next: null },
	meta: meta(rows.length),
});

const renderSection = ({ serialTracking = false } = {}) =>
	render(
		<Provider
			store={configureStore({
				reducer: {
					auth: () => ({
						loading: false,
						user: { id: 1, permisos: [...granted.perms], roles: [] as string[] },
					}),
				},
			})}>
			<MemoryRouter initialEntries={['/inventario/stock/31#compras']}>
				<ProductPurchases subsidiaryId={2} productId={31} serialTracking={serialTracking} />
			</MemoryRouter>
		</Provider>,
	);

const lastHistoryParams = (): unknown => service.listProductPurchaseHistory.mock.lastCall?.[2];

beforeEach(() => {
	granted.perms = new Set(['view-product', 'view-purchase-document']);
	service.listProductSuppliers.mockReset();
	service.listProductPurchaseHistory.mockReset();
	service.listProductPurchaseHistory.mockResolvedValue(historyResponse([historyRow(90)]));
});

describe('proveedores', () => {
	it('destaca al sugerido tal como lo manda el backend y rotula cada exclusión', async () => {
		service.listProductSuppliers.mockResolvedValue(
			suppliersResponse(
				[
					supplierRow(7, 'Acme', { is_suggested: true }),
					supplierRow(8, 'Beta', {
						exclusion_reason: 'inactive_supplier',
						supplier: {
							id: 8,
							display_name: 'Beta',
							rut: '76.000.008-K',
							is_active: false,
						},
					}),
					supplierRow(9, 'Gamma', {
						exclusion_reason: 'no_comparable_cost',
						last_purchase: {
							...supplierRow(9, 'Gamma').last_purchase,
							cost: unknownCost,
						},
					}),
					supplierRow(10, 'Delta'),
				],
				7,
			),
		);

		renderSection();

		const table = await screen.findByRole('table', {
			name: 'Proveedores que vendieron este producto',
		});
		expect(screen.getByText(/Proveedor sugerido: Acme\./)).toBeInTheDocument();
		const [, first, second, third, fourth] = within(table).getAllByRole('row');
		// El orden es el del backend: no se reordena.
		expect(within(first).getByText('Acme')).toBeInTheDocument();
		expect(within(first).getByText('Sugerido')).toBeInTheDocument();
		expect(
			within(second).getByText('Proveedor desactivado: no se sugiere'),
		).toBeInTheDocument();
		expect(within(second).getByText(/Desactivado/)).toBeInTheDocument();
		expect(
			within(third).getByText('Su última compra no tiene costo conocido'),
		).toBeInTheDocument();
		expect(within(third).getByText('Desconocido')).toBeInTheDocument();
		expect(within(fourth).getByText('Comparable')).toBeInTheDocument();
		expect(within(first).getByText('$4.800,00')).toBeInTheDocument();
	});

	it('enlaza recepción y documento sólo con el permiso de cada ficha', async () => {
		granted.perms = new Set(['view-product']);
		service.listProductSuppliers.mockResolvedValue(
			suppliersResponse([supplierRow(7, 'Acme', { is_suggested: true })], 7),
		);

		renderSection();

		const table = await screen.findByRole('table', {
			name: 'Proveedores que vendieron este producto',
		});
		expect(within(table).getByRole('link', { name: /Recepción #87/ })).toHaveAttribute(
			'href',
			'/inventario/abastecimiento/recepciones/87',
		);
		expect(within(table).queryByRole('link', { name: /Factura #127/ })).toBeNull();
		expect(within(table).getByText('Factura #127')).toBeInTheDocument();
	});

	it('sin elegibles dice que no hay sugerencia', async () => {
		service.listProductSuppliers.mockResolvedValue(
			suppliersResponse(
				[supplierRow(8, 'Beta', { exclusion_reason: 'inactive_supplier' })],
				null,
			),
		);

		renderSection();

		expect(await screen.findByText(/Ningún proveedor puede sugerirse/)).toBeInTheDocument();
		expect(screen.queryByText(/Proveedor sugerido/)).toBeNull();
	});
});

describe('estados', () => {
	it('sin compras muestra el estado vacío y la aclaración de alcance', async () => {
		service.listProductSuppliers.mockResolvedValue(suppliersResponse([], null));
		service.listProductPurchaseHistory.mockResolvedValue(historyResponse([]));

		renderSection();

		expect(
			await screen.findByText('Todavía no hay compras registradas de este producto.'),
		).toBeInTheDocument();
		expect(
			screen.getByText(/sucursales a las que tienes acceso/, { exact: false }),
		).toBeInTheDocument();
		expect(screen.queryByRole('table')).toBeNull();
		expect(document.getElementById('compras')).not.toBeNull();
	});

	it('un producto con serie explica por qué no tiene compras', async () => {
		service.listProductSuppliers.mockResolvedValue(suppliersResponse([], null));
		service.listProductPurchaseHistory.mockResolvedValue(historyResponse([]));

		renderSection({ serialTracking: true });

		expect(await screen.findByText(/número de serie no se reciben/)).toBeInTheDocument();
	});

	it('las compras sin proveedor siguen en el historial', async () => {
		service.listProductSuppliers.mockResolvedValue(suppliersResponse([], null));

		renderSection();

		expect(
			await screen.findByText(/Ninguna compra registrada tiene proveedor/),
		).toBeInTheDocument();
		const history = await screen.findByRole('table', {
			name: 'Historial de compras del producto',
		});
		expect(within(history).getByText('Sin proveedor')).toBeInTheDocument();
		expect(within(history).getByText('Bodega central')).toBeInTheDocument();
	});

	it('un 404 (producto de otra filial) avisa sin reintento', async () => {
		const notFound = { response: { status: 404, data: { message: 'Not Found' } } };
		service.listProductSuppliers.mockRejectedValue(notFound);
		service.listProductPurchaseHistory.mockRejectedValue(notFound);

		renderSection();

		expect(await screen.findByText(/no pertenece a la filial activa/)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
		expect(screen.queryByText('Not Found')).toBeNull();
	});

	it('un error de red ofrece reintentar', async () => {
		service.listProductSuppliers
			.mockRejectedValueOnce(new Error('Network Error'))
			.mockResolvedValue(
				suppliersResponse([supplierRow(7, 'Acme', { is_suggested: true })], 7),
			);

		renderSection();

		fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
		expect(
			await screen.findByRole('table', { name: 'Proveedores que vendieron este producto' }),
		).toBeInTheDocument();
		expect(service.listProductSuppliers).toHaveBeenCalledTimes(2);
	});
});

describe('historial', () => {
	beforeEach(() => {
		service.listProductSuppliers.mockResolvedValue(
			suppliersResponse([supplierRow(7, 'Acme', { is_suggested: true })], 7),
		);
	});

	it('pide la primera página sin filtros', async () => {
		renderSection();

		await screen.findByRole('table', { name: 'Historial de compras del producto' });
		expect(service.listProductPurchaseHistory).toHaveBeenCalledWith(
			2,
			31,
			{
				supplier_id: undefined,
				received_from: undefined,
				received_to: undefined,
				page: 1,
				per_page: 15,
			},
			expect.any(AbortSignal),
		);
		expect(service.listProductSuppliers).toHaveBeenCalledWith(
			2,
			31,
			{ page: 1, per_page: 100 },
			expect.any(AbortSignal),
		);
	});

	it('filtra por proveedor y por fechas de recepción', async () => {
		renderSection();
		await screen.findByRole('table', { name: 'Historial de compras del producto' });

		fireEvent.change(screen.getByLabelText('Proveedor'), { target: { value: '7' } });
		await waitFor(() => expect(lastHistoryParams()).toMatchObject({ supplier_id: 7, page: 1 }));

		fireEvent.change(screen.getByLabelText('Recibida desde'), {
			target: { value: '2026-09-01' },
		});
		fireEvent.change(screen.getByLabelText('Recibida hasta'), {
			target: { value: '2026-09-30' },
		});
		await waitFor(() =>
			expect(lastHistoryParams()).toMatchObject({
				supplier_id: 7,
				received_from: '2026-09-01',
				received_to: '2026-09-30',
			}),
		);

		fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
		await waitFor(() =>
			expect(lastHistoryParams()).toMatchObject({
				supplier_id: undefined,
				received_from: undefined,
				received_to: undefined,
			}),
		);
	});

	it('no manda un «hasta» anterior al «desde» y lo marca', async () => {
		renderSection();
		await screen.findByRole('table', { name: 'Historial de compras del producto' });

		fireEvent.change(screen.getByLabelText('Recibida desde'), {
			target: { value: '2026-09-10' },
		});
		fireEvent.change(screen.getByLabelText('Recibida hasta'), {
			target: { value: '2026-09-01' },
		});

		expect(
			await screen.findByText('La fecha hasta no puede ser anterior a la fecha desde.'),
		).toBeInTheDocument();
		expect(lastHistoryParams()).toMatchObject({
			received_from: '2026-09-10',
			received_to: undefined,
		});
	});

	it('descarta la respuesta tardía de un filtro anterior', async () => {
		let resolveStale: (value: IProductPurchaseHistoryResponse) => void = () => undefined;
		service.listProductPurchaseHistory
			.mockReturnValueOnce(
				new Promise<IProductPurchaseHistoryResponse>((resolve) => {
					resolveStale = resolve;
				}),
			)
			.mockResolvedValue(
				historyResponse([
					historyRow(91, {
						supplier: {
							id: 7,
							display_name: 'Acme',
							rut: '76.000.007-K',
							is_active: true,
						},
					}),
				]),
			);

		renderSection();
		await waitFor(() => expect(service.listProductPurchaseHistory).toHaveBeenCalled());
		fireEvent.change(screen.getByLabelText('Proveedor'), { target: { value: '7' } });

		const history = await screen.findByRole('table', {
			name: 'Historial de compras del producto',
		});
		await act(() => {
			resolveStale(historyResponse([historyRow(99)]));
			return Promise.resolve();
		});

		expect(within(history).getByText('Recepción #91')).toBeInTheDocument();
		expect(screen.queryByText('Recepción #99')).toBeNull();
	});
});
