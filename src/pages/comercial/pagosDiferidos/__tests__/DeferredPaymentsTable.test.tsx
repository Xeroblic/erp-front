import React from 'react';
import { render, screen } from '@testing-library/react';
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
});
