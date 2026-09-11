import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	clearAllPersistedMockState,
	loadPersistedMockState,
} from '@/services/procurement/procurementMockPersistence.util';
import useSupplierPhoto from '../useSupplierPhoto';

const toastSpies = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('react-toastify', () => ({ toast: toastSpies }));

const NAMESPACE = 'supplier-photos';
const deferred = <T,>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((resolvePromise) => {
		resolve = resolvePromise;
	});
	return { promise, resolve };
};

const mockCanvas = () => {
	const context = { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D;
	const createElement = document.createElement.bind(document);
	vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
		if (tagName !== 'canvas') return createElement(tagName);
		const canvas = {
			width: 0,
			height: 0,
			getContext: () => context,
			toDataURL: () => `data:image/webp;base64,photo-${canvas.width}`,
		};
		return canvas as unknown as HTMLCanvasElement;
	});
};

afterEach(() => {
	clearAllPersistedMockState(NAMESPACE);
	toastSpies.success.mockReset();
	toastSpies.error.mockReset();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('useSupplierPhoto — propiedad de contexto', () => {
	it('persiste la carga diferida bajo su proveedor y filial de origen sin pintar ni avisar en el nuevo contexto', async () => {
		const bitmap = deferred<ImageBitmap>();
		vi.stubGlobal(
			'createImageBitmap',
			vi.fn(() => bitmap.promise),
		);
		mockCanvas();
		const { result, rerender } = renderHook(
			({ subsidiaryId, supplierId }) => useSupplierPhoto({ subsidiaryId, supplierId }),
			{ initialProps: { subsidiaryId: 4, supplierId: 7 } },
		);

		let upload!: Promise<void>;
		act(() => {
			upload = result.current.uploadPhoto(
				new File(['photo'], 'foto.png', { type: 'image/png' }),
			);
		});
		rerender({ subsidiaryId: 5, supplierId: 12 });
		expect(result.current.photoUrl).toBeNull();
		expect(result.current.isUploading).toBe(false);
		// Volver a A no revalida la operación pendiente: su generación ya no
		// representa la pantalla actual, aunque el owner vuelva a coincidir.
		rerender({ subsidiaryId: 4, supplierId: 7 });
		expect(result.current.photoUrl).toBeNull();
		expect(result.current.isUploading).toBe(false);

		await act(async () => {
			bitmap.resolve({ width: 100, height: 50 } as ImageBitmap);
			await upload;
		});

		expect(result.current.photoUrl).toBeNull();
		expect(toastSpies.success).not.toHaveBeenCalled();
		expect(loadPersistedMockState<Record<number, string>>(NAMESPACE, 1, 4)).toEqual({
			7: 'data:image/webp;base64,photo-100',
		});
		expect(loadPersistedMockState<Record<number, string>>(NAMESPACE, 1, 5)).toBeNull();
	});

	it('no publica estado ni toast después de desmontar, pero conserva la foto en su contexto de origen', async () => {
		const bitmap = deferred<ImageBitmap>();
		vi.stubGlobal(
			'createImageBitmap',
			vi.fn(() => bitmap.promise),
		);
		mockCanvas();
		const { result, unmount } = renderHook(() =>
			useSupplierPhoto({ subsidiaryId: 4, supplierId: 7 }),
		);

		let upload!: Promise<void>;
		act(() => {
			upload = result.current.uploadPhoto(
				new File(['photo'], 'foto.png', { type: 'image/png' }),
			);
		});
		unmount();

		await act(async () => {
			bitmap.resolve({ width: 100, height: 50 } as ImageBitmap);
			await upload;
		});

		expect(toastSpies.success).not.toHaveBeenCalled();
		expect(toastSpies.error).not.toHaveBeenCalled();
		expect(loadPersistedMockState<Record<number, string>>(NAMESPACE, 1, 4)).toEqual({
			7: 'data:image/webp;base64,photo-100',
		});
	});

	it('conserva en persistencia la última carga cuando dos archivos del mismo proveedor resuelven en orden inverso', async () => {
		const firstBitmap = deferred<ImageBitmap>();
		const secondBitmap = deferred<ImageBitmap>();
		vi.stubGlobal(
			'createImageBitmap',
			vi
				.fn()
				.mockImplementationOnce(() => firstBitmap.promise)
				.mockImplementationOnce(() => secondBitmap.promise),
		);
		mockCanvas();
		const { result } = renderHook(() => useSupplierPhoto({ subsidiaryId: 4, supplierId: 7 }));

		let firstUpload!: Promise<void>;
		let secondUpload!: Promise<void>;
		act(() => {
			firstUpload = result.current.uploadPhoto(
				new File(['first'], 'primera.png', { type: 'image/png' }),
			);
			secondUpload = result.current.uploadPhoto(
				new File(['second'], 'segunda.png', { type: 'image/png' }),
			);
		});

		await act(async () => {
			secondBitmap.resolve({ width: 200, height: 100 } as ImageBitmap);
			await secondUpload;
		});
		await act(async () => {
			firstBitmap.resolve({ width: 100, height: 50 } as ImageBitmap);
			await firstUpload;
		});

		expect(result.current.photoUrl).toBe('data:image/webp;base64,photo-200');
		expect(loadPersistedMockState<Record<number, string>>(NAMESPACE, 1, 4)).toEqual({
			7: 'data:image/webp;base64,photo-200',
		});
	});

	it('persiste las cargas pendientes de proveedores distintos aunque una se inicie después del cambio de contexto', async () => {
		const bitmapA = deferred<ImageBitmap>();
		const bitmapB = deferred<ImageBitmap>();
		vi.stubGlobal(
			'createImageBitmap',
			vi
				.fn()
				.mockImplementationOnce(() => bitmapA.promise)
				.mockImplementationOnce(() => bitmapB.promise),
		);
		mockCanvas();
		const { result, rerender } = renderHook(
			({ subsidiaryId, supplierId }) => useSupplierPhoto({ subsidiaryId, supplierId }),
			{ initialProps: { subsidiaryId: 4, supplierId: 7 } },
		);

		let uploadA!: Promise<void>;
		let uploadB!: Promise<void>;
		act(() => {
			uploadA = result.current.uploadPhoto(
				new File(['a'], 'proveedor-a.png', { type: 'image/png' }),
			);
		});
		rerender({ subsidiaryId: 5, supplierId: 12 });
		act(() => {
			uploadB = result.current.uploadPhoto(
				new File(['b'], 'proveedor-b.png', { type: 'image/png' }),
			);
		});

		await act(async () => {
			bitmapB.resolve({ width: 200, height: 100 } as ImageBitmap);
			await uploadB;
			bitmapA.resolve({ width: 100, height: 50 } as ImageBitmap);
			await uploadA;
		});

		expect(loadPersistedMockState<Record<number, string>>(NAMESPACE, 1, 4)).toEqual({
			7: 'data:image/webp;base64,photo-100',
		});
		expect(loadPersistedMockState<Record<number, string>>(NAMESPACE, 1, 5)).toEqual({
			12: 'data:image/webp;base64,photo-200',
		});
	});
});
