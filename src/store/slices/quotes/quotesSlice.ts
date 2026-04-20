import {
	createAsyncThunk,
	createSlice,
	createSelector,
	type PayloadAction,
} from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import ApiService from '@/services/ApiService';
import type {
	Quote,
	QuoteCreateDTO,
	QuoteItem,
	QuoteItemDTO,
	QuoteListMeta,
	QuotePDFResponse,
	QuoteStatus,
	QuoteUpdateDTO,
} from '@/interface/quotes.interface';
import { sortBy } from 'lodash';

const buildQuoteUrl = (subsidiaryId: number, suffix = '') =>
	`/subsidiaries/${subsidiaryId}/quotes${suffix}`;

const sortQuotesByIdDesc = (quotes: Quote[]) =>
	sortBy(quotes, [(quote) => -(Number(quote.id) || 0)]);

const normalizeListResponse = (payload: any): { quotes: Quote[]; meta: QuoteListMeta } => {
	const quotes: Quote[] = Array.isArray(payload?.data)
		? payload.data
		: Array.isArray(payload)
			? payload
			: Array.isArray(payload?.quotes)
				? payload.quotes
				: [];
	const meta: QuoteListMeta = {
		total: payload?.meta?.total ?? quotes.length,
		current_page: payload?.meta?.current_page ?? 1,
		per_page: payload?.meta?.per_page ?? quotes.length,
		last_page: payload?.meta?.last_page ?? 1,
	};
	return { quotes: sortQuotesByIdDesc(quotes), meta };
};

const extractEntity = <T>(payload: any): T => {
	if (payload?.data) {
		return payload.data as T;
	}
	return payload as T;
};

export interface QuoteFiltersState {
	status?: QuoteStatus | 'all';
	search?: string;
}

export interface QuoteStateMeta {
	total: number;
	currentPage: number;
	perPage: number;
	lastPage: number;
}

export interface QuoteState {
	list: Quote[];
	quoteItems: QuoteItem[];
	currentQuote: Quote | null;
	loadingList: boolean;
	loadingDetails: boolean;
	loadingItems: boolean;
	creating: boolean;
	updating: boolean;
	deleting: boolean;
	itemsSaving: boolean;
	itemsDeleting: boolean;
	convertLoading: boolean;
	pdfLoading: boolean;
	error?: string;
	filters: QuoteFiltersState;
	meta: QuoteStateMeta;
}

const initialState: QuoteState = {
	list: [],
	quoteItems: [],
	currentQuote: null,
	loadingList: false,
	loadingDetails: false,
	loadingItems: false,
	creating: false,
	updating: false,
	deleting: false,
	itemsSaving: false,
	itemsDeleting: false,
	convertLoading: false,
	pdfLoading: false,
	error: undefined,
	filters: {},
	meta: {
		total: 0,
		currentPage: 1,
		perPage: 10,
		lastPage: 1,
	},
};

export interface FetchQuotesParams {
	subsidiaryId: number;
	page?: number;
	perPage?: number;
	status?: QuoteStatus | 'all';
	search?: string;
}

export const fetchQuotes = createAsyncThunk<
	{ quotes: Quote[]; meta: QuoteListMeta },
	FetchQuotesParams,
	{ rejectValue: string }
>(
	'quotes/fetchQuotes',
	async ({ subsidiaryId, page = 1, perPage = 10, status, search }, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<{ data?: Quote[]; meta?: QuoteListMeta }>({
				url: buildQuoteUrl(subsidiaryId),
				method: 'get',
				params: {
					page,
					per_page: perPage,
					status: status && status !== 'all' ? status : undefined,
					q: search?.trim() || undefined,
					with_customer: 1,
				},
			});

			return normalizeListResponse(response.data);
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message || 'No se pudieron obtener las cotizaciones',
			);
		}
	},
);

export const fetchQuoteById = createAsyncThunk<
	Quote,
	{ subsidiaryId: number; quoteId: number },
	{ rejectValue: string }
>('quotes/fetchQuoteById', async ({ subsidiaryId, quoteId }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: Quote }>({
			url: buildQuoteUrl(subsidiaryId, `/${quoteId}`),
			method: 'get',
			params: {
				with_customer: 1,
				with_subsidiary: 1,
				with_sale: 1,
			},
		});
		const quote = extractEntity<Quote>(response.data);
		try {
			const itemsResponse = await ApiService.fetchData<{ data?: QuoteItem[] }>({
				url: buildQuoteUrl(subsidiaryId, `/${quoteId}/items`),
				method: 'get',
			});
			const items = Array.isArray(itemsResponse.data?.data)
				? itemsResponse.data?.data
				: Array.isArray(itemsResponse.data)
					? (itemsResponse.data as QuoteItem[])
					: [];
			return { ...quote, items };
		} catch (e) {
			return quote;
		}
	} catch (error: any) {
		return rejectWithValue(error?.response?.data?.message || 'No se pudo cargar la cotización');
	}
});

