import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IDeferredPaymentDocument } from '@/interface/deferredPayments.interface';
import { useDeferredPaymentAttachments } from '../hooks/useDeferredPaymentAttachments';

const serviceSpies = vi.hoisted(() => ({
	deleteDeferredPaymentDocumentAttachment: vi.fn(),
	updateDeferredPaymentAttachmentSharing: vi.fn(),
	uploadDeferredPaymentDocumentAttachment: vi.fn(),
}));

vi.mock('@/services/deferredPaymentsService', () => ({ default: serviceSpies }));

const attachment = {
	id: 7,
	file_name: 'factura.pdf',
	mime_type: 'application/pdf',
	size: 20,
	share_with_customer: true,
	url: '/attachments/7',
};
const document = { id: 20, attachments: [attachment] } as IDeferredPaymentDocument;

describe('useDeferredPaymentAttachments', () => {
	beforeEach(() => {
		Object.values(serviceSpies).forEach((spy) => spy.mockReset());
	});

	it('rechaza archivos sobre 10 MB sin ponerlos en la cola', () => {
		const { result } = renderHook(() =>
			useDeferredPaymentAttachments({ isOpen: true, subsidiaryId: 1, document }),
		);
		const tooLarge = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'factura.pdf');
		const files = { 0: tooLarge, length: 1, item: () => tooLarge } as unknown as FileList;
		act(() => result.current.addFiles(files));
		expect(result.current.pending).toEqual([]);
		expect(result.current.error).toBe(
			'factura.pdf: Cada archivo puede pesar como máximo 10 MB.',
		);
	});

	it('conserva la cola previa y agrega sólo los archivos válidos de un lote mixto', () => {
		const { result } = renderHook(() =>
			useDeferredPaymentAttachments({ isOpen: true, subsidiaryId: 1, document }),
		);
		const previous = new File(['previous'], 'anterior.pdf');
		const valid = new File(['valid'], 'nuevo.xlsx');
		const invalid = new File(['invalid'], 'bloqueado.exe');
		const asFiles = (files: File[]) =>
			({
				...files,
				length: files.length,
				item: (index: number) => files[index] ?? null,
			}) as FileList;

		act(() => result.current.addFiles(asFiles([previous])));
		act(() => result.current.addFiles(asFiles([valid, invalid])));

		expect(result.current.pending.map((item) => item.file.name)).toEqual([
			'anterior.pdf',
			'nuevo.xlsx',
		]);
		expect(result.current.error).toBe(
			'bloqueado.exe: El archivo debe ser PDF, JPG, JPEG, PNG, WEBP, XLS o XLSX.',
		);
	});

	it('serializa mutaciones y no inicia un PATCH mientras un DELETE está en vuelo', async () => {
		let resolveDelete: () => void = () => undefined;
		serviceSpies.deleteDeferredPaymentDocumentAttachment.mockImplementation(
			() =>
				new Promise<void>((resolve) => {
					resolveDelete = resolve;
				}),
		);
		const { result } = renderHook(() =>
			useDeferredPaymentAttachments({ isOpen: true, subsidiaryId: 1, document }),
		);
		let deleteResult: Promise<boolean> | undefined;
		act(() => {
			deleteResult = result.current.deleteAttachment(attachment.id);
		});
		await act(async () => {
			expect(await result.current.updateSharing(attachment, false)).toBe(false);
		});
		expect(serviceSpies.updateDeferredPaymentAttachmentSharing).not.toHaveBeenCalled();
		await act(async () => {
			resolveDelete();
			await expect(deleteResult).resolves.toBe(true);
		});
		expect(result.current.attachments).toEqual([]);
	});

	it('expone un error si se intenta reintentar mientras hay otra operación en curso', async () => {
		let resolveDelete: () => void = () => undefined;
		serviceSpies.deleteDeferredPaymentDocumentAttachment.mockImplementation(
			() =>
				new Promise<void>((resolve) => {
					resolveDelete = resolve;
				}),
		);
		const { result } = renderHook(() =>
			useDeferredPaymentAttachments({ isOpen: true, subsidiaryId: 1, document }),
		);
		const pendingFile = new File(['pending'], 'pendiente.pdf');
		act(() =>
			result.current.addFiles({
				0: pendingFile,
				length: 1,
				item: () => pendingFile,
			} as unknown as FileList),
		);

		let deletion: Promise<boolean> | undefined;
		act(() => {
			deletion = result.current.deleteAttachment(attachment.id);
		});
		await act(async () => {
			expect(await result.current.uploadPending(document)).toBe(false);
		});
		expect(result.current.error).toBe(
			'Hay otra operación de adjuntos en curso. Espera a que termine para reintentar.',
		);
		await act(async () => {
			resolveDelete();
			await deletion;
		});
	});

	it('descarta una respuesta tardía al cambiar la subsidiaria', async () => {
		let rejectDelete: (error: Error) => void = () => undefined;
		serviceSpies.deleteDeferredPaymentDocumentAttachment.mockImplementation(
			() =>
				new Promise<void>((_resolve, reject) => {
					rejectDelete = reject;
				}),
		);
		const { result, rerender } = renderHook(
			({ subsidiaryId }) =>
				useDeferredPaymentAttachments({ isOpen: true, subsidiaryId, document }),
			{ initialProps: { subsidiaryId: 1 } },
		);
		let deletion: Promise<boolean> | undefined;
		act(() => {
			deletion = result.current.deleteAttachment(attachment.id);
		});
		rerender({ subsidiaryId: 2 });
		act(() => {
			rejectDelete(new Error('Error de A'));
		});
		await expect(deletion).resolves.toBe(false);
		expect(result.current.error).toBeNull();
	});
});
