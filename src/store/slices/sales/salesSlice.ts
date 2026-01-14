import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import type { RootState } from '@/store';
import type {
	ISale,
	ISaleItem,
	ICreateSaleRequest,
	ISaleResponse,
	ISalesResponse,
	SaleStatus,
} from '@/interface/sales.interface';
import ApiService from '@/services/ApiService';

// Tipos para el estado del slice
interface SalesState {
	sales: ISale[];
	currentSale: ISale | null;
	loading: {
		fetch: boolean;
		create: boolean;
		update: boolean;
		delete: boolean;
		invoice: boolean;
		payment: boolean;
		ship: boolean;
		cancel: boolean;
	};
	pagination: {
		currentPage: number;
		totalPages: number;
		totalSales: number;
		perPage: number;
	};
	filters: {
		status?: SaleStatus;
		customer_id?: string;
		sale_date_from?: string;
		sale_date_to?: string;
		delivery_date_from?: string;
		delivery_date_to?: string;
		salesperson_id?: string;
		min_amount?: number;
		max_amount?: number;
		with_customer?: string | number; // Added to support sales timeline
	};
	statistics: {
		totalSalesAmount: number;
		totalSalesCount: number;
		pendingSales: number;
		deliveredSales: number;
		cancelledSales: number;
		monthlyGrowth: number;
	};
}

// Estado inicial
const initialState: SalesState = {
	sales: [],
	currentSale: null,
	loading: {
		fetch: false,
		create: false,
		update: false,
		delete: false,
		invoice: false,
		payment: false,
		ship: false,
		cancel: false,
	},
	pagination: {
		currentPage: 1,
		totalPages: 1,
		totalSales: 0,
		perPage: 20,
	},
	filters: {},
	statistics: {
		totalSalesAmount: 0,
		totalSalesCount: 0,
		pendingSales: 0,
		deliveredSales: 0,
		cancelledSales: 0,
		monthlyGrowth: 0,
	},
};

const extractMessage = (error: unknown, fallback: string): string => {
	if (typeof error === 'string') return error;
	if (error && typeof error === 'object' && 'response' in error) {
		const resp = (error as { response?: { data?: { message?: string } } }).response;
		if (resp?.data?.message) return resp.data.message;
	}
	return fallback;
};

// Async thunks
export const fetchSales = createAsyncThunk(
	'sales/fetchSales',
	async (
		params: {
			subsidiaryId: number;
			page?: number;
			perPage?: number;
			filters?: SalesState['filters'];
		},
	) => {
		try {
			const { subsidiaryId, page = 1, perPage = 20, filters = {} } = params;

			const queryParams = new URLSearchParams({
				page: page.toString(),
				per_page: perPage.toString(),
				...Object.fromEntries(
					Object.entries(filters)
						.filter(([_, value]) => value !== undefined && value !== '')
						.map(([key, value]) => [key, value.toString()]),
				),
			});

			const response = await ApiService.fetchData<ISalesResponse>({
				url: `/subsidiaries/${subsidiaryId}/sales?${queryParams.toString()}`,
				method: 'get',
			});

			return response.data;
		} catch (error: unknown) {
			toast.error(extractMessage(error, 'Error al cargar las ventas'));
			throw error;
		}
	},
);

export const fetchSaleById = createAsyncThunk('sales/fetchSaleById', async ({ subsidiaryId, id }: { subsidiaryId: number; id: number }) => {
	try {
		const response = await ApiService.fetchData<ISaleResponse>({
			url: `/subsidiaries/${subsidiaryId}/sales/${id}`,
			method: 'get',
		});
		return response.data;
	} catch (error: unknown) {
		toast.error(extractMessage(error, 'Error al cargar la venta'));
		throw error;
	}
});

export const createSale = createAsyncThunk('sales/createSale', async ({ subsidiaryId, data }: { subsidiaryId: number; data: ICreateSaleRequest }) => {
	try {
		const response = await ApiService.fetchData<ISaleResponse>({
			url: `/subsidiaries/${subsidiaryId}/sales`,
			method: 'post',
			data: data as unknown as Record<string, unknown>,
		});
		toast.success('Venta creada exitosamente');
		return response.data;
	} catch (error: unknown) {
		const message =
			typeof error === 'object' && error !== null && 'response' in error
				? (error as { response?: { data?: { message?: string } } }).response?.data?.message
				: null;
		toast.error(message || 'Error al crear la venta');
		throw error;
	}
});

