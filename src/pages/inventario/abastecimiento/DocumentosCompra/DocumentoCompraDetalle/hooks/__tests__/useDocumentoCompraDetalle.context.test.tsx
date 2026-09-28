import React, { type PropsWithChildren } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetPurchaseDocumentsStoreForTests } from '@/mocks/services/purchaseDocuments.mock';
import purchaseDocumentsReducer from '@/store/slices/procurement/purchaseDocumentsSlice';
import useDocumentoCompraDetalle from '../useDocumentoCompraDetalle';

/**
 * Propiedad de contexto de la ficha (ZF-12). La limpieza del contexto
 * anterior y la carga nueva ocurren en efectos, después del render: la ficha
 * y sus modales no pueden quedar a la vista de otra filial ni de otro
 * documento, ni siquiera en el primer render.
 */

vi.mock(
	'@/services/procurement/purchaseDocuments.service',
	() => import('@/mocks/services/purchaseDocuments.mock'),
);

const branchContext = vi.hoisted(() => ({ branchId: 4, subsidiaryId: 4 }));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ ...branchContext }),
}));

const routeParams = vi.hoisted(() => ({ documentoId: '42' }));
vi.mock('react-router-dom', () => ({
	useParams: () => ({ ...routeParams }),
	useNavigate: () => vi.fn(),
}));

vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});

const DRAFT_INVOICE_ID = 42; // draftInvoiceDocument de `procurement.db.ts`
const OTHER_DOCUMENT_ID = 24; // pcExpressInvoiceDocument
const OTHER_SUBSIDIARY_ID = 9;

const createWrapper = () => {
	const store = configureStore({ reducer: { purchaseDocuments: purchaseDocumentsReducer } });
	const Wrapper = ({ children }: PropsWithChildren) => (
		<Provider store={store}>{children}</Provider>
	);
	return Wrapper;
};

type TDetail = ReturnType<typeof useDocumentoCompraDetalle>;

/**
 * Guarda cada render con el contexto en que ocurrió. `rerender` corre dentro
 * de `act`, así que los efectos ya limpiaron el store cuando se lee
 * `result.current`: el primer render del contexto nuevo sólo se ve acá.
 */
const renderLoaded = async () => {
	const renders: { subsidiaryId: number; documentoId: string; value: TDetail }[] = [];
	const rendered = renderHook(
		() => {
			const value = useDocumentoCompraDetalle();
			renders.push({
				subsidiaryId: branchContext.subsidiaryId,
				documentoId: routeParams.documentoId,
				value,
			});
			return value;
		},
		{ wrapper: createWrapper() },
	);
	await waitFor(() => expect(rendered.result.current.document?.id).toBe(DRAFT_INVOICE_ID));
	const rendersFrom = (start: number) => renders.slice(start).map((render) => render.value);
	return { ...rendered, renders, rendersFrom };
};

afterEach(() => {
	resetPurchaseDocumentsStoreForTests();
	branchContext.branchId = 4;
	branchContext.subsidiaryId = 4;
	routeParams.documentoId = String(DRAFT_INVOICE_ID);
});

describe('useDocumentoCompraDetalle — cambio de contexto', () => {
	it('al cambiar de filial no muestra la ficha anterior ni su ETag', async () => {
		const { result, rerender, renders, rendersFrom } = await renderLoaded();
		const start = renders.length;

		branchContext.subsidiaryId = OTHER_SUBSIDIARY_ID;
		rerender();

		const afterSwitch = rendersFrom(start);
		expect(afterSwitch.length).toBeGreaterThan(0);
		afterSwitch.forEach((render) => {
			expect(render.document).toBeNull();
			expect(render.etag).toBeNull();
			expect(render.loading).toBe(true);
		});

		await waitFor(() => expect(result.current.document?.id).toBe(DRAFT_INVOICE_ID));
	});

	it('al pasar a otro documento no muestra el anterior', async () => {
		const { result, rerender, renders, rendersFrom } = await renderLoaded();
		const start = renders.length;

		routeParams.documentoId = String(OTHER_DOCUMENT_ID);
		rerender();

		rendersFrom(start).forEach((render) => {
			expect(render.document?.id).not.toBe(DRAFT_INVOICE_ID);
		});
		await waitFor(() => expect(result.current.document?.id).toBe(OTHER_DOCUMENT_ID));
	});

	it('un modal abierto en la filial anterior queda cerrado desde el primer render', async () => {
		const { result, rerender, renders, rendersFrom } = await renderLoaded();
		act(() => result.current.setIsCancelModalOpen(true));
		expect(result.current.isCancelModalOpen).toBe(true);
		const start = renders.length;

		branchContext.subsidiaryId = OTHER_SUBSIDIARY_ID;
		rerender();

		rendersFrom(start).forEach((render) => expect(render.isCancelModalOpen).toBe(false));

		// Volver a la filial no reabre el modal: la acción se abandonó.
		branchContext.subsidiaryId = 4;
		rerender();
		await waitFor(() => expect(result.current.document?.id).toBe(DRAFT_INVOICE_ID));
		expect(result.current.isCancelModalOpen).toBe(false);
	});
});
