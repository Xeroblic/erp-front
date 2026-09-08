import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFERRED_PAYMENT_LIST_FIXTURES } from './deferredPaymentsTestData';
import DeferredPaymentsTable from '../components/tables/DeferredPaymentsTable';
import { formatDeferredPaymentDate } from '../utils';

describe('DeferredPaymentsTable', () => {
	it('delegates local sorting to the view owner', () => {
		const onSort = vi.fn();
		render(
			<DeferredPaymentsTable
				rows={[DEFERRED_PAYMENT_LIST_FIXTURES[0]]}
				meta={null}
				loading={false}
				hasError={false}
				hasFilters={false}
				sort={null}
				onSort={onSort}
				onPaginationChange={vi.fn()}
				onRowClick={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Ordenar por N° documento' }));

		expect(onSort).toHaveBeenCalledWith('document_number');
	});

	it('muestra la fecha de emisión del documento y permite ordenar por ella', () => {
		const onSort = vi.fn();
		render(
			<DeferredPaymentsTable
				rows={[DEFERRED_PAYMENT_LIST_FIXTURES[0]]}
				meta={null}
				loading={false}
				hasError={false}
				hasFilters={false}
				sort={null}
				onSort={onSort}
				onPaginationChange={vi.fn()}
				onRowClick={vi.fn()}
			/>,
		);

		expect(
			screen.getByText(
				formatDeferredPaymentDate(DEFERRED_PAYMENT_LIST_FIXTURES[0].issue_date),
			),
		).toBeInTheDocument();

		fireEvent.click(
			screen.getByRole('button', { name: 'Ordenar por Fecha emisión documento' }),
		);

		expect(onSort).toHaveBeenCalledWith('issue_date');
	});

	it('no afirma que no hay documentos cuando la consulta falló', () => {
		render(
			<DeferredPaymentsTable
				rows={[DEFERRED_PAYMENT_LIST_FIXTURES[0]]}
				meta={null}
				loading={false}
				hasError
				hasFilters={false}
				sort={null}
				onSort={vi.fn()}
				onPaginationChange={vi.fn()}
				onRowClick={vi.fn()}
			/>,
		);

		expect(
			screen.queryByText('Aún no hay documentos de pago diferido'),
		).not.toBeInTheDocument();
		expect(screen.queryByText('0 documentos')).not.toBeInTheDocument();
		expect(screen.getByText('No fue posible mostrar los documentos')).toBeInTheDocument();
		expect(
			screen.queryByText(DEFERRED_PAYMENT_LIST_FIXTURES[0].document_number),
		).not.toBeInTheDocument();
	});

	it('expone la acción de la fila y la activa con teclado', () => {
		const onRowClick = vi.fn();
		render(
			<DeferredPaymentsTable
				rows={[DEFERRED_PAYMENT_LIST_FIXTURES[0]]}
				meta={null}
				loading={false}
				hasError={false}
				hasFilters={false}
				sort={null}
				onSort={vi.fn()}
				onPaginationChange={vi.fn()}
				onRowClick={onRowClick}
			/>,
		);

		const row = screen.getByRole('button', {
			name: `Abrir detalle del documento ${DEFERRED_PAYMENT_LIST_FIXTURES[0].document_number}`,
		});
		fireEvent.keyDown(row, { key: 'Enter' });
		fireEvent.keyDown(row, { key: ' ' });

		expect(onRowClick).toHaveBeenCalledTimes(2);
		expect(onRowClick).toHaveBeenNthCalledWith(1, DEFERRED_PAYMENT_LIST_FIXTURES[0].id);
		expect(onRowClick).toHaveBeenNthCalledWith(2, DEFERRED_PAYMENT_LIST_FIXTURES[0].id);
	});

	it('marca como no aplicable el vencimiento de documentos pagados', () => {
		const paidDocument = DEFERRED_PAYMENT_LIST_FIXTURES.find((row) => row.status === 'paid');
		expect(paidDocument).toBeDefined();
		const paidRow = { ...paidDocument!, days_until_due: -12 };
		render(
			<DeferredPaymentsTable
				rows={[paidRow]}
				meta={null}
				loading={false}
				hasError={false}
				hasFilters={false}
				sort={null}
				onSort={vi.fn()}
				onPaginationChange={vi.fn()}
				onRowClick={vi.fn()}
			/>,
		);

		expect(screen.getByLabelText('No aplica')).toHaveTextContent('—');
	});
	it('prioriza la empresa y muestra el contacto como dato secundario', () => {
		const row = {
			...DEFERRED_PAYMENT_LIST_FIXTURES[0],
			customer: {
				...DEFERRED_PAYMENT_LIST_FIXTURES[0].customer,
				contact_name: 'Ana Pérez',
				billing_company: 'Comercial Andina Ltda.',
				rut: '76.123.456-7',
			},
		};
		render(
			<DeferredPaymentsTable
				rows={[row]}
				meta={null}
				loading={false}
				hasError={false}
				hasFilters={false}
				sort={null}
				onSort={vi.fn()}
				onPaginationChange={vi.fn()}
				onRowClick={vi.fn()}
			/>,
		);

		expect(screen.getByText('Comercial Andina Ltda.')).toBeInTheDocument();
		expect(screen.getByText('76.123.456-7')).toBeInTheDocument();
		expect(screen.queryByText('Comercial Andina Ltda. · 76.123.456-7')).not.toBeInTheDocument();
	});
	it('usa el nombre del cliente cuando no pertenece a una empresa', () => {
		const row = {
			...DEFERRED_PAYMENT_LIST_FIXTURES[0],
			customer: {
				...DEFERRED_PAYMENT_LIST_FIXTURES[0].customer,
				contact_name: 'Camila Araya',
				billing_company: '',
				rut: '55.000.001-2',
			},
		};
		render(
			<DeferredPaymentsTable
				rows={[row]}
				meta={null}
				loading={false}
				hasError={false}
				hasFilters={false}
				sort={null}
				onSort={vi.fn()}
				onPaginationChange={vi.fn()}
				onRowClick={vi.fn()}
			/>,
		);

		expect(screen.getByText('Camila Araya')).toBeInTheDocument();
		expect(screen.getByText('55.000.001-2')).toBeInTheDocument();
	});
	it('muestra la fecha de pago inmediatamente después del vencimiento y ordena por ella', () => {
		const onSort = vi.fn();
		const paidRow = {
			...DEFERRED_PAYMENT_LIST_FIXTURES[0],
			status: 'paid' as const,
			paid_at: '2026-03-14T10:30:00-03:00',
		};
		render(
			<DeferredPaymentsTable
				rows={[paidRow]}
				meta={null}
				loading={false}
				hasError={false}
				hasFilters={false}
				sort={null}
				onSort={onSort}
				onPaginationChange={vi.fn()}
				onRowClick={vi.fn()}
			/>,
		);

		const headers = screen.getAllByRole('columnheader').map((header) => header.textContent);
		expect(headers.indexOf('Fecha de pago')).toBe(headers.indexOf('Vencimiento') + 1);

		expect(screen.getByText(formatDeferredPaymentDate(paidRow.paid_at))).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Ordenar por Fecha de pago' }));

		expect(onSort).toHaveBeenCalledWith('paid_at');
	});

	it('deja la fecha de pago vacía mientras el documento sigue por cobrar', () => {
		const outstandingRow = {
			...DEFERRED_PAYMENT_LIST_FIXTURES[0],
			status: 'pending' as const,
			purchase_order: 'OC-202601',
			days_until_due: 5,
			is_overdue: false,
			paid_at: null,
		};
		render(
			<DeferredPaymentsTable
				rows={[outstandingRow]}
				meta={null}
				loading={false}
				hasError={false}
				hasFilters={false}
				sort={null}
				onSort={vi.fn()}
				onPaginationChange={vi.fn()}
				onRowClick={vi.fn()}
			/>,
		);

		// El único guion de la fila es el de la fecha de pago: la OC trae valor y el
		// vencimiento muestra su badge de días.
		expect(screen.getAllByText('—')).toHaveLength(1);
	});
});
