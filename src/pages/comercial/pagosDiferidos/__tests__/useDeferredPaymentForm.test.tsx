import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IDeferredPaymentDocument } from '@/interface/deferredPayments.interface';
import deferredPaymentsService from '@/services/deferredPaymentsService';
import deferredPaymentsReducer, {
	setDeferredPaymentsFilters,
} from '@/store/slices/deferredPayments/deferredPaymentsSlice';
import useDeferredPaymentForm, {
	addDaysToDateOnly,
	mapDeferredPaymentDocumentToForm,
	mapDeferredPaymentFormToPayload,
} from '../hooks/useDeferredPaymentForm';
import DEFERRED_PAYMENT_DOCUMENT_FIXTURES from './deferredPaymentTestFixtures';

const createMutationSpy = vi.hoisted(() => vi.fn());
const mutationFailure = vi.hoisted<{ error: Error | null }>(() => ({ error: null }));
const mutationGate = vi.hoisted(() => ({ wait: null as Promise<void> | null }));
const toastSpies = vi.hoisted(() => ({ success: vi.fn(), warn: vi.fn(), error: vi.fn() }));
const branchContext = vi.hoisted(() => ({ subsidiaryId: 1 as number | null }));

vi.mock('react-toastify', () => ({ toast: toastSpies }));

