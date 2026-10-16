import React, { PropsWithChildren } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildAuthState, withStore } from '@/test-utils/renderWithStore';
import type {
	NotificationEventDTO,
	UserNotificationDTO,
} from '@/interface/notifications.interface';
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

const criticalEvent: NotificationEventDTO = {
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
};

const criticalNotice: UserNotificationDTO = {
	id: 7,
	status: 'unread',
	bucket: 'Important',
	created_at: '2026-10-15T10:00:00-03:00',
	message: 'Notebook Lenovo entró en stock crítico: quedan 3 disponibles (umbral 5).',
	event: criticalEvent,
};

interface IActiveContext {
	/** Filial activa del usuario (`user.subsidiary`). */
	subsidiaryId: number;
	visibleSubsidiaries?: Array<{ id: number; name: string }>;
}

const renderDetail = (
	notification: UserNotificationDTO,
	permisos: string[],
	context?: IActiveContext,
) => {
	const { auth } = buildAuthState({ permisos });
	const user = context
		? {
				...auth.user,
				subsidiary: { id: context.subsidiaryId, name: 'Filial activa' },
				visible: { ...auth.user.visible, subsidiaries: context.visibleSubsidiaries ?? [] },
			}
		: auth.user;
	const { Wrapper } = withStore({
		auth: { ...auth, user },
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

const withScope = (subsidiaryId: number): UserNotificationDTO => ({
	...criticalNotice,
	event: {
		...criticalEvent,
		scope: { company_id: 1, subsidiary_id: subsidiaryId, branch_id: null },
	},
});

const inventoryButton = () => screen.queryByRole('button', { name: 'Ver ficha de inventario' });

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
				event: { ...criticalEvent, id: 71, type_key: 'product.updated' },
			},
			['view-product'],
		);

		expect(
			screen.queryByRole('button', { name: 'Ver ficha de inventario' }),
		).not.toBeInTheDocument();
	});

	describe('filial del aviso', () => {
		it('de otra filial no enlaza y explica cómo cambiarla, con su nombre', () => {
			renderDetail(withScope(1), ['view-product'], {
				subsidiaryId: 2,
				visibleSubsidiaries: [
					{ id: 1, name: 'Filial Norte' },
					{ id: 2, name: 'Filial Sur' },
				],
			});

			expect(inventoryButton()).not.toBeInTheDocument();
			expect(
				screen.getByText(
					'Este aviso es de la filial Filial Norte; cámbiala en el encabezado para ver la ficha.',
				),
			).toBeInTheDocument();
		});

		it('de otra filial sin nombre conocido usa un texto neutro, sin el ID', () => {
			renderDetail(withScope(1), ['view-product'], { subsidiaryId: 2 });

			expect(inventoryButton()).not.toBeInTheDocument();
			expect(
				screen.getByText(
					'Este aviso es de otra filial; cámbiala en el encabezado para ver la ficha.',
				),
			).toBeInTheDocument();
		});

		it('de la filial activa enlaza a la ficha sin nota', () => {
			renderDetail(withScope(2), ['view-product'], { subsidiaryId: 2 });

			expect(inventoryButton()).toBeInTheDocument();
			expect(screen.queryByText(/cámbiala en el encabezado/)).not.toBeInTheDocument();
		});

		it('sin scope enlaza a la ficha como antes', () => {
			renderDetail(criticalNotice, ['view-product'], { subsidiaryId: 2 });

			expect(inventoryButton()).toBeInTheDocument();
			expect(screen.queryByText(/cámbiala en el encabezado/)).not.toBeInTheDocument();
		});
	});
});
