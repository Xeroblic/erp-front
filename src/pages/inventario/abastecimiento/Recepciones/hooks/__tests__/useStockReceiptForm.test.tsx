import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IPurchaseDocument, IStockReceipt } from '@/interface/procurement.interface';
import { EMPTY_RECEPCION_LINE, EMPTY_RECEPCION_VALUES } from '../../types';
import type { IStockReceiptFormValues } from '../../types';
import useStockReceiptForm from '../useStockReceiptForm';
import { buildDocumentLines } from '../../utils/stockReceiptFormValues';
import { toUpdatePayload } from '../../utils/stockReceiptPayload';

/**
 * Dos garantías del envío que no se ven razonando sobre el cierre de
 * `onSubmit`: una respuesta que llega con otra filial ya activa no actúa sobre
 * la pantalla nueva, y la bodega se autoriza por su propia sucursal.
 */

const mocks = vi.hoisted(() => ({
	dispatch: vi.fn(),
	authorize: vi.fn(() => true),
	toast: { info: vi.fn(), error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/store', () => ({
	useAppDispatch: () => mocks.dispatch,
	useAppSelector: (selector: (state: unknown) => unknown) =>
		selector({
			auth: { user: { id: 7, first_name: 'Ana', last_name: 'Soto', email: 'a@b.cl' } },
		}),
}));
// Los thunks se reemplazan por acciones planas para poder leer qué se envió.
vi.mock('@/store/slices/procurement/stockReceiptsSlice', () => ({
	createStockReceiptThunk: (args: unknown) => ({ type: 'create', args }),
	updateStockReceiptThunk: (args: unknown) => ({ type: 'update', args }),
	postStockReceiptThunk: (args: unknown) => ({ type: 'post', args }),
}));
vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ authorize: mocks.authorize }),
}));
vi.mock('react-toastify', () => ({ toast: mocks.toast }));
const MAIN_WAREHOUSE_ID = 8; // sucursal 4
const SOUTH_BRANCH_WAREHOUSE_ID = 15; // sucursal 6

/** Bodegas ofrecidas: sólo las de la sucursal autorizada 4. */
const OFFERED_WAREHOUSES = [
	{ id: MAIN_WAREHOUSE_ID, name: 'Bodega Central', is_active: true, branch_id: 4 },
];

const createdReceipt = { id: 501 } as IStockReceipt;

const validValues: IStockReceiptFormValues = {
	...EMPTY_RECEPCION_VALUES,
	mode: 'manual',
	warehouse_id: MAIN_WAREHOUSE_ID,
	received_on: '2026-09-04',
	reason: 'Ingreso de prueba',
	items: [{ ...EMPTY_RECEPCION_LINE, product_id: 31, quantity: '3' }],
};

/** El thunk queda pendiente hasta que la prueba decide resolverlo. */
const deferWrite = () => {
	let resolve: (value: { data: IStockReceipt; headers: { etag: string } }) => void = () =>
		undefined;
	const pending = new Promise<{ data: IStockReceipt; headers: { etag: string } }>((done) => {
		resolve = done;
	});
	mocks.dispatch.mockReturnValue({ unwrap: () => pending });
	return (data: IStockReceipt) => resolve({ data, headers: { etag: 'W/"sr-501-v1"' } });
};

const renderForm = (onSuccess: (receipt: IStockReceipt) => void) =>
	renderHook(
		({ subsidiaryId }: { subsidiaryId: number | null }) =>
			useStockReceiptForm({
				subsidiaryId,
				branchId: 4,
				authorizedBranchIds: [4],
				warehouses: OFFERED_WAREHOUSES,
				onSuccess,
			}),
		{ initialProps: { subsidiaryId: 2 } },
	);

afterEach(() => {
	vi.clearAllMocks();
});

