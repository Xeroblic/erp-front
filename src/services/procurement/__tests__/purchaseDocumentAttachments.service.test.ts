import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	deletePurchaseDocumentAttachment,
	downloadPurchaseDocumentAttachment,
	listPurchaseDocumentAttachments,
	uploadPurchaseDocumentAttachment,
} from '@/services/procurement/purchaseDocumentAttachments.service';

/**
 * Cableado HTTP de los adjuntos privados: multipart con el
 * campo `file`, descarga como `blob` autenticado y `Idempotency-Key` en subir
 * y eliminar. Las reglas de estado y cupo las cubre el doble en
 * `purchaseDocumentAttachments.mock.test.ts`.
 */

const apiSpies = vi.hoisted(() => ({ fetchData: vi.fn() }));

vi.mock('@/services/ApiService', () => ({ default: apiSpies }));

const BASE = '/subsidiaries/4/procurement/purchase-documents/9/attachments';
const KEY = '3f2a7c1e-9b4d-4e8a-a1c2-5d6e7f8a9b0c';

beforeEach(() => {
	apiSpies.fetchData.mockReset();
});

describe('adjuntos', () => {
	it('lista paginado dentro del documento', async () => {
		const envelope = { data: [], links: {}, meta: { total: 0 } };
		apiSpies.fetchData.mockResolvedValueOnce({ data: envelope });

		const result = await listPurchaseDocumentAttachments(4, 9, { per_page: 10 });

		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: BASE,
			method: 'get',
			params: { per_page: 10 },
		});
		expect(result).toBe(envelope);
	});

	it('sube el archivo en el campo multipart `file` con Idempotency-Key', async () => {
		apiSpies.fetchData.mockResolvedValueOnce({ data: { data: { id: 31 } } });
		const file = new File(['%PDF'], 'factura.pdf', { type: 'application/pdf' });

		const result = await uploadPurchaseDocumentAttachment(4, 9, file, {
			idempotencyKey: KEY,
		});

		const [config] = apiSpies.fetchData.mock.calls[0] as [
			{ url: string; method: string; data: FormData; headers: Record<string, string> },
		];
		expect(config.url).toBe(BASE);
		expect(config.method).toBe('post');
		expect(config.headers).toEqual({ 'Idempotency-Key': KEY });
		expect(config.data.get('file')).toBe(file);
		expect(result).toEqual({ data: { id: 31 } });
	});

	it('descarga como blob y toma el nombre de Content-Disposition', async () => {
		const blob = new Blob(['%PDF'], { type: 'application/pdf' });
		apiSpies.fetchData.mockResolvedValueOnce({
			data: blob,
			headers: {
				'content-disposition': "attachment; filename*=UTF-8''factura%20n%C2%BA1.pdf",
			},
		});

		const result = await downloadPurchaseDocumentAttachment(4, 9, 31);

		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: `${BASE}/31`,
			method: 'get',
			responseType: 'blob',
		});
		expect(result).toEqual({
			blob,
			fileName: 'factura nº1.pdf',
			mimeType: 'application/pdf',
		});
	});

	it('elimina con DELETE e Idempotency-Key', async () => {
		apiSpies.fetchData.mockResolvedValueOnce({ data: '' });

		await deletePurchaseDocumentAttachment(4, 9, 31, { idempotencyKey: KEY });

		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: `${BASE}/31`,
			method: 'delete',
			headers: { 'Idempotency-Key': KEY },
		});
	});
});