export const createQuote = createAsyncThunk<
	Quote,
	{ subsidiaryId: number; data: QuoteCreateDTO },
	{ rejectValue: string }
>('quotes/createQuote', async ({ subsidiaryId, data }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: Quote }>({
			url: buildQuoteUrl(subsidiaryId),
			method: 'post',
			data,
		});
		return extractEntity<Quote>(response.data);
	} catch (error: any) {
		return rejectWithValue(error?.response?.data?.message || 'No se pudo crear la cotización');
	}
});

export const updateQuote = createAsyncThunk<
	Quote,
	{ subsidiaryId: number; quoteId: number; data: QuoteUpdateDTO },
	{ rejectValue: string }
>('quotes/updateQuote', async ({ subsidiaryId, quoteId, data }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: Quote }>({
			url: buildQuoteUrl(subsidiaryId, `/${quoteId}`),
			method: 'patch',
			data,
		});
		return extractEntity<Quote>(response.data);
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message || 'No se pudo actualizar la cotización',
		);
	}
});

export const deleteQuote = createAsyncThunk<
	number,
	{ subsidiaryId: number; quoteId: number },
	{ rejectValue: string }
>('quotes/deleteQuote', async ({ subsidiaryId, quoteId }, { rejectWithValue }) => {
	try {
		await ApiService.fetchData({
			url: buildQuoteUrl(subsidiaryId, `/${quoteId}`),
			method: 'delete',
		});
		return quoteId;
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message || 'No se pudo eliminar la cotización',
		);
	}
});

export const fetchQuoteItems = createAsyncThunk<
	QuoteItem[],
	{ subsidiaryId: number; quoteId: number },
	{ rejectValue: string }
>('quotes/fetchQuoteItems', async ({ subsidiaryId, quoteId }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: QuoteItem[] }>({
			url: buildQuoteUrl(subsidiaryId, `/${quoteId}/items`),
			method: 'get',
		});
		if (Array.isArray(response.data?.data)) {
			return response.data.data;
		}
		if (Array.isArray(response.data)) {
			return response.data as QuoteItem[];
		}
		return [];
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message || 'No se pudieron obtener los ítems',
		);
	}
});

export const addQuoteItem = createAsyncThunk<
	QuoteItem,
	{ subsidiaryId: number; quoteId: number; data: QuoteItemDTO },
	{ rejectValue: string }
>('quotes/addQuoteItem', async ({ subsidiaryId, quoteId, data }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: QuoteItem }>({
			url: buildQuoteUrl(subsidiaryId, `/${quoteId}/items`),
			method: 'post',
			data,
		});
		return extractEntity<QuoteItem>(response.data);
	} catch (error: any) {
		return rejectWithValue(error?.response?.data?.message || 'No se pudo agregar el ítem');
	}
});

export const updateQuoteItem = createAsyncThunk<
	QuoteItem,
	{ subsidiaryId: number; quoteId: number; itemId: number; data: QuoteItemDTO },
	{ rejectValue: string }
>(
	'quotes/updateQuoteItem',
	async ({ subsidiaryId, quoteId, itemId, data }, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<{ data?: QuoteItem }>({
				url: buildQuoteUrl(subsidiaryId, `/${quoteId}/items/${itemId}`),
				method: 'patch',
				data,
			});
			return extractEntity<QuoteItem>(response.data);
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message || 'No se pudo actualizar el ítem',
			);
		}
	},
);

export const deleteQuoteItem = createAsyncThunk<
	number,
	{ subsidiaryId: number; quoteId: number; itemId: number },
	{ rejectValue: string }
>('quotes/deleteQuoteItem', async ({ subsidiaryId, quoteId, itemId }, { rejectWithValue }) => {
	try {
		await ApiService.fetchData({
			url: buildQuoteUrl(subsidiaryId, `/${quoteId}/items/${itemId}`),
			method: 'delete',
		});
		return itemId;
	} catch (error: any) {
		return rejectWithValue(error?.response?.data?.message || 'No se pudo eliminar el ítem');
	}
});

