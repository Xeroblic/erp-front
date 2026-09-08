import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as purchaseDocumentAttachmentsService from '@/services/procurement/purchaseDocumentAttachments.service';
import {
	resetPurchaseDocumentAttachmentsStoreForTests,
	uploadPurchaseDocumentAttachment,
} from '@/services/procurement/purchaseDocumentAttachments.service';
import { resetPurchaseDocumentsStoreForTests } from '@/services/procurement/purchaseDocuments.service';
import { PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT } from '@/interface/procurement.interface';
import useDocumentAttachments from '../useDocumentAttachments';

/**
 * `useDocumentAttachments` es el único lugar que decide, del lado del
 * cliente, si un archivo se sube antes de golpear el servicio mock (sección
 * 6: «los límites se muestran antes de intentar subir, no sólo cuando el
 * servidor rechaza»). Estas pruebas verifican esa decisión y el ciclo
 * subir/descargar/eliminar, no las reglas del servicio — esas ya las cubre
 * `purchaseDocumentAttachments.service.test.ts`.
 */

const toastSpies = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
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
		// `addFiles` no espera al refetch que dispara al terminar: la lista se
		// actualiza en un efecto aparte, así que se espera por su resultado.
		await waitFor(() => expect(result.current.attachments).toHaveLength(1));

		expect(result.current.attachments[0].file_name).toBe('nueva-factura.pdf');
		expect(result.current.uploadError).toBeNull();
		expect(onChanged).toHaveBeenCalledTimes(1);
	});

	it('si la tanda falla a mitad de camino, refresca igual lo que sí se subió', async () => {
		// Simula un 422 del servidor en el segundo archivo de la tanda (por
		// ejemplo, otra pestaña agotó el cupo entre el chequeo del cliente y
		// esta subida). Sin el fix, la lista se quedaba sin el primer archivo
		// —que sí se guardó en el store mock— hasta el próximo refresco manual.
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
		expect(result.current.uploadError).toContain(
			'Este documento ya tiene 10 adjuntos, el máximo permitido.',
		);
		expect(onChanged).toHaveBeenCalledTimes(1);

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
		// El `revokeObjectURL` corre en un `setTimeout(0)` real, aparte del
		// `act` de arriba: se espera su resultado en vez de forzar timers
		// falsos, que bloquearían el propio `waitFor` de esta prueba.
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