export const updateSale = createAsyncThunk(
	'sales/updateSale',
	async ({ subsidiaryId, id, data }: { subsidiaryId: number; id: number; data: Partial<ICreateSaleRequest> }) => {
		try {
			const response = await ApiService.fetchData<ISaleResponse>({
				url: `/subsidiaries/${subsidiaryId}/sales/${id}`,
				method: 'put',
				data: data as unknown as Record<string, unknown>,
			});
			toast.success('Venta actualizada exitosamente');
			return response.data;
		} catch (error: unknown) {
			const message =
				typeof error === 'object' && error !== null && 'response' in error
					? (error as { response?: { data?: { message?: string } } }).response?.data
						?.message
					: null;
			toast.error(message || 'Error al actualizar la venta');
			throw error;
		}
	},
);

export const deleteSale = createAsyncThunk('sales/deleteSale', async ({ subsidiaryId, id }: { subsidiaryId: number; id: number }) => {
	try {
		await ApiService.fetchData({
			url: `/subsidiaries/${subsidiaryId}/sales/${id}`,
			method: 'delete',
		});
		toast.success('Venta eliminada exitosamente');
		return id;
	} catch (error: unknown) {
		toast.error(extractMessage(error, 'Error al eliminar la venta'));
		throw error;
	}
});

export const generateInvoice = createAsyncThunk('sales/generateInvoice', async ({ subsidiaryId, id }: { subsidiaryId: number; id: number }) => {
	try {
		const response = await ApiService.fetchData<ISaleResponse>({
			url: `/subsidiaries/${subsidiaryId}/sales/${id}/invoice`,
			method: 'post',
		});
		toast.success('Factura generada exitosamente');
		return response.data;
	} catch (error: unknown) {
		toast.error(extractMessage(error, 'Error al generar la factura'));
		throw error;
	}
});

export const recordPayment = createAsyncThunk(
	'sales/recordPayment',
	async ({
		subsidiaryId,
		id,
		data,
	}: {
		subsidiaryId: number;
		id: number;
		data: {
			amount: number;
			payment_method: string;
			payment_date: string;
			reference?: string;
			notes?: string;
		};
	}) => {
		try {
			const response = await ApiService.fetchData<ISaleResponse>({
				url: `/subsidiaries/${subsidiaryId}/sales/${id}/payments`,
				method: 'post',
				data,
			});
			toast.success('Pago registrado exitosamente');
			return response.data;
		} catch (error: unknown) {
			toast.error(extractMessage(error, 'Error al registrar el pago'));
			throw error;
		}
	},
);

export const shipSale = createAsyncThunk(
	'sales/shipSale',
	async ({
		subsidiaryId,
		id,
		data,
	}: {
		subsidiaryId: number;
		id: number;
		data: {
			tracking_number?: string;
			carrier?: string;
			shipped_date: string;
			expected_delivery_date?: string;
			notes?: string;
		};
	}) => {
		try {
			const response = await ApiService.fetchData<ISaleResponse>({
				url: `/subsidiaries/${subsidiaryId}/sales/${id}/ship`,
				method: 'post',
				data,
			});
			toast.success('Venta marcada como enviada');
			return response.data;
		} catch (error: unknown) {
			toast.error(extractMessage(error, 'Error al enviar la venta'));
			throw error;
		}
	},
);

export const deliverSale = createAsyncThunk(
	'sales/deliverSale',
	async ({
		subsidiaryId,
		id,
		data,
	}: {
		subsidiaryId: number;
		id: number;
		data: {
			delivered_date: string;
			received_by?: string;
			notes?: string;
		};
	}) => {
		try {
			const response = await ApiService.fetchData<ISaleResponse>({
				url: `/subsidiaries/${subsidiaryId}/sales/${id}/deliver`,
				method: 'post',
				data,
			});
			toast.success('Venta marcada como entregada');
			return response.data;
		} catch (error: unknown) {
			toast.error(extractMessage(error, 'Error al entregar la venta'));
			throw error;
		}
	},
);

export const cancelSale = createAsyncThunk(
	'sales/cancelSale',
	async ({
		subsidiaryId,
		id,
		data,
	}: {
		subsidiaryId: number;
		id: number;
		data: {
			reason: string;
			refund_amount?: number;
			notes?: string;
		};
	}) => {
		try {
			const response = await ApiService.fetchData<ISaleResponse>({
				url: `/subsidiaries/${subsidiaryId}/sales/${id}/cancel`,
				method: 'post',
				data,
			});
			toast.success('Venta cancelada exitosamente');
			return response.data;
		} catch (error: unknown) {
			toast.error(extractMessage(error, 'Error al cancelar la venta'));
			throw error;
		}
	},
);

export const fetchSalesStatistics = createAsyncThunk(
	'sales/fetchStatistics',
	async (params: { subsidiaryId: number; period?: 'day' | 'week' | 'month' | 'year' }) => {
		try {
			const { subsidiaryId, period = 'month' } = params;
			const response = await ApiService.fetchData<{
				totalSalesAmount: number;
				totalSalesCount: number;
				pendingSales: number;
				deliveredSales: number;
				cancelledSales: number;
				monthlyGrowth: number;
			}>({
				url: `/subsidiaries/${subsidiaryId}/sales/statistics?period=${period}`,
				method: 'get',
			});
			return response.data;
		} catch (error: unknown) {
			toast.error(extractMessage(error, 'Error al cargar las estadísticas'));
			throw error;
		}
	},
);

