import { describe, expect, it } from 'vitest';
import type { IPurchaseDocument, IStockReceipt } from '@/interface/procurement.interface';
import { buildLinkMapping } from '../linkPurchaseDocumentMapping';

const receiptOf = (lines: [id: number, productId: number, quantity: number][]) =>
	({
		items: lines.map(([id, productId, quantity]) => ({
			id,
			product: { id: productId },
			quantity,
		})),
	}) as unknown as Pick<IStockReceipt, 'items'>;

const documentOf = (lines: [id: number, productId: number, remaining: number][]) =>
	({
		items: lines.map(([id, productId, remaining]) => ({
			id,
			product: { id: productId },
			remaining_quantity: remaining,
		})),
	}) as unknown as Pick<IPurchaseDocument, 'items'>;

describe('buildLinkMapping', () => {
	it('encuentra la asignación válida aunque el primer par que cabe la bloquee (3 y 5 contra 5 y 3)', () => {
		const mapping = buildLinkMapping(
			receiptOf([
				[301, 31, 3],
				[302, 31, 5],
			]),
			documentOf([
				[101, 31, 5],
				[102, 31, 3],
			]),
		);

		expect(mapping.unmatched.size).toBe(0);
		expect(mapping.items).toEqual([
			{ stock_receipt_line_id: 301, purchase_document_line_id: 102 },
			{ stock_receipt_line_id: 302, purchase_document_line_id: 101 },
		]);
	});

	it('suma dos líneas de la recepción en una sola línea del documento si lo pendiente alcanza', () => {
		const mapping = buildLinkMapping(
			receiptOf([
				[301, 31, 4],
				[302, 31, 6],
			]),
			documentOf([[101, 31, 10]]),
		);

		expect(mapping.unmatched.size).toBe(0);
		expect(mapping.items).toEqual([
			{ stock_receipt_line_id: 301, purchase_document_line_id: 101 },
			{ stock_receipt_line_id: 302, purchase_document_line_id: 101 },
		]);
	});

	it('sin asignación posible marca todas las líneas del producto y no envía ninguna', () => {
		const mapping = buildLinkMapping(
			receiptOf([
				[301, 31, 4],
				[302, 31, 4],
			]),
			documentOf([
				[101, 31, 5],
				[102, 31, 3],
			]),
		);

		expect(mapping.items).toEqual([]);
		expect([...mapping.unmatched]).toEqual([
			[301, 'no_capacity'],
			[302, 'no_capacity'],
		]);
	});

	it('cada producto se asigna a sus propias líneas, y uno sin línea en el documento no arrastra al otro', () => {
		const mapping = buildLinkMapping(
			receiptOf([
				[301, 31, 2],
				[302, 58, 7],
				[303, 99, 1],
			]),
			documentOf([
				[101, 58, 7],
				[102, 31, 2],
			]),
		);

		expect(mapping.items).toEqual([
			{ stock_receipt_line_id: 301, purchase_document_line_id: 102 },
			{ stock_receipt_line_id: 302, purchase_document_line_id: 101 },
		]);
		expect([...mapping.unmatched]).toEqual([[303, 'no_line']]);
	});

	it('respeta la línea que eligió el usuario y reparte el resto con lo que queda', () => {
		const receipt = receiptOf([
			[301, 31, 3],
			[302, 31, 5],
		]);
		const document = documentOf([
			[101, 31, 8],
			[102, 31, 5],
		]);

		const mapping = buildLinkMapping(receipt, document, new Map([[302, 102]]));

		expect(mapping.unmatched.size).toBe(0);
		expect(mapping.items).toEqual([
			{ stock_receipt_line_id: 301, purchase_document_line_id: 101 },
			{ stock_receipt_line_id: 302, purchase_document_line_id: 102 },
		]);
	});

	it('una elección que se pasa de lo pendiente se marca en vez de corregirse', () => {
		const mapping = buildLinkMapping(
			receiptOf([
				[301, 31, 3],
				[302, 31, 5],
			]),
			documentOf([
				[101, 31, 5],
				[102, 31, 3],
			]),
			new Map([[302, 102]]),
		);

		expect(mapping.assignment.get(302)).toBe(102);
		expect(mapping.unmatched.get(302)).toBe('no_capacity');
		expect(mapping.items.some((item) => item.stock_receipt_line_id === 302)).toBe(false);
	});

	it('ignora una elección de una línea de otro producto', () => {
		const mapping = buildLinkMapping(
			receiptOf([[301, 31, 3]]),
			documentOf([
				[101, 58, 9],
				[102, 31, 3],
			]),
			new Map([[301, 101]]),
		);

		expect(mapping.items).toEqual([
			{ stock_receipt_line_id: 301, purchase_document_line_id: 102 },
		]);
	});
});
