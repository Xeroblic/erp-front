import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DeferredPaymentExportDownload } from '@/services/deferredPaymentsService';
import useDeferredPaymentsExport, { withoutPagination } from '../hooks/useDeferredPaymentsExport';

const createDeferred = <T,>() => {
	let resolve: (value: T) => void = () => undefined;
	const promise = new Promise<T>((resolvePromise) => {
		resolve = resolvePromise;
	});
	return { promise, resolve };
};

describe('useDeferredPaymentsExport', () => {
	it('preserva la página actual y elimina page/per_page al exportar todo', async () => {
		vi.useFakeTimers();
		const download = vi
			.fn<
				(params: {
					page?: number;
					per_page?: number;
					search?: string;
				}) => Promise<DeferredPaymentExportDownload>
			>()
			.mockResolvedValue({ blob: new Blob(['xlsx']), fileName: 'pagos.xlsx' });
		const createObjectUrl = vi.fn(() => 'blob:pagos');
		const revokeObjectUrl = vi.fn();
		const click = vi.fn();
		vi.stubGlobal('URL', {
			createObjectURL: createObjectUrl,
			revokeObjectURL: revokeObjectUrl,
		});
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(click);
		const { result } = renderHook(() =>
			useDeferredPaymentsExport({ disabled: false, ownerContext: 4, download }),
		);
		const pageParams = { page: 2, per_page: 50, search: 'Andes' };

		await act(async () => result.current.exportPage(pageParams));
		await act(async () => result.current.exportAll(withoutPagination(pageParams)));

		expect(download).toHaveBeenNthCalledWith(1, pageParams, expect.any(AbortSignal));
		expect(download).toHaveBeenNthCalledWith(2, { search: 'Andes' }, expect.any(AbortSignal));
		expect(createObjectUrl).toHaveBeenCalledTimes(2);
		expect(click).toHaveBeenCalledTimes(2);
		await act(async () => vi.runAllTimersAsync());
		expect(revokeObjectUrl).toHaveBeenCalledTimes(2);
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it('muestra el mensaje backend cuando Axios rechaza un Blob JSON', async () => {
		const errorBody = {
			text: () =>
				Promise.resolve(JSON.stringify({ message: 'La página debe ser mayor a cero.' })),
		};
		const download = vi.fn().mockRejectedValue({
			response: {
				status: 422,
				data: errorBody,
			},
		});
		const { result } = renderHook(() =>
			useDeferredPaymentsExport({ disabled: false, ownerContext: 4, download }),
		);

		await act(async () => result.current.exportPage({ page: 0 }));

		expect(result.current.error).toBe('La página debe ser mayor a cero.');
	});

	it('no inicia otra descarga mientras está deshabilitado', async () => {
		const download = vi.fn();
		const { result } = renderHook(() =>
			useDeferredPaymentsExport({ disabled: true, ownerContext: 4, download }),
		);

		await act(async () => result.current.exportPage({ page: 1, per_page: 20 }));

		expect(download).not.toHaveBeenCalled();
	});

	it('usa un cerrojo síncrono ante activaciones consecutivas', async () => {
		const pendingDownload = createDeferred<DeferredPaymentExportDownload>();
		const download = vi.fn(() => pendingDownload.promise);
		const { result } = renderHook(() =>
			useDeferredPaymentsExport({ disabled: false, ownerContext: 4, download }),
		);

		act(() => {
			result.current.exportPage({ page: 1 }).catch(() => undefined);
			result.current.exportPage({ page: 1 }).catch(() => undefined);
		});

		expect(download).toHaveBeenCalledOnce();
		await act(async () => {
			pendingDownload.resolve({ blob: new Blob(['xlsx']), fileName: 'pagos.xlsx' });
			await pendingDownload.promise;
		});
	});

	it('descarta la respuesta de una subsidiaria anterior', async () => {
		const pendingDownload = createDeferred<DeferredPaymentExportDownload>();
		const download = vi.fn(() => pendingDownload.promise);
		const createObjectUrl = vi.fn(() => 'blob:pagos');
		vi.stubGlobal('URL', { createObjectURL: createObjectUrl, revokeObjectURL: vi.fn() });
		const { result, rerender } = renderHook(
			({ ownerContext }) =>
				useDeferredPaymentsExport({ disabled: false, ownerContext, download }),
			{ initialProps: { ownerContext: 4 as number | null } },
		);

		act(() => {
			result.current.exportPage({ page: 1 }).catch(() => undefined);
		});
		rerender({ ownerContext: 8 });
		await act(async () => {
			pendingDownload.resolve({ blob: new Blob(['xlsx']), fileName: 'A.xlsx' });
			await pendingDownload.promise;
		});

		expect(createObjectUrl).not.toHaveBeenCalled();
		expect(result.current.error).toBeNull();
		vi.unstubAllGlobals();
	});
});
