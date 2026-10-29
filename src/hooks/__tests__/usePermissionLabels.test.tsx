import { describe, it, expect, vi, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { Provider } from 'react-redux';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { usePermissionLabels } from '../usePermissionLabels';
import ApiService from '@/services/ApiService';
import permissionsReducer from '@/store/slices/permissions/permissionsSlice';
import { makeIntegrationStore } from '@/test-utils/integrationStore';

let rolesCalls = 0;
let permissionsCalls = 0;

const server = setupServer(
	http.get('*/roles', () => {
		rolesCalls += 1;
		return HttpResponse.json({ data: [] });
	}),
	http.get('*/permissions', () => {
		permissionsCalls += 1;
		return HttpResponse.json({ data: [] });
	}),
);

const makeStore = () => makeIntegrationStore({ permissions: permissionsReducer });

const renderPermissionLabels = (store: ReturnType<typeof makeStore>) => {
	const Wrapper = ({ children }: PropsWithChildren) => (
		<Provider store={store}>{children}</Provider>
	);
	return renderHook(() => usePermissionLabels(), { wrapper: Wrapper });
};

describe('usePermissionLabels', () => {
	beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
	beforeEach(() => {
		rolesCalls = 0;
		permissionsCalls = 0;
		ApiService.clearCache();
	});
	afterEach(() => {
		server.resetHandlers();
		vi.clearAllMocks();
	});
	afterAll(() => server.close());

	it('no reintenta en bucle cuando el catálogo responde vacío (regresión bloqueante)', async () => {
		const store = makeStore();
		renderPermissionLabels(store);

		await waitFor(() => {
			expect(store.getState().permissions.loading.roles).toBe(false);
			expect(store.getState().permissions.loading.permissions).toBe(false);
		});

		// Si la guarda volviera a depender de `loading`/`state.error`, cada fulfilled
		// reabriría el efecto y este margen alcanzaría a capturar varias llamadas más.
		await new Promise((resolve) => {
			setTimeout(resolve, 100);
		});

		expect(rolesCalls).toBe(1);
		expect(permissionsCalls).toBe(1);
	});

	it('no reintenta en bucle cuando el catálogo responde con error (guarda no depende de state.error)', async () => {
		server.use(
			http.get('*/roles', () => {
				rolesCalls += 1;
				return HttpResponse.json({ message: 'Error de servidor' }, { status: 500 });
			}),
		);

		const store = makeStore();
		renderPermissionLabels(store);

		await waitFor(() => {
			expect(store.getState().permissions.loading.roles).toBe(false);
			expect(store.getState().permissions.loading.permissions).toBe(false);
		});

		await new Promise((resolve) => {
			setTimeout(resolve, 100);
		});

		expect(rolesCalls).toBe(1);
		expect(permissionsCalls).toBe(1);
	});
});