describe('useStockReceiptForm — cambio de filial durante el envío', () => {
	it('una respuesta que llega con otra filial activa no ejecuta onSuccess', async () => {
		const onSuccess = vi.fn();
		const resolveWrite = deferWrite();
		const { result, rerender } = renderForm(onSuccess);

		await act(async () => {
			await result.current.formik.setValues(validValues);
		});
		let submission: Promise<unknown> = Promise.resolve();
		act(() => {
			submission = result.current.formik.submitForm();
		});
		await waitFor(() => expect(mocks.dispatch).toHaveBeenCalledTimes(1));

		rerender({ subsidiaryId: 9 });
		await act(async () => {
			resolveWrite(createdReceipt);
			await submission;
		});

		expect(onSuccess).not.toHaveBeenCalled();
		expect(mocks.toast.info).toHaveBeenCalledWith(expect.stringMatching(/cambiaste de filial/));
	});

	it('sin cambio de filial, la respuesta sí ejecuta onSuccess', async () => {
		const onSuccess = vi.fn();
		const resolveWrite = deferWrite();
		const { result } = renderForm(onSuccess);

		await act(async () => {
			await result.current.formik.setValues(validValues);
		});
		let submission: Promise<unknown> = Promise.resolve();
		act(() => {
			submission = result.current.formik.submitForm();
		});
		await waitFor(() => expect(mocks.dispatch).toHaveBeenCalledTimes(1));

		await act(async () => {
			resolveWrite(createdReceipt);
			await submission;
		});

		expect(onSuccess).toHaveBeenCalledWith(createdReceipt);
	});
});

describe('useStockReceiptForm — sucursal de la bodega', () => {
	it('rechaza una bodega de una sucursal fuera de las autorizadas, sin enviar', async () => {
		const { result } = renderForm(vi.fn());

		await act(async () => {
			await result.current.formik.setValues({
				...validValues,
				warehouse_id: SOUTH_BRANCH_WAREHOUSE_ID,
			});
		});
		await act(async () => {
			await result.current.formik.submitForm();
		});

		expect(mocks.dispatch).not.toHaveBeenCalled();
		expect(result.current.formik.errors.warehouse_id).toMatch(/sucursal/);
	});

	it('autoriza contra la sucursal de la bodega, no sólo contra la activa', async () => {
		mocks.authorize.mockImplementation(
			(options?: { branchId?: number | null }) => options?.branchId !== 4,
		);
		const { result } = renderForm(vi.fn());

		await act(async () => {
			await result.current.formik.setValues(validValues);
		});
		await act(async () => {
			await result.current.formik.submitForm();
		});

		expect(mocks.authorize).toHaveBeenCalled();
		expect(mocks.dispatch).not.toHaveBeenCalled();
		mocks.authorize.mockImplementation(() => true);
	});
});

