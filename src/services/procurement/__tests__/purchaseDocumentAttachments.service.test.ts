import { afterEach, describe, expect, it } from 'vitest';
import {
	deletePurchaseDocumentAttachment,
	downloadPurchaseDocumentAttachment,
	listPurchaseDocumentAttachments,
	resetPurchaseDocumentAttachmentsStoreForTests,
	uploadPurchaseDocumentAttachment,
} from '@/services/procurement/purchaseDocumentAttachments.service';
import {
	getPurchaseDocument,
	resetPurchaseDocumentsStoreForTests,
} from '@/services/procurement/purchaseDocuments.service';
import { PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT } from '@/interface/procurement.interface';

/**
 * El servicio simula la subsección «Adjuntos privados» de la sección 6 del
 * contrato (`/purchase-documents/{document}/attachments`). Estas pruebas
 * verifican la simulación de las reglas del contrato — tipo/tamaño/cupo,
 * estados permitidos, ausencia de URL pública, aislamiento por filial — no
 * el fixture en sí, que ya cubre `procurement.db.test.ts`.
 */

const SUBSIDIARY_A = 4;
const SUBSIDIARY_B = 9;

// IDs literales de `procurement.db.ts`.
const CONFIRMED_WITH_ATTACHMENT_ID = 24; // pcExpressInvoiceDocument
const DRAFT_INVOICE_ID = 42; // draftInvoiceDocument
const CANCELLED_ID = 50; // cancelledInvoiceDocument

const readErrorData = async (promise: Promise<unknown>) => {
	try {
		await promise;
		throw new Error('Se esperaba que la promesa rechazara');
	} catch (error) {
		return (error as { response: { status: number; data: Record<string, unknown> } }).response;
	}
};

const pdfFile = (name = 'respaldo.pdf', size?: number): File => {
	const content = size !== undefined ? new Uint8Array(size) : ['contenido de prueba'];
	return new File([content as BlobPart], name, { type: 'application/pdf' });
};

afterEach(() => {
	resetPurchaseDocumentAttachmentsStoreForTests();
	resetPurchaseDocumentsStoreForTests();
});

describe('listPurchaseDocumentAttachments', () => {
	it('lista el adjunto semilla del documento confirmado y 404 si el documento no existe', async () => {
		const result = await listPurchaseDocumentAttachments(
			SUBSIDIARY_A,
			CONFIRMED_WITH_ATTACHMENT_ID,
		);
		expect(result.data).toHaveLength(1);
		expect(result.data[0]).toMatchObject({
			file_name: 'factura-1234.pdf',
			mime_type: 'application/pdf',
		});
		expect(result.meta.total).toBe(1);

		const { status } = await readErrorData(listPurchaseDocumentAttachments(SUBSIDIARY_A, 9999));
		expect(status).toBe(404);
	});

	it('un documento sin adjuntos lista vacío, no un hueco', async () => {
		const result = await listPurchaseDocumentAttachments(SUBSIDIARY_A, DRAFT_INVOICE_ID);
		expect(result.data).toEqual([]);
		expect(result.meta.total).toBe(0);
	});

	it('ningún adjunto ni ningún envoltorio trae una clave de URL pública', async () => {
		const result = await listPurchaseDocumentAttachments(
			SUBSIDIARY_A,
			CONFIRMED_WITH_ATTACHMENT_ID,
		);
		expect(Object.keys(result.data[0])).not.toContain('url');
	});

	it('aísla el store por filial: subir en A no aparece en B', async () => {
		await uploadPurchaseDocumentAttachment(SUBSIDIARY_A, DRAFT_INVOICE_ID, pdfFile());

		const inA = await listPurchaseDocumentAttachments(SUBSIDIARY_A, DRAFT_INVOICE_ID);
		const inB = await listPurchaseDocumentAttachments(SUBSIDIARY_B, DRAFT_INVOICE_ID);
		expect(inA.data).toHaveLength(1);
		expect(inB.data).toHaveLength(0);
	});
});

