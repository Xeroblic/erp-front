import React, { PropsWithChildren } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildAuthState, withStore } from '@/test-utils/renderWithStore';
import type { UserNotificationDTO } from '@/interface/notifications.interface';
import NotificationDetail from '../NotificationDetail';

vi.mock('gsap', () => ({
	default: {
		context: () => ({ revert: () => undefined }),
		fromTo: vi.fn(),
		to: vi.fn(),
	},
}));
vi.mock('@/components/layouts/PageWrapper/PageWrapper', () => ({
	default: ({ children }: PropsWithChildren) => <main>{children}</main>,
}));
vi.mock('@/components/icon/Icon', () => ({ default: () => null }));
vi.mock('@/hooks/useThemeColorGlobal', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: 500 }),
}));

const criticalNotice: UserNotificationDTO = {
	id: 7,
	status: 'unread',
	bucket: 'Important',
	created_at: '2026-10-15T10:00:00-03:00',
	message: 'Notebook Lenovo entró en stock crítico: quedan 3 disponibles (umbral 5).',
	event: {
		id: 70,
		type_key: 'inventory.critical-stock-entered',
		type_label: 'Stock crítico',
		module: 'inventory',
		payload: {
			product_id: 42,
			product_name: 'Notebook Lenovo',
			sku: 'NB-001',
			threshold: 5,
			available_quantity: 3,
			fit_quantity: 4,
			held_quantity: 1,
			critical_since: '2026-10-15T10:00:00-03:00',
		},
	},
};

const renderDetail = (notification: UserNotificationDTO, permisos: string[]) => {
	const { Wrapper } = withStore({
		...buildAuthState({ permisos }),
		notifications: { items: [notification], loading: false },
	});
	return render(
		<Wrapper>
			<MemoryRouter initialEntries={[`/notificaciones/${notification.id}`]}>
				<Routes>
					<Route path='/notificaciones/:id' element={<NotificationDetail />} />
					<Route path='/inventario/stock/:productId' element={<p>Ficha abierta</p>} />
				</Routes>
			</MemoryRouter>
		</Wrapper>,
	);
};

describe('NotificationDetail — aviso de stock crítico', () => {
	it('muestra el mensaje del backend y, con view-product, abre la ficha de inventario', () => {
		renderDetail(criticalNotice, ['view-product']);

		expect(screen.getByText(criticalNotice.message ?? '')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Ver ficha de inventario' }));
		expect(screen.getByText('Ficha abierta')).toBeInTheDocument();
	});

	it('sin view-product no ofrece el enlace', () => {
		renderDetail(criticalNotice, ['receive-critical-stock-alerts']);

		expect(screen.getByText(criticalNotice.message ?? '')).toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: 'Ver ficha de inventario' }),
		).not.toBeInTheDocument();
	});

	it('un aviso de otro tipo no ofrece el enlace aunque traiga product_id', () => {
		renderDetail(
			{
				...criticalNotice,
				event: { ...criticalNotice.event, id: 71, type_key: 'product.updated' },
			},
			['view-product'],
		);

		expect(
			screen.queryByRole('button', { name: 'Ver ficha de inventario' }),
		).not.toBeInTheDocument();
	});
});
