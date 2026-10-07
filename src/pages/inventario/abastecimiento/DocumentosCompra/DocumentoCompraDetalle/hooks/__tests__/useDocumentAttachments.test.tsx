import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as purchaseDocumentAttachmentsService from '@/services/procurement/purchaseDocumentAttachments.service';
import { uploadPurchaseDocumentAttachment } from '@/services/procurement/purchaseDocumentAttachments.service';
import { resetPurchaseDocumentAttachmentsStoreForTests } from '@/mocks/services/purchaseDocumentAttachments.mock';
import { resetPurchaseDocumentsStoreForTests } from '@/mocks/services/purchaseDocuments.mock';
import { PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT } from '@/interface/procurement.interface';
import useDocumentAttachments from '../useDocumentAttachments';

// Las reglas del servicio las cubre `purchaseDocumentAttachments.mock.test.ts`;
// acá se ejerce el hook contra ese doble en memoria, que valida estado y cupo.
vi.mock(
	'@/services/procurement/purchaseDocumentAttachments.service',
	() => import('@/mocks/services/purchaseDocumentAttachments.mock'),
);

const toastSpies = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('react-toastify', () => ({ toast: toastSpies }));

const SUBSIDIARY_A = 4;
// IDs literales de `procurement.db.ts`.
const CONFIRMED_WITH_ATTACHMENT_ID = 24; // pcExpressInvoiceDocument, con un adjunto semilla
const DRAFT_INVOICE_ID = 42; // draftInvoiceDocument, sin adjuntos

const asFileList = (files: File[]): FileList => files as unknown as FileList;

const pdfFile = (name = 'respaldo.pdf', size = 1024): File =>
	new File([new Uint8Array(size)], name, { type: 'application/pdf' });

/** Mismo shape que `apiError` de los servicios mock, para simular su rechazo. */
const mockAxiosError = (status: number, data: Record<string, unknown>) => ({
	isAxiosError: true as const,
	response: { status, data },
});

afterEach(() => {
	resetPurchaseDocumentAttachmentsStoreForTests();
	resetPurchaseDocumentsStoreForTests();
	toastSpies.success.mockReset();
	toastSpies.error.mockReset();
	toastSpies.info.mockReset();
});

