import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DeferredPaymentsTable from '../components/tables/DeferredPaymentsTable';

describe('DeferredPaymentsTable', () => {
	it('no afirma que no hay documentos cuando la consulta falló', () => {
		render(
			<DeferredPaymentsTable
				rows={[]}
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
	});
});
