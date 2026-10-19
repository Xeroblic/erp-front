import React, { useLayoutEffect } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getStockReceipt } from '@/services/procurement/stockReceipts.service';
import stockReceiptsReducer from '@/store/slices/procurement/stockReceiptsSlice';
import useRecepcionDetalle from '@/pages/inventario/abastecimiento/Recepciones/RecepcionDetalle/hooks/useRecepcionDetalle';
import { postedKeyboardStockReceipt } from '@/mocks/db/procurement.db';

const context = vi.hoisted(() => ({ subsidiaryId: 1, branchId: 1, route: '76' }));
vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return { useAppDispatch: redux.useDispatch, useAppSelector: redux.useSelector };
});
vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ ...context, visibleBranches: [] }),
}));
vi.mock('react-router-dom', () => ({
	useParams: () => ({ recepcionId: context.route }),
	useLocation: () => ({ state: null }),
	useNavigate: () => vi.fn(),
}));
vi.mock('@/hooks/useSubsidiaryRolloutStage', () => ({
	useSubsidiaryRolloutStage: () => ({ isMultiLocation: false }),
}));
vi.mock('@/services/procurement/stockReceipts.service', () => ({
	STOCK_RECEIPTS_USE_TEST_SUPPLIERS: false,
	getStockReceipt: vi.fn(() => new Promise(() => {})),
	cancelStockReceipt: vi.fn(),
	createStockReceipt: vi.fn(),
	linkStockReceiptPurchaseDocument: vi.fn(),
	listStockReceipts: vi.fn(),
	postStockReceipt: vi.fn(),
	retryStockReceipt: vi.fn(),
	reverseStockReceipt: vi.fn(),
	updateStockReceipt: vi.fn(),
}));

beforeEach(() => {
	context.subsidiaryId = 1;
	context.branchId = 1;
	context.route = '76';
	vi.mocked(getStockReceipt).mockReset();
	vi.mocked(getStockReceipt).mockImplementation(() => new Promise(() => {}));
});

describe('Auditoría de propiedad de la ficha de recepción', () => {
	it.each(['filial', 'recepción'] as const)(
		'no entrega datos ajenos en el primer commit al cambiar %s',
		(destination) => {
			const initial = stockReceiptsReducer(undefined, { type: 'init' });
			const receipt = {
				...postedKeyboardStockReceipt,
				id: 76,
				subsidiary_id: 1,
				branch_id: 1,
			};
			const store = configureStore({
				reducer: {
					stockReceipts: stockReceiptsReducer,
					auth: (state = { user: { id: 1, first_name: 'Operador' } }) => state,
				},
				preloadedState: {
					stockReceipts: {
						...initial,
						current: receipt,
						currentSubsidiaryId: 1,
						currentId: 76,
						currentEtag: '"A"',
					},
				},
			});
			const commits: {
				active: number;
				receiptOwner: number | null;
				loading: boolean;
				etag: string | null;
			}[] = [];
			const { rerender } = renderHook(
				({ tick }) => {
					void tick;
					const model = useRecepcionDetalle();
					useLayoutEffect(() => {
						commits.push({
							active: context.subsidiaryId,
							receiptOwner: model.receipt?.subsidiary_id ?? null,
							loading: model.loading,
							etag: model.etag,
						});
					});
					return model;
				},
				{
					initialProps: { tick: 0 },
					wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
				},
			);
			expect(commits.some((commit) => commit.receiptOwner === 1)).toBe(true);
			if (destination === 'filial') {
				context.subsidiaryId = 2;
				context.branchId = 2;
			} else context.route = '77';
			const commitCount = commits.length;
			rerender({ tick: 1 });
			const firstB = commits[commitCount];

			expect(firstB).toMatchObject({ receiptOwner: null, loading: true, etag: null });
		},
	);
});

it.each(['éxito', 'rechazo'] as const)(
	'ignora el %s tardío de A y muestra el error propio de B',
	async (outcome) => {
		let resolveA!: (value: Awaited<ReturnType<typeof getStockReceipt>>) => void;
		let rejectA!: (reason: unknown) => void;
		const requestA = new Promise<Awaited<ReturnType<typeof getStockReceipt>>>(
			(resolve, reject) => {
				resolveA = resolve;
				rejectA = reject;
			},
		);
		vi.mocked(getStockReceipt).mockImplementation((subsidiary) =>
			subsidiary === 1 ? requestA : Promise.reject(new Error('Error de B')),
		);
		const store = configureStore({
			reducer: {
				stockReceipts: stockReceiptsReducer,
				auth: (state = { user: { id: 1, first_name: 'Operador' } }) => state,
			},
		});
		const { result, rerender } = renderHook(
			({ tick }) => {
				void tick;
				return useRecepcionDetalle();
			},
			{
				initialProps: { tick: 0 },
				wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
			},
		);
		context.subsidiaryId = 2;
		rerender({ tick: 1 });
		await waitFor(() => expect(result.current.error).toBe('Error de B'));
		await act(async () => {
			if (outcome === 'éxito')
				resolveA({
					data: { ...postedKeyboardStockReceipt, id: 76, subsidiary_id: 1 },
					headers: { etag: '"A"' },
				});
			else rejectA(new Error('Error tardío de A'));
			await Promise.resolve();
		});
		expect(result.current).toMatchObject({
			receipt: null,
			etag: null,
			loading: false,
			error: 'Error de B',
		});
	},
);

it('mantiene la ficha al refrescar el mismo recurso y renueva su ETag', async () => {
	vi.mocked(getStockReceipt).mockResolvedValue({
		data: { ...postedKeyboardStockReceipt, id: 76, subsidiary_id: 1 },
		headers: { etag: '"uno"' },
	});
	const store = configureStore({
		reducer: {
			stockReceipts: stockReceiptsReducer,
			auth: (state = { user: { id: 1, first_name: 'Operador' } }) => state,
		},
	});
	const { result } = renderHook(() => useRecepcionDetalle(), {
		wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
	});
	await waitFor(() => expect(result.current.etag).toBe('"uno"'));
	let resolveRefresh!: (value: Awaited<ReturnType<typeof getStockReceipt>>) => void;
	vi.mocked(getStockReceipt).mockImplementation(
		() =>
			new Promise((resolve) => {
				resolveRefresh = resolve;
			}),
	);
	act(() => result.current.retry());
	expect(result.current.receipt?.id).toBe(76);
	expect(result.current.loading).toBe(false);
	await act(async () => {
		resolveRefresh({
			data: { ...postedKeyboardStockReceipt, id: 76, subsidiary_id: 1 },
			headers: { etag: '"dos"' },
		});
		await Promise.resolve();
	});
	expect(result.current.etag).toBe('"dos"');
});
