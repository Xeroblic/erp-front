import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFERRED_PAYMENTS_MOCK } from '@/store/slices/deferredPayments/deferredPaymentsMock';
import DeferredPaymentsTable from '../components/tables/DeferredPaymentsTable';

describe('DeferredPaymentsTable', () => {
	it('no afirma que no hay documentos cuando la consulta falló', () => {
		render(
			<DeferredPaymentsTable
				rows={[DEFERRED_PAYMENTS_MOCK[0]]}
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
			screen.queryByText(DEFERRED_PAYMENTS_MOCK[0].document_number),
		).not.toBeInTheDocument();
	});

	it('expone la acción de la fila y la activa con teclado', () => {
		const onRowClick = vi.fn();
		render(
			<DeferredPaymentsTable
				rows={[DEFERRED_PAYMENTS_MOCK[0]]}
				meta={null}
				loading={false}
				hasError={false}
				hasFilters={false}
				onPaginationChange={vi.fn()}
				onRowClick={onRowClick}
			/>,
		);

		const row = screen.getByRole('button', {
			name: `Abrir detalle del documento ${DEFERRED_PAYMENTS_MOCK[0].document_number}`,
		});
		fireEvent.keyDown(row, { key: 'Enter' });
		fireEvent.keyDown(row, { key: ' ' });

		expect(onRowClick).toHaveBeenCalledTimes(2);
		expect(onRowClick).toHaveBeenNthCalledWith(1, DEFERRED_PAYMENTS_MOCK[0].id);
		expect(onRowClick).toHaveBeenNthCalledWith(2, DEFERRED_PAYMENTS_MOCK[0].id);
	});

	it('marca como no aplicable el vencimiento de documentos pagados', () => {
		const paidRow = DEFERRED_PAYMENTS_MOCK.find((row) => row.status === 'paid');
		expect(paidRow).toBeDefined();
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
});
