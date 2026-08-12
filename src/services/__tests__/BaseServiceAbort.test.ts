import axios, { type AxiosAdapter } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import BaseService, { cancelAllRequests } from '../BaseService';

const createAbortableAdapter = () => {
	let markStarted: (() => void) | undefined;
	const started = new Promise<void>((resolve) => {
		markStarted = resolve;
	});
	const adapter: AxiosAdapter = (config) => {
		markStarted?.();
		return new Promise((_resolve, reject) => {
			const cancel = () => reject(new axios.CanceledError('Request cancelled'));
			if (config.signal?.aborted) {
				cancel();
				return;
			}
			config.signal?.addEventListener?.('abort', cancel, { once: true });
		});
	};

	return { adapter, started };
};

describe('BaseService cancellation composition', () => {
	const originalAdapter = BaseService.defaults.adapter;

	afterEach(() => {
		BaseService.defaults.adapter = originalAdapter;
		cancelAllRequests();
	});

	it('cancels a request when the caller signal aborts', async () => {
		const { adapter, started } = createAbortableAdapter();
		BaseService.defaults.adapter = adapter;
		const caller = new AbortController();
		const request = BaseService.get('/pending-caller-abort', { signal: caller.signal });
		await started;
		caller.abort();

		await expect(request).rejects.toBeInstanceOf(axios.CanceledError);
	});

	it('cancels a request with its own signal when all requests are cancelled', async () => {
		const { adapter, started } = createAbortableAdapter();
		BaseService.defaults.adapter = adapter;
		const caller = new AbortController();
		const request = BaseService.get('/pending-global-abort', { signal: caller.signal });
		await started;
		cancelAllRequests();

		await expect(request).rejects.toBeInstanceOf(axios.CanceledError);
		expect(caller.signal.aborted).toBe(false);
	});
});
