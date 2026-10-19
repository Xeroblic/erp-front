import React, { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildAuthState, withStore } from '@/test-utils/renderWithStore';
import OperationDetail from '@/pages/inventario/Inventario/components/traceability/OperationDetail';
import OperationsTable from '@/pages/inventario/Inventario/components/traceability/OperationsTable';
import type { TInventoryTraceability } from '@/pages/inventario/Inventario/hooks/useInventoryTraceability';
import type {
	IInventoryOperationDetail,
	IInventoryOperationEffect,
	IInventoryOperationItem,
	IInventoryOperationRow,
	IInventoryOperationsResponse,
} from '@/interface/inventoryOperations.interface';
import type { IProcurementProduct } from '@/interface/procurement.interface';

/**
 * Checklist de la tarea 17 en la UI de Trazabilidad: lo que la pantalla hace
 * con los campos del contrato real, no con una lista de tipos en el cliente.
 */

const product = (id: number, name: string): IProcurementProduct => ({
	id,
	sku: `SKU-${id}`,
	commercial_sku: null,
	name,
	short_description: null,
	serial_tracking: false,
	grade: null,
	currency_code: 'CLP',
	price: null,
	offer_price: null,
	cost: null,
	cost_basis: 'unknown',
	brand: null,
	categories: [],
	image: null,
	is_active: true,
});

const row = (patch: Partial<IInventoryOperationRow> = {}): IInventoryOperationRow => ({
	id: 'op-1',
	operation_type: 'stock_receipt',
	title: 'Recepción de mercadería',
	occurred_at: '2026-09-25T10:00:30-03:00',
	branch: { id: 4, name: 'Centro' },
	actor: null,
	reason: null,
	source: null,
	reverses_operation_id: null,
	summary: { products_count: 1, units_affected: 10, physical_effect: true },
	...patch,
});

const effect = (patch: Partial<IInventoryOperationEffect> = {}): IInventoryOperationEffect => ({
	branch_id: 4,
	warehouse_id: null,
	warehouse: null,
	physical_quantity_delta: 5,
	fit_quantity_delta: 5,
	unfit_quantity_delta: 0,
	physical_quantity_before: 0,
	physical_quantity_after: 5,
	fit_quantity_before: 0,
	fit_quantity_after: 5,
	unfit_quantity_before: 0,
	unfit_quantity_after: 0,
	...patch,
});

const item = (patch: Partial<IInventoryOperationItem> = {}): IInventoryOperationItem => ({
	product: product(31, 'Mouse'),
	product_id: 31,
	quantity: 5,
	condition: 'fit',
	matches_filter: true,
	effects: [effect()],
	origins: [],
	...patch,
});

const detailOf = (items: IInventoryOperationItem[]): IInventoryOperationDetail => ({
	...row(),
	items,
});

const response = (rows: IInventoryOperationRow[], pending = 0): IInventoryOperationsResponse => ({
	data: rows,
	links: { first: null, last: null, prev: null, next: null },
	meta: {
		current_page: 1,
		from: 1,
		last_page: 1,
		links: [],
		path: '/api/subsidiaries/2/inventory-operations',
		per_page: 15,
		to: rows.length,
		total: rows.length,
	},
	context: { pending_movements_count: pending },
});

const traceability = (value: IInventoryOperationsResponse): TInventoryTraceability => ({
	response: value,
	loading: false,
	error: null,
	refresh: () => {},
	expanded: [],
	toggle: () => {},
	detailOf: () => ({ detail: null, loading: true, error: null }),
	retryDetail: () => {},
});

const renderUi = (ui: ReactElement) => {
	const { Wrapper } = withStore(buildAuthState({ permisos: ['view-inventory-movements'] }));
	return render(
		<Wrapper>
			<MemoryRouter>{ui}</MemoryRouter>
		</Wrapper>,
	);
};

const renderTable = (value: IInventoryOperationsResponse) =>
	renderUi(
		<OperationsTable
			title='Operaciones'
			description='Prueba'
			data={traceability(value)}
			warehouses={[]}
			hasFilters={false}
			highlightMatches={false}
			onPaginate={() => {}}
		/>,
	);

const renderDetail = (detail: IInventoryOperationDetail, highlightMatches = false) =>
	renderUi(
		<OperationDetail
			state={{ detail, loading: false, error: null }}
			warehouses={new Map()}
			highlightMatches={highlightMatches}
			onRetry={() => {}}
		/>,
	);

