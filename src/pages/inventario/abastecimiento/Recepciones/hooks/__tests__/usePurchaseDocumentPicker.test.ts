import { describe, expect, it, vi } from 'vitest';
import type { IPurchaseDocumentListRow } from '@/interface/procurement.interface';
import * as purchaseDocumentsApi from '@/services/procurement/purchaseDocuments.service';
import { listAllConfirmedDocuments } from '../usePurchaseDocumentPicker';

/**
 * El listado de documentos pagina de a 100: el selector del alta «con
 * documento» tiene que recorrer todas las páginas, o el documento 101 no se
 * podría elegir.
 */

vi.mock('@/services/procurement/purchaseDocuments.service', () => ({
	listPurchaseDocuments: vi.fn(),
	getPurchaseDocument: vi.fn(),
}));

const listMock = vi.mocked(purchaseDocumentsApi.listPurchaseDocuments);

const row = (id: number) => ({ id }) as IPurchaseDocumentListRow;

const page = (ids: number[], lastPage: number) =>
	({
		data: ids.map(row),
		links: { first: null, last: null, prev: null, next: null },
		meta: {
			current_page: 1,
			from: 1,
			last_page: lastPage,
			links: [],
			path: '',
			per_page: 100,
			to: 1,
			total: 0,
		},
	}) as Awaited<ReturnType<typeof purchaseDocumentsApi.listPurchaseDocuments>>;

describe('listAllConfirmedDocuments', () => {
	it('recorre todas las páginas de documentos confirmados', async () => {
		const firstPage = Array.from({ length: 100 }, (_, index) => index + 1);
		listMock.mockImplementation((_subsidiaryId, params) =>
			Promise.resolve(params?.page === 2 ? page([101], 2) : page(firstPage, 2)),
		);

		const rows = await listAllConfirmedDocuments(purchaseDocumentsApi, 4);

		expect(rows).toHaveLength(101);
		expect(rows.at(-1)?.id).toBe(101);
		expect(listMock).toHaveBeenCalledWith(4, { status: 'confirmed', per_page: 100, page: 1 });
		expect(listMock).toHaveBeenCalledWith(4, { status: 'confirmed', per_page: 100, page: 2 });
	});

	it('con una sola página no pide más', async () => {
		listMock.mockReset();
		listMock.mockResolvedValue(page([7], 1));

		const rows = await listAllConfirmedDocuments(purchaseDocumentsApi, 4);

		expect(rows.map((document) => document.id)).toEqual([7]);
		expect(listMock).toHaveBeenCalledTimes(1);
	});
});