describe('useStockReceiptForm — guardar e ingresar al stock', () => {
	const draftReceipt = { id: 501, status: 'draft' } as IStockReceipt;
	const queuedReceipt = { id: 501, status: 'queued' } as IStockReceipt;

	/** Error de negocio con respuesta: definitivo, no admite reintento con la misma clave. */
	const rejectedError = {
		response: {
			status: 409,
			data: { code: 'UNKNOWN_BUSINESS_RULE', message: 'El documento cambió.' },
		},
	};
	/** Sin respuesta (timeout/red): el ingreso pudo aplicarse o no. */
	const transportError = { isAxiosError: true, request: {} };

	/**
	 * create/update resuelve con la recepción en borrador; cada `post` consume
	 * el siguiente resultado de `postOutcomes` (el último se repite).
	 */
	const mockWrites = (...postOutcomes: ('ok' | 'rejected' | 'uncertain')[]) => {
		let postCalls = 0;
		mocks.dispatch.mockImplementation((action: { type: string }) => ({
			unwrap: () => {
				if (action.type !== 'post')
					return Promise.resolve({ data: draftReceipt, headers: { etag: 'W/"1"' } });
				const outcome = postOutcomes[Math.min(postCalls, postOutcomes.length - 1)];
				postCalls += 1;
				if (outcome === 'ok')
					return Promise.resolve({ data: queuedReceipt, headers: { etag: 'W/"2"' } });
				return Promise.reject(outcome === 'rejected' ? rejectedError : transportError);
			},
		}));
	};

	const postKeys = () =>
		mocks.dispatch.mock.calls
			.map(
				([action]) =>
					action as { type: string; args: { headers: { idempotencyKey: string } } },
			)
			.filter((action) => action.type === 'post')
			.map((action) => action.args.headers.idempotencyKey);

	it('guarda, pide el ingreso de esa recepción y entrega la recepción ya en proceso', async () => {
		mockWrites('ok');
		const onSuccess = vi.fn();
		const { result } = renderForm(onSuccess);

		await act(async () => {
			await result.current.formik.setValues(validValues);
		});
		act(() => {
			result.current.submitWith('save_and_post');
		});
		await waitFor(() => expect(onSuccess).toHaveBeenCalled());

		const types = mocks.dispatch.mock.calls.map(
			([action]) => (action as { type: string }).type,
		);
		expect(types).toEqual(['create', 'post']);
		const postArgs = (mocks.dispatch.mock.calls[1][0] as { args: { id: number } }).args;
		expect(postArgs.id).toBe(501);
		expect(onSuccess).toHaveBeenCalledWith(queuedReceipt);
	});

	it('un rechazo definitivo del ingreso se informa como rechazo y sigue a la ficha', async () => {
		mockWrites('rejected');
		const onSuccess = vi.fn();
		const { result } = renderForm(onSuccess);

		await act(async () => {
			await result.current.formik.setValues(validValues);
		});
		act(() => {
			result.current.submitWith('save_and_post');
		});
		await waitFor(() => expect(onSuccess).toHaveBeenCalled());

		expect(onSuccess).toHaveBeenCalledWith(draftReceipt);
		expect(mocks.toast.error).toHaveBeenCalledWith(expect.stringMatching(/rechazado/));
		expect(result.current.pendingIngress).toBeNull();
	});

	it('un resultado incierto no afirma el estado ni cierra: conserva la operación pendiente', async () => {
		mockWrites('uncertain');
		const onSuccess = vi.fn();
		const { result } = renderForm(onSuccess);

		await act(async () => {
			await result.current.formik.setValues(validValues);
		});
		act(() => {
			result.current.submitWith('save_and_post');
		});
		await waitFor(() =>
			expect(result.current.pendingIngress).toEqual({
				receipt: draftReceipt,
				subsidiaryId: 2,
			}),
		);

		expect(onSuccess).not.toHaveBeenCalled();
		expect(mocks.toast.error).not.toHaveBeenCalled();
		expect(mocks.toast.warning).toHaveBeenCalledWith(
			expect.stringMatching(/no pudimos confirmar/),
		);
	});

	it('el reintento del ingreso incierto repite la misma clave y, si se acepta, sigue a la ficha', async () => {
		mockWrites('uncertain', 'ok');
		const onSuccess = vi.fn();
		const { result } = renderForm(onSuccess);

		await act(async () => {
			await result.current.formik.setValues(validValues);
		});
		act(() => {
			result.current.submitWith('save_and_post');
		});
		await waitFor(() => expect(result.current.pendingIngress).not.toBeNull());

		await act(async () => {
			await result.current.retryIngress();
		});

		const [firstKey, retryKey] = postKeys();
		expect(retryKey).toBe(firstKey);
		// No se vuelve a crear la recepción: sólo se repite el ingreso.
		const types = mocks.dispatch.mock.calls.map(
			([action]) => (action as { type: string }).type,
		);
		expect(types).toEqual(['create', 'post', 'post']);
		expect(onSuccess).toHaveBeenCalledWith(queuedReceipt);
		expect(result.current.pendingIngress).toBeNull();
	});

	it('dejar el ingreso incierto lleva a la ficha y la próxima operación usa otra clave', async () => {
		mockWrites('uncertain');
		const onSuccess = vi.fn();
		const { result } = renderForm(onSuccess);

		await act(async () => {
			await result.current.formik.setValues(validValues);
		});
		act(() => {
			result.current.submitWith('save_and_post');
		});
		await waitFor(() => expect(result.current.pendingIngress).not.toBeNull());

		act(() => {
			result.current.leavePendingIngress();
		});
		expect(onSuccess).toHaveBeenCalledWith(draftReceipt);
		expect(result.current.pendingIngress).toBeNull();

		await act(async () => {
			await result.current.formik.setValues(validValues);
		});
		act(() => {
			result.current.submitWith('save_and_post');
		});
		await waitFor(() => expect(postKeys()).toHaveLength(2));
		const [abandonedKey, nextKey] = postKeys();
		expect(nextKey).not.toBe(abandonedKey);
	});

	it('«Guardar borrador» no pide el ingreso', async () => {
		mockWrites('ok');
		const onSuccess = vi.fn();
		const { result } = renderForm(onSuccess);

		await act(async () => {
			await result.current.formik.setValues(validValues);
		});
		act(() => {
			result.current.submitWith('save');
		});
		await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(draftReceipt));

		const types = mocks.dispatch.mock.calls.map(
			([action]) => (action as { type: string }).type,
		);
		expect(types).toEqual(['create']);
	});

	it('con documento, no envía las líneas que quedaron en 0', async () => {
		mockWrites('ok');
		const { result } = renderForm(vi.fn());

		await act(async () => {
			await result.current.formik.setValues({
				...EMPTY_RECEPCION_VALUES,
				mode: 'with_document',
				purchase_document_id: 61,
				warehouse_id: MAIN_WAREHOUSE_ID,
				received_on: '2026-09-04',
				items: [
					{
						...EMPTY_RECEPCION_LINE,
						purchase_document_line_id: 601,
						quantity: '0',
						pending_quantity: 5,
					},
					{
						...EMPTY_RECEPCION_LINE,
						purchase_document_line_id: 602,
						quantity: '2',
						pending_quantity: 2,
					},
				],
			});
		});
		act(() => {
			result.current.submitWith('save');
		});
		await waitFor(() => expect(mocks.dispatch).toHaveBeenCalled());

		const createArgs = (
			mocks.dispatch.mock.calls[0][0] as {
				args: { payload: { items: { purchase_document_line_id: number }[] } };
			}
		).args;
		expect(createArgs.payload.items).toEqual([
			{ id: undefined, purchase_document_line_id: 602, quantity: 2 },
		]);
	});
});

