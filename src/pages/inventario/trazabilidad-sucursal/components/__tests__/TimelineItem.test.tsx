import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { IInventoryMovement } from '@/interface/inventoryMovements.interface';
import TimelineItem from '../TimelineItem';

vi.mock('@/components/icon/Icon', () => ({
	default: ({ icon }: { icon: string }) => <span data-icon={icon} />,
}));

vi.mock('@/components/ui/Badge', () => ({
	default: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

const makeMovement = (metadata: IInventoryMovement['metadata']): IInventoryMovement => ({
	id: 42,
	product: { id: 7, sku: 'SKU-007', name: 'Producto trazable' },
	branch: { id: 3, name: 'Sucursal Centro' },
	warehouse: { id: 5, name: 'Bodega principal' },
	quantity_delta: 15,
	balance_before: 38,
	balance_after: 53,
	movement_type: 'manual_adjustment',
	reason: 'Regularización confirmada por inventario',
	source: { type: 'batch_adjustment', id: 91, line_id: 12 },
	performed_by: { id: 8, name: 'Nicolás Muñoz', email: 'nicolas@example.com' },
	metadata,
	occurred_at: '2026-08-27T12:34:00-04:00',
	created_at: '2026-08-27T12:35:00-04:00',
});

describe('TimelineItem', () => {
	it('expone la expansión de forma accesible y muestra metadatos abiertos sin perder su clave', () => {
		render(
			<TimelineItem
				movement={makeMovement({
					batch_id: 'e4faf8d1-64c2-4dd5-bb15-ca86dcf00a44',
					origin: 'batch_adjustment',
					notes: 'Ajuste de inventario autorizado',
					approved: false,
					current_status: 'available_for_sale',
					sale_id: 1436,
					customer_id: 1086,
					requested_qty: 1,
					serial_numbers: ['PF464K3X', 'PF463E8G'],
					context: { channel: 'erp', retries: 0 },
				})}
			/>,
		);

		const toggle = screen.getByRole('button', {
			name: 'Mostrar detalles del movimiento de Producto trazable',
		});
		expect(toggle).toHaveAttribute('aria-expanded', 'false');

		fireEvent.click(toggle);

		expect(
			screen.getByRole('button', {
				name: 'Ocultar detalles del movimiento de Producto trazable',
			}),
		).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getByRole('heading', { name: 'Metadatos del movimiento' })).toBeVisible();
		expect(screen.getByText('Lote de ajuste')).toBeVisible();
		expect(screen.getByText('batch_id')).toBeVisible();
		expect(screen.getByText('e4faf8d1-64c2-4dd5-bb15-ca86dcf00a44')).toBeVisible();
		expect(screen.getByText('Estado actual')).toBeVisible();
		expect(screen.getByText('Disponible para venta')).toBeVisible();
		expect(screen.getByText('Venta #1436')).toBeVisible();
		expect(screen.getByText('Cliente #1086')).toBeVisible();
		expect(screen.getByText('1 unidad')).toBeVisible();
		expect(screen.getByText(/• PF464K3X\s+• PF463E8G/)).toBeVisible();
		expect(screen.getByText('No')).toBeVisible();
		expect(screen.getByText(/"channel": "erp"/)).toBeVisible();
	});

	it('renderiza el detalle aunque el movimiento no tenga metadatos', () => {
		render(<TimelineItem movement={makeMovement(null)} />);

		fireEvent.click(
			screen.getByRole('button', {
				name: 'Mostrar detalles del movimiento de Producto trazable',
			}),
		);

		expect(screen.getByRole('heading', { name: 'Detalle del movimiento' })).toBeVisible();
		expect(
			screen.queryByRole('heading', { name: 'Metadatos del movimiento' }),
		).not.toBeInTheDocument();
	});

	it('oculta metadatos sin información y conserva valores válidos falsy', () => {
		render(
			<TimelineItem
				movement={makeMovement({
					customer_name: null,
					sale_branch_id: undefined,
					notes: '   ',
					serial_numbers: [],
					context: {},
					stock_target: 0,
					approved: false,
				})}
			/>,
		);

		fireEvent.click(
			screen.getByRole('button', {
				name: 'Mostrar detalles del movimiento de Producto trazable',
			}),
		);

		expect(screen.getByText('2 campos')).toBeVisible();
		expect(screen.queryByText('Nombre del cliente')).not.toBeInTheDocument();
		expect(screen.queryByText('Sucursal de la venta')).not.toBeInTheDocument();
		expect(screen.queryByText('Notas')).not.toBeInTheDocument();
		expect(screen.queryByText('Números de serie')).not.toBeInTheDocument();
		expect(screen.getByText('0')).toBeVisible();
		expect(screen.getByText('No')).toBeVisible();
	});
});
