import type { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import purchaseDocuments from '@/store/slices/procurement/purchaseDocumentsSlice';
import { createPurchaseDocument } from '@/services/procurement/purchaseDocuments.service';
import { draftReceiptDocument } from '@/mocks/db/procurement.db';
import usePurchaseDocumentForm from '../usePurchaseDocumentForm';

vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return { useAppDispatch: redux.useDispatch, useAppSelector: redux.useSelector };
});
vi.mock('@/services/procurement/purchaseDocuments.service', () => ({
	createPurchaseDocument: vi.fn(),
	updatePurchaseDocument: vi.fn(),
	listPurchaseDocuments: vi.fn(),
	getPurchaseDocument: vi.fn(),
	confirmPurchaseDocument: vi.fn(),
	cancelPurchaseDocument: vi.fn(),
}));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), info: vi.fn() } }));

const timeout = () =>
	Object.assign(new Error('timeout'), {
		isAxiosError: true,
		code: 'ECONNABORTED',
		request: {},
	});
const create = vi.mocked(createPurchaseDocument);
const saved = { data: draftReceiptDocument, headers: { etag: '"saved"' } };
const makeSession = () => {
	const store = configureStore({ reducer: { purchaseDocuments } });
	const wrapper = ({ children }: { children: ReactNode }) => (
		<Provider store={store}>{children}</Provider>
	);
	return { store, wrapper };
};
const fillAndSubmit = async (hook: {
	result: { current: ReturnType<typeof usePurchaseDocumentForm> };
}) => {
	await act(async () => {
		await hook.result.current.formik.setValues({
			...hook.result.current.formik.values,
			document_type: 'receipt',
			document_number: 'B-1',
			issue_date: '2026-10-19',
			notes: 'Original',
			items: [
				{
					product_id: 1,
					quantity: '1',
					unit_cost: '100',
					unit_cost_basis: 'net',
					notes: '',
				},
			],
		});
	});
	await act(async () => {
		await hook.result.current.formik.submitForm();
	});
};