describe('useStockReceiptForm — ingreso incierto y cambio de filial', () => {
	const draftReceipt = { id: 501, status: 'draft' } as IStockReceipt;
	const queuedReceipt = { id: 501, status: 'queued' } as IStockReceipt;
	const transportError = { isAxiosError: true, request: {} };

	/** El primer `post` queda incierto; los siguientes, según `thenPost`. */
	const mockUncertainThen = (thenPost: 'ok' | 'uncertain') => {
		let postCalls = 0;
		mocks.dispatch.mockImplementation((action: { type: string }) => ({
			unwrap: () => {
				if (action.type !== 'post')
					return Promise.resolve({ data: draftReceipt, headers: { etag: 'W/"1"' } });
				postCalls += 1;
				if (postCalls === 1 || thenPost === 'uncertain')
					return Promise.reject(transportError);
				return Promise.resolve({ data: queuedReceipt, headers: { etag: 'W/"2"' } });
			},
		}));
	};

	const postActions = () =>
		mocks.dispatch.mock.calls
			.map(
				([action]) =>
					action as {
						type: string;
						args: {
							id: number;
							subsidiaryId: number;
							headers: { idempotencyKey: string };
						};
					},
			)
			.filter((action) => action.type === 'post')
			.map((action) => action.args);

	const leaveUncertainInSubsidiary2 = async (onSuccess: (receipt: IStockReceipt) => void) => {
		const rendered = renderForm(onSuccess);
		await act(async () => {
			await rendered.result.current.formik.setValues(validValues);
		});
		act(() => {
			rendered.result.current.submitWith('save_and_post');
		});
		await waitFor(() => expect(rendered.result.current.pendingIngress).not.toBeNull());
		return rendered;
	};

	it('desde otra filial no reintenta ni navega (reproducción del revisor)', async () => {
		mockUncertainThen('ok');
		const onSuccess = vi.fn();
		const { result, rerender } = await leaveUncertainInSubsidiary2(onSuccess);

		rerender({ subsidiaryId: 3 });
		expect(result.current.isPendingIngressForeign).toBe(true);

		await act(async () => {
			await result.current.retryIngress();
		});
		act(() => {
			result.current.leavePendingIngress();
		});

		// Sólo el `post` original, con la filial 2: ninguno con `subsidiaryId: 3`.
		expect(postActions().map(({ id, subsidiaryId }) => ({ id, subsidiaryId }))).toEqual([
			{ id: 501, subsidiaryId: 2 },
		]);
		expect(onSuccess).not.toHaveBeenCalled();
		expect(result.current.pendingIngress).toEqual({ receipt: draftReceipt, subsidiaryId: 2 });
	});

	it('al volver a la filial propietaria reintenta con esa filial y la misma clave', async () => {
		mockUncertainThen('ok');
		const onSuccess = vi.fn();
		const { result, rerender } = await leaveUncertainInSubsidiary2(onSuccess);

		rerender({ subsidiaryId: 3 });
		rerender({ subsidiaryId: 2 });
		expect(result.current.isPendingIngressForeign).toBe(false);

		await act(async () => {
			await result.current.retryIngress();
		});

		const [original, retry] = postActions();
		expect(retry.subsidiaryId).toBe(2);
		expect(retry.id).toBe(501);
		expect(retry.headers.idempotencyKey).toBe(original.headers.idempotencyKey);
		expect(onSuccess).toHaveBeenCalledWith(queuedReceipt);
	});

	it('si la filial cambia durante el primer ingreso incierto, la operación se conserva con su filial', async () => {
		let rejectPost: (reason: unknown) => void = () => undefined;
		mocks.dispatch.mockImplementation((action: { type: string }) => ({
			unwrap: () =>
				action.type === 'post'
					? new Promise((_, reject) => {
							rejectPost = reject;
						})
					: Promise.resolve({ data: draftReceipt, headers: { etag: 'W/"1"' } }),
		}));
		const onSuccess = vi.fn();
		const { result, rerender } = renderForm(onSuccess);

		await act(async () => {
			await result.current.formik.setValues(validValues);
		});
		act(() => {
			result.current.submitWith('save_and_post');
		});
		await waitFor(() => expect(postActions()).toHaveLength(1));

		rerender({ subsidiaryId: 3 });
		await act(async () => {
			rejectPost(transportError);
			await Promise.resolve();
		});

		await waitFor(() =>
			expect(result.current.pendingIngress).toEqual({
				receipt: draftReceipt,
				subsidiaryId: 2,
			}),
		);
		expect(result.current.isPendingIngressForeign).toBe(true);
		expect(onSuccess).not.toHaveBeenCalled();
	});

	it('descartar desde otra filial no navega y libera la clave para la próxima operación', async () => {
		mockUncertainThen('ok');
		const onSuccess = vi.fn();
		const { result, rerender } = await leaveUncertainInSubsidiary2(onSuccess);

		rerender({ subsidiaryId: 3 });
		act(() => {
			result.current.discardPendingIngress();
		});

		expect(result.current.pendingIngress).toBeNull();
		expect(onSuccess).not.toHaveBeenCalled();

		rerender({ subsidiaryId: 2 });
		await act(async () => {
			await result.current.formik.setValues(validValues);
		});
		act(() => {
			result.current.submitWith('save_and_post');
		});
		await waitFor(() => expect(postActions()).toHaveLength(2));
		const [abandoned, next] = postActions();
		expect(next.headers.idempotencyKey).not.toBe(abandoned.headers.idempotencyKey);
	});
});

