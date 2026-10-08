import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { IProcurementSupplierListRow } from '@/interface/procurement.interface';
import ProveedoresTable from '../ProveedoresTable';

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

const row = (id: number, rut: string, name: string): IProcurementSupplierListRow => ({
	id,
	rut,
	display_name: name,
	company_name: name,
	contact_name: null,
	business_activity: null,
	email: null,
	phone: null,
	is_active: true,
});

describe('ProveedoresTable', () => {
	it('respeta el orden del servidor y no ofrece ordenar sólo la página visible', () => {
		render(
			<ProveedoresTable
				rows={[row(1, '3-3', 'Beta'), row(2, '1-1', 'Alfa'), row(3, '2-2', 'Gamma')]}
				meta={null}
				loading={false}
				hasError={false}
				hasSearch={false}
				onPaginationChange={vi.fn()}
				onView={vi.fn()}
				onDeactivate={vi.fn()}
				onRestore={vi.fn()}
			/>,
		);

		const [header, ...bodyRows] = screen.getAllByRole('row');
		expect(within(header).queryAllByRole('button')).toHaveLength(0);
		expect(
			bodyRows.map((bodyRow) => within(bodyRow).getAllByRole('cell')[0].textContent),
		).toEqual(['3-3', '1-1', '2-2']);
	});
});