describe('Trazabilidad · lista', () => {
	it('rotula «Sin cambio físico» por `physical_effect`, no por el tipo, y conserva las unidades', () => {
		renderTable(
			response([
				// Tipo físico con `physical_effect: false` (stock inicial del respaldo).
				row({
					id: 'op-doc',
					operation_type: 'initial_stock',
					title: 'Stock inicial',
					summary: { products_count: 1, units_affected: 10, physical_effect: false },
				}),
				// Tipo documental que sí sumó (el campo manda, no el tipo).
				row({
					id: 'op-fis',
					operation_type: 'initial_stock_document_allocation',
					title: 'Respaldo documental de stock inicial',
					summary: { products_count: 1, units_affected: 3, physical_effect: true },
				}),
			]),
		);
		const [, documental, fisica] = screen.getAllByRole('row');

		expect(within(documental).getByText('10')).toBeInTheDocument();
		expect(within(documental).getByText('Sin cambio físico')).toBeInTheDocument();
		expect(within(fisica).getByText('3')).toBeInTheDocument();
		expect(within(fisica).queryByText('Sin cambio físico')).not.toBeInTheDocument();
	});

	it('avisa los movimientos pendientes de agrupar sin bloquear la lista', () => {
		renderTable(response([row()], 3));

		expect(
			screen.getByText('Hay 3 movimientos recientes que aparecerán en unos segundos.'),
		).toBeInTheDocument();
		expect(screen.getByRole('table', { name: 'Operaciones' })).toBeInTheDocument();
	});

	it('usa el singular con un movimiento y no avisa con cero', () => {
		const { unmount } = renderTable(response([row()], 1));
		expect(
			screen.getByText('Hay 1 movimiento reciente que aparecerá en unos segundos.'),
		).toBeInTheDocument();
		unmount();

		renderTable(response([row()], 0));
		expect(screen.queryByText(/movimientos? recientes?/)).not.toBeInTheDocument();
	});

	it('muestra el título que manda el backend', () => {
		renderTable(response([row({ operation_type: 'tipo_nuevo', title: 'Algo nuevo' })]));

		expect(screen.getByText('Algo nuevo')).toBeInTheDocument();
	});
});

describe('Trazabilidad · detalle', () => {
	it('muestra «—» y no 0 cuando el saldo histórico no se guardó', () => {
		renderDetail(
			detailOf([
				item({
					effects: [
						effect({
							physical_quantity_delta: -1,
							physical_quantity_before: null,
							physical_quantity_after: null,
						}),
					],
				}),
			]),
		);
		const saldo = screen.getByText('Sin ubicación').closest('li');
		if (!saldo) throw new Error('Sin efecto');

		expect(within(saldo).getAllByText('—')).toHaveLength(2);
		expect(within(saldo).getAllByText('sin dato')).toHaveLength(2);
		expect(within(saldo).queryByText('0')).not.toBeInTheDocument();
	});

	it('un saldo real en 0 se muestra como 0', () => {
		renderDetail(detailOf([item()]));
		const saldo = screen.getByText('Sin ubicación').closest('li');
		if (!saldo) throw new Error('Sin efecto');

		expect(saldo).toHaveTextContent('0 → 5');
		expect(within(saldo).queryByText('—')).not.toBeInTheDocument();
	});

	it('rotula cada efecto con el nombre de bodega que trae la API', () => {
		renderDetail(
			detailOf([
				item({
					effects: [
						effect({ warehouse_id: 11, warehouse: { id: 11, name: 'Bodega 1' } }),
					],
				}),
			]),
		);

		expect(screen.getByText('Bodega 1')).toBeInTheDocument();
	});

	it('resalta los ítems con `matches_filter` y atenúa los demás sin ocultarlos', () => {
		renderDetail(
			detailOf([
				item({ product: product(31, 'Mouse'), product_id: 31, matches_filter: true }),
				item({ product: product(44, 'Teclado'), product_id: 44, matches_filter: false }),
			]),
			true,
		);
		const mouse = screen.getByText('Mouse').closest('tr');
		const teclado = screen.getByText('Teclado').closest('tr');
		if (!mouse || !teclado) throw new Error('Faltan filas');

		expect(within(mouse).getByText('Coincide con el filtro')).toBeInTheDocument();
		expect(mouse).not.toHaveClass('opacity-50');
		expect(teclado).toHaveClass('opacity-50');
		expect(within(teclado).queryByText('Coincide con el filtro')).not.toBeInTheDocument();
	});

	it('explica `origins: []` en entradas y traslados en vez de mostrarlo como faltante', () => {
		renderDetail(
			detailOf([
				item({ product: product(31, 'Mouse'), product_id: 31 }),
				item({
					product: product(44, 'Teclado'),
					product_id: 44,
					effects: [
						effect({ physical_quantity_delta: -2 }),
						effect({
							warehouse_id: 11,
							warehouse: { id: 11, name: 'Bodega 1' },
							physical_quantity_delta: 2,
						}),
					],
				}),
			]),
		);

		expect(screen.getByText('Ingresa como procedencia nueva.')).toBeInTheDocument();
		expect(
			screen.getByText('Mueve saldo entre ubicaciones; la procedencia no cambia.'),
		).toBeInTheDocument();
	});

	it('una operación documental, sin efectos, dice «Sin cambio físico»', () => {
		renderDetail(detailOf([item({ condition: null, effects: [] })]));

		expect(screen.getByText('Sin cambio físico')).toBeInTheDocument();
	});
});
