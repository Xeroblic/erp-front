import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import deferredPaymentsReducer from '@/store/slices/deferredPayments/deferredPaymentsSlice';
import { DEFERRED_PAYMENT_DETAILS_MOCK } from '@/store/slices/deferredPayments/deferredPaymentsMock';
import useDeferredPaymentForm, {
	addDaysToDateOnly,
	mapDeferredPaymentDocumentToForm,
	mapDeferredPaymentFormToPayload,
} from '../hooks/useDeferredPaymentForm';

const createMutationSpy = vi.hoisted(() => vi.fn());

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
			return actual.mockCreateDeferredPayment(...args);
		},
	};
});

vi.mock('@/store/slices/deferredPayments/deferredPaymentsConfig', () => ({ default: true }));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ branchId: 1, subsidiaryId: 1, hasValidBranch: true }),
}));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

describe('useDeferredPaymentForm', () => {
	const createHook = (
		document = null as (typeof DEFERRED_PAYMENT_DETAILS_MOCK)[number] | null,
	) => {
		const store = configureStore({ reducer: { deferredPayments: deferredPaymentsReducer } });
		const Wrapper = ({ children }: PropsWithChildren) => (
			<Provider store={store}>{children}</Provider>
		);
		const hook = renderHook(
			() =>
				useDeferredPaymentForm({
					mode: document ? 'edit' : 'create',
					document,
					paymentTermDays: 15,
				}),
			{ wrapper: Wrapper },
		);
		return { hook, store };
	};

	afterEach(() => {
		createMutationSpy.mockClear();
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
		expect(store.getState().deferredPayments.lastMutationCreditLimitExceeded).toBe(true);
		expect(store.getState().deferredPayments.list.length).toBeGreaterThan(0);
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
