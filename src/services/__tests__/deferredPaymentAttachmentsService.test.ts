import { beforeEach, describe, expect, it, vi } from 'vitest';
import deferredPaymentsService from '@/services/deferredPaymentsService';

const apiSpies = vi.hoisted(() => ({ fetchData: vi.fn(), invalidateCache: vi.fn() }));
vi.mock('@/services/ApiService', () => ({ default: apiSpies }));
describe('ZF-8 servicio de comprobantes', () => {
	beforeEach(() => {
		apiSpies.fetchData.mockReset();
		apiSpies.invalidateCache.mockReset();
	});
	it('sube un único file y deferred_payment_id al endpoint del documento', async () => {
		const attachment = {
			id: 9,
			file_name: 'pago.pdf',
			mime_type: 'application/pdf',
			size: 10,
			url: '/files/9',
		};
		apiSpies.fetchData.mockResolvedValue({ data: { data: attachment } });
		const controller = new AbortController();
		const file = new File(['pago'], 'pago.pdf', { type: 'application/pdf' });
		await expect(
			deferredPaymentsService.uploadDeferredPaymentAttachment(
				4,
				7,
				3,
				file,
				controller.signal,
			),
		).resolves.toEqual(attachment);
		const config = apiSpies.fetchData.mock.calls[0][0] as {
			url: string;
			method: string;
			data: FormData;
			signal: AbortSignal;
		};
		expect(config).toMatchObject({
			url: '/subsidiaries/4/deferred-payments/7/attachments',
			method: 'post',
			signal: controller.signal,
		});
		expect(config.data.getAll('file')).toEqual([file]);
		expect(config.data.get('deferred_payment_id')).toBe('3');
		expect([...config.data.keys()]).toEqual(['file', 'deferred_payment_id']);
	});
	it('descarga la URL autenticada como blob propagando AbortSignal', async () => {
		const blob = new Blob(['contenido'], { type: 'application/pdf' });
		apiSpies.fetchData.mockResolvedValue({
			data: blob,
			headers: {
				'content-disposition': "attachment; filename*=UTF-8''comprobante%20pago.pdf",
			},
		});
		const controller = new AbortController();
		await expect(
			deferredPaymentsService.downloadDeferredPaymentAttachment(
				'/files/9',
				controller.signal,
			),
		).resolves.toEqual({ blob, fileName: 'comprobante pago.pdf' });
		expect(apiSpies.fetchData).toHaveBeenCalledWith({
			url: '/files/9',
			method: 'get',
			responseType: 'blob',
			signal: controller.signal,
		});
	});
});