describe('buildDocumentLines', () => {
	const document = {
		items: [
			{ id: 601, remaining_quantity: 5 },
			{ id: 602, remaining_quantity: 0 },
			{ id: 603, remaining_quantity: 0 },
		],
	} as unknown as IPurchaseDocument;

	it('alta: precarga sólo las líneas con saldo, con lo pendiente como cantidad', () => {
		expect(buildDocumentLines(document, [], { preserveExisting: false })).toEqual([
			{
				...EMPTY_RECEPCION_LINE,
				purchase_document_line_id: 601,
				quantity: '5',
				pending_quantity: 5,
			},
		]);
	});

	it('corrección: no agrega unidades de líneas omitidas y conserva las cantidades', () => {
		// Una recepción con 2 de A no debe volver con 10 de B.
		const withTwoLines = {
			items: [
				{ id: 701, remaining_quantity: 5 },
				{ id: 702, remaining_quantity: 10 },
			],
		} as unknown as IPurchaseDocument;
		const receipt = { id: 501, supplier: null } as unknown as IStockReceipt;
		const current = [
			{ ...EMPTY_RECEPCION_LINE, id: 11, purchase_document_line_id: 701, quantity: '2' },
		];

		const lines = buildDocumentLines(withTwoLines, current, { preserveExisting: true });

		expect(
			lines.map((line) => [line.id, line.purchase_document_line_id, line.quantity]),
		).toEqual([
			[11, 701, '2'],
			[undefined, 702, '0'],
		]);
		const payload = toUpdatePayload(
			{
				...EMPTY_RECEPCION_VALUES,
				mode: 'with_document',
				purchase_document_id: 61,
				warehouse_id: MAIN_WAREHOUSE_ID,
				received_on: '2026-09-04',
				items: lines,
			},
			receipt,
		);
		expect(payload.items).toEqual([{ id: 11, purchase_document_line_id: 701, quantity: 2 }]);
	});

	it('corrección: conserva cada fila aunque varias apunten a la misma línea del documento', () => {
		const lines = buildDocumentLines(
			document,
			[
				{ ...EMPTY_RECEPCION_LINE, id: 21, purchase_document_line_id: 601, quantity: '1' },
				{ ...EMPTY_RECEPCION_LINE, id: 22, purchase_document_line_id: 601, quantity: '2' },
				{ ...EMPTY_RECEPCION_LINE, id: 23, purchase_document_line_id: 603, quantity: '3' },
			],
			{ preserveExisting: true },
		);
		expect(
			lines.map((line) => [line.id, line.purchase_document_line_id, line.quantity]),
		).toEqual([
			[21, 601, '1'],
			[22, 601, '2'],
			[23, 603, '3'],
		]);
		expect(lines.map((line) => line.pending_quantity)).toEqual([5, 5, 0]);
	});
});