describe('uploadPurchaseDocumentAttachment', () => {
	it('sube en draft y refleja el conteo en related_counts.attachments del documento', async () => {
		const { data } = await uploadPurchaseDocumentAttachment(
			SUBSIDIARY_A,
			DRAFT_INVOICE_ID,
			pdfFile('nueva-factura.pdf'),
		);
		expect(data.file_name).toBe('nueva-factura.pdf');

		const { data: document } = await getPurchaseDocument(SUBSIDIARY_A, DRAFT_INVOICE_ID);
		expect(document.related_counts.attachments).toBe(1);
	});

	it('sube también en confirmed', async () => {
		const { data } = await uploadPurchaseDocumentAttachment(
			SUBSIDIARY_A,
			CONFIRMED_WITH_ATTACHMENT_ID,
			pdfFile('segundo-respaldo.pdf'),
		);
		expect(data.file_name).toBe('segundo-respaldo.pdf');
	});

	it('rechaza en cancelled con 409', async () => {
		const { status, data } = await readErrorData(
			uploadPurchaseDocumentAttachment(SUBSIDIARY_A, CANCELLED_ID, pdfFile()),
		);
		expect(status).toBe(409);
		expect(data.code).toBe('PURCHASE_DOCUMENT_ATTACHMENT_NOT_ALLOWED');
	});

	it('rechaza un tipo no permitido con 422 y error de campo', async () => {
		const file = new File(['contenido'], 'planilla.xlsx', {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		});
		const { status, data } = await readErrorData(
			uploadPurchaseDocumentAttachment(SUBSIDIARY_A, DRAFT_INVOICE_ID, file),
		);
		expect(status).toBe(422);
		expect(data.code).toBe('PURCHASE_DOCUMENT_ATTACHMENT_TYPE_INVALID');
		expect(data.errors).toEqual({ file: [expect.any(String)] });
	});

	it('rechaza más de 10 MB con 422', async () => {
		const { status, data } = await readErrorData(
			uploadPurchaseDocumentAttachment(
				SUBSIDIARY_A,
				DRAFT_INVOICE_ID,
				pdfFile('grande.pdf', 10 * 1024 * 1024 + 1),
			),
		);
		expect(status).toBe(422);
		expect(data.code).toBe('PURCHASE_DOCUMENT_ATTACHMENT_TOO_LARGE');
	});

	it('con el cupo lleno, la siguiente subida recibe 422 de cupo', async () => {
		for (let index = 0; index < PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT; index += 1) {
			// eslint-disable-next-line no-await-in-loop -- cada subida depende del cupo dejado por la anterior.
			await uploadPurchaseDocumentAttachment(
				SUBSIDIARY_A,
				DRAFT_INVOICE_ID,
				pdfFile(`adjunto-${index}.pdf`),
			);
		}

		const { status, data } = await readErrorData(
			uploadPurchaseDocumentAttachment(SUBSIDIARY_A, DRAFT_INVOICE_ID, pdfFile('once.pdf')),
		);
		expect(status).toBe(422);
		expect(data.code).toBe('PURCHASE_DOCUMENT_ATTACHMENT_QUOTA_EXCEEDED');
	});

	it('dos subidas concurrentes contra el cupo justo no pasan ambas: se encolan por documento', async () => {
		for (let index = 0; index < PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT - 1; index += 1) {
			// eslint-disable-next-line no-await-in-loop -- mismo motivo que arriba.
			await uploadPurchaseDocumentAttachment(
				SUBSIDIARY_A,
				DRAFT_INVOICE_ID,
				pdfFile(`adjunto-${index}.pdf`),
			);
		}

		const [first, second] = await Promise.allSettled([
			uploadPurchaseDocumentAttachment(
				SUBSIDIARY_A,
				DRAFT_INVOICE_ID,
				pdfFile('penultimo.pdf'),
			),
			uploadPurchaseDocumentAttachment(SUBSIDIARY_A, DRAFT_INVOICE_ID, pdfFile('ultimo.pdf')),
		]);

		const outcomes = [first.status, second.status].sort();
		expect(outcomes).toEqual(['fulfilled', 'rejected']);

		const { data: document } = await getPurchaseDocument(SUBSIDIARY_A, DRAFT_INVOICE_ID);
		expect(document.related_counts.attachments).toBe(PURCHASE_DOCUMENT_ATTACHMENT_MAX_COUNT);
	});

	it('reintentar con la misma Idempotency-Key devuelve el mismo resultado sin duplicar', async () => {
		const key = 'upload-key-1';
		const first = await uploadPurchaseDocumentAttachment(
			SUBSIDIARY_A,
			DRAFT_INVOICE_ID,
			pdfFile('idempotente.pdf'),
			{ idempotencyKey: key },
		);
		const second = await uploadPurchaseDocumentAttachment(
			SUBSIDIARY_A,
			DRAFT_INVOICE_ID,
			pdfFile('idempotente.pdf'),
			{ idempotencyKey: key },
		);
		expect(second.data.id).toBe(first.data.id);

		const listed = await listPurchaseDocumentAttachments(SUBSIDIARY_A, DRAFT_INVOICE_ID);
		expect(listed.data).toHaveLength(1);
	});
});

