import { act } from '@testing-library/react';
import { toast } from 'react-toastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHookWithStore } from '@/test-utils/renderWithStore';
import type { IQuoteItem } from '@/interface';
import useQuotationsManager from '../useQuotationsManager';

/**
 * Los thunks del slice se reemplazan por thunks que registran la llamada y
 * resuelven (o rechazan) con un valor fijo, para observar el orden de escritura
 * de los ítems sin backend.
 */
const calls: string[] = [];

const thunk = (label: string, result: () => Promise<unknown>) => () => {
	calls.push(label);
	return { unwrap: result };
};

const existingItems: Array<Pick<IQuoteItem, 'id'>> = [{ id: 5 }, { id: 9 }];

const mocks = vi.hoisted(() => ({
	updateItem: vi.fn<(args: { itemId: number }) => () => { unwrap: () => Promise<unknown> }>(),
}));

vi.mock('react-toastify', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/store/selectors/subsidiarySelectors', () => ({
	selectEffectiveSubsidiaryId: () => 1,
}));

vi.mock('@/store/slices/quotes/quotesSlice', () => ({
	// El store real registra el reducer del slice al importarse `@/store`.
	default: (state: Record<string, unknown> = {}) => state,
	selectQuotes: () => [],
	selectQuotesLoading: () => false,
	selectQuoteActionsLoading: () => ({}),
	fetchQuotes: () => thunk('fetchQuotes', () => Promise.resolve({})),
	fetchQuoteById: vi.fn(),
	createQuote: () => thunk('createQuote', () => Promise.resolve({ id: 77 })),
	updateQuote: vi.fn(),
	deleteQuote: vi.fn(),
	convertQuoteToSale: vi.fn(),
	fetchQuoteItems: () => thunk('fetchQuoteItems', () => Promise.resolve(existingItems)),
	updateQuoteItem: (args: { itemId: number }) => mocks.updateItem(args),
	addQuoteItem: () => thunk('addQuoteItem', () => Promise.resolve({})),
	deleteQuoteItem: (args: { itemId: number }) =>
		thunk(`deleteQuoteItem:${args.itemId}`, () => Promise.resolve({})),
}));

const items = [
	{ id: 5, quote_id: 77, product_id: 3, quantity: 2, unit_price: 1000 },
	{ id: 0, quote_id: 77, product_id: 4, quantity: 1, unit_price: 500 },
] as IQuoteItem[];

const quotation = {
	customer_id: 1,
	quote_date: '2026-10-26',
	status: 'draft' as const,
	items,
};

describe('useQuotationsManager — sincronización de ítems', () => {
	beforeEach(() => {
		calls.length = 0;
		vi.mocked(toast.error).mockClear();
		mocks.updateItem.mockReset();
	});

	it('actualiza, crea y elimina los ítems en ese orden', async () => {
		mocks.updateItem.mockImplementation((args: { itemId: number }) =>
			thunk(`updateQuoteItem:${args.itemId}`, () => Promise.resolve({})),
		);
		const { result } = renderHookWithStore(() => useQuotationsManager());

		await act(async () => {
			await result.current.createQuotation(quotation);
		});

		const writes = calls.filter(
			(label) => label.includes('QuoteItem:') || label === 'addQuoteItem',
		);
		expect(writes).toEqual(['updateQuoteItem:5', 'addQuoteItem', 'deleteQuoteItem:9']);
		expect(toast.error).not.toHaveBeenCalled();
	});

	it('si una escritura falla, no ejecuta las siguientes y avisa el error', async () => {
		mocks.updateItem.mockImplementation((args: { itemId: number }) =>
			thunk(`updateQuoteItem:${args.itemId}`, () =>
				Promise.reject(new Error('No se pudo actualizar el ítem')),
			),
		);
		const { result } = renderHookWithStore(() => useQuotationsManager());

		await act(async () => {
			await result.current.createQuotation(quotation);
		});

		expect(calls).toContain('updateQuoteItem:5');
		expect(calls).not.toContain('addQuoteItem');
		expect(calls).not.toContain('deleteQuoteItem:9');
		expect(toast.error).toHaveBeenCalledWith('No se pudo actualizar el ítem');
	});
});