describe('useDocumentAttachments', () => {
	it('carga la lista del documento y expone el cupo restante', async () => {
		const { result } = renderHook(() =>
			useDocumentAttachments({
				subsidiaryId: SUBSIDIARY_A,
				documentId: DRAFT_INVOICE_ID,
				canUpload: true,
				canDelete: true,
				onChanged: vi.fn(),
			}),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.attachments).toEqual([]);
		expect(result.current.remainingQuota).toBe(PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT);
		expect(result.current.isQuotaReached).toBe(false);
	});

	it('sube un archivo válido, refresca la lista y avisa a onChanged', async () => {
		const onChanged = vi.fn();
		const { result } = renderHook(() =>
			useDocumentAttachments({
				subsidiaryId: SUBSIDIARY_A,
				documentId: DRAFT_INVOICE_ID,
				canUpload: true,
				canDelete: true,
				onChanged,
			}),
		);
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.addFiles(asFileList([pdfFile('nueva-factura.pdf')]));
		});
		// La lista se refresca en un efecto aparte, después de `addFiles`.
		await waitFor(() => expect(result.current.attachments).toHaveLength(1));

		expect(result.current.attachments[0].file_name).toBe('nueva-factura.pdf');
		expect(result.current.uploadError).toBeNull();
		expect(onChanged).toHaveBeenCalledTimes(1);
	});

	it('si la tanda falla a mitad de camino, refresca igual lo que sí se subió y deja el fallido en cola', async () => {
		// 422 en el segundo archivo: otra pestaña agotó el cupo entre el chequeo
		// del cliente y esta subida.
		const originalUpload = purchaseDocumentAttachmentsService.uploadPurchaseDocumentAttachment;
		const uploadSpy = vi.spyOn(
			purchaseDocumentAttachmentsService,
			'uploadPurchaseDocumentAttachment',
		);
		uploadSpy.mockImplementationOnce((...args) => originalUpload(...args));
		uploadSpy.mockImplementationOnce(() =>
			Promise.reject(
				mockAxiosError(422, {
					message: 'Este documento ya tiene 10 adjuntos, el máximo permitido.',
					code: 'PURCHASE_DOCUMENT_ATTACHMENT_QUOTA_EXCEEDED',
				}),
			),
		);

		const onChanged = vi.fn();
		const { result } = renderHook(() =>
			useDocumentAttachments({
				subsidiaryId: SUBSIDIARY_A,
				documentId: DRAFT_INVOICE_ID,
				canUpload: true,
				canDelete: true,
				onChanged,
			}),
		);
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.addFiles(asFileList([pdfFile('uno.pdf'), pdfFile('dos.pdf')]));
		});

		await waitFor(() => expect(result.current.attachments).toHaveLength(1));
		expect(result.current.attachments[0].file_name).toBe('uno.pdf');
		expect(onChanged).toHaveBeenCalledTimes(1);

		expect(result.current.uploadQueue).toHaveLength(1);
		expect(result.current.uploadQueue[0].file.name).toBe('dos.pdf');
		expect(result.current.uploadQueue[0].status).toBe('error');
		expect(result.current.uploadQueue[0].errorMessage).toContain(
			'Este documento ya tiene 10 adjuntos, el máximo permitido.',
		);

		uploadSpy.mockRestore();
	});

	it('reintentar un archivo fallido reutiliza la misma Idempotency-Key, no una nueva', async () => {
		const originalUpload = purchaseDocumentAttachmentsService.uploadPurchaseDocumentAttachment;
		const uploadSpy = vi.spyOn(
			purchaseDocumentAttachmentsService,
			'uploadPurchaseDocumentAttachment',
		);
		const capturedKeys: Array<string | undefined> = [];
		uploadSpy.mockImplementationOnce((...args) => {
			capturedKeys.push(args[3]?.idempotencyKey);
			return Promise.reject(mockAxiosError(500, { message: 'Error transitorio simulado.' }));
		});
		uploadSpy.mockImplementationOnce((...args) => {
			capturedKeys.push(args[3]?.idempotencyKey);
			return originalUpload(...args);
		});

		const { result } = renderHook(() =>
			useDocumentAttachments({
				subsidiaryId: SUBSIDIARY_A,
				documentId: DRAFT_INVOICE_ID,
				canUpload: true,
				canDelete: true,
				onChanged: vi.fn(),
			}),
		);
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.addFiles(asFileList([pdfFile('reintento.pdf')]));
		});
		await waitFor(() => expect(result.current.uploadQueue).toHaveLength(1));
		expect(result.current.uploadQueue[0].status).toBe('error');
		const [failedItem] = result.current.uploadQueue;

		act(() => {
			result.current.retryUpload(failedItem.localId);
		});
		await waitFor(() => expect(result.current.attachments).toHaveLength(1));

		expect(capturedKeys).toHaveLength(2);
		expect(capturedKeys[0]).toBeDefined();
		expect(capturedKeys[1]).toBe(capturedKeys[0]);
		expect(result.current.uploadQueue).toHaveLength(0);

		uploadSpy.mockRestore();
	});

	it('una subida en curso al cambiar de documento no refresca el documento abandonado', async () => {
		// En la pantalla real, `onChanged` de A recargaría el documento
		// equivocado por encima del que el usuario está mirando.
		const onChangedA = vi.fn();
		const onChangedB = vi.fn();
		const { result, rerender } = renderHook(
			({ documentId, onChanged }) =>
				useDocumentAttachments({
					subsidiaryId: SUBSIDIARY_A,
					documentId,
					canUpload: true,
					canDelete: true,
					onChanged,
				}),
			{ initialProps: { documentId: DRAFT_INVOICE_ID, onChanged: onChangedA } },
		);
		await waitFor(() => expect(result.current.loading).toBe(false));

		let addFilesPromise!: Promise<void>;
		act(() => {
			addFilesPromise = result.current.addFiles(asFileList([pdfFile('tardio.pdf')]));
		});

		rerender({ documentId: CONFIRMED_WITH_ATTACHMENT_ID, onChanged: onChangedB });

		await act(async () => {
			await addFilesPromise;
		});

		expect(onChangedA).not.toHaveBeenCalled();
		expect(result.current.uploadQueue).toEqual([]);
	});

	it('la cola del documento nuevo se sube aunque la del abandonado siga en vuelo', async () => {
		const originalUpload = purchaseDocumentAttachmentsService.uploadPurchaseDocumentAttachment;
		const uploadSpy = vi.spyOn(
			purchaseDocumentAttachmentsService,
			'uploadPurchaseDocumentAttachment',
		);
		let releaseA!: () => void;
		let releaseB!: () => void;
		uploadSpy.mockImplementationOnce((...args) =>
			new Promise<void>((resolve) => {
				releaseA = resolve;
			}).then(() => originalUpload(...args)),
		);
		uploadSpy.mockImplementationOnce((...args) =>
			new Promise<void>((resolve) => {
				releaseB = resolve;
			}).then(() => originalUpload(...args)),
		);

		const onChangedA = vi.fn();
		const onChangedB = vi.fn();
		const { result, rerender } = renderHook(
			({ documentId, onChanged }) =>
				useDocumentAttachments({
					subsidiaryId: SUBSIDIARY_A,
					documentId,
					canUpload: true,
					canDelete: true,
					onChanged,
				}),
			{ initialProps: { documentId: DRAFT_INVOICE_ID, onChanged: onChangedA } },
		);
		await waitFor(() => expect(result.current.loading).toBe(false));

		let addFilesA!: Promise<void>;
		act(() => {
			addFilesA = result.current.addFiles(asFileList([pdfFile('de-a.pdf')]));
		});
		await waitFor(() => expect(uploadSpy).toHaveBeenCalledTimes(1));

		rerender({ documentId: CONFIRMED_WITH_ATTACHMENT_ID, onChanged: onChangedB });
		await waitFor(() => expect(result.current.attachments).toHaveLength(1));

		let addFilesB!: Promise<void>;
		act(() => {
			addFilesB = result.current.addFiles(asFileList([pdfFile('de-b.pdf')]));
		});
		await waitFor(() => expect(uploadSpy).toHaveBeenCalledTimes(2));
		expect(uploadSpy.mock.calls[1][1]).toBe(CONFIRMED_WITH_ATTACHMENT_ID);

		// El bucle abandonado termina mientras el de B sigue subiendo.
		await act(async () => {
			releaseA();
			await addFilesA;
		});
		expect(result.current.isUploading).toBe(true);
		expect(result.current.uploadQueue.map((item) => item.status)).toEqual(['uploading']);

		await act(async () => {
			releaseB();
			await addFilesB;
		});
		await waitFor(() => expect(result.current.attachments).toHaveLength(2));

		expect(result.current.attachments.map((item) => item.file_name)).toContain('de-b.pdf');
		expect(result.current.uploadQueue).toEqual([]);
		expect(result.current.isUploading).toBe(false);
		expect(onChangedB).toHaveBeenCalledTimes(1);
		expect(onChangedA).not.toHaveBeenCalled();

		uploadSpy.mockRestore();
	});

	it('un tipo no permitido se rechaza en el cliente, sin llamar al servicio', async () => {
		const onChanged = vi.fn();
		const { result } = renderHook(() =>
			useDocumentAttachments({
				subsidiaryId: SUBSIDIARY_A,
				documentId: DRAFT_INVOICE_ID,
				canUpload: true,
				canDelete: true,
				onChanged,
			}),
		);
		await waitFor(() => expect(result.current.loading).toBe(false));

		const invalid = new File(['contenido'], 'planilla.xlsx', {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		});
		await act(async () => {
			await result.current.addFiles(asFileList([invalid]));
		});

		expect(result.current.attachments).toEqual([]);
		expect(result.current.uploadError).toContain('PDF, JPG o PNG');
		expect(onChanged).not.toHaveBeenCalled();
	});

	it('un archivo de más de 10 MB se rechaza en el cliente', async () => {
		const { result } = renderHook(() =>
			useDocumentAttachments({
				subsidiaryId: SUBSIDIARY_A,
				documentId: DRAFT_INVOICE_ID,
				canUpload: true,
				canDelete: true,
				onChanged: vi.fn(),
			}),
		);
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.addFiles(
				asFileList([pdfFile('grande.pdf', 10 * 1024 * 1024 + 1)]),
			);
		});

		expect(result.current.attachments).toEqual([]);
		expect(result.current.uploadError).toContain('10 MB');
	});

	it('con el cupo lleno, avisa sin subir nada nuevo', async () => {
		for (let index = 0; index < PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT; index += 1) {
			// eslint-disable-next-line no-await-in-loop -- semilla secuencial del cupo, cada subida es independiente.
			await uploadPurchaseDocumentAttachment(
				SUBSIDIARY_A,
				DRAFT_INVOICE_ID,
				pdfFile(`adjunto-${index}.pdf`),
				{ idempotencyKey: `cupo-${index}` },
			);
		}

		const { result } = renderHook(() =>
			useDocumentAttachments({
				subsidiaryId: SUBSIDIARY_A,
				documentId: DRAFT_INVOICE_ID,
				canUpload: true,
				canDelete: true,
				onChanged: vi.fn(),
			}),
		);
		await waitFor(() => expect(result.current.isQuotaReached).toBe(true));

		await act(async () => {
			await result.current.addFiles(asFileList([pdfFile('once.pdf')]));
		});

		expect(result.current.attachments).toHaveLength(PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT);
		expect(result.current.uploadError).toContain('cupo');
	});

	it('no sube nada cuando canUpload es false (documento cancelled)', async () => {
		const onChanged = vi.fn();
		const { result } = renderHook(() =>
			useDocumentAttachments({
				subsidiaryId: SUBSIDIARY_A,
				documentId: DRAFT_INVOICE_ID,
				canUpload: false,
				canDelete: true,
				onChanged,
			}),
		);
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.addFiles(asFileList([pdfFile()]));
		});

		expect(result.current.attachments).toEqual([]);
		expect(onChanged).not.toHaveBeenCalled();
	});

	it('elimina en draft y decrementa; avisa a onChanged', async () => {
		const onChanged = vi.fn();
		const { result } = renderHook(() =>
			useDocumentAttachments({
				subsidiaryId: SUBSIDIARY_A,
				documentId: DRAFT_INVOICE_ID,
				canUpload: true,
				canDelete: true,
				onChanged,
			}),
		);
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.addFiles(asFileList([pdfFile('a-eliminar.pdf')]));
		});
		await waitFor(() => expect(result.current.attachments).toHaveLength(1));
		const [uploaded] = result.current.attachments;

		await act(async () => {
			await result.current.removeAttachment(uploaded);
		});
		await waitFor(() => expect(result.current.attachments).toEqual([]));

		expect(onChanged).toHaveBeenCalledTimes(2);
	});

	it('si el borrado se aplicó pero su respuesta se perdió, el 404 del reintento quita el adjunto y refresca', async () => {
		const onChanged = vi.fn();
		const { result } = renderHook(() =>
			useDocumentAttachments({
				subsidiaryId: SUBSIDIARY_A,
				documentId: DRAFT_INVOICE_ID,
				canUpload: true,
				canDelete: true,
				onChanged,
			}),
		);
		await waitFor(() => expect(result.current.loading).toBe(false));
		await act(async () => {
			await result.current.addFiles(asFileList([pdfFile('perdido.pdf')]));
		});
		await waitFor(() => expect(result.current.attachments).toHaveLength(1));
		const [uploaded] = result.current.attachments;
		onChanged.mockClear();

		// El servidor elimina el archivo, pero la respuesta no llega al navegador.
		const originalDelete = purchaseDocumentAttachmentsService.deletePurchaseDocumentAttachment;
		const deleteSpy = vi.spyOn(
			purchaseDocumentAttachmentsService,
			'deletePurchaseDocumentAttachment',
		);
		deleteSpy.mockImplementationOnce((...args) =>
			originalDelete(...args).then(() =>
				Promise.reject(
					Object.assign(new Error('Network Error'), {
						isAxiosError: true,
						code: 'ERR_NETWORK',
					}),
				),
			),
		);
		await act(async () => {
			await result.current.removeAttachment(uploaded);
		});
		expect(toastSpies.error).toHaveBeenCalledTimes(1);
		expect(result.current.attachments).toHaveLength(1);

		await act(async () => {
			await result.current.removeAttachment(uploaded);
		});

		await waitFor(() => expect(result.current.attachments).toEqual([]));
		expect(result.current.remainingQuota).toBe(PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT);
		expect(onChanged).toHaveBeenCalledTimes(1);
		expect(toastSpies.error).toHaveBeenCalledTimes(1);
		expect(toastSpies.info).toHaveBeenCalledWith('El adjunto ya se había eliminado.');
		expect(result.current.deletingId).toBeNull();
		deleteSpy.mockRestore();
	});

	it('no elimina cuando canDelete es false (documento confirmed)', async () => {
		const onChanged = vi.fn();
		const { result } = renderHook(() =>
			useDocumentAttachments({
				subsidiaryId: SUBSIDIARY_A,
				documentId: CONFIRMED_WITH_ATTACHMENT_ID,
				canUpload: true,
				canDelete: false,
				onChanged,
			}),
		);
		await waitFor(() => expect(result.current.attachments).toHaveLength(1));
		const [seeded] = result.current.attachments;

		await act(async () => {
			await result.current.removeAttachment(seeded);
		});

		expect(result.current.attachments).toHaveLength(1);
		expect(onChanged).not.toHaveBeenCalled();
	});

	it('descarga dispara la descarga del navegador con el nombre del adjunto', async () => {
		const createObjectUrl = vi.fn(() => 'blob:factura-1234');
		const revokeObjectUrl = vi.fn();
		const click = vi.fn();
		vi.stubGlobal('URL', {
			createObjectURL: createObjectUrl,
			revokeObjectURL: revokeObjectUrl,
		});
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(click);

		const { result } = renderHook(() =>
			useDocumentAttachments({
				subsidiaryId: SUBSIDIARY_A,
				documentId: CONFIRMED_WITH_ATTACHMENT_ID,
				canUpload: true,
				canDelete: false,
				onChanged: vi.fn(),
			}),
		);
		await waitFor(() => expect(result.current.attachments).toHaveLength(1));
		const [seeded] = result.current.attachments;

		await act(async () => {
			await result.current.downloadAttachment(seeded);
		});

		expect(createObjectUrl).toHaveBeenCalledTimes(1);
		expect(click).toHaveBeenCalledTimes(1);
		// `revokeObjectURL` corre en un `setTimeout(0)` real; timers falsos
		// bloquearían el propio `waitFor`.
		await waitFor(() => expect(revokeObjectUrl).toHaveBeenCalledTimes(1));

		vi.unstubAllGlobals();
	});

	it('un fallo de descarga avisa por toast sin romper', async () => {
		const { result } = renderHook(() =>
			useDocumentAttachments({
				subsidiaryId: SUBSIDIARY_A,
				documentId: CONFIRMED_WITH_ATTACHMENT_ID,
				canUpload: true,
				canDelete: false,
				onChanged: vi.fn(),
			}),
		);
		await waitFor(() => expect(result.current.attachments).toHaveLength(1));

		await act(async () => {
			// id inexistente: el servicio responde 404.
			await result.current.downloadAttachment({
				id: 9999,
				file_name: 'fantasma.pdf',
				mime_type: 'application/pdf',
				size: 10,
				created_at: new Date().toISOString(),
			});
		});

		expect(toastSpies.error).toHaveBeenCalledWith('El adjunto no existe en este documento.');
	});
});
