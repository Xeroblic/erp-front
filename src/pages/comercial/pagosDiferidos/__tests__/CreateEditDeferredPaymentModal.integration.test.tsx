import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import customerSalesReducer from '@/store/slices/customerSales/customerSalesSlice';
import { DEFERRED_PAYMENT_DETAIL_FIXTURES } from './deferredPaymentsTestData';
import deferredPaymentsReducer from '@/store/slices/deferredPayments/deferredPaymentsSlice';
import usersAdminReducer from '@/store/slices/usersAdmin/usersAdminSlice';
import authReducer, { type AuthState } from '@/store/slices/auth/authSlice';
import CreateEditDeferredPaymentModal from '../components/modals/CreateEditDeferredPaymentModal';

const apiSpies = vi.hoisted(() => ({ fetchData: vi.fn(), invalidateCache: vi.fn() }));
const branchContext = vi.hoisted(() => ({ subsidiaryId: 1 as number | null }));

vi.mock('@/services/ApiService', () => ({ default: apiSpies }));
vi.mock('react-i18next', () => ({
	useTranslation: () => ({ i18n: { dir: () => 'ltr' } }),
}));
vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ hasAnyPermission: () => true, isSuperAdmin: true }),
}));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({
		branchId: 1,
		subsidiaryId: branchContext.subsidiaryId,
		hasValidBranch: true,
	}),
}));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

const emptyPagination = {
	data: [],
	current_page: 1,
	from: null,
	last_page: 1,
	per_page: 100,
	to: null,
	total: 0,
	first_page_url: null,
	last_page_url: null,
	prev_page_url: null,
	next_page_url: null,
};

const addDaysToDateOnly = (date: string, days: number) => {
	const [first, second, third] = date.split('-').map(Number);
	const [year, month, day] = date.startsWith('20')
		? [first, second, third]
		: [third, second, first];
	const value = new Date(Date.UTC(year, month - 1, day + days));
	const [resultYear, resultMonth, resultDay] = value.toISOString().slice(0, 10).split('-');
	return `${resultDay}-${resultMonth}-${resultYear}`;
};

const createTestStore = (authUser?: NonNullable<AuthState['user']>) =>
	configureStore({
		reducer: {
			auth: authReducer,
			customerSales: customerSalesReducer,
			deferredPayments: deferredPaymentsReducer,
			usersAdmin: usersAdminReducer,
		},
		preloadedState: {
			auth: {
				...authReducer(undefined, { type: 'test/init' }),
				...(authUser ? { user: authUser, isAuthenticated: true } : {}),
			},
			deferredPayments: {
				...deferredPaymentsReducer(undefined, { type: 'test/init' }),
				listSubsidiaryId: 1,
			},
		},
	});