export const convertQuoteToSale = createAsyncThunk<
	{ quote: Quote; sale: Record<string, any> },
	{ subsidiaryId: number; quoteId: number },
	{ rejectValue: string }
>('quotes/convertQuoteToSale', async ({ subsidiaryId, quoteId }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ quote: Quote; sale: Record<string, any> }>({
			url: buildQuoteUrl(subsidiaryId, `/${quoteId}/convert-to-sale`),
			method: 'post',
			data: {
				sale_number: null,
			},
		});
		return response.data;
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message || 'No se pudo convertir la cotización',
		);
	}
});

export const downloadQuotePDF = createAsyncThunk<
	QuotePDFResponse,
	{ subsidiaryId: number; quoteId: number },
	{ rejectValue: string }
>('quotes/downloadQuotePDF', async ({ subsidiaryId, quoteId }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: QuotePDFResponse }>({
			url: buildQuoteUrl(subsidiaryId, `/${quoteId}/pdf`),
			method: 'get',
		});
		return extractEntity<QuotePDFResponse>(response.data);
	} catch (error: any) {
		return rejectWithValue(error?.response?.data?.message || 'No se pudo generar el PDF');
	}
});

const cotizacionesSlice = createSlice({
	name: 'cotizaciones',
	initialState,
	reducers: {
		setQuoteFilters: (state, action: PayloadAction<Partial<QuoteFiltersState>>) => {
			state.filters = { ...state.filters, ...action.payload };
		},
		resetQuoteState: () => initialState,
		clearQuoteError: (state) => {
			state.error = undefined;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchQuotes.pending, (state) => {
				state.loadingList = true;
				state.error = undefined;
			})
			.addCase(fetchQuotes.fulfilled, (state, action) => {
				state.loadingList = false;
				state.list = sortQuotesByIdDesc(action.payload.quotes);
				state.meta = {
					total: action.payload.meta.total,
					currentPage: action.payload.meta.current_page,
					perPage: action.payload.meta.per_page,
					lastPage: action.payload.meta.last_page,
				};
			})
			.addCase(fetchQuotes.rejected, (state, action) => {
				state.loadingList = false;
				state.error = action.payload;
				toast.error(action.payload || 'Error al cargar cotizaciones');
			})
			.addCase(fetchQuoteById.pending, (state) => {
				state.loadingDetails = true;
				state.error = undefined;
			})
			.addCase(fetchQuoteById.fulfilled, (state, action) => {
				state.loadingDetails = false;
				state.currentQuote = action.payload;
			})
			.addCase(fetchQuoteById.rejected, (state, action) => {
				state.loadingDetails = false;
				state.error = action.payload;
				toast.error(action.payload || 'Error al cargar la cotización');
			})
			.addCase(createQuote.pending, (state) => {
				state.creating = true;
				state.error = undefined;
			})
			.addCase(createQuote.fulfilled, (state, action) => {
				state.creating = false;
				state.list = sortQuotesByIdDesc([...state.list, action.payload]);
				state.meta.total += 1;
				toast.success('Cotización creada correctamente');
			})
			.addCase(createQuote.rejected, (state, action) => {
				state.creating = false;
				state.error = action.payload;
				toast.error(action.payload || 'Error al crear la cotización');
			})
			.addCase(updateQuote.pending, (state) => {
				state.updating = true;
			})
			.addCase(updateQuote.fulfilled, (state, action) => {
				state.updating = false;
				state.list = sortQuotesByIdDesc(state.list.map((quote) =>
					quote.id === action.payload.id ? action.payload : quote,
				));
				if (state.currentQuote?.id === action.payload.id) {
					state.currentQuote = action.payload;
				}
				toast.success('Cotización actualizada');
			})
			.addCase(updateQuote.rejected, (state, action) => {
				state.updating = false;
				state.error = action.payload;
				toast.error(action.payload || 'Error al actualizar la cotización');
			})
			.addCase(deleteQuote.pending, (state) => {
				state.deleting = true;
			})
			.addCase(deleteQuote.fulfilled, (state, action) => {
				state.deleting = false;
				state.list = state.list.filter((quote) => quote.id !== action.payload);
				if (state.currentQuote?.id === action.payload) {
					state.currentQuote = null;
				}
				state.meta.total = Math.max(0, state.meta.total - 1);
				toast.success('Cotización eliminada');
			})
			.addCase(deleteQuote.rejected, (state, action) => {
				state.deleting = false;
				state.error = action.payload;
				toast.error(action.payload || 'Error al eliminar la cotización');
			})
			.addCase(fetchQuoteItems.pending, (state) => {
				state.loadingItems = true;
			})
			.addCase(fetchQuoteItems.fulfilled, (state, action) => {
				state.loadingItems = false;
				state.quoteItems = action.payload;
			})
			.addCase(fetchQuoteItems.rejected, (state, action) => {
				state.loadingItems = false;
				state.error = action.payload;
				toast.error(action.payload || 'Error al obtener los ítems');
			})
			.addCase(addQuoteItem.pending, (state) => {
				state.itemsSaving = true;
			})
			.addCase(addQuoteItem.fulfilled, (state, action) => {
				state.itemsSaving = false;
				state.quoteItems = [action.payload, ...state.quoteItems];
				toast.success('Ítem agregado');
			})
			.addCase(addQuoteItem.rejected, (state, action) => {
				state.itemsSaving = false;
				state.error = action.payload;
				toast.error(action.payload || 'Error al agregar el ítem');
			})
			.addCase(updateQuoteItem.pending, (state) => {
				state.itemsSaving = true;
			})
			.addCase(updateQuoteItem.fulfilled, (state, action) => {
				state.itemsSaving = false;
				state.quoteItems = state.quoteItems.map((item) =>
					item.id === action.payload.id ? action.payload : item,
				);
				toast.success('Ítem actualizado');
			})
			.addCase(updateQuoteItem.rejected, (state, action) => {
				state.itemsSaving = false;
				state.error = action.payload;
				toast.error(action.payload || 'Error al actualizar el ítem');
			})
			.addCase(deleteQuoteItem.pending, (state) => {
				state.itemsDeleting = true;
			})
			.addCase(deleteQuoteItem.fulfilled, (state, action) => {
				state.itemsDeleting = false;
				state.quoteItems = state.quoteItems.filter((item) => item.id !== action.payload);
				toast.success('Ítem eliminado');
			})
			.addCase(deleteQuoteItem.rejected, (state, action) => {
				state.itemsDeleting = false;
				state.error = action.payload;
				toast.error(action.payload || 'Error al eliminar el ítem');
			})
			.addCase(convertQuoteToSale.pending, (state) => {
				state.convertLoading = true;
			})
			.addCase(convertQuoteToSale.fulfilled, (state, action) => {
				state.convertLoading = false;
				state.list = sortQuotesByIdDesc(state.list.map((quote) =>
					quote.id === action.payload.quote.id ? action.payload.quote : quote,
				));
				if (state.currentQuote?.id === action.payload.quote.id) {
					state.currentQuote = action.payload.quote;
				}
				toast.success('Cotización convertida a venta');
			})
			.addCase(convertQuoteToSale.rejected, (state, action) => {
				state.convertLoading = false;
				state.error = action.payload;
				toast.error(action.payload || 'Error al convertir la cotización');
			})
			.addCase(downloadQuotePDF.pending, (state) => {
				state.pdfLoading = true;
			})
			.addCase(downloadQuotePDF.fulfilled, (state) => {
				state.pdfLoading = false;
				toast.success('PDF generado correctamente');
			})
			.addCase(downloadQuotePDF.rejected, (state, action) => {
				state.pdfLoading = false;
				state.error = action.payload;
				toast.error(action.payload || 'Error al generar el PDF');
			});
	},
});

export const { setQuoteFilters, resetQuoteState, clearQuoteError } = cotizacionesSlice.actions;

export default cotizacionesSlice.reducer;

// Selectores
type QuotesRootState = { cotizaciones: QuoteState };

export const selectQuotesState = (state: QuotesRootState) => state.cotizaciones;
export const selectQuotes = createSelector(selectQuotesState, (state) => state.list);
export const selectQuoteMeta = createSelector(selectQuotesState, (state) => state.meta);
export const selectQuoteFilters = createSelector(selectQuotesState, (state) => state.filters);
export const selectQuotesLoading = createSelector(selectQuotesState, (state) => state.loadingList);
export const selectCurrentQuote = createSelector(selectQuotesState, (state) => state.currentQuote);
export const selectQuoteItems = createSelector(selectQuotesState, (state) => state.quoteItems);
export const selectQuoteActionsLoading = createSelector(selectQuotesState, (state) => ({
	creating: state.creating,
	updating: state.updating,
	deleting: state.deleting,
	itemsSaving: state.itemsSaving,
	itemsDeleting: state.itemsDeleting,
	convertLoading: state.convertLoading,
	pdfLoading: state.pdfLoading,
}));
