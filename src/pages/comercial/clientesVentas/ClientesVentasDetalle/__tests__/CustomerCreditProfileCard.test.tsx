import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import CustomerCreditProfileCard from '../components/CustomerCreditProfileCard';

const apiSpies = vi.hoisted(() => ({ fetchData: vi.fn(), invalidateCache: vi.fn() }));
const authorizationSpies = vi.hoisted(() => ({ authorize: vi.fn(), hasAnyPermission: vi.fn() }));

vi.mock('@/services/ApiService', () => ({ default: apiSpies }));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ branchId: 1, subsidiaryId: 4, hasValidBranch: true }),
}));
vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));
vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({
		authorize: authorizationSpies.authorize,
		hasAnyPermission: authorizationSpies.hasAnyPermission,
		isLoading: false,
		isSuperAdmin: false,
	}),
}));

const emptyProfile = {
	id: null,
	customer_sale_id: null,
	is_active: false,
	payment_term_days: 30,
	credit_limit: null,
	notes: null,
};

describe('CustomerCreditProfileCard', () => {
	beforeEach(() => {
		apiSpies.fetchData.mockReset();
		apiSpies.invalidateCache.mockReset();
		authorizationSpies.authorize.mockReset().mockReturnValue(true);
		authorizationSpies.hasAnyPermission.mockReset().mockReturnValue(true);
	});

	it('crea un perfil y normaliza los opcionales vacíos', async () => {
		const savedProfile = {
			id: 5,
			customer_sale_id: 8,
			is_active: true,
			payment_term_days: 45,
			credit_limit: null,
			notes: null,
		};
		apiSpies.fetchData
			.mockResolvedValueOnce({ data: { data: emptyProfile } } as never)
			.mockResolvedValueOnce({ data: { data: savedProfile } } as never);

		render(<CustomerCreditProfileCard customerSaleId={8} />);

		expect(await screen.findByText('Sin perfil de crédito.')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Crear perfil' }));
		fireEvent.change(screen.getByLabelText('Plazo de pago (días)'), {
			target: { value: '45' },
		});
		fireEvent.change(screen.getByLabelText('Notas'), { target: { value: '   ' } });
		fireEvent.click(screen.getByRole('button', { name: 'Guardar condiciones' }));

		await waitFor(() =>
			expect(apiSpies.fetchData).toHaveBeenLastCalledWith(
				expect.objectContaining({
					url: '/subsidiaries/4/customer-sales/8/credit-profile',
					method: 'put',
					data: {
						is_active: true,
						payment_term_days: 45,
						credit_limit: null,
						notes: null,
					},
				}),
			),
		);
		expect(await screen.findByText('45 días')).toBeInTheDocument();
		expect(screen.getByText('Sin cupo definido')).toBeInTheDocument();
	});

	it('muestra claramente un perfil suspendido', async () => {
		apiSpies.fetchData.mockResolvedValue({
			data: {
				data: {
					id: 6,
					customer_sale_id: 8,
					is_active: false,
					payment_term_days: 30,
					credit_limit: '500000.00',
					notes: 'Revisar antes de reactivar.',
				},
			},
		} as never);

		render(<CustomerCreditProfileCard customerSaleId={8} />);

		expect(await screen.findByText('Suspendido')).toBeInTheDocument();
		expect(screen.getByText('Revisar antes de reactivar.')).toBeInTheDocument();
	});

	it('mantiene las acciones dentro de su formulario independiente', async () => {
		apiSpies.fetchData.mockResolvedValue({ data: { data: emptyProfile } } as never);

		render(<CustomerCreditProfileCard customerSaleId={8} />);

		const createButton = await screen.findByRole('button', { name: 'Crear perfil' });
		expect(createButton).toHaveAttribute('type', 'button');
		fireEvent.click(createButton);

		expect(
			screen.getByRole('form', { name: 'Formulario de condiciones de crédito' }),
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveAttribute(
			'type',
			'button',
		);
		expect(screen.getByRole('button', { name: 'Guardar condiciones' })).toHaveAttribute(
			'type',
			'submit',
		);
	});

	it('permite reintentar cuando no se puede cargar el perfil', async () => {
		apiSpies.fetchData
			.mockRejectedValueOnce(new Error('Servicio no disponible'))
			.mockResolvedValueOnce({ data: { data: emptyProfile } } as never);

		render(<CustomerCreditProfileCard customerSaleId={8} />);

		expect(await screen.findByText('Servicio no disponible')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
		expect(await screen.findByText('Sin perfil de crédito.')).toBeInTheDocument();
		expect(apiSpies.fetchData).toHaveBeenCalledTimes(2);
	});

	it('conserva el borrador tras un error al guardar y permite cancelarlo', async () => {
		apiSpies.fetchData
			.mockResolvedValueOnce({ data: { data: emptyProfile } } as never)
			.mockRejectedValueOnce(new Error('No se pudo guardar'));

		render(<CustomerCreditProfileCard customerSaleId={8} />);

		fireEvent.click(await screen.findByRole('button', { name: 'Crear perfil' }));
		fireEvent.change(screen.getByLabelText('Plazo de pago (días)'), {
			target: { value: '45' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Guardar condiciones' }));

		expect(await screen.findByText('No se pudo guardar')).toBeInTheDocument();
		expect(screen.getByLabelText('Plazo de pago (días)')).toHaveValue(45);
		fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
		expect(screen.getByText('Sin perfil de crédito.')).toBeInTheDocument();
	});

	it('muestra el perfil, pero oculta las acciones sin permiso de edición', async () => {
		authorizationSpies.authorize.mockImplementation(
			({ permission }: { permission?: string | string[] }) =>
				permission === ERP_PERMISSIONS.DEFERRED_PAYMENTS.VIEW,
		);
		apiSpies.fetchData.mockResolvedValue({
			data: {
				data: {
					id: 9,
					customer_sale_id: 8,
					is_active: true,
					payment_term_days: 30,
					credit_limit: null,
					notes: null,
				},
			},
		} as never);

		render(<CustomerCreditProfileCard customerSaleId={8} />);

		expect(await screen.findByText('Activo')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
	});

	it('no muestra la card sin permiso de lectura', () => {
		authorizationSpies.authorize.mockReturnValue(false);

		render(<CustomerCreditProfileCard customerSaleId={8} />);

		expect(screen.queryByText('Condiciones de crédito')).not.toBeInTheDocument();
		expect(apiSpies.fetchData).not.toHaveBeenCalled();
	});
});