describe('Integración de CreateEditDeferredPaymentModal', () => {
	beforeEach(() => {
		branchContext.subsidiaryId = 1;
		const portalRoot = document.createElement('div');
		portalRoot.id = 'portal-root';
		document.body.appendChild(portalRoot);
		apiSpies.fetchData.mockReset();
		apiSpies.invalidateCache.mockReset();
		apiSpies.fetchData.mockImplementation(({ url }: { url: string }) =>
			Promise.resolve({
				data: url.includes('/overview')
					? emptyPagination
					: {
							data: [],
							meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 },
						},
			}),
		);
	});

	it('busca clientes remotamente y conserva las opciones del documento editado', async () => {
		const store = configureStore({
			reducer: {
				customerSales: customerSalesReducer,
				deferredPayments: deferredPaymentsReducer,
				usersAdmin: usersAdminReducer,
			},
			preloadedState: {
				deferredPayments: {
					...deferredPaymentsReducer(undefined, { type: 'test/init' }),
					listSubsidiaryId: 1,
				},
			},
		});
		const Wrapper = ({ children }: PropsWithChildren) => (
			<Provider store={store}>{children}</Provider>
		);
		const editedDocument = DEFERRED_PAYMENT_DETAIL_FIXTURES[1];
		render(
			<CreateEditDeferredPaymentModal
				isOpen
				deferredPaymentDocument={editedDocument}
				onClose={vi.fn()}
			/>,
			{ wrapper: Wrapper },
		);

		expect(
			screen.getByText(
				`${editedDocument.customer.billing_company} · ${editedDocument.customer.rut}`,
			),
		).toBeInTheDocument();
		expect(screen.getByText(new RegExp(editedDocument.assignees[0].name))).toBeInTheDocument();
		expect(
			apiSpies.fetchData.mock.calls.some(
				([request]) =>
					typeof request === 'object' &&
					request !== null &&
					'url' in request &&
					request.url === '/subsidiaries/1/customer-sales/overview',
			),
		).toBe(false);

		fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'Automarco' } });
		await waitFor(() =>
			expect(apiSpies.fetchData).toHaveBeenCalledWith(
				expect.objectContaining({
					url: '/subsidiaries/1/customer-sales/overview',
					params: expect.objectContaining({ q: 'Automarco', per_page: 100 }),
				}),
			),
		);
	});

	it('normaliza las etiquetas remotas y omite segmentos vacíos o repetidos', async () => {
		const customers = [
			{
				id: 801,
				name: ' Comercial Zentria SpA ',
				rut: ' 76.801.000-1 ',
				contact: { name: ' Carla Pérez ' },
				loyalty: 0,
				total_sales: 0,
				is_active: true,
			},
			{
				id: 802,
				name: ' Persona Natural ',
				rut: ' ',
				contact: { name: 'persona natural' },
				loyalty: 0,
				total_sales: 0,
				is_active: true,
			},
		];
		apiSpies.fetchData.mockImplementation(({ url }: { url: string }) =>
			Promise.resolve({
				data: url.includes('/overview')
					? { ...emptyPagination, data: customers, total: customers.length }
					: { data: [], meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 } },
			}),
		);
		const store = createTestStore();
		const Wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
		render(<CreateEditDeferredPaymentModal isOpen onClose={vi.fn()} />, { wrapper: Wrapper });

		fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'zentria' } });

		expect(
			await screen.findByText('Comercial Zentria SpA · Carla Pérez · 76.801.000-1'),
		).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'persona' } });
		expect(await screen.findByText('Persona Natural')).toBeInTheDocument();
		expect(screen.queryByText(/Persona Natural ·/)).not.toBeInTheDocument();
	});

	it('permite asignar al usuario de cobranza aunque no pueda listar usuarios', async () => {
		apiSpies.fetchData.mockImplementation(({ url }: { url: string }) => {
			if (url.startsWith('/users?')) return Promise.reject(new Error('Forbidden'));
			return Promise.resolve({ data: emptyPagination });
		});
		const collector = {
			id: 37,
			pk: 37,
			first_name: 'Carla',
			last_name: 'Cobranza',
			email: 'carla@empresa.cl',
			is_active: true,
			authority: ['create-deferred-payment'],
			permisos: ['create-deferred-payment'],
			roles: ['collector'],
		} as NonNullable<AuthState['user']>;
		const store = createTestStore(collector);
		const Wrapper = ({ children }: PropsWithChildren) => (
			<Provider store={store}>{children}</Provider>
		);

		render(<CreateEditDeferredPaymentModal isOpen onClose={vi.fn()} />, { wrapper: Wrapper });

		await waitFor(() => expect(store.getState().usersAdmin.loading.users).toBe(false));
		fireEvent.mouseDown(screen.getByLabelText('Responsables'));
		fireEvent.click(await screen.findByText('Carla Cobranza · carla@empresa.cl'));

		expect(screen.getByText('Carla Cobranza · carla@empresa.cl')).toBeInTheDocument();
	});

	it('carga el perfil existente al editar y conserva el vencimiento del documento', async () => {
		const editedDocument = DEFERRED_PAYMENT_DETAIL_FIXTURES[1];
		apiSpies.fetchData.mockImplementation(({ url }: { url: string }) =>
			Promise.resolve({
				data: url.includes('/credit-profile')
					? {
							data: {
								id: 77,
								customer_sale_id: editedDocument.customer.id,
								is_active: true,
								payment_term_days: 45,
								credit_limit: '500000',
								notes: null,
							},
						}
					: url.includes('/summary')
						? {
								data: {
									total_outstanding: '100000',
									overdue: { count: 0, amount: '0' },
									due_within_7_days: { count: 0, amount: '0' },
									current: { count: 0, amount: '0' },
								},
							}
						: { data: [], meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 } },
			}),
		);
		const store = createTestStore();
		const Wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
		render(
			<CreateEditDeferredPaymentModal
				isOpen
				deferredPaymentDocument={editedDocument}
				onClose={vi.fn()}
			/>,
			{ wrapper: Wrapper },
		);

		await waitFor(() =>
			expect(apiSpies.fetchData).toHaveBeenCalledWith(
				expect.objectContaining({
					url: `/subsidiaries/1/customer-sales/${editedDocument.customer.id}/credit-profile`,
				}),
			),
		);
		expect(await screen.findByText('45 días')).toBeInTheDocument();
		expect(
			screen.queryByText('Este cliente no tiene un perfil de crédito creado.'),
	).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Editar perfil' }));
		expect(await screen.findByText('Editar perfil de crédito')).toBeInTheDocument();
		expect(
			await screen.findByRole('form', { name: 'Formulario de condiciones de crédito' }),
		).toBeInTheDocument();
		expect(screen.getByLabelText('Fecha de vencimiento')).toHaveValue(
			editedDocument.due_date.split('-').reverse().join('-'),
		);
	});

	it('recarga el perfil creado desde el modal secundario al editar un documento', async () => {
		const editedDocument = DEFERRED_PAYMENT_DETAIL_FIXTURES[1];
		let profileWasCreated = false;
		apiSpies.fetchData.mockImplementation(({ url }: { url: string }) =>
			Promise.resolve({
				data: url.includes('/credit-profile')
					? {
							data: profileWasCreated
								? {
										id: 78,
										customer_sale_id: editedDocument.customer.id,
										is_active: true,
										payment_term_days: 45,
										credit_limit: null,
										notes: null,
									}
								: {
										id: null,
										customer_sale_id: null,
										is_active: false,
										payment_term_days: 30,
										credit_limit: null,
										notes: null,
									},
						}
					: { data: [], meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 } },
			}),
		);
		const store = createTestStore();
		const Wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
		render(
			<CreateEditDeferredPaymentModal
				isOpen
				deferredPaymentDocument={editedDocument}
				onClose={vi.fn()}
			/>,
			{ wrapper: Wrapper },
		);

		await screen.findByText('Este cliente no tiene un perfil de crédito creado.');
		fireEvent.click(screen.getByRole('button', { name: 'Crear perfil' }));
		expect(await screen.findByText('Crear perfil de crédito')).toBeInTheDocument();
		expect(
			await screen.findByRole('form', { name: 'Formulario de condiciones de crédito' }),
		).toBeInTheDocument();
		profileWasCreated = true;
		const closeButtons = document.querySelectorAll<HTMLButtonElement>(
			'[data-component-name="CloseButton"]',
		);
		const closeButton = closeButtons.item(closeButtons.length - 1);
		expect(closeButton).not.toBeNull();
		if (closeButton) fireEvent.click(closeButton);

		expect(await screen.findByText('45 días')).toBeInTheDocument();
	});
	it('conserva el cliente elegido sin volver a consultar al cerrar la búsqueda', async () => {
		const searchedCustomer = {
			id: 457,
			name: 'Zeta Corp',
			rut: '76.457.000-1',
			contact: { name: 'Ana Pérez' },
			loyalty: 0,
			total_sales: 0,
			is_active: true,
		};
		apiSpies.fetchData.mockImplementation(
			({ url, params }: { url: string; params?: { q?: string } }) =>
				Promise.resolve({
					data: url.includes('/overview')
						? {
								...emptyPagination,
								data: params?.q === 'Zeta' ? [searchedCustomer] : [],
								total: params?.q === 'Zeta' ? 1 : 0,
							}
						: {
								data: [],
								meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 },
							},
				}),
		);
		const store = configureStore({
			reducer: {
				customerSales: customerSalesReducer,
				deferredPayments: deferredPaymentsReducer,
				usersAdmin: usersAdminReducer,
			},
			preloadedState: {
				deferredPayments: {
					...deferredPaymentsReducer(undefined, { type: 'test/init' }),
					listSubsidiaryId: 1,
				},
			},
		});
		const Wrapper = ({ children }: PropsWithChildren) => (
			<Provider store={store}>{children}</Provider>
		);
		render(<CreateEditDeferredPaymentModal isOpen onClose={vi.fn()} />, {
			wrapper: Wrapper,
		});

		const customerInput = screen.getByLabelText('Cliente');
		fireEvent.change(customerInput, { target: { value: 'Zeta' } });
		const option = await screen.findByText('Zeta Corp · Ana Pérez · 76.457.000-1');
		fireEvent.click(option);
		fireEvent.blur(customerInput);

		await act(async () => {
			await new Promise((resolve) => {
				setTimeout(resolve, 350);
			});
		});

		expect(screen.getByText('Zeta Corp · Ana Pérez · 76.457.000-1')).toBeInTheDocument();
		expect(store.getState().deferredPayments).toBeDefined();
		const overviewCalls = apiSpies.fetchData.mock.calls.filter(([request]) =>
			String((request as { url?: string }).url).includes('/overview'),
		);
		expect(overviewCalls).toHaveLength(1);
		expect(overviewCalls[0]?.[0]).toEqual(
			expect.objectContaining({ params: expect.objectContaining({ q: 'Zeta' }) }),
		);
	});

	it('aplica el plazo del perfil activo al vencimiento al crear un documento', async () => {
		const customer = {
			id: 457,
			name: 'Zeta Corp',
			rut: '76.457.000-1',
			contact: { name: 'Ana Pérez' },
			loyalty: 0,
			total_sales: 0,
			is_active: true,
		};
		apiSpies.fetchData.mockImplementation(({ url }: { url: string }) =>
			Promise.resolve({
				data: url.includes('/overview')
					? { ...emptyPagination, data: [customer], total: 1 }
					: url.includes('/credit-profile')
						? {
								data: {
									id: 9,
									customer_sale_id: customer.id,
									is_active: true,
									payment_term_days: 45,
									credit_limit: null,
									notes: null,
								},
							}
						: { data: [], meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 } },
			}),
		);
		const store = createTestStore();
		const Wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
		render(<CreateEditDeferredPaymentModal isOpen onClose={vi.fn()} />, { wrapper: Wrapper });

		const customerInput = screen.getByLabelText('Cliente');
		fireEvent.change(customerInput, { target: { value: 'Zeta' } });
		fireEvent.click(await screen.findByText('Zeta Corp · Ana Pérez · 76.457.000-1'));

		await waitFor(() =>
			expect(apiSpies.fetchData).toHaveBeenCalledWith(
				expect.objectContaining({
					url: '/subsidiaries/1/customer-sales/457/credit-profile',
					method: 'get',
				}),
			),
		);
		await waitFor(() => {
			const issueDate = (screen.getByLabelText('Fecha de emisión') as HTMLInputElement).value;
			expect(screen.getByLabelText('Fecha de vencimiento')).toHaveValue(
				addDaysToDateOnly(issueDate, 45),
			);
		});
		expect(screen.getByRole('button', { name: 'Crear documento' })).not.toBeDisabled();
	});

	it('muestra la carga del perfil sin bloquear la creación', async () => {
		const customer = {
			id: 458,
			name: 'Cliente con perfil cargando',
			rut: '76.458.000-1',
			contact: { name: 'Ana Pérez' },
			loyalty: 0,
			total_sales: 0,
			is_active: true,
		};
		let resolveProfile: (value: unknown) => void = () => undefined;
		const profileRequest = new Promise((resolve) => {
			resolveProfile = resolve;
		});
		apiSpies.fetchData.mockImplementation(({ url }: { url: string }) => {
			if (url.includes('/overview')) {
				return Promise.resolve({ data: { ...emptyPagination, data: [customer], total: 1 } });
			}
			if (url.includes('/458/credit-profile')) return profileRequest;
			return Promise.resolve({
				data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 } },
			});
		});
		const store = createTestStore();
		const Wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
		render(<CreateEditDeferredPaymentModal isOpen onClose={vi.fn()} />, { wrapper: Wrapper });

		const customerInput = screen.getByLabelText('Cliente');
		fireEvent.change(customerInput, { target: { value: 'cargando' } });
		fireEvent.click(
			await screen.findByText('Cliente con perfil cargando · Ana Pérez · 76.458.000-1'),
		);

		expect(await screen.findByText('Cargando información de crédito…')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Crear documento' })).not.toBeDisabled();

		await act(async () => {
			resolveProfile({
				data: {
					id: null,
					customer_sale_id: null,
					is_active: false,
					payment_term_days: 30,
					credit_limit: null,
					notes: null,
				},
			});
			await Promise.resolve();
		});
	});

	it('muestra el perfil de crédito suspendido sin bloquear la creación', async () => {
		const customer = {
			id: 458,
			name: 'Cliente Suspendido',
			rut: '76.458.000-1',
			contact: { name: 'Ana Pérez' },
			loyalty: 0,
			total_sales: 0,
			is_active: true,
		};
		apiSpies.fetchData.mockImplementation(({ url }: { url: string }) =>
			Promise.resolve({
				data: url.includes('/overview')
					? { ...emptyPagination, data: [customer], total: 1 }
					: url.includes('/credit-profile')
						? {
								data: {
									id: 10,
									customer_sale_id: customer.id,
									is_active: false,
								payment_term_days: 45,
								credit_limit: '500000',
									notes: null,
								},
							}
						: { data: [], meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 } },
			}),
		);
		const store = createTestStore();
		const Wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
		render(<CreateEditDeferredPaymentModal isOpen onClose={vi.fn()} />, { wrapper: Wrapper });

		const customerInput = screen.getByLabelText('Cliente');
		fireEvent.change(customerInput, { target: { value: 'Suspendido' } });
		fireEvent.click(await screen.findByText('Cliente Suspendido · Ana Pérez · 76.458.000-1'));

		await waitFor(() => expect(screen.getByText('45 días')).toBeInTheDocument());
		expect(screen.getByRole('button', { name: 'Crear documento' })).not.toBeDisabled();
		expect(screen.getByText('45 días')).toBeInTheDocument();
		expect(screen.getByText('Cupo usado').parentElement).toHaveTextContent('—');
		expect(screen.getByText('Cupo disponible').parentElement).toHaveTextContent('—');
		expect(
			apiSpies.fetchData.mock.calls.some(([request]) =>
				String((request as { url?: string }).url).includes('/deferred-payments/summary'),
			),
		).toBe(false);
	});

	it('limpia el perfil y el bloqueo al cerrar y reabrir el formulario', async () => {
		const customer = {
			id: 468,
			name: 'Cliente suspendido al cerrar',
			rut: '76.468.000-1',
			contact: { name: 'Ana Pérez' },
			loyalty: 0,
			total_sales: 0,
			is_active: true,
		};
		apiSpies.fetchData.mockImplementation(({ url }: { url: string }) =>
			Promise.resolve({
				data: url.includes('/overview')
					? { ...emptyPagination, data: [customer], total: 1 }
					: url.includes('/credit-profile')
						? {
								data: {
									id: 18,
									customer_sale_id: customer.id,
									is_active: false,
									payment_term_days: 30,
									credit_limit: null,
									notes: null,
								},
							}
						: { data: [], meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 } },
			}),
		);
		const store = createTestStore();
		const Wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
		const onClose = vi.fn();
		const { rerender } = render(<CreateEditDeferredPaymentModal isOpen onClose={onClose} />, {
			wrapper: Wrapper,
		});

		fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'cerrar' } });
		fireEvent.click(
			await screen.findByText('Cliente suspendido al cerrar · Ana Pérez · 76.468.000-1'),
		);
		await screen.findByText('30 días');

		fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
		expect(onClose).toHaveBeenCalledTimes(1);
		rerender(<CreateEditDeferredPaymentModal isOpen={false} onClose={onClose} />);
		rerender(<CreateEditDeferredPaymentModal isOpen onClose={onClose} />);

		expect(screen.getByText('Busca por razón social o RUT')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Crear documento' })).not.toBeDisabled();
	});

	it('permite crear sin perfil y recarga el perfil creado durante el alta', async () => {
		const customer = {
			id: 459,
			name: 'Cliente sin perfil',
			rut: '76.459.000-1',
			contact: { name: 'Ana Pérez' },
			loyalty: 0,
			total_sales: 0,
			is_active: true,
		};
		let profileWasCreated = false;
		apiSpies.fetchData.mockImplementation(({ url }: { url: string }) =>
			Promise.resolve({
				data: url.includes('/overview')
					? { ...emptyPagination, data: [customer], total: 1 }
					: url.includes('/credit-profile')
						? {
								data: {
									id: profileWasCreated ? 19 : null,
									customer_sale_id: profileWasCreated ? customer.id : null,
									is_active: profileWasCreated,
									payment_term_days: profileWasCreated ? 45 : 30,
									credit_limit: null,
									notes: null,
								},
							}
						: { data: [], meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 } },
			}),
		);
		const store = createTestStore();
		const Wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
		render(<CreateEditDeferredPaymentModal isOpen onClose={vi.fn()} />, { wrapper: Wrapper });

		fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'sin perfil' } });
		fireEvent.click(await screen.findByText('Cliente sin perfil · Ana Pérez · 76.459.000-1'));

		await waitFor(() => {
			const issueDate = (screen.getByLabelText('Fecha de emisión') as HTMLInputElement).value;
			expect(screen.getByLabelText('Fecha de vencimiento')).toHaveValue(
				addDaysToDateOnly(issueDate, 30),
			);
		});
		expect(
			screen.getByText('Este cliente no tiene un perfil de crédito creado.'),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Crear perfil' }));
		expect(await screen.findByText('Crear perfil de crédito')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Crear documento' })).not.toBeDisabled();
		profileWasCreated = true;
		const closeButtons = document.querySelectorAll<HTMLButtonElement>(
			'[data-component-name="CloseButton"]',
		);
		const closeButton = closeButtons.item(closeButtons.length - 1);
		expect(closeButton).not.toBeNull();
		if (closeButton) fireEvent.click(closeButton);

		await waitFor(() => {
			const issueDate = (screen.getByLabelText('Fecha de emisión') as HTMLInputElement).value;
			expect(screen.getByLabelText('Fecha de vencimiento')).toHaveValue(
				addDaysToDateOnly(issueDate, 45),
			);
		});
		expect(await screen.findByText('45 días')).toBeInTheDocument();
	});

	it('muestra un error de crédito, permite crear y reintentar', async () => {
		const customer = {
			id: 460,
			name: 'Cliente con error',
			rut: '76.460.000-1',
			contact: { name: 'Ana Pérez' },
			loyalty: 0,
			total_sales: 0,
			is_active: true,
		};
		let profileFails = true;
		apiSpies.fetchData.mockImplementation(({ url }: { url: string }) => {
			if (url.includes('/overview')) {
				return Promise.resolve({
					data: { ...emptyPagination, data: [customer], total: 1 },
				});
			}
			if (url.includes('/deferred-payments/summary')) {
				return Promise.resolve({ data: { total_outstanding: '0', overdue: { count: 0, amount: '0' }, due_within_7_days: { count: 0, amount: '0' }, current: { count: 0, amount: '0' } } });
			}
			if (url.includes('/credit-profile')) {
				if (profileFails && url.includes('/460/credit-profile')) {
					return Promise.reject(new Error('Perfil no disponible'));
				}
				return Promise.resolve({
					data: {
						id: url.includes('/460') ? 20 : 21,
						customer_sale_id: 460,
						is_active: true,
						payment_term_days: 30,
						credit_limit: null,
						notes: null,
					},
				});
			}
			return Promise.resolve({
				data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 } },
			});
		});
		const store = createTestStore();
		const Wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
		render(<CreateEditDeferredPaymentModal isOpen onClose={vi.fn()} />, { wrapper: Wrapper });

		fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'error' } });
		fireEvent.click(await screen.findByText('Cliente con error · Ana Pérez · 76.460.000-1'));
		expect(
			await screen.findByText('Perfil no disponible'),
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Crear documento' })).not.toBeDisabled();

		profileFails = false;
		fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Crear documento' })).not.toBeDisabled(),
		);
	});

	it('mantiene habilitada la creación al cambiar desde un cliente suspendido', async () => {
		const suspendedCustomer = {
			id: 461,
			name: 'Cliente suspendido',
			rut: '76.461.000-1',
			contact: { name: 'Ana Pérez' },
			loyalty: 0,
			total_sales: 0,
			is_active: true,
		};
		const activeCustomer = {
			...suspendedCustomer,
			id: 462,
			name: 'Cliente habilitado',
			rut: '76.462.000-1',
		};
		apiSpies.fetchData.mockImplementation(({ url }: { url: string }) =>
			Promise.resolve({
				data: url.includes('/overview')
					? { ...emptyPagination, data: [suspendedCustomer, activeCustomer], total: 2 }
					: url.includes('/461/credit-profile')
						? {
								data: {
									id: 11,
									customer_sale_id: 461,
									is_active: false,
									payment_term_days: 30,
									credit_limit: null,
									notes: null,
								},
							}
						: {
								data: {
									id: 12,
									customer_sale_id: 462,
									is_active: true,
									payment_term_days: 30,
									credit_limit: null,
									notes: null,
								},
							},
			}),
		);
		const store = createTestStore();
		const Wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
		render(<CreateEditDeferredPaymentModal isOpen onClose={vi.fn()} />, { wrapper: Wrapper });

		const customerInput = screen.getByLabelText('Cliente');
		fireEvent.change(customerInput, { target: { value: 'suspendido' } });
		fireEvent.click(await screen.findByText('Cliente suspendido · Ana Pérez · 76.461.000-1'));
		await screen.findByText('30 días');
		expect(screen.getByRole('button', { name: 'Crear documento' })).not.toBeDisabled();

		fireEvent.change(customerInput, { target: { value: 'habilitado' } });
		fireEvent.click(await screen.findByText('Cliente habilitado · Ana Pérez · 76.462.000-1'));
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Crear documento' })).not.toBeDisabled(),
		);
	});

	it('ignora una respuesta antigua al cambiar rápidamente de cliente', async () => {
		const firstCustomer = {
			id: 463,
			name: 'Cliente anterior',
			rut: '76.463.000-1',
			contact: { name: 'Ana Pérez' },
			loyalty: 0,
			total_sales: 0,
			is_active: true,
		};
		const secondCustomer = {
			...firstCustomer,
			id: 464,
			name: 'Cliente actual',
			rut: '76.464.000-1',
		};
		let resolveFirstProfile: (value: unknown) => void = () => undefined;
		let resolveSecondProfile: (value: unknown) => void = () => undefined;
		const firstProfileRequest = new Promise((resolve) => {
			resolveFirstProfile = resolve;
		});
		const secondProfileRequest = new Promise((resolve) => {
			resolveSecondProfile = resolve;
		});
		apiSpies.fetchData.mockImplementation(({ url }: { url: string }) => {
			if (url.includes('/overview')) {
				return Promise.resolve({
					data: { ...emptyPagination, data: [firstCustomer, secondCustomer], total: 2 },
				});
			}
			if (url.includes('/463/credit-profile')) return firstProfileRequest;
			if (url.includes('/464/credit-profile')) return secondProfileRequest;
			return Promise.resolve({
				data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 } },
			});
		});
		const store = createTestStore();
		const Wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
		render(<CreateEditDeferredPaymentModal isOpen onClose={vi.fn()} />, { wrapper: Wrapper });

		const customerInput = screen.getByLabelText('Cliente');
		fireEvent.change(customerInput, { target: { value: 'anterior' } });
		fireEvent.click(await screen.findByText('Cliente anterior · Ana Pérez · 76.463.000-1'));
		fireEvent.change(customerInput, { target: { value: 'actual' } });
		fireEvent.click(await screen.findByText('Cliente actual · Ana Pérez · 76.464.000-1'));

		await act(async () => {
			resolveSecondProfile({
				data: {
					id: 14,
					customer_sale_id: 464,
					is_active: true,
					payment_term_days: 30,
					credit_limit: null,
					notes: null,
				},
			});
			await Promise.resolve();
		});
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Crear documento' })).not.toBeDisabled(),
		);

		await act(async () => {
			resolveFirstProfile({
				data: {
					id: 13,
					customer_sale_id: 463,
					is_active: false,
					payment_term_days: 30,
					credit_limit: null,
					notes: null,
				},
			});
			await Promise.resolve();
		});

		expect(screen.queryByText(/El crédito de este cliente está suspendido/)).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Crear documento' })).not.toBeDisabled();
	});

	it('recarga el perfil en la subsidiaria actual e ignora la resolución anterior', async () => {
		const customer = {
			id: 470,
			name: 'Cliente multi subsidiaria',
			rut: '76.470.000-1',
			contact: { name: 'Ana Pérez' },
			loyalty: 0,
			total_sales: 0,
			is_active: true,
		};
		let resolveFirstProfile: (value: unknown) => void = () => undefined;
		let resolveSecondProfile: (value: unknown) => void = () => undefined;
		const firstProfileRequest = new Promise((resolve) => {
			resolveFirstProfile = resolve;
		});
		const secondProfileRequest = new Promise((resolve) => {
			resolveSecondProfile = resolve;
		});
		apiSpies.fetchData.mockImplementation(({ url }: { url: string }) => {
			if (url.includes('/overview'))
				return Promise.resolve({ data: { ...emptyPagination, data: [customer], total: 1 } });
			if (url === '/subsidiaries/1/customer-sales/470/credit-profile')
				return firstProfileRequest;
			if (url === '/subsidiaries/2/customer-sales/470/credit-profile')
				return secondProfileRequest;
			return Promise.resolve({
				data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 } },
			});
		});
		const store = createTestStore();
		const Wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
		const { rerender } = render(<CreateEditDeferredPaymentModal isOpen onClose={vi.fn()} />, {
			wrapper: Wrapper,
		});

		fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'multi' } });
		fireEvent.click(await screen.findByText('Cliente multi subsidiaria · Ana Pérez · 76.470.000-1'));
		await waitFor(() =>
			expect(apiSpies.fetchData).toHaveBeenCalledWith(
				expect.objectContaining({ url: '/subsidiaries/1/customer-sales/470/credit-profile' }),
			),
		);

		branchContext.subsidiaryId = 2;
		rerender(<CreateEditDeferredPaymentModal isOpen onClose={vi.fn()} />);
		await waitFor(() =>
			expect(apiSpies.fetchData).toHaveBeenCalledWith(
				expect.objectContaining({ url: '/subsidiaries/2/customer-sales/470/credit-profile' }),
			),
		);

		await act(async () => {
			resolveFirstProfile({
				data: {
					id: 30,
					customer_sale_id: customer.id,
					is_active: false,
					payment_term_days: 5,
					credit_limit: null,
					notes: null,
				},
			});
			await Promise.resolve();
		});
		expect(screen.queryByText(/El crédito de este cliente está suspendido/)).not.toBeInTheDocument();

		await act(async () => {
			resolveSecondProfile({
				data: {
					id: null,
					customer_sale_id: null,
					is_active: false,
					payment_term_days: 21,
					credit_limit: null,
					notes: null,
				},
			});
			await Promise.resolve();
		});
		await waitFor(() => {
			const issueDate = (screen.getByLabelText('Fecha de emisión') as HTMLInputElement).value;
			expect(screen.getByLabelText('Fecha de vencimiento')).toHaveValue(
				addDaysToDateOnly(issueDate, 21),
			);
		});
	});

	it('cierra el editor secundario cuando el padre se cierra externamente', async () => {
		const customer = {
			id: 471,
			name: 'Cliente del editor secundario',
			rut: '76.471.000-1',
			contact: { name: 'Ana Pérez' },
			loyalty: 0,
			total_sales: 0,
			is_active: true,
		};
		apiSpies.fetchData.mockImplementation(({ url }: { url: string }) =>
			Promise.resolve({
				data: url.includes('/overview')
					? { ...emptyPagination, data: [customer], total: 1 }
					: url.includes('/credit-profile')
						? {
								data: {
									id: null,
									customer_sale_id: null,
									is_active: false,
									payment_term_days: 30,
									credit_limit: null,
									notes: null,
								},
							}
						: { data: [], meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 } },
			}),
		);
		const store = createTestStore();
		const Wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
		const onClose = vi.fn();
		const { rerender } = render(<CreateEditDeferredPaymentModal isOpen onClose={onClose} />, {
			wrapper: Wrapper,
		});

		fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'secundario' } });
		fireEvent.click(
			await screen.findByText('Cliente del editor secundario · Ana Pérez · 76.471.000-1'),
		);
		fireEvent.click(await screen.findByRole('button', { name: 'Crear perfil' }));
		expect(await screen.findByText('Crear perfil de crédito')).toBeInTheDocument();

		rerender(<CreateEditDeferredPaymentModal isOpen={false} onClose={onClose} />);
		await waitFor(() =>
			expect(screen.queryByText('Crear perfil de crédito')).not.toBeInTheDocument(),
		);
	});
});
