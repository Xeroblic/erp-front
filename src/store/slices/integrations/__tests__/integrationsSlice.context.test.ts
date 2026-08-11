import { describe, expect, it } from 'vitest';
import type { Integration } from '@/types/integrations.types';
import integrationsReducer, { fetchIntegrations } from '../integrationsSlice';

const integration = (subsidiaryId: number): Integration => ({
	id: `woo-${subsidiaryId}`,
	subsidiary_id: subsidiaryId,
	name: 'WooCommerce',
	provider: 'woocommerce',
	base_url: 'https://woo.example.test',
	mode: 'read',
	is_active: true,
	scopes: null,
	allowed_ips: null,
	params: null,
	api_key_prefix: 'key',
	has_api_key: true,
	has_consumer_secret: true,
	has_api_token: false,
	has_webhook_secret: false,
	last_success_at: null,
	last_error_at: null,
	last_error_msg: null,
	created_at: '2026-08-11T00:00:00Z',
	updated_at: '2026-08-11T00:00:00Z',
});

describe('integrationsSlice contexto organizacional', () => {
	it('vacía la lista en transición y descarta una respuesta de otra subsidiaria', () => {
		const firstArg = { subsidiaryId: 1 };
		const secondArg = { subsidiaryId: 2 };
		let state = integrationsReducer(undefined, fetchIntegrations.pending('first', firstArg));
		state = integrationsReducer(
			state,
			fetchIntegrations.fulfilled([integration(1)], 'first', firstArg),
		);
		state = integrationsReducer(state, fetchIntegrations.pending('second', secondArg));

		expect(state).toMatchObject({
			integrations: [],
			listSubsidiaryId: 2,
			loading: true,
		});

		state = integrationsReducer(
			state,
			fetchIntegrations.fulfilled([integration(1)], 'first', firstArg),
		);

		expect(state.integrations).toEqual([]);
		expect(state.listSubsidiaryId).toBe(2);
		expect(state.loading).toBe(true);

		state = integrationsReducer(
			state,
			fetchIntegrations.rejected(new Error('fallo A'), 'first', firstArg, 'fallo A'),
		);

		expect(state.error).toBeNull();
		expect(state.loading).toBe(true);
	});
});
