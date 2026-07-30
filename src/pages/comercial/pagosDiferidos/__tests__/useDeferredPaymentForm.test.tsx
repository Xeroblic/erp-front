import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IDeferredPaymentDocument } from '@/interface/deferredPayments.interface';
import deferredPaymentsReducer from '@/store/slices/deferredPayments/deferredPaymentsSlice';
import { DEFERRED_PAYMENT_DETAILS_MOCK } from '@/store/slices/deferredPayments/deferredPaymentsMock';
import useDeferredPaymentForm, {
	addDaysToDateOnly,
	mapDeferredPaymentDocumentToForm,
	mapDeferredPaymentFormToPayload,
} from '../hooks/useDeferredPaymentForm';

const createMutationSpy = vi.hoisted(() => vi.fn());
const mutationFailure = vi.hoisted(() => ({ error: null as unknown }));
const mutationGate = vi.hoisted(() => ({ wait: null as Promise<void> | null }));
const toastSpies = vi.hoisted(() => ({ success: vi.fn(), warn: vi.fn(), error: vi.fn() }));
const branchContext = vi.hoisted(() => ({ subsidiaryId: 1 as number | null }));

vi.mock('react-toastify', () => ({ toast: toastSpies }));

vi.mock('@/store/slices/deferredPayments/deferredPaymentsMock', async (importOriginal) => {
	const actual =
		await importOriginal<
			typeof import('@/store/slices/deferredPayments/deferredPaymentsMock')
		>();
	return {
		...actual,
		mockCreateDeferredPayment: (
			...args: Parameters<typeof actual.mockCreateDeferredPayment>
		) => {
			createMutationSpy(...args);
			if (mutationFailure.error) return Promise.reject(mutationFailure.error);
			return (async () => {
				if (mutationGate.wait) await mutationGate.wait;
				return actual.mockCreateDeferredPayment(...args);
			})();
		},
	};
});

vi.mock('@/store/slices/deferredPayments/deferredPaymentsConfig', () => ({ default: true }));
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

describe('useDeferredPaymentForm', () => {
	const createHook = (
		document = null as (typeof DEFERRED_PAYMENT_DETAILS_MOCK)[number] | null,
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

	it('calcula el vencimiento sin desfases de zona horaria', () => {
		expect(addDaysToDateOnly('2026-07-28', 15)).toBe('2026-08-12');
		expect(addDaysToDateOnly('2026-12-25', 10)).toBe('2027-01-04');
	});

	it('mapea el documento y normaliza el payload del formulario', () => {
		const document = Object.values(DEFERRED_PAYMENT_DETAILS_MOCK)[0];
		const values = mapDeferredPaymentDocumentToForm(document);
		const payload = mapDeferredPaymentFormToPayload({
			...values,
			document_number: `  ${values.document_number}  `,
			notes: '   ',
		});

		expect(values.assignee_ids).toEqual(document.assignees.map(({ id }) => id));
		expect(payload).toMatchObject({
			customer_sale_id: document.customer.id,
			document_number: document.document_number,
			notes: null,
		});
		expect(
			mapDeferredPaymentFormToPayload({ ...values, assignee_ids: [] }, 37)?.assignee_ids,
		).toEqual([37]);
	});

	it('recalcula vencimiento y total estimado al editar el formulario', async () => {
		const { hook } = createHook();

		await act(async () => {
			await hook.result.current.formik.setFieldValue('issue_date', '2026-08-01');
			await hook.result.current.formik.setFieldValue('items.0.quantity', 3);
			await hook.result.current.formik.setFieldValue('items.0.unit_price', 2500);
		});

		expect(hook.result.current.formik.values.due_date).toBe('2026-08-16');
		expect(hook.result.current.estimatedTotal).toBe(7500);

		await act(async () => {
			await hook.result.current.actions.setDueDateManually('2026-12-31');
			await hook.result.current.formik.setFieldValue('issue_date', '2026-08-02');
		});
		expect(hook.result.current.formik.values.due_date).toBe('2026-12-31');
	});

	it('crea una sola vez ante dos envíos simultáneos y refresca el estado', async () => {
		vi.useFakeTimers();
		const { hook, store } = createHook();
		await act(async () => {
			await hook.result.current.formik.setValues({
				...hook.result.current.formik.values,
				customer_sale_id: 1,
				document_number: 'FD-HOOK-001',
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
		expect(toastSpies.warn).toHaveBeenCalledWith(
			'El total supera el límite de crédito conocido del cliente',
			{ autoClose: false },
		);
		expect(toastSpies.success).toHaveBeenCalledWith('Documento creado correctamente');
		expect(toastSpies.error).not.toHaveBeenCalled();
		expect(store.getState().deferredPayments.lastMutationCreditLimitExceeded).toBe(true);
		expect(store.getState().deferredPayments.list.length).toBeGreaterThan(0);

		hook.unmount();
		expect(store.getState().deferredPayments.lastMutationCreditLimitExceeded).toBe(false);
	});
	it('aborta el guardado y omite callbacks al cambiar de subsidiaria', async () => {
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

	it('muestra el error de la mutación en un toast', async () => {
		mutationFailure.error = new Error('Servidor no disponible');
		const { hook } = createHook();
		await act(async () => {
			await hook.result.current.formik.setValues({
				...hook.result.current.formik.values,
				customer_sale_id: 1,
				document_number: 'FD-HOOK-ERROR',
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

		expect(toastSpies.error).toHaveBeenCalledWith('Servidor no disponible');
		expect(toastSpies.success).not.toHaveBeenCalled();
	});
	it('asocia los errores de validación del backend con sus campos', async () => {
		mutationFailure.error = {
			response: {
				data: {
					message: 'Los datos enviados no son válidos.',
					errors: { document_number: ['El número de documento ya está registrado.'] },
				},
			},
		};
		const { hook } = createHook();
		await act(async () => {
			await hook.result.current.formik.setValues({
				...hook.result.current.formik.values,
				customer_sale_id: 1,
				document_number: 'FD-DUPLICADO',
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
			'El número de documento ya está registrado.',
		);
		expect(hook.result.current.formik.touched.document_number).toBe(true);
		expect(toastSpies.error).toHaveBeenCalledWith('Los datos enviados no son válidos.');
	});
	it('bloquea la edición de documentos pagados', async () => {
		const paidDocument = Object.values(DEFERRED_PAYMENT_DETAILS_MOCK).find(
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
