import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import useContextScopedResource from '../useContextScopedResource';
import type { OrganizationalContext } from '../useContextScopedSelection';

const subsidiary = (id: number): OrganizationalContext => ({ type: 'subsidiary', id });

describe('useContextScopedResource', () => {
	it('oculta sincrónicamente datos, meta y error de otra subsidiaria', () => {
		const { result, rerender } = renderHook(
			({ currentContext }) =>
				useContextScopedResource({
					currentContext,
					ownerContext: subsidiary(1),
					data: ['cliente de la subsidiaria 1'],
					meta: { total: 1 },
					loading: false,
					error: 'Error anterior',
					emptyData: [] as string[],
					emptyMeta: null,
				}),
			{ initialProps: { currentContext: subsidiary(1) } },
		);

		expect(result.current).toMatchObject({
			data: ['cliente de la subsidiaria 1'],
			meta: { total: 1 },
			loading: false,
			error: 'Error anterior',
		});

		rerender({ currentContext: subsidiary(2) });

		expect(result.current).toMatchObject({
			data: [],
			meta: null,
			loading: true,
			error: undefined,
			isCurrent: false,
		});
	});
});
