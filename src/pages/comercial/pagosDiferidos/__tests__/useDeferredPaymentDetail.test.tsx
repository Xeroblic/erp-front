import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IDeferredPaymentDocument } from '@/interface/deferredPayments.interface';
// eslint-disable-next-line import/extensions
import deferredPaymentsService from '@/services/deferredPaymentsService';
// eslint-disable-next-line import/extensions
import deferredPaymentsReducer from '@/store/slices/deferredPayments/deferredPaymentsSlice';
import useDeferredPaymentDetail from '../hooks/useDeferredPaymentDetail';

const branchContext = vi.hoisted(() => ({ subsidiaryId: 10 as number | null }));
vi.mock('@/services/deferredPaymentsService', () => ({ default: { getDocument: vi.fn() } }));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({
		branchId: 1,
		subsidiaryId: branchContext.subsidiaryId,
		hasValidBranch: branchContext.subsidiaryId !== null,
		visibleBranches: [],
	}),
}));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

const documentFixture = (id: number): IDeferredPaymentDocument => ({
	id,
	document_number: `FAC-${id}`,
	document_type: 'invoice',
	purchase_order: null,
	total_amount: '1000.00',
	outstanding_amount: '1000.00',
	paid_amount: '0.00',
	status: 'pending',
	is_overdue: false,
	days_until_due: 10,
	due_date: '2026-08-10',
	issue_date: '2026-07-01',
	notes: null,
	customer: { id: 7, billing_company: 'Cliente Real', rut: '1-9', contact_name: 'Ana' },
	assignees: [],
	items: [],
	payments: [],
	attachments: [],
});
const flushPromises = async () => {
	await act(async () => {
		await Promise.resolve();
	});
};

describe('useDeferredPaymentDetail con servicio', () => {
	const getDocumentMock = vi.mocked(deferredPaymentsService.getDocument);
	const createHook = (
		documentId: number | null,
		selectionContext = documentId === null
			? null
			: { type: 'subsidiary' as const, id: branchContext.subsidiaryId ?? 0 },
	) => {
		const store = configureStore({ reducer: { deferredPayments: deferredPaymentsReducer } });
		const Wrapper = ({ children }: PropsWithChildren) => (
			<Provider store={store}>{children}</Provider>
		);
		const hook = renderHook(
			({
				selectedId,
				context,
			}: {
				selectedId: number | null;
				context: { type: 'subsidiary'; id: number } | null;
			}) => useDeferredPaymentDetail(selectedId, context),
			{
				initialProps: { selectedId: documentId, context: selectionContext },
				wrapper: Wrapper,
			},
		);
		return { store, hook };
	};
	beforeEach(() => {
		branchContext.subsidiaryId = 10;
		getDocumentMock.mockImplementation((_subsidiaryId, documentId) =>
			Promise.resolve(documentFixture(documentId)),
		);
	});
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('no consulta ni conserva detalle cuando no hay documento seleccionado', async () => {
		const { hook, store } = createHook(null);
		await flushPromises();
		expect(getDocumentMock).not.toHaveBeenCalled();
		expect(hook.result.current.document).toBeNull();
		expect(store.getState().deferredPayments.current).toBeNull();
	});
	it('no consulta sin subsidiaria valida', async () => {
		branchContext.subsidiaryId = null;
		const { hook } = createHook(2);
		await flushPromises();
		expect(getDocumentMock).not.toHaveBeenCalled();
		expect(hook.result.current.document).toBeNull();
		expect(hook.result.current.hasDataContext).toBe(false);
	});
	it('carga el detalle con documento y subsidiaria', async () => {
		const { hook } = createHook(2);
		await flushPromises();
		expect(getDocumentMock).toHaveBeenCalledWith(10, 2, expect.any(AbortSignal));
		expect(hook.result.current.document).toEqual(documentFixture(2));
		expect(hook.result.current.hasDataContext).toBe(true);
	});
	it('aborta el detalle anterior al cambiar rapidamente de documento', async () => {
		const signals: AbortSignal[] = [];
		getDocumentMock.mockImplementation((_subsidiaryId, documentId, signal) => {
			if (signal) signals.push(signal);
			if (documentId === 1) return new Promise(() => {});
			return Promise.resolve(documentFixture(documentId));
		});
		const { hook, store } = createHook(1);
		await flushPromises();
		hook.rerender({ selectedId: 2, context: { type: 'subsidiary', id: 10 } });
		await flushPromises();
		expect(signals[0]?.aborted).toBe(true);
		expect(getDocumentMock).toHaveBeenCalledTimes(2);
		expect(hook.result.current.document?.id).toBe(2);
		expect(store.getState().deferredPayments.errorDetail).toBeNull();
	});
	it('no consulta el ID heredado bajo una subsidiaria nueva', async () => {
		const { hook } = createHook(4);
		await flushPromises();
		expect(hook.result.current.document?.id).toBe(4);
		getDocumentMock.mockClear();
		act(() => {
			branchContext.subsidiaryId = 20;
			hook.rerender({ selectedId: null, context: null });
		});
		await flushPromises();
		expect(getDocumentMock).not.toHaveBeenCalled();
		expect(hook.result.current.document).toBeNull();
		expect(hook.result.current.branch.subsidiaryId).toBe(20);
	});
	it('expone el error del servicio y permite reintentar la solicitud vigente', async () => {
		getDocumentMock
			.mockRejectedValueOnce(new Error('Documento no encontrado'))
			.mockResolvedValueOnce(documentFixture(9));
		const { hook } = createHook(9);
		await flushPromises();
		expect(hook.result.current.error).toBe('Documento no encontrado');
		act(() => {
			hook.result.current.actions.refresh()?.catch(() => undefined);
		});
		await flushPromises();
		expect(getDocumentMock).toHaveBeenCalledTimes(2);
		expect(hook.result.current.error).toBeNull();
		expect(hook.result.current.document?.id).toBe(9);
	});
	it('aborta y limpia el estado del detalle al desmontar', async () => {
		let signal: AbortSignal | undefined;
		getDocumentMock.mockImplementation((_subsidiaryId, _documentId, requestSignal) => {
			signal = requestSignal;
			return new Promise(() => {});
		});
		const { hook, store } = createHook(1);
		await flushPromises();
		hook.unmount();
		expect(signal?.aborted).toBe(true);
		expect(store.getState().deferredPayments).toMatchObject({
			current: null,
			loadingDetail: false,
			errorDetail: null,
			detailRequestId: null,
		});
	});
});
