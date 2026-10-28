import type { PropsWithChildren, ReactElement } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import subEmpresa, { fetchSubsidiariaDetail } from '@/store/slices/subempresa/subEmpresaSlice';
import { useSubsidiaryRolloutStage } from '@/hooks/useSubsidiaryRolloutStage';

const context = vi.hoisted((): { subsidiaryId: number | null } => ({ subsidiaryId: 2 }));
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ branchId: 4, subsidiaryId: context.subsidiaryId }),
}));

/** Backend falso de `GET /subsidiaries/{id}`: etapa por filial, o una respuesta propia. */
const api = vi.hoisted(
	(): {
		stages: Record<number, boolean | undefined>;
		respond: ((id: number) => Promise<unknown>) | null;
		calls: string[];
	} => ({ stages: {}, respond: null, calls: [] }),
);
vi.mock('@/services/ApiService', () => ({
	default: {
		fetchData: ({ url }: { url: string }) => {
			api.calls.push(url);
			const id = Number(url.split('/').pop());
			if (api.respond) return api.respond(id);
			const stage = api.stages[id];
			const data =
				stage === undefined
					? { id, subsidiary_name: `Filial ${id}` }
					: { id, subsidiary_name: `Filial ${id}`, multi_location_enabled: stage };
			return Promise.resolve({ data: { data } });
		},
	},
}));

const setup = () => {
	const store = configureStore({ reducer: { subEmpresa } });
	const Wrapper = ({ children }: PropsWithChildren): ReactElement => (
		<Provider store={store}>{children}</Provider>
	);
	return { store, Wrapper };
};

beforeEach(() => {
	context.subsidiaryId = 2;
	api.stages = { 2: false, 3: true };
	api.respond = null;
	api.calls = [];
});
afterEach(() => vi.restoreAllMocks());

describe('useSubsidiaryRolloutStage', () => {
	it('filial en la etapa 1: multi-ubicación apagada', async () => {
		const { Wrapper } = setup();
		const { result } = renderHook(() => useSubsidiaryRolloutStage(), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current).toEqual({
			multiLocationEnabled: false,
			isMultiLocation: false,
			isLoading: false,
		});
		expect(api.calls).toEqual(['/subsidiaries/2']);
	});

	it('filial en la etapa 2: multi-ubicación encendida', async () => {
		context.subsidiaryId = 3;
		const { Wrapper } = setup();
		const { result } = renderHook(() => useSubsidiaryRolloutStage(), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.isMultiLocation).toBe(true));
		expect(result.current.multiLocationEnabled).toBe(true);
	});

	it('mientras carga se comporta como la etapa 1', () => {
		// Una lectura que nunca responde.
		api.respond = () =>
			new Promise(() => {
				/* pendiente */
			});
		const { Wrapper } = setup();
		const { result } = renderHook(() => useSubsidiaryRolloutStage(), { wrapper: Wrapper });

		expect(result.current).toEqual({
			multiLocationEnabled: null,
			isMultiLocation: false,
			isLoading: true,
		});
	});

	it('si la lectura falla o no trae el campo, la etapa queda desconocida (etapa 1)', async () => {
		api.respond = () => Promise.reject(new Error('500'));
		const failed = setup();
		const { result: failure } = renderHook(() => useSubsidiaryRolloutStage(), {
			wrapper: failed.Wrapper,
		});
		await waitFor(() => expect(failure.current.isLoading).toBe(false));
		expect(failure.current.multiLocationEnabled).toBeNull();
		expect(failure.current.isMultiLocation).toBe(false);

		api.respond = null;
		api.stages = { 2: undefined };
		const missing = setup();
		const { result: noField } = renderHook(() => useSubsidiaryRolloutStage(), {
			wrapper: missing.Wrapper,
		});
		await waitFor(() => expect(noField.current.isLoading).toBe(false));
		expect(noField.current.multiLocationEnabled).toBeNull();
		expect(noField.current.isMultiLocation).toBe(false);
	});

	it('al cambiar de filial sigue la etapa de la nueva', async () => {
		const { Wrapper } = setup();
		const { result, rerender } = renderHook(() => useSubsidiaryRolloutStage(), {
			wrapper: Wrapper,
		});
		await waitFor(() => expect(result.current.multiLocationEnabled).toBe(false));

		context.subsidiaryId = 3;
		rerender();
		// La filial nueva todavía no se conoce: etapa 1 hasta confirmarla.
		expect(result.current.isMultiLocation).toBe(false);
		await waitFor(() => expect(result.current.isMultiLocation).toBe(true));

		// Volver a la primera usa lo ya leído, sin pedirlo otra vez.
		context.subsidiaryId = 2;
		rerender();
		expect(result.current).toEqual({
			multiLocationEnabled: false,
			isMultiLocation: false,
			isLoading: false,
		});
		expect(api.calls).toEqual(['/subsidiaries/2', '/subsidiaries/3']);
	});

	it('una sola petición por filial aunque varias pantallas la lean a la vez', async () => {
		const { Wrapper } = setup();
		const { result } = renderHook(
			() => [useSubsidiaryRolloutStage(), useSubsidiaryRolloutStage(2)] as const,
			{ wrapper: Wrapper },
		);
		await waitFor(() => expect(result.current[0].isLoading).toBe(false));
		expect(result.current[1].multiLocationEnabled).toBe(false);
		expect(api.calls).toEqual(['/subsidiaries/2']);
	});

	it('acepta una filial explícita y no pide nada sin filial', async () => {
		const { Wrapper } = setup();
		const { result } = renderHook(() => useSubsidiaryRolloutStage(3), { wrapper: Wrapper });
		await waitFor(() => expect(result.current.isMultiLocation).toBe(true));

		const none = setup();
		const { result: noSubsidiary } = renderHook(() => useSubsidiaryRolloutStage(null), {
			wrapper: none.Wrapper,
		});
		expect(noSubsidiary.current).toEqual({
			multiLocationEnabled: null,
			isMultiLocation: false,
			isLoading: false,
		});
		expect(api.calls).toEqual(['/subsidiaries/3']);
	});

	it('reutiliza la etapa que ya trajo el detalle de la filial', async () => {
		const { store, Wrapper } = setup();
		await store.dispatch(fetchSubsidiariaDetail(3));
		const { result } = renderHook(() => useSubsidiaryRolloutStage(3), { wrapper: Wrapper });

		expect(result.current.isMultiLocation).toBe(true);
		expect(api.calls).toEqual(['/subsidiaries/3']);
	});
});
