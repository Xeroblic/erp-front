import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import customerSalesReducer from '@/store/slices/customerSales/customerSalesSlice';
import authReducer from '@/store/slices/auth/authSlice';
import type { IQuote } from '@/interface';
import { calculateQuotationGrossUnitPrice, mapItemToFormItem } from '../shared/helpers';
import CreateQuotationModal from '../ModalCreacion/CreateQuotationModal';
import EditQuotationModal from '../ModalEditar/EditQuotationModal';

const apiSpies = vi.hoisted(() => ({
	fetchData: vi.fn(),
	fetchNormalized: vi.fn(),
	invalidateCache: vi.fn(),
}));

vi.mock('@/services/ApiService', () => ({ default: apiSpies }));
vi.mock('@/pages/comercial/clientesVentas/components/modals/CreateCustomerSaleModal', () => ({
	default: () => null,
}));
vi.mock('react-i18next', () => ({
	useTranslation: () => ({ i18n: { dir: () => 'ltr' } }),
}));
vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ authorize: () => true, hasAnyPermission: () => true, isSuperAdmin: true }),
}));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ branchId: 1, subsidiaryId: 1, hasValidBranch: true }),
}));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

const createTestStore = () =>
	configureStore({
		reducer: { auth: authReducer, customerSales: customerSalesReducer },
	});

const renderWithStore = (ui: React.ReactElement) =>
	render(<Provider store={createTestStore()}>{ui}</Provider>);

/** Todas las casillas «Calcular IVA» visibles, una por ítem del formulario. */
const ivaCheckboxes = () => screen.getAllByRole('checkbox', { name: 'Calcular IVA' });

describe('Valores por defecto de la cotización', () => {
	beforeEach(() => {
		const portalRoot = document.createElement('div');
		portalRoot.id = 'portal-root';
		document.body.appendChild(portalRoot);
		apiSpies.fetchData.mockReset();
		apiSpies.fetchNormalized.mockReset();
		apiSpies.fetchData.mockResolvedValue({ data: { data: [] } });
		apiSpies.fetchNormalized.mockResolvedValue([]);
	});

	it('abre una cotización nueva con IVA por ítem, IVA global y efectivo sin recargo', async () => {
		renderWithStore(
			<CreateQuotationModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} />, //
		);

		await waitFor(() => expect(ivaCheckboxes()).toHaveLength(1));
		expect(ivaCheckboxes()[0]).toBeChecked();
		expect(screen.getByRole('checkbox', { name: 'Calcula IVA por ítem (19%)' })).toBeChecked();
		expect(screen.getByText('Efectivo')).toBeInTheDocument();
		expect(screen.queryByText('Recargo por Método de Pago %')).not.toBeInTheDocument();
	});

	it('crea cada ítem nuevo, de catálogo o libre, con «Calcular IVA» marcado', async () => {
		renderWithStore(<CreateQuotationModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} />);

		await waitFor(() => expect(ivaCheckboxes()).toHaveLength(1));
		fireEvent.click(screen.getByRole('button', { name: /Agregar producto/ }));
		fireEvent.click(screen.getByRole('button', { name: /Agregar ítem libre/ }));

		await waitFor(() => expect(ivaCheckboxes()).toHaveLength(3));
		ivaCheckboxes().forEach((checkbox) => expect(checkbox).toBeChecked());
	});

	it('rotula el precio según el IVA y muestra el bruto calculado', async () => {
		renderWithStore(<CreateQuotationModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} />);

		await waitFor(() => expect(ivaCheckboxes()).toHaveLength(1));
		fireEvent.change(screen.getByLabelText('Precio neto'), { target: { value: '1000' } });

		const hint = await screen.findByText(/Bruto calculado/);
		expect(hint.textContent?.replace(/\s/g, '')).toContain('1.190');

		fireEvent.click(ivaCheckboxes()[0]);

		expect(await screen.findByLabelText('Precio bruto c/ IVA')).toBeInTheDocument();
		expect(screen.queryByText(/Bruto calculado/)).not.toBeInTheDocument();
	});

	it('calcula el precio bruto con el mismo criterio que pagos diferidos', () => {
		expect(calculateQuotationGrossUnitPrice(1000, true)).toBe(1190);
		expect(calculateQuotationGrossUnitPrice(1000, false)).toBe(1000);
		// Se redondea el unitario a dos decimales, no el total de la fila.
		expect(calculateQuotationGrossUnitPrice(33.33, true)).toBe(39.66);
		expect(calculateQuotationGrossUnitPrice('', true)).toBeNull();
		expect(calculateQuotationGrossUnitPrice(-1, true)).toBeNull();
	});

	it('respeta el IVA guardado de cada ítem al mapear una cotización existente', () => {
		expect(
			mapItemToFormItem({
				id: 1,
				quote_id: 1,
				product_id: 5,
				quantity: 1,
				unit_price: 1000,
				metadata: { includes_tax: false },
			} as never).includes_tax,
		).toBe(false);
		expect(
			mapItemToFormItem({
				id: 2,
				quote_id: 1,
				product_id: 5,
				quantity: 1,
				unit_price: 1000,
				metadata: { includes_tax: true },
			} as never).includes_tax,
		).toBe(true);
	});
});

const buildQuotation = (overrides: Partial<IQuote> = {}): IQuote =>
	({
		id: 10,
		subsidiary_id: 1,
		customer_id: 77,
		customer: { id: 77, name: 'Comercial Zeta', rut: '76.777.000-1' },
		quote_date: '2026-01-10',
		expiry_date: '2026-02-10',
		status: 'draft',
		payment_method: 'transferencia',
		document_type: 'boleta',
		payment_terms: 0,
		subtotal: 1000,
		tax_amount: 190,
		total_amount: 1190,
		tax_percentage: 19,
		discount_amount: 0,
		items: [
			{
				id: 1,
				quote_id: 10,
				product_id: null,
				customer_name: 'Servicio exento',
				quantity: 1,
				unit_price: 1000,
				metadata: { includes_tax: false },
			},
		],
		created_at: '2026-01-10T00:00:00Z',
		updated_at: '2026-01-10T00:00:00Z',
		...overrides,
	}) as unknown as IQuote;

describe('Edición de cotización', () => {
	beforeEach(() => {
		const portalRoot = document.createElement('div');
		portalRoot.id = 'portal-root';
		document.body.appendChild(portalRoot);
		apiSpies.fetchData.mockReset();
		apiSpies.fetchNormalized.mockReset();
		apiSpies.fetchData.mockResolvedValue({ data: { data: [] } });
		apiSpies.fetchNormalized.mockResolvedValue([]);
	});

	it('conserva el IVA por ítem y el medio de pago guardados', async () => {
		renderWithStore(
			<EditQuotationModal
				isOpen
				onClose={vi.fn()}
				onSubmit={vi.fn()}
				quotation={buildQuotation()}
			/>,
		);

		await waitFor(() => expect(ivaCheckboxes()).toHaveLength(1));
		expect(ivaCheckboxes()[0]).not.toBeChecked();
		expect(screen.getByText('Transferencia')).toBeInTheDocument();
	});

	it('cae a efectivo sólo cuando la cotización no tiene medio de pago', async () => {
		renderWithStore(
			<EditQuotationModal
				isOpen
				onClose={vi.fn()}
				onSubmit={vi.fn()}
				quotation={buildQuotation({ payment_method: null })}
			/>,
		);

		expect(await screen.findByText('Efectivo')).toBeInTheDocument();
	});
});