describe('downloadPurchaseDocumentAttachment', () => {
	it('devuelve el binario, nombre y tipo del adjunto semilla, en cualquier estado', async () => {
		const result = await downloadPurchaseDocumentAttachment(
			SUBSIDIARY_A,
			CONFIRMED_WITH_ATTACHMENT_ID,
			1,
		);
		expect(result.fileName).toBe('factura-1234.pdf');
		expect(result.mimeType).toBe('application/pdf');
		expect(result.blob).toBeInstanceOf(Blob);
		expect(result.blob.size).toBeGreaterThan(0);
	});

	it('404 si el adjunto no existe o no pertenece al documento', async () => {
		const { status } = await readErrorData(
			downloadPurchaseDocumentAttachment(SUBSIDIARY_A, CONFIRMED_WITH_ATTACHMENT_ID, 9999),
		);
		expect(status).toBe(404);

		const { data: uploaded } = await uploadPurchaseDocumentAttachment(
			SUBSIDIARY_A,
			DRAFT_INVOICE_ID,
			pdfFile(),
		);
		const { status: crossDocumentStatus } = await readErrorData(
			downloadPurchaseDocumentAttachment(
				SUBSIDIARY_A,
				CONFIRMED_WITH_ATTACHMENT_ID,
				uploaded.id,
			),
		);
		expect(crossDocumentStatus).toBe(404);
	});
});

describe('deletePurchaseDocumentAttachment', () => {
	it('elimina en draft y decrementa related_counts.attachments', async () => {
		const { data: uploaded } = await uploadPurchaseDocumentAttachment(
			SUBSIDIARY_A,
			DRAFT_INVOICE_ID,
			pdfFile(),
		);

		await deletePurchaseDocumentAttachment(SUBSIDIARY_A, DRAFT_INVOICE_ID, uploaded.id);

		const listed = await listPurchaseDocumentAttachments(SUBSIDIARY_A, DRAFT_INVOICE_ID);
		expect(listed.data).toEqual([]);
		const { data: document } = await getPurchaseDocument(SUBSIDIARY_A, DRAFT_INVOICE_ID);
		expect(document.related_counts.attachments).toBe(0);
	});

	it('rechaza en confirmed con 409, sin eliminar nada', async () => {
		const { status, data } = await readErrorData(
			deletePurchaseDocumentAttachment(SUBSIDIARY_A, CONFIRMED_WITH_ATTACHMENT_ID, 1),
		);
		expect(status).toBe(409);
		expect(data.code).toBe('PURCHASE_DOCUMENT_ATTACHMENT_DELETE_NOT_DRAFT');

		const listed = await listPurchaseDocumentAttachments(
			SUBSIDIARY_A,
			CONFIRMED_WITH_ATTACHMENT_ID,
		);
		expect(listed.data).toHaveLength(1);
	});

	it('404 si el adjunto no existe en ese documento', async () => {
		const { status } = await readErrorData(
			deletePurchaseDocumentAttachment(SUBSIDIARY_A, DRAFT_INVOICE_ID, 9999),
		);
		expect(status).toBe(404);
	});
});
