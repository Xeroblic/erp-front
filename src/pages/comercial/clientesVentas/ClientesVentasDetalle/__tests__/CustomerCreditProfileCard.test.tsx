import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

const emptySummaryData = {
	total_outstanding: '0',
	overdue: { count: 0, amount: '0' },
	due_within_7_days: { count: 0, amount: '0' },
	current: { count: 0, amount: '0' },
};

let creditProfileResponse: unknown = {
	data: {
		id: null,
		customer_sale_id: null,
		is_active: false,
		payment_term_days: 30,
		credit_limit: null,
		notes: null,
	},
};
let creditProfilePutResponse: unknown = null;
let shouldRejectCreditProfile = false;
let creditProfileError: Error | null = null;

const deferred = <T,>() => {
	let resolve: (value: T) => void = () => undefined;
	let reject: (reason?: unknown) => void = () => undefined;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
};

const setupFetchData = () => {
	apiSpies.fetchData.mockImplementation(({ url, method }: { url: string; method?: string }) => {
		if (
			url.includes('/customer-sales') &&
			url.includes('/credit-profile') &&
			method !== 'put'
		) {
			if (shouldRejectCreditProfile) {
				return Promise.reject(creditProfileError ?? new Error('Servicio no disponible'));
			}
			return Promise.resolve(creditProfileResponse);
		}
		if (
			url.includes('/customer-sales') &&
			url.includes('/credit-profile') &&
			method === 'put'
		) {
			if (shouldRejectCreditProfile) {
				return Promise.reject(creditProfileError ?? new Error('No se pudo guardar'));
			}
			return Promise.resolve(creditProfilePutResponse ?? creditProfileResponse);
		}
		if (url.includes('/deferred-payments/summary')) {
			return Promise.resolve({ data: emptySummaryData });
		}
		return Promise.reject(new Error(`URL no esperada: ${url}`));
	});
};

const waitForButtonClickGuard = async (): Promise<void> => {
	await act(async () => {
		await new Promise<void>((resolve) => {
			setTimeout(resolve, 450);
		});
	});
};

