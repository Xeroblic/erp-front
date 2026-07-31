import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFERRED_PAYMENT_LIST_FIXTURES } from './deferredPaymentsTestData';
import DeferredPaymentsTable from '../components/tables/DeferredPaymentsTable';

describe('DeferredPaymentsTable', () => {
	it('no afirma que no hay documentos cuando la consulta falló', () => {
		render(
			<DeferredPaymentsTable
				rows={[DEFERRED_PAYMENT_LIST_FIXTURES[0]]}
				meta={null}
				loading={false}
				hasError
				hasFilters={false}
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
				rows={[paidRow!]}
				meta={null}
				loading={false}
				hasError={false}
				hasFilters={false}
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
				onPaginationChange={vi.fn()}
				onRowClick={vi.fn()}
			/>,
		);

		expect(screen.getByText('Camila Araya')).toBeInTheDocument();
		expect(screen.getByText('55.000.001-2')).toBeInTheDocument();
	});
});