vi.mock('@/services/deferredPaymentsService', () => ({
	default: {
		createDocument: createMutationSpy,
		updateDocument: vi.fn(),
		getDocuments: vi.fn(),
		getSummary: vi.fn(),
	},
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
	return {
		default: {},
		useAppDispatch: reactRedux.useDispatch,
		useAppSelector: reactRedux.useSelector,
	};
});

describe('useDeferredPaymentForm', () => {
	const createHook = (
		document = null as IDeferredPaymentDocument | null,
		onSuccess?: (savedDocument: IDeferredPaymentDocument) => void,
	) => {
		const store = configureStore({ reducer: { deferredPayments: deferredPaymentsReducer } });
		const Wrapper = ({ children }: PropsWithChildren) => (
			<Provider store={store}>{children}</Provider>
		);
		const hook = renderHook(
			() =>
				useDeferredPaymentForm({
					mode: document ? 'edit' : 'create',
					deferredPaymentDocument: document,
					paymentTermDays: 15,
					onSuccess,
				}),
			{ wrapper: Wrapper },
		);
		return { hook, store };
	};

	afterEach(() => {
		createMutationSpy.mockClear();
		mutationFailure.error = null;
		mutationGate.wait = null;
		branchContext.subsidiaryId = 1;
		toastSpies.success.mockClear();
		toastSpies.warn.mockClear();
		toastSpies.error.mockClear();
		vi.useRealTimers();
	});

	const configureSuccessfulServices = () => {
		createMutationSpy.mockImplementation(async () => {
			if (mutationFailure.error) throw mutationFailure.error;
			if (mutationGate.wait) await mutationGate.wait;
			return { document: DEFERRED_PAYMENT_DOCUMENT_FIXTURES[0], credit_limit_exceeded: false };
		});
		vi.mocked(deferredPaymentsService.getDocuments).mockResolvedValue({
			data: [DEFERRED_PAYMENT_DOCUMENT_FIXTURES[0]],
			meta: { current_page: 1, per_page: 10, total: 1, last_page: 1 },
		});
		vi.mocked(deferredPaymentsService.getSummary).mockResolvedValue({
			total_outstanding: '2500000.00',
			overdue: { count: 0, amount: '0.00' },
			due_within_7_days: { count: 0, amount: '0.00' },
			current: { count: 1, amount: '2500000.00' },
		});
	};

	it('calcula el vencimiento sin desfases de zona horaria', () => {
		expect(addDaysToDateOnly('2026-07-28', 15)).toBe('2026-08-12');
		expect(addDaysToDateOnly('2026-12-25', 10)).toBe('2027-01-04');
	});

	it('mapea el documento y normaliza el payload del formulario', () => {
		const document = DEFERRED_PAYMENT_DOCUMENT_FIXTURES[0];
		const values = mapDeferredPaymentDocumentToForm(document);
		const payload = mapDeferredPaymentFormToPayload({
			...values,
			document_number: `  ${values.document_number}  `,
			purchase_order: '   ',
			notes: '   ',
			total_amount: 475976,
			items: [{ ...values.items[0], unit_price: '2500000' }],
		});

		const valuesWithoutPurchaseOrder = mapDeferredPaymentDocumentToForm({
			...document,
			purchase_order: undefined,
		} as unknown as IDeferredPaymentDocument);

		expect(values.assignee_ids).toEqual(document.assignees.map(({ id }) => id));
		expect(valuesWithoutPurchaseOrder.purchase_order).toBeNull();
		expect(payload).toMatchObject({
			customer_sale_id: document.customer.id,
			document_number: document.document_number,
			purchase_order: null,
			notes: null,
			total_amount: 475976,
			items: [expect.objectContaining({ unit_price: 2500000 })],
		});
		expect(
			mapDeferredPaymentFormToPayload({ ...values, assignee_ids: [] }, 37)?.assignee_ids,
		).toEqual([37]);
	});

	it('recalcula el vencimiento sin sustituir el total oficial al editar ítems', async () => {
		const { hook } = createHook();

		await act(async () => {
			await hook.result.current.formik.setFieldValue('issue_date', '2026-08-01');
			await hook.result.current.formik.setFieldValue('items.0.quantity', 3);
			await hook.result.current.formik.setFieldValue('items.0.unit_price', 2500);
			await hook.result.current.formik.setFieldValue('total_amount', 475976);
		});

		expect(hook.result.current.formik.values.due_date).toBe('2026-08-16');
		expect(hook.result.current.estimatedTotal).toBe(7500);
		expect(hook.result.current.documentTotal).toBe(
			475976,
		);

		await act(async () => {
			await hook.result.current.actions.setDueDateManually('2026-12-31');
			await hook.result.current.formik.setFieldValue('issue_date', '2026-08-02');
		});
		expect(hook.result.current.formik.values.due_date).toBe('2026-12-31');
	});

	it('restablece un vencimiento manual al adoptar el plazo de un cliente distinto', async () => {
		const { hook } = createHook();
		const issueDate = hook.result.current.formik.values.issue_date;
		await act(async () => {
			await hook.result.current.actions.setDueDateManually('2026-12-31');
			await hook.result.current.actions.resetDueDateManualOverride(45);
		});

		expect(hook.result.current.formik.values.due_date).toBe(addDaysToDateOnly(issueDate, 45));
	});

	it('crea una sola vez ante dos envíos simultáneos y refresca el estado', async () => {
		configureSuccessfulServices();
		vi.useFakeTimers();
		const { hook, store } = createHook();
		act(() => {
			store.dispatch(
				setDeferredPaymentsFilters({ status: 'overdue', search: 'andina', page: 1 }),
			);
		});
		await act(async () => {
			await hook.result.current.formik.setValues({
				...hook.result.current.formik.values,
				customer_sale_id: 1,
				document_number: 'FD-HOOK-001',
				total_amount: 2500000,
				items: [
					{
						client_key: 'hook-item-1',
						product_id: null,
						code: 'SERV',
						description: 'Servicio de prueba',
						quantity: 1,
						unit_price: 2500001,
						serials: [],
					},
				],
			});
		});
		await act(async () => {
			const firstSubmit = hook.result.current.formik.submitForm();
			const secondSubmit = hook.result.current.formik.submitForm();
			await vi.runAllTimersAsync();
			await Promise.all([firstSubmit, secondSubmit]);
		});

		expect(createMutationSpy).toHaveBeenCalledOnce();
		expect(toastSpies.error).not.toHaveBeenCalled();
		expect(toastSpies.success).toHaveBeenCalledWith('Documento creado correctamente');
		expect(store.getState().deferredPayments.lastMutationCreditLimitExceeded).toBe(false);
		expect(store.getState().deferredPayments.list.length).toBeGreaterThan(0);
		expect(deferredPaymentsService.getDocuments).toHaveBeenCalledWith(
			1,
			expect.objectContaining({ page: 1, status: 'overdue', search: 'andina' }),
			expect.any(AbortSignal),
		);
		expect(deferredPaymentsService.getSummary).toHaveBeenCalledWith(
			1,
			{
				status: 'overdue',
				customer_sale_id: undefined,
				search: 'andina',
				due_before: undefined,
				due_after: undefined,
			},
			expect.any(AbortSignal),
		);

		hook.unmount();
		expect(store.getState().deferredPayments.lastMutationCreditLimitExceeded).toBe(false);
	});
	it('aborta el guardado y omite callbacks al cambiar de subsidiaria', async () => {
		configureSuccessfulServices();
		let releaseMutation: () => void = () => {};
		mutationGate.wait = new Promise<void>((resolve) => {
			releaseMutation = resolve;
		});
		const onSuccess = vi.fn();
		const { hook, store } = createHook(null, onSuccess);
		await act(async () => {
			await hook.result.current.formik.setValues({
				...hook.result.current.formik.values,
				customer_sale_id: 1,
				document_number: 'FD-CONTEXT-CHANGE',
				total_amount: 1000,
				items: [
					{
						client_key: 'context-item',
						product_id: null,
						code: 'SERV',
						description: 'Servicio pendiente',
						quantity: 1,
						unit_price: 1000,
						serials: [],
					},
				],
			});
		});

		let submitPromise: Promise<void> = Promise.resolve();
		await act(async () => {
			submitPromise = hook.result.current.formik.submitForm();
			await Promise.resolve();
		});
		await vi.waitFor(() => expect(createMutationSpy).toHaveBeenCalledOnce());

		act(() => {
			branchContext.subsidiaryId = 99;
			hook.rerender();
		});
		await act(async () => {
			releaseMutation();
			await submitPromise;
		});

		expect(onSuccess).not.toHaveBeenCalled();
		expect(toastSpies.success).not.toHaveBeenCalled();
		expect(toastSpies.error).not.toHaveBeenCalled();
		expect(store.getState().deferredPayments.list).toEqual([]);
	});

	it('muestra el 422 autoritativo en un toast y conserva el borrador', async () => {
		configureSuccessfulServices();
		mutationFailure.error = Object.assign(new Error('El cliente no tiene cupo de crédito disponible.'), {
			response: { data: { message: 'El cliente no tiene cupo de crédito disponible.' } },
		});
		const { hook } = createHook();
		await act(async () => {
			await hook.result.current.formik.setValues({
				...hook.result.current.formik.values,
				customer_sale_id: 1,
				document_number: 'FD-HOOK-ERROR',
				total_amount: 1000,
				items: [
					{
						client_key: 'hook-item-error',
						product_id: null,
						code: 'SERV',
						description: 'Servicio con error',
						quantity: 1,
						unit_price: 1000,
						serials: [],
					},
				],
			});
		});
		await act(async () => {
			await hook.result.current.formik.submitForm();
		});

		expect(toastSpies.error).toHaveBeenCalledWith(
			'El cliente no tiene cupo de crédito disponible.',
		);
		expect(toastSpies.success).not.toHaveBeenCalled();
		expect(hook.result.current.formik.values.document_number).toBe('FD-HOOK-ERROR');
		expect(hook.result.current.formik.values.total_amount).toBe(1000);
	});
	it('asocia los errores de validación del backend con sus campos', async () => {
		configureSuccessfulServices();
		mutationFailure.error = Object.assign(
			new Error('The document number has already been taken.'),
			{
				response: {
					data: {
						message: 'The document number has already been taken.',
						errors: {
							document_number: ['The document number has already been taken.'],
						},
					},
				},
			},
		);
		const { hook } = createHook();
		await act(async () => {
			await hook.result.current.formik.setValues({
				...hook.result.current.formik.values,
				customer_sale_id: 1,
				document_number: 'FD-DUPLICADO',
				total_amount: 1000,
				items: [
					{
						client_key: 'hook-item-duplicate',
						product_id: null,
						code: 'SERV',
						description: 'Servicio duplicado',
						quantity: 1,
						unit_price: 1000,
						serials: [],
					},
				],
			});
		});
		await act(async () => {
			await hook.result.current.formik.submitForm();
		});
		expect(hook.result.current.formik.errors.document_number).toBe(
			'The document number has already been taken.',
		);
		expect(hook.result.current.formik.touched.document_number).toBe(true);
		expect(toastSpies.error).toHaveBeenCalledWith(
			'The document number has already been taken.',
		);
	});
	it('bloquea la edición de documentos pagados', async () => {
		const paidDocument = DEFERRED_PAYMENT_DOCUMENT_FIXTURES.find(
			(document) => document.status === 'paid',
		);
		expect(paidDocument).toBeDefined();
		const { hook, store } = createHook(paidDocument ?? null);

		await act(async () => {
			await hook.result.current.formik.submitForm();
		});

		expect(hook.result.current.isPaidEdit).toBe(true);
		expect(store.getState().deferredPayments.updating).toBe(false);
	});
});
