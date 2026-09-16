import type { ReactNode } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import inventoryStock from '@/store/slices/procurement/inventoryStockSlice';
import AjustesTrasladosView from '@/pages/inventario/abastecimiento/AjustesTraslados/AjustesTrasladosView';
import { resetInventoryStockStoreForTests } from '@/services/procurement/inventoryStock.service';

vi.mock('@/config/inventoryStock.config', () => ({ default: true }));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ branchId: 4, subsidiaryId: 2 }),
}));
vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return { useAppDispatch: redux.useDispatch, useAppSelector: redux.useSelector };
});
vi.mock('@/components/layouts/PageWrapper/PageWrapper', () => ({
	default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
/**
 * La transición entre pasos del asistente no aporta a estas pruebas y en jsdom
 * demora el cambio de paso: `framer-motion` se sustituye por elementos planos.
 */
vi.mock('framer-motion', () => ({
	AnimatePresence: ({ children }: { children: ReactNode }) => children,
	motion: {
		section: ({
			children,
			className,
			'aria-labelledby': labelledBy,
		}: {
			children: ReactNode;
			className?: string;
			'aria-labelledby'?: string;
		}) => (
			<section className={className} aria-labelledby={labelledBy}>
				{children}
			</section>
		),
	},
}));
/**
 * `react-select` no expone sus opciones como controles nativos en jsdom; como
 * en `StockPorUbicacion.test.tsx`, `SelectReact` se sustituye por un `<select>`
 * nativo cableado a las mismas props.
 */
vi.mock('@/components/form/SelectReact', () => ({
	default: ({
		'aria-label': ariaLabel,
		isDisabled,
		options,
		value,
		onChange,
		placeholder,
	}: {
		'aria-label'?: string;
		isDisabled?: boolean;
		options?: { value: string; label: string }[];
		value?: { value: string; label: string } | null;
		onChange?: (option: { value: string; label: string } | null) => void;
		placeholder?: string;
	}) => (
		<select
			aria-label={ariaLabel}
			disabled={isDisabled}
			value={value?.value ?? ''}
			onChange={(event) => {
				const selected =
					options?.find((option) => option.value === event.target.value) ?? null;
				onChange?.(selected);
			}}>
			<option value=''>{placeholder}</option>
			{options?.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	),
}));

const auth = createSlice({
	name: 'auth',
	initialState: {
		loading: false,
		user: {
			id: 1,
			permisos: ['view-product', 'edit-product'] as string[],
			roles: [] as string[],
			visible: { branches: [{ id: 4 }], subsidiaries: [{ id: 2 }] },
		},
	},
	reducers: {},
});

const LocationProbe = () => {
	const location = useLocation();
	return <output data-testid='location'>{location.search}</output>;
};

const renderPage = (entry: string) => {
	const store = configureStore({ reducer: { inventoryStock, auth: auth.reducer } });
	return render(
		<Provider store={store}>
			<MemoryRouter initialEntries={[entry]}>
				<AjustesTrasladosView />
				<LocationProbe />
			</MemoryRouter>
		</Provider>,
	);
};

afterEach(() => {
	resetInventoryStockStoreForTests();
	vi.restoreAllMocks();
});

describe('Ajustes y traslados — una página con dos pestañas', () => {
	it('abre la pestaña de ajuste por omisión y sin montar el traslado', () => {
		renderPage('/');
		expect(screen.getByRole('tab', { name: 'Ajuste de inventario' })).toHaveAttribute(
			'aria-selected',
			'true',
		);
		expect(screen.getByLabelText('Ubicación')).toBeInTheDocument();
		// El traslado no carga su stock hasta que se abre su pestaña.
		expect(screen.queryByLabelText('Origen')).not.toBeInTheDocument();
	});

	it('respeta `?tab=traslado` y descarta un valor desconocido', () => {
		const { unmount } = renderPage('/?tab=traslado');
		expect(screen.getByRole('tab', { name: 'Traslados internos' })).toHaveAttribute(
			'aria-selected',
			'true',
		);
		expect(screen.getByLabelText('Origen')).toBeInTheDocument();
		expect(screen.queryByLabelText('Ubicación')).not.toBeInTheDocument();
		unmount();

		renderPage('/?tab=otra');
		expect(screen.getByRole('tab', { name: 'Ajuste de inventario' })).toHaveAttribute(
			'aria-selected',
			'true',
		);
	});

	it('cambia de pestaña en la URL sin descartar el formulario de la otra', () => {
		renderPage('/?tab=ajuste');
		fireEvent.change(screen.getByLabelText('Ubicación'), {
			target: { value: 'unlocated' },
		});

		fireEvent.click(screen.getByRole('tab', { name: 'Traslados internos' }));
		expect(screen.getByTestId('location')).toHaveTextContent('?tab=traslado');
		expect(screen.getByLabelText('Origen')).toBeInTheDocument();

		fireEvent.click(screen.getByRole('tab', { name: 'Ajuste de inventario' }));
		expect(screen.getByTestId('location')).toHaveTextContent('?tab=ajuste');
		expect(screen.getByLabelText('Ubicación')).toHaveValue('unlocated');
	});

	it('nombra cada paso con su propio título aunque ambas pestañas estén montadas', () => {
		renderPage('/?tab=ajuste');
		fireEvent.click(screen.getByRole('tab', { name: 'Traslados internos' }));

		const sections = [...document.querySelectorAll('section[aria-labelledby]')];
		expect(sections).toHaveLength(2);
		const titleIds = sections.map((section) => section.getAttribute('aria-labelledby') ?? '');
		expect(new Set(titleIds).size).toBe(2);
		sections.forEach((section, index) => {
			// Cada sección apunta a un título que está dentro de ella misma.
			expect(section).toContainElement(document.getElementById(titleIds[index]));
		});
		expect(screen.getByRole('region', { name: /Origen y destino/ })).toBeInTheDocument();
		expect(screen.getByRole('region', { name: /Paso 1 de 3: Ubicación/ })).toBeInTheDocument();
	});
});