beforeEach(() => vi.clearAllMocks());
describe('Documento de compra — recuperación del resultado incierto', () => {
	it('reintenta el cuerpo original con la misma clave aunque Formik cambie', async () => {
		create.mockRejectedValueOnce(timeout()).mockResolvedValueOnce(saved);
		const hook = renderHook(
			() => usePurchaseDocumentForm({ subsidiaryId: 1, defaultDocumentType: 'receipt' }),
			makeSession(),
		);
		await fillAndSubmit(hook);
		await act(async () => {
			await hook.result.current.formik.setFieldValue('notes', 'Cambio posterior');
		});
		await act(async () => {
			await hook.result.current.formik.submitForm();
		});
		expect(create).toHaveBeenCalledTimes(2);
		expect(create.mock.calls[1]).toEqual(create.mock.calls[0]);
	});

	it('recupera el borrador y la clave después de cerrar y montar de nuevo', async () => {
		create.mockRejectedValueOnce(timeout()).mockResolvedValueOnce(saved);
		const session = makeSession();
		const first = renderHook(
			() => usePurchaseDocumentForm({ subsidiaryId: 1, defaultDocumentType: 'receipt' }),
			session,
		);
		await fillAndSubmit(first);
		first.unmount();
		const second = renderHook(
			() => usePurchaseDocumentForm({ subsidiaryId: 1, defaultDocumentType: 'receipt' }),
			session,
		);
		expect(second.result.current.formik.values.document_number).toBe('B-1');
		await act(async () => {
			await second.result.current.formik.submitForm();
		});
		expect(create.mock.calls[1]).toEqual(create.mock.calls[0]);
	});

	it('descartar un resultado incierto libera el borrador y crea una clave distinta', async () => {
		create.mockRejectedValueOnce(timeout()).mockResolvedValueOnce(saved);
		const hook = renderHook(
			() => usePurchaseDocumentForm({ subsidiaryId: 1, defaultDocumentType: 'receipt' }),
			makeSession(),
		);
		await fillAndSubmit(hook);
		act(() => hook.result.current.discardAttempt());
		expect(hook.result.current.pendingAttempt).toBeNull();
		await fillAndSubmit(hook);
		expect(create.mock.calls[1][2]?.idempotencyKey).not.toBe(
			create.mock.calls[0][2]?.idempotencyKey,
		);
	});

	it('un 422 permite corregir con clave nueva y conserva los errores del campo', async () => {
		create
			.mockRejectedValueOnce({
				response: {
					status: 422,
					data: {
						message: 'Folio inválido',
						errors: { document_number: ['Folio inválido'] },
					},
				},
			})
			.mockResolvedValueOnce(saved);
		const hook = renderHook(
			() => usePurchaseDocumentForm({ subsidiaryId: 1, defaultDocumentType: 'receipt' }),
			makeSession(),
		);
		await fillAndSubmit(hook);
		expect(hook.result.current.pendingAttempt).toBeNull();
		expect(hook.result.current.formik.errors.document_number).toBe('Folio inválido');
		await fillAndSubmit(hook);
		expect(create.mock.calls[1][2]?.idempotencyKey).not.toBe(
			create.mock.calls[0][2]?.idempotencyKey,
		);
	});

	it('una respuesta de A después de A→B→A queda recuperable y no ejecuta callbacks del borrador viejo', async () => {
		let resolve: ((value: typeof saved) => void) | undefined;
		create.mockImplementationOnce(
			() =>
				new Promise((done) => {
					resolve = done;
				}),
		);
		const session = makeSession();
		const onSuccess = vi.fn();
		const hook = renderHook(
			({ subsidiaryId }) =>
				usePurchaseDocumentForm({
					subsidiaryId,
					defaultDocumentType: 'receipt',
					onSuccess,
				}),
			{ ...session, initialProps: { subsidiaryId: 1 } },
		);
		let sending: Promise<unknown> | undefined;
		await act(async () => {
			await hook.result.current.formik.setValues({
				...hook.result.current.formik.values,
				document_number: 'B-1',
				issue_date: '2026-10-19',
				items: [
					{
						product_id: 1,
						quantity: '1',
						unit_cost: '100',
						unit_cost_basis: 'net',
						notes: '',
					},
				],
			});
		});
		act(() => {
			sending = hook.result.current.formik.submitForm();
		});
		await act(async () => {
			await Promise.resolve();
		});
		hook.rerender({ subsidiaryId: 2 });
		hook.rerender({ subsidiaryId: 1 });
		await act(async () => {
			resolve?.(saved);
			await sending;
		});
		expect(onSuccess).not.toHaveBeenCalled();
		expect(hook.result.current.pendingAttempt?.status).toBe('completed');
		act(() => {
			hook.result.current.retryPending();
		});
		expect(onSuccess).toHaveBeenCalledWith(saved.data);
		expect(create).toHaveBeenCalledTimes(1);
	});

	it('un 422 después de renderizar la carga conserva el borrador y los errores', async () => {
		let reject: (reason: unknown) => void = () => {};
		create.mockImplementationOnce(
			() =>
				new Promise((_resolve, fail) => {
					reject = fail;
				}),
		);
		const hook = renderHook(
			() => usePurchaseDocumentForm({ subsidiaryId: 1, defaultDocumentType: 'receipt' }),
			makeSession(),
		);
		await act(async () => {
			await hook.result.current.formik.setValues({
				...hook.result.current.formik.values,
				document_number: 'B-99',
				issue_date: '2026-10-19',
				notes: 'No perder',
				items: [
					{
						product_id: 1,
						quantity: '2',
						unit_cost: '100',
						unit_cost_basis: 'net',
						notes: '',
					},
				],
			});
		});
		let sending: Promise<unknown> | undefined;
		act(() => {
			sending = hook.result.current.formik.submitForm();
		});
		await waitFor(() => expect(hook.result.current.pendingAttempt?.status).toBe('in_flight'));
		await act(async () => {
			reject({
				response: {
					status: 422,
					data: {
						message: 'Folio inválido',
						errors: { document_number: ['Folio inválido'] },
					},
				},
			});
			await sending;
		});
		expect(hook.result.current.pendingAttempt).toBeNull();
		expect(hook.result.current.formik.values.document_number).toBe('B-99');
		expect(hook.result.current.formik.values.notes).toBe('No perder');
		expect(hook.result.current.formik.errors.document_number).toBe('Folio inválido');
	});
});
