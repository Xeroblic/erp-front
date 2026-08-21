import { describe, it, expect } from 'vitest';
import { normalizeCommunePayload, extractMediaUrl, validateFile } from '@/utils/apiHelpers';

describe('apiHelpers', () => {
	it('normalizeCommunePayload handles various fields', () => {
		const input = { comuna: { id: 6307 }, other: 1 } as any;
		const out = normalizeCommunePayload(input);
		expect(out.commune_id).toBe(6307);

		const input2 = { commune: { value: '123' } } as any;
		const out2 = normalizeCommunePayload(input2);
		expect(out2.commune_id).toBe(123);

		const input3 = { commune_id: '' } as any;
		const out3 = normalizeCommunePayload(input3);
		expect(out3.commune_id).toBeNull();
	});

	it('extractMediaUrl picks correct url from payload shapes', () => {
		const a = { url: '/uploads/foo.jpg' } as any;
		const r = extractMediaUrl(a);
		expect(r).toContain('uploads');

		const b = [{ thumb: '/thumb.jpg' }];
		const r2 = extractMediaUrl(b as any);
		expect(r2).toContain('thumb');
	});

	it('validateFile rejects oversized and wrong mime', () => {
		const small = new File([new ArrayBuffer(10)], 'small.png', { type: 'image/png' });
		expect(validateFile(small, { maxKB: 1 })).toEqual({ ok: true });

		const big = new File([new ArrayBuffer(1024 * 1024 * 2)], 'big.png', { type: 'image/png' });
		const res = validateFile(big, { maxKB: 100 });
		expect(res.ok).toBe(false);

		const svg = new File([new ArrayBuffer(10)], 'f.svg', { type: 'image/svg+xml' });
		const res2 = validateFile(svg, { allowedMimes: ['image/png'] });
		expect(res2.ok).toBe(false);
	});
});
