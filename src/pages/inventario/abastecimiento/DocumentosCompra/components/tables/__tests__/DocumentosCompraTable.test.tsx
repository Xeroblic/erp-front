import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { IPurchaseDocumentListRow } from '@/interface/procurement.interface';
import DocumentosCompraTable from '../DocumentosCompraTable';

vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ authorize: () => true, hasAnyPermission: () => true, isSuperAdmin: false }),
}));
vi.mock('@/hooks/useDir', () => ({
	default: () => ({ dir: 'ltr', isLTR: true, isRTL: false }),
}));
vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));
vi.mock('@/utils/tailwindColorResolver.util', () => ({
	resolveTailwindColor: () => '#2563eb',
	resolveTailwindColorAlpha: () => 'rgba(37, 99, 235, 0.5)',
}));

const row = (id: number, documentNumber: string): IPurchaseDocumentListRow => ({
	id,
	document_type: 'receipt',
	document_number: documentNumber,
	issue_date: '2026-09-06',
	currency_code: 'CLP',
	total_amount: null,
	status: 'draft',
	reception_status: null,
	supplier: null,
	items_count: 1,
	created_at: '2026-09-06T12:00:00Z',
	allowed_actions: [],
});

describe('DocumentosCompraTable', () => {
	it('respeta el orden del servidor y no ofrece ordenar sólo la página visible', () => {
		render(
			<DocumentosCompraTable
				rows={[row(1, 'B-200'), row(2, 'A-100'), row(3, 'C-300')]}
				meta={null}
				loading={false}
				hasError={false}
				hasActiveFilters={false}
				onPaginationChange={vi.fn()}
				onView={vi.fn()}
			/>,
		);

		const [header, ...bodyRows] = screen.getAllByRole('row');
		expect(within(header).queryAllByRole('button')).toHaveLength(0);
		expect(
			bodyRows.map((bodyRow) => within(bodyRow).getAllByRole('cell')[0].textContent),
		).toEqual(['B-200', 'A-100', 'C-300']);
	});
});
