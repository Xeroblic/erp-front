import React, { PropsWithChildren } from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { toast } from 'react-toastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAuthState, renderWithStore } from '@/test-utils/renderWithStore';
import type { UnmappedWooCommerceProduct } from '@/types/integrations.types';
import { UnmappedProductsContent } from '../UnmappedProductsPage';

const IGNORE_FULFILLED = 'unmappedProducts/ignore/fulfilled';

const mocks = vi.hoisted(() => ({
	ignore: vi.fn<(args: { unmappedProductId: number }) => void>(),
	fetchUnmapped: vi.fn(),
}));

vi.mock('react-toastify', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/store/selectors/subsidiarySelectors', () => ({
	selectEffectiveSubsidiaryId: () => 1,
}));

vi.mock('@/store/slices/integrations/integrationsSlice', () => ({
	default: (state: Record<string, unknown> = {}) => state,
	fetchIntegrations: () => () => Promise.resolve({ type: 'integrations/fetch/fulfilled' }),
}));

vi.mock('@/store/slices/integrations/unmappedProductsSlice', () => ({
	default: (state: Record<string, unknown> = {}) => state,
	fetchUnmappedProducts: () => () => {
		mocks.fetchUnmapped();
		return Promise.resolve({ type: 'unmappedProducts/fetch/fulfilled' });
	},
	fetchMappedProducts: () => () => Promise.resolve({ type: 'mappedProducts/fetch/fulfilled' }),
	mapProduct: Object.assign(() => () => Promise.resolve({ type: 'map/rejected' }), {
		fulfilled: { match: () => false },
	}),
	ignoreProduct: Object.assign(
		(args: { unmappedProductId: number }) => () => {
			mocks.ignore(args);
			return Promise.resolve({ type: IGNORE_FULFILLED });
		},
		{ fulfilled: { match: (action: { type: string }) => action.type === IGNORE_FULFILLED } },
	),
}));

// El select real usa react-select: se reemplaza por uno nativo para elegir la integración.
vi.mock('@/components/form/SelectReact', () => ({
	default: ({
		options,
		onChange,
	}: {
		options: Array<{ value: string; label: string }>;
		onChange: (option: { value: string; label: string } | null) => void;
	}) => (
		<select
			aria-label='Integración'
			onChange={(e) => onChange(options.find((o) => o.value === e.target.value) ?? null)}>
			<option value=''>—</option>
			{options.map((o) => (
				<option key={o.value} value={o.value}>
					{o.label}
				</option>
			))}
		</select>
	),
}));

// El modal real anima y monta en un portal: se sustituye por contenedores planos.
vi.mock('@/components/ui/Modal', () => ({
	default: ({ isOpen, children }: PropsWithChildren<{ isOpen: boolean }>) =>
		isOpen ? <section aria-label='Modal'>{children}</section> : null,
	ModalHeader: ({ children }: PropsWithChildren) => <header>{children}</header>,
	ModalBody: ({ children }: PropsWithChildren) => <div>{children}</div>,
	ModalFooter: ({ children }: PropsWithChildren) => <footer>{children}</footer>,
	ModalFooterChild: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('@/components/icon/Icon', () => ({
	default: () => <span aria-hidden='true' />,
}));

const product = {
	id: 42,
	name: 'Polera azul',
	sku: 'POL-AZ',
	external_product_id: 1001,
	sale: { id: 7, sale_number: 'V-0007' },
} as unknown as UnmappedWooCommerceProduct;

const renderPage = () =>
	renderWithStore(<UnmappedProductsContent />, {
		...buildAuthState(),
		integrations: {
			integrations: [
				{ id: 'int-1', is_active: true, name: 'Tienda', base_url: 'https://tienda.test' },
			],
		},
		unmappedProducts: { unmappedProducts: [product], mappedProducts: [], loading: false },
	});

const openIgnoreModal = () => {
	fireEvent.change(screen.getByLabelText('Integración'), { target: { value: 'int-1' } });
	fireEvent.click(screen.getByRole('button', { name: /Ignorar/ }));
	return screen.getByRole('region', { name: 'Modal' });
};

describe('UnmappedProductsPage — ignorar producto', () => {
	beforeEach(() => {
		mocks.ignore.mockClear();
		mocks.fetchUnmapped.mockClear();
		vi.mocked(toast.success).mockClear();
	});

	it('pide confirmación antes de ignorar', () => {
		renderPage();

		const modal = openIgnoreModal();

		expect(within(modal).getByText('Ignorar producto')).toBeInTheDocument();
		expect(mocks.ignore).not.toHaveBeenCalled();
	});

	it('cancelar cierra el modal sin ignorar', () => {
		renderPage();

		const modal = openIgnoreModal();
		fireEvent.click(within(modal).getByRole('button', { name: 'Cancelar' }));

		expect(screen.queryByRole('region', { name: 'Modal' })).not.toBeInTheDocument();
		expect(mocks.ignore).not.toHaveBeenCalled();
	});

	it('confirmar ignora el producto, avisa y recarga la lista', async () => {
		renderPage();

		const modal = openIgnoreModal();
		mocks.fetchUnmapped.mockClear();
		fireEvent.click(within(modal).getByRole('button', { name: 'Ignorar' }));

		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith('Producto marcado como ignorado');
		});
		expect(mocks.ignore).toHaveBeenCalledWith(
			expect.objectContaining({ unmappedProductId: 42, integrationId: 'int-1' }),
		);
		expect(mocks.fetchUnmapped).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole('region', { name: 'Modal' })).not.toBeInTheDocument();
	});
});
