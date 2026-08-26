import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'react-toastify';
import * as channelsService from '@/services/productChannelsService';
import {
	useChannelNameMutation,
	useChannelPriceMutation,
	useChannelVisibilityMutation,
} from '@/services/hooks/useProductChannelOverrides';

vi.mock('react-toastify', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/services/productChannelsService', () => ({
	updateChannelPrice: vi.fn(),
	updateChannelName: vi.fn(),
	updateChannelVisibility: vi.fn(),
}));

const BUSINESS_MESSAGE = 'El canal no pertenece a la misma subsidiaria que el producto.';
const apiError = { response: { status: 422, data: { message: BUSINESS_MESSAGE } } };

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
	});

	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe('mutaciones de override por canal', () => {
	beforeEach(() => vi.clearAllMocks());

	it('muestra el message del 422 al actualizar precio', async () => {
		vi.mocked(channelsService.updateChannelPrice).mockRejectedValue(apiError);
		const { result } = renderHook(() => useChannelPriceMutation(7, 21), {
			wrapper: createWrapper(),
		});

		act(() => result.current.mutate({ integration_id: 'woo-1', price_override: 1000 }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith(BUSINESS_MESSAGE));
	});

	it('muestra el message del 422 al actualizar nombre', async () => {
		vi.mocked(channelsService.updateChannelName).mockRejectedValue(apiError);
		const { result } = renderHook(() => useChannelNameMutation(7, 21), {
			wrapper: createWrapper(),
		});

		act(() => result.current.mutate({ integration_id: 'woo-1', name_override: 'Nombre' }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith(BUSINESS_MESSAGE));
	});

	it('muestra el message del 422 al actualizar visibilidad', async () => {
		vi.mocked(channelsService.updateChannelVisibility).mockRejectedValue(apiError);
		const { result } = renderHook(() => useChannelVisibilityMutation(7, 21), {
			wrapper: createWrapper(),
		});

		act(() => result.current.mutate({ integration_id: 'woo-1', visibility: 'private' }));

		await waitFor(() => expect(toast.error).toHaveBeenCalledWith(BUSINESS_MESSAGE));
	});
});