// Download shipping label
export const downloadShippingLabel = createAsyncThunk(
	'sales/downloadLabel',
	async ({ subsidiaryId, id }: { subsidiaryId: number; id: number }) => {
		try {
			const response = await ApiService.fetchData<Blob>({
				url: `/subsidiaries/${subsidiaryId}/sales/${id}/download-label`,
				method: 'post',
				responseType: 'blob',
			});

			// Create blob url and download
			const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', `etiqueta_envio_${id}.docx`);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);

			toast.success('Etiqueta descargada exitosamente');
			return true;
		} catch (error: unknown) {
			toast.error(extractMessage(error, 'Error al descargar la etiqueta'));
			throw error;
		}
	}
);

// Slice
const ventasSlice = createSlice({
	name: 'ventas',
	initialState,
	reducers: {
		setFilters: (state, action: PayloadAction<Partial<SalesState['filters']>>) => {
			state.filters = { ...state.filters, ...action.payload };
		},
		clearFilters: (state) => {
			state.filters = {};
		},
		setCurrentSale: (state, action: PayloadAction<ISale | null>) => {
			state.currentSale = action.payload;
		},
		clearCurrentSale: (state) => {
			state.currentSale = null;
		},
		updateSaleItem: (state, action: PayloadAction<{ saleId: number; item: ISaleItem }>) => {
			const { saleId, item } = action.payload;
			const sale = state.sales.find((s) => s.id === saleId);
			if (sale && sale.items) {
				const itemIndex = sale.items.findIndex((i) => i.id === item.id);
				if (itemIndex !== -1) {
					sale.items[itemIndex] = item;
					// Recalcular total
					const newTotal = sale.items.reduce((total, saleItem) => {
						const line = Number(saleItem.total ?? saleItem.subtotal ?? 0);
						return total + (Number.isFinite(line) ? line : 0);
					}, 0);
					sale.total_amount = String(newTotal);
				}
			}

			if (state.currentSale && state.currentSale.id === saleId && state.currentSale.items) {
				const itemIndex = state.currentSale.items.findIndex((i) => i.id === item.id);
				if (itemIndex !== -1) {
					state.currentSale.items[itemIndex] = item;
					const newTotal = state.currentSale.items.reduce((total, saleItem) => {
						const line = Number(saleItem.total ?? saleItem.subtotal ?? 0);
						return total + (Number.isFinite(line) ? line : 0);
					}, 0);
					state.currentSale.total_amount = String(newTotal);
				}
			}
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch sales
			.addCase(fetchSales.pending, (state) => {
				state.loading.fetch = true;
			})
			.addCase(fetchSales.fulfilled, (state, action) => {
				state.loading.fetch = false;
				state.sales = action.payload.data;
				state.pagination = {
					currentPage:
						action.payload.current_page ?? action.payload.meta?.current_page ?? 1,
					totalPages: action.payload.last_page ?? action.payload.meta?.last_page ?? 1,
					totalSales:
						action.payload.total ??
						action.payload.meta?.total ??
						action.payload.data?.length ??
						0,
					perPage:
						action.payload.per_page ??
						action.payload.meta?.per_page ??
						state.pagination.perPage,
				};
			})
			.addCase(fetchSales.rejected, (state) => {
				state.loading.fetch = false;
				state.sales = [];
			})

			// Fetch sale by ID
			.addCase(fetchSaleById.pending, (state) => {
				state.loading.fetch = true;
			})
			.addCase(fetchSaleById.fulfilled, (state, action) => {
				state.loading.fetch = false;
				state.currentSale = action.payload.data;
			})
			.addCase(fetchSaleById.rejected, (state) => {
				state.loading.fetch = false;
				state.currentSale = null;
			})

			// Create sale
			.addCase(createSale.pending, (state) => {
				state.loading.create = true;
			})
			.addCase(createSale.fulfilled, (state, action) => {
				state.loading.create = false;
				state.sales.unshift(action.payload.data);
				state.pagination.totalSales += 1;
			})
			.addCase(createSale.rejected, (state) => {
				state.loading.create = false;
			})

			// Update sale
			.addCase(updateSale.pending, (state) => {
				state.loading.update = true;
			})
			.addCase(updateSale.fulfilled, (state, action) => {
				state.loading.update = false;
				const index = state.sales.findIndex((s) => s.id === action.payload.data.id);
				if (index !== -1) {
					state.sales[index] = action.payload.data;
				}
				if (state.currentSale?.id === action.payload.data.id) {
					state.currentSale = action.payload.data;
				}
			})
			.addCase(updateSale.rejected, (state) => {
				state.loading.update = false;
			})

			// Delete sale
			.addCase(deleteSale.pending, (state) => {
				state.loading.delete = true;
			})
			.addCase(deleteSale.fulfilled, (state, action) => {
				state.loading.delete = false;
				state.sales = state.sales.filter((s) => s.id !== action.payload);
				state.pagination.totalSales -= 1;
				if (state.currentSale?.id === action.payload) {
					state.currentSale = null;
				}
			})
			.addCase(deleteSale.rejected, (state) => {
				state.loading.delete = false;
			})

			// Generate invoice
			.addCase(generateInvoice.pending, (state) => {
				state.loading.invoice = true;
			})
			.addCase(generateInvoice.fulfilled, (state, action) => {
				state.loading.invoice = false;
				const index = state.sales.findIndex((s) => s.id === action.payload.data.id);
				if (index !== -1) {
					state.sales[index] = action.payload.data;
				}
				if (state.currentSale?.id === action.payload.data.id) {
					state.currentSale = action.payload.data;
				}
			})
			.addCase(generateInvoice.rejected, (state) => {
				state.loading.invoice = false;
			})

			// Record payment
			.addCase(recordPayment.pending, (state) => {
				state.loading.payment = true;
			})
			.addCase(recordPayment.fulfilled, (state, action) => {
				state.loading.payment = false;
				const index = state.sales.findIndex((s) => s.id === action.payload.data.id);
				if (index !== -1) {
					state.sales[index] = action.payload.data;
				}
				if (state.currentSale?.id === action.payload.data.id) {
					state.currentSale = action.payload.data;
				}
			})
			.addCase(recordPayment.rejected, (state) => {
				state.loading.payment = false;
			})

			// Ship sale
			.addCase(shipSale.pending, (state) => {
				state.loading.ship = true;
			})
			.addCase(shipSale.fulfilled, (state, action) => {
				state.loading.ship = false;
				const index = state.sales.findIndex((s) => s.id === action.payload.data.id);
				if (index !== -1) {
					state.sales[index] = action.payload.data;
				}
				if (state.currentSale?.id === action.payload.data.id) {
					state.currentSale = action.payload.data;
				}
			})
			.addCase(shipSale.rejected, (state) => {
				state.loading.ship = false;
			})

			// Deliver sale
			.addCase(deliverSale.pending, (state) => {
				state.loading.ship = true;
			})
			.addCase(deliverSale.fulfilled, (state, action) => {
				state.loading.ship = false;
				const index = state.sales.findIndex((s) => s.id === action.payload.data.id);
				if (index !== -1) {
					state.sales[index] = action.payload.data;
				}
				if (state.currentSale?.id === action.payload.data.id) {
					state.currentSale = action.payload.data;
				}
			})
			.addCase(deliverSale.rejected, (state) => {
				state.loading.ship = false;
			})

			// Cancel sale
			.addCase(cancelSale.pending, (state) => {
				state.loading.cancel = true;
			})
			.addCase(cancelSale.fulfilled, (state, action) => {
				state.loading.cancel = false;
				const index = state.sales.findIndex((s) => s.id === action.payload.data.id);
				if (index !== -1) {
					state.sales[index] = action.payload.data;
				}
				if (state.currentSale?.id === action.payload.data.id) {
					state.currentSale = action.payload.data;
				}
			})
			.addCase(cancelSale.rejected, (state) => {
				state.loading.cancel = false;
			})

			// Fetch statistics
			.addCase(fetchSalesStatistics.fulfilled, (state, action) => {
				state.statistics = action.payload;
			});
	},
});

// Actions
export const { setFilters, clearFilters, setCurrentSale, clearCurrentSale, updateSaleItem } =
	ventasSlice.actions;

// Selectors
export const selectSales = (state: RootState) => state.ventas.sales;
export const selectCurrentSale = (state: RootState) => state.ventas.currentSale;
export const selectSalesLoading = (state: RootState) => state.ventas.loading;
export const selectSalesPagination = (state: RootState) => state.ventas.pagination;
export const selectSaleFilters = (state: RootState) => state.ventas.filters;
export const selectSalesStatistics = (state: RootState) => state.ventas.statistics;

// Loading selectors
export const selectSalesFetching = (state: RootState) => state.ventas.loading.fetch;
export const selectSaleActionLoading = (state: RootState) => ({
	create: state.ventas.loading.create,
	update: state.ventas.loading.update,
	delete: state.ventas.loading.delete,
	invoice: state.ventas.loading.invoice,
	payment: state.ventas.loading.payment,
	ship: state.ventas.loading.ship,
	cancel: state.ventas.loading.cancel,
});

export default ventasSlice.reducer;
