import { describe, it, expect } from 'vitest';
import { normalizeCommunePayload, extractMediaUrl } from '@/utils/apiHelpers';

describe('apiHelpers', () => {
    it('normalizeCommunePayload converts commune objects and keys to commune_id number or null', () => {
        expect(normalizeCommunePayload({ commune: { id: 12 } })).toEqual({ commune_id: 12 });
        expect(normalizeCommunePayload({ comuna: '45' })).toEqual({ commune_id: 45 });
        expect(normalizeCommunePayload({ commune_id: '33' })).toEqual({ commune_id: 33 });
        expect(normalizeCommunePayload({ commune: null })).toEqual({ commune_id: null });
    });

    it('extractMediaUrl picks url from various payload shapes', () => {
        const obj = { url: 'http://example.com/a.jpg' };
        expect(extractMediaUrl(obj)).toBe('http://example.com/a.jpg');

        const arr = [{ original_url: 'http://example.com/b.jpg' }];
        expect(extractMediaUrl(arr)).toBe('http://example.com/b.jpg');

        const media = { data: [{ full_url: 'http://example.com/c.jpg' }] };
        expect(extractMediaUrl(media)).toBe('http://example.com/c.jpg');
    });
});
