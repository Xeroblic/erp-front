import type { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import inventoryStock from '@/store/slices/procurement/inventoryStockSlice';
import { inventoryStockEnvelope } from '@/mocks/db/procurement.db';
import AdjustmentPanel from '../components/adjustment/AdjustmentPanel';

const fetchData = vi.hoisted(() => vi.fn());
vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('@/config/inventoryAdjustments.config', () => ({ default: false }));
vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return { useAppDispatch: redux.useDispatch, useAppSelector: redux.useSelector };
});
vi.mock('framer-motion', () => ({
	AnimatePresence: ({ children }: { children: ReactNode }) => children,
	motion: { section: ({ children }: { children: ReactNode }) => <section>{children}</section> },
}));
const warehouseResponse = (page: number) => ({
	data: {
		data: [
			{
				id: page === 1 ? 8 : 12,
				name: page === 1 ? 'Central real' : 'Estante real',
				is_active: page === 1,
			},
		],
		meta: { last_page: 2 },
	},
});
beforeEach(() => {
	vi.clearAllMocks();
	fetchData.mockImplementation((config: { url: string; params?: { page?: number } }) => {
		if (config.url.endsWith('/warehouses'))
			return Promise.resolve(warehouseResponse(config.params?.page ?? 1));
		return Promise.resolve({ data: inventoryStockEnvelope });
	});
});
const mount = (branchId = 4, preselect = false) => {
	const store = configureStore({
		reducer: { inventoryStock, auth: (state = { user: { id: 1 } }) => state },
	});
	const node = (id: number) => (
		<Provider store={store}>
			<AdjustmentPanel
				branchId={id}
				subsidiaryId={2}
				owner={`2:${id}`}
				multiLocation
				preselection={preselect ? { location: 'warehouse:12', productId: null } : undefined}
			/>
		</Provider>
	);
	return { ...render(node(branchId)), node };
};

describe('Ajuste de etapa 2 — catálogo API real', () => {
	it('recorre todas las páginas y ofrece bodegas reales, incluidas las inactivas', async () => {
		mount();
		const select = await screen.findByLabelText('Ubicación');
		expect(screen.getByRole('option', { name: 'Estante real (inactiva)' })).toHaveValue(
			'warehouse:12',
		);
		fireEvent.change(select, { target: { value: 'warehouse:8' } });
		expect(select).toHaveValue('warehouse:8');
		expect(fetchData).toHaveBeenCalledWith(
			expect.objectContaining({
				url: '/branches/4/warehouses',
				params: { page: 2, per_page: 100 },
			}),
		);
	});

	it('espera el catálogo antes de conservar la bodega del enlace directo', async () => {
		mount(4, true);
		expect(screen.getByRole('status')).toHaveTextContent('Cargando bodegas');
		await screen.findByText('Estante real (inactiva)');
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
	});

	it('explica un 403 y permite reintentar o elegir explícitamente Sin ubicación', async () => {
		fetchData.mockRejectedValueOnce({
			response: { status: 403, data: { message: 'Sin permiso de bodegas' } },
		});
		mount();
		await screen.findByText('Sin permiso de bodegas');
		expect(screen.queryByLabelText('Ubicación')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Ajustar solo Sin ubicación' }));
		expect(await screen.findByText('Sin ubicación')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Reintentar bodegas' }));
		expect(await screen.findByLabelText('Ubicación')).toBeInTheDocument();
	});

	it('oculta las bodegas anteriores en el primer render de otra sucursal', async () => {
		const mounted = mount();
		await screen.findByRole('option', { name: 'Central real' });
		fetchData.mockImplementationOnce(() => new Promise(() => {}));
		mounted.rerender(mounted.node(5));
		expect(screen.queryByRole('option', { name: 'Central real' })).not.toBeInTheDocument();
		await waitFor(() =>
			expect(screen.getByRole('status')).toHaveTextContent('Cargando bodegas'),
		);
	});
});
