import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IStockReceipt } from '@/interface/procurement.interface';
import { EMPTY_RECEPCION_LINE, EMPTY_RECEPCION_VALUES } from '../../types';
import type { IRecepcionFormValues } from '../../types';
import useRecepcionForm from '../useRecepcionForm';

/**
 * Dos garantías del envío que no se ven razonando sobre el cierre de
 * `onSubmit`: una respuesta que llega con otra filial ya activa no actúa sobre
 * la pantalla nueva, y la bodega se autoriza por su propia sucursal.
 */

const mocks = vi.hoisted(() => ({
	dispatch: vi.fn(),
	authorize: vi.fn(() => true),
	toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/store', () => ({ useAppDispatch: () => mocks.dispatch }));
vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ authorize: mocks.authorize }),
}));
vi.mock('react-toastify', () => ({ toast: mocks.toast }));

const MAIN_WAREHOUSE_ID = 8; // sucursal 4
const SOUTH_BRANCH_WAREHOUSE_ID = 15; // sucursal 6

const createdReceipt = { id: 501 } as IStockReceipt;

const validValues: IRecepcionFormValues = {
	...EMPTY_RECEPCION_VALUES,
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
			useRecepcionForm({
				subsidiaryId,
				branchId: 4,
				authorizedBranchIds: [4],
				onSuccess,
			}),
		{ initialProps: { subsidiaryId: 2 } },
	);

afterEach(() => {
	vi.clearAllMocks();
});

describe('useRecepcionForm — cambio de filial durante el envío', () => {
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

describe('useRecepcionForm — sucursal de la bodega', () => {
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