describe('CustomerCreditProfileCard', () => {
	beforeEach(() => {
		apiSpies.fetchData.mockReset();
		apiSpies.invalidateCache.mockReset();
		authorizationSpies.authorize.mockReset().mockReturnValue(true);
		authorizationSpies.hasAnyPermission.mockReset().mockReturnValue(true);
		creditProfileResponse = {
			data: {
				id: null,
				customer_sale_id: null,
				is_active: false,
				payment_term_days: 30,
				credit_limit: null,
				notes: null,
			},
		};
		creditProfilePutResponse = null;
		shouldRejectCreditProfile = false;
		creditProfileError = null;
		setupFetchData();
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
		creditProfilePutResponse = { data: savedProfile };

		render(<CustomerCreditProfileCard customerSaleId={8} />);

		expect(await screen.findByText('Sin información registrada.')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Crear perfil' }));
		fireEvent.change(screen.getByLabelText('Plazo de pago (días)'), {
			target: { value: '45' },
		});
		fireEvent.change(screen.getByLabelText('Notas'), { target: { value: '   ' } });
		fireEvent.click(screen.getByRole('button', { name: 'Guardar condiciones' }));

		await waitFor(() =>
			expect(apiSpies.fetchData).toHaveBeenCalledWith(
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
		await waitForButtonClickGuard();
	});

	it('muestra claramente un perfil suspendido', async () => {
		creditProfileResponse = {
			data: {
				id: 6,
				customer_sale_id: 8,
				is_active: false,
				payment_term_days: 30,
				credit_limit: '500000.00',
				notes: 'Revisar antes de reactivar.',
			},
		};
		setupFetchData();

		render(<CustomerCreditProfileCard customerSaleId={8} />);

		expect(await screen.findByText('Suspendido')).toBeInTheDocument();
		expect(screen.getByText('$ 500.000')).toBeInTheDocument();
		expect(screen.getByText('Revisar antes de reactivar.')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
		expect(screen.getByLabelText('Cupo de crédito')).toHaveValue('$ 500.000');
		await waitForButtonClickGuard();
	});

	it('muestra la barra de progreso cuando hay cupo definido', async () => {
		creditProfileResponse = {
			data: {
				id: 7,
				customer_sale_id: 8,
				is_active: true,
				payment_term_days: 30,
				credit_limit: '1000000',
				notes: null,
			},
		};
		setupFetchData();
		apiSpies.fetchData.mockImplementation(
			({ url, method }: { url: string; method?: string }) => {
				if (
					url.includes('/customer-sales') &&
					url.includes('/credit-profile') &&
					method !== 'put'
				) {
					return Promise.resolve(creditProfileResponse);
				}
				if (url.includes('/deferred-payments/summary')) {
					return Promise.resolve({
						data: { ...emptySummaryData, total_outstanding: '350000' },
					});
				}
				return Promise.reject(new Error(`URL no esperada: ${url}`));
			},
		);

		render(<CustomerCreditProfileCard customerSaleId={8} />);

		expect(await screen.findByText('Activo')).toBeInTheDocument();
		expect(screen.getByText('$ 1.000.000')).toBeInTheDocument();
		expect(screen.getByText('Usado $ 350.000')).toBeInTheDocument();
		expect(screen.getByText('35%')).toBeInTheDocument();
		expect(screen.getByText('Disponible $ 650.000')).toBeInTheDocument();
		await waitForButtonClickGuard();
	});

	it('formatea el cupo en CLP y descarta caracteres que no son números', async () => {
		render(<CustomerCreditProfileCard customerSaleId={8} />);

		fireEvent.click(await screen.findByRole('button', { name: 'Crear perfil' }));
		const creditLimitInput = screen.getByLabelText('Cupo de crédito');
		fireEvent.change(creditLimitInput, { target: { value: '500000' } });
		expect(creditLimitInput).toHaveValue('$ 500.000');
		fireEvent.change(creditLimitInput, { target: { value: '$ 500.000abc' } });
		expect(creditLimitInput).toHaveValue('$ 500.000');
		await waitForButtonClickGuard();
	});

	it('mantiene las acciones dentro de su formulario independiente', async () => {
		render(<CustomerCreditProfileCard customerSaleId={8} />);

		const createButton = await screen.findByRole('button', { name: 'Crear perfil' });
		expect(createButton).toHaveAttribute('type', 'button');
		fireEvent.click(createButton);

		expect(
			screen.getByRole('form', { name: 'Formulario de condiciones de crédito' }),
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveAttribute('type', 'button');
		expect(screen.getByRole('button', { name: 'Guardar condiciones' })).toHaveAttribute(
			'type',
			'submit',
		);
		await waitForButtonClickGuard();
	});

	it('permite reintentar cuando no se puede cargar el perfil', async () => {
		shouldRejectCreditProfile = true;
		creditProfileError = new Error('Servicio no disponible');
		setupFetchData();

		render(<CustomerCreditProfileCard customerSaleId={8} />);

		expect(await screen.findByText('Servicio no disponible')).toBeInTheDocument();

		shouldRejectCreditProfile = false;
		setupFetchData();
		fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
		expect(await screen.findByText('Sin información registrada.')).toBeInTheDocument();
		await waitForButtonClickGuard();
	});

	it('conserva el borrador tras un error al guardar y permite cancelarlo', async () => {
		creditProfilePutResponse = null;
		apiSpies.fetchData.mockImplementation(
			({ url, method }: { url: string; method?: string }) => {
				if (
					url.includes('/customer-sales') &&
					url.includes('/credit-profile') &&
					method !== 'put'
				) {
					return Promise.resolve({
						data: {
							id: null,
							customer_sale_id: null,
							is_active: false,
							payment_term_days: 30,
							credit_limit: null,
							notes: null,
						},
					});
				}
				if (
					url.includes('/customer-sales') &&
					url.includes('/credit-profile') &&
					method === 'put'
				) {
					return Promise.reject(new Error('No se pudo guardar'));
				}
				if (url.includes('/deferred-payments/summary')) {
					return Promise.resolve({ data: emptySummaryData });
				}
				return Promise.reject(new Error(`URL no esperada: ${url}`));
			},
		);

		render(<CustomerCreditProfileCard customerSaleId={8} />);

		fireEvent.click(await screen.findByRole('button', { name: 'Crear perfil' }));
		fireEvent.change(screen.getByLabelText('Plazo de pago (días)'), {
			target: { value: '45' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Guardar condiciones' }));

		expect(await screen.findByText('No se pudo guardar')).toBeInTheDocument();
		expect(screen.getByLabelText('Plazo de pago (días)')).toHaveValue(45);
		fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
		expect(screen.getByText('Sin información registrada.')).toBeInTheDocument();
		await waitForButtonClickGuard();
	});

	it('ignora una carga obsoleta después de cambiar de cliente', async () => {
		const firstLoad = deferred<unknown>();
		const secondLoad = deferred<unknown>();
		apiSpies.fetchData.mockImplementation(
			({ url, method }: { url: string; method?: string }) => {
				if (url.includes('/customer-sales/8/credit-profile') && method !== 'put') {
					return firstLoad.promise;
				}
				if (url.includes('/customer-sales/9/credit-profile') && method !== 'put') {
					return secondLoad.promise;
				}
				return Promise.reject(new Error(`URL no esperada: ${url}`));
			},
		);

		const view = render(<CustomerCreditProfileCard customerSaleId={8} />);
		await waitFor(() => expect(apiSpies.fetchData).toHaveBeenCalledTimes(1));
		view.rerender(<CustomerCreditProfileCard customerSaleId={9} />);
		await waitFor(() => expect(apiSpies.fetchData).toHaveBeenCalledTimes(2));

		await act(async () => {
			secondLoad.resolve({
				data: {
					id: 9,
					customer_sale_id: 9,
					is_active: true,
					payment_term_days: 90,
					credit_limit: null,
					notes: null,
				},
			});
		});
		expect(await screen.findByText('90 días')).toBeInTheDocument();

		await act(async () => {
			firstLoad.resolve({
				data: {
					id: 8,
					customer_sale_id: 8,
					is_active: true,
					payment_term_days: 15,
					credit_limit: null,
					notes: null,
				},
			});
		});
		expect(screen.getByText('90 días')).toBeInTheDocument();
		expect(screen.queryByText('15 días')).not.toBeInTheDocument();
	});

	it('limpia la edición y el borrador cuando cambia la identidad del cliente', async () => {
		const view = render(<CustomerCreditProfileCard customerSaleId={8} />);
		fireEvent.click(await screen.findByRole('button', { name: 'Crear perfil' }));
		fireEvent.change(screen.getByLabelText('Notas'), { target: { value: 'Borrador de A' } });

		view.rerender(<CustomerCreditProfileCard customerSaleId={9} />);
		expect(await screen.findByText('Sin información registrada.')).toBeInTheDocument();
		expect(
			screen.queryByRole('form', { name: 'Formulario de condiciones de crédito' }),
		).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Crear perfil' }));
		expect(screen.getByLabelText('Notas')).toHaveValue('');
		await waitForButtonClickGuard();
	});

	it('aborta e ignora el error de guardado de la identidad anterior', async () => {
		const pendingSave = deferred<unknown>();
		let saveSignal: AbortSignal | undefined;
		apiSpies.fetchData.mockImplementation(
			({ url, method, signal }: { url: string; method?: string; signal?: AbortSignal }) => {
				if (url.includes('/customer-sales/8/credit-profile') && method !== 'put') {
					return Promise.resolve({
						data: {
							id: null,
							customer_sale_id: null,
							is_active: false,
							payment_term_days: 30,
							credit_limit: null,
							notes: null,
						},
					});
				}
				if (url.includes('/customer-sales/9/credit-profile') && method !== 'put') {
					return Promise.resolve({
						data: {
							id: 9,
							customer_sale_id: 9,
							is_active: true,
							payment_term_days: 90,
							credit_limit: null,
							notes: null,
						},
					});
				}
				if (url.includes('/customer-sales/8/credit-profile') && method === 'put') {
					saveSignal = signal;
					return pendingSave.promise;
				}
				return Promise.reject(new Error(`URL no esperada: ${url}`));
			},
		);

		const view = render(<CustomerCreditProfileCard customerSaleId={8} />);
		fireEvent.click(await screen.findByRole('button', { name: 'Crear perfil' }));
		fireEvent.change(screen.getByLabelText('Plazo de pago (días)'), {
			target: { value: '45' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Guardar condiciones' }));
		await waitFor(() => expect(saveSignal).toBeDefined());

		view.rerender(<CustomerCreditProfileCard customerSaleId={9} />);
		expect(saveSignal?.aborted).toBe(true);
		expect(await screen.findByText('90 días')).toBeInTheDocument();

		await act(async () => {
			pendingSave.reject(new Error('No se pudo guardar'));
		});
		expect(screen.getByText('90 días')).toBeInTheDocument();
		expect(screen.queryByText('No se pudo guardar')).not.toBeInTheDocument();
	});

	it('muestra el perfil, pero oculta las acciones sin permiso de edición', async () => {
		authorizationSpies.authorize.mockImplementation(
			({ permission }: { permission?: string | string[] }) =>
				permission === ERP_PERMISSIONS.DEFERRED_PAYMENTS.VIEW,
		);
		creditProfileResponse = {
			data: {
				id: 9,
				customer_sale_id: 8,
				is_active: true,
				payment_term_days: 30,
				credit_limit: null,
				notes: null,
			},
		};
		setupFetchData();

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
