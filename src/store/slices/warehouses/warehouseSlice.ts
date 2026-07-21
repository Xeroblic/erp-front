import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type {
	IWarehouse,
	IWarehouseDetail,
	IWarehouseListMeta,
	IWarehouseStats,
	IFetchWarehousesParams,
	ICreateWarehouseRequest,
	IUpdateWarehouseRequest,
	IAttachProductRequest,
	IDetachProductRequest,
} from '@/interface/warehouse.interface';

// ==================== Error Helper ====================

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | undefined =>
	typeof value === 'object' && value !== null ? (value as UnknownRecord) : undefined;

const getErrorMessage = (error: unknown, fallback: string): string => {
	const errorRecord = asRecord(error);
	const responseRecord = asRecord(errorRecord?.response);
	const data = asRecord(responseRecord?.data);
	const msgFromResponse = data?.message;
	if (typeof msgFromResponse === 'string' && msgFromResponse.trim()) {
		return msgFromResponse;
	}
	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}
	return fallback;
};

export interface IWarehouseApiError {
	message: string;
	code?: string;
	fields?: Record<string, string[]>;
}

const extractApiError = (error: unknown): IWarehouseApiError => {
	const errorRecord = asRecord(error);
	const responseRecord = asRecord(errorRecord?.response);
	const data = asRecord(responseRecord?.data) ?? {};
	return {
		message: getErrorMessage(error, 'Error desconocido'),
		code: typeof data.error === 'string' ? data.error : undefined,
		fields: data.errors as Record<string, string[]> | undefined,
	};
};

// ==================== State Interface ====================

export interface WarehouseState {
	warehouses: IWarehouse[];
	meta: IWarehouseListMeta;
	stats: IWarehouseStats;
	warehouseDetail: IWarehouseDetail | null;
	loading: boolean;
	warehouseDetailLoading: boolean;
	creating: boolean;
	updating: boolean;
	deleting: boolean;
	attachingProducts: boolean;
	detachingProduct: boolean;
	error: string | null;
	warehouseDetailError: string | null;
}

// ==================== Initial State ====================

const initialState: WarehouseState = {
	warehouses: [],
	meta: {
		total: 0,
		current_page: 1,
		per_page: 15,
		last_page: 1,
	},
	stats: {
		total: 0,
		actives: 0,
		inactives: 0,
		with_products: 0,
		empty: 0,
		near_capacity: 0,
	},
	warehouseDetail: null,
	loading: false,
	warehouseDetailLoading: false,
	creating: false,
	updating: false,
	deleting: false,
	attachingProducts: false,
	detachingProduct: false,
	error: null,
	warehouseDetailError: null,
};

// ==================== Helper Functions ====================

const computeWarehouseStats = (warehouses: IWarehouse[]): IWarehouseStats => {
	const stats: IWarehouseStats = {
		total: warehouses.length,
		actives: 0,
		inactives: 0,
		with_products: 0,
		empty: 0,
		near_capacity: 0,
	};

	warehouses.forEach((warehouse) => {
		if (warehouse.is_active) {
			stats.actives++;
		} else {
			stats.inactives++;
		}

		if (warehouse.products && warehouse.products.length > 0) {
			stats.with_products++;
		} else {
			stats.empty++;
		}

		if (
			warehouse.maximum_capacity !== null &&
			warehouse.current_capacity !== undefined &&
			warehouse.maximum_capacity > 0
		) {
			const percentage = (warehouse.current_capacity / warehouse.maximum_capacity) * 100;
			if (percentage >= 90) {
				stats.near_capacity++;
			}
		}
	});

	return stats;
};

const defaultError = (action: { payload?: IWarehouseApiError }, fallback: string): string =>
	action.payload?.message ?? fallback;

// ==================== Async Thunks ====================

export const fetchWarehouses = createAsyncThunk<
	{ items: IWarehouse[]; meta: IWarehouseListMeta; stats: IWarehouseStats },
	{ branchId: number; params?: IFetchWarehousesParams },
	{ rejectValue: IWarehouseApiError }
>('warehouses/fetchWarehouses', async ({ branchId, params }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{
			data?: IWarehouse[];
			meta?: Partial<IWarehouseListMeta> & UnknownRecord;
		}>({
			url: `/branches/${branchId}/warehouses`,
			method: 'get',
			params: {
				page: params?.page ?? 1,
				per_page: params?.per_page ?? 15,
				q: params?.q,
				warehouse_type: params?.warehouse_type,
				is_active: params?.is_active,
			},
		});

		const items = Array.isArray(response.data?.data)
			? response.data.data
			: Array.isArray(response.data)
				? response.data
				: [];

		const metaSource = asRecord(response.data?.meta) ?? {};
		const meta: IWarehouseListMeta = {
			total: Number(metaSource.total ?? items.length),
			current_page: Number(metaSource.current_page ?? params?.page ?? 1),
			per_page: Number(metaSource.per_page ?? params?.per_page ?? (items.length || 1)),
			last_page: Number(metaSource.last_page ?? 1),
		};

		return { items, meta, stats: computeWarehouseStats(items) };
	} catch (error: unknown) {
		return rejectWithValue(extractApiError(error));
	}
});

export const fetchWarehouseDetail = createAsyncThunk<
	IWarehouseDetail,
	{ branchId: number; warehouseId: number },
	{ rejectValue: IWarehouseApiError }
>('warehouses/fetchWarehouseDetail', async ({ branchId, warehouseId }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: IWarehouseDetail }>({
			url: `/branches/${branchId}/warehouses/${warehouseId}/detail`,
			method: 'get',
		});
		const data = response.data?.data ?? response.data;
		return data as IWarehouseDetail;
	} catch (error: unknown) {
		return rejectWithValue(extractApiError(error));
	}
});

export const createWarehouse = createAsyncThunk<
	IWarehouse,
	{ branchId: number; data: ICreateWarehouseRequest },
	{ rejectValue: IWarehouseApiError }
>('warehouses/createWarehouse', async ({ branchId, data }, { rejectWithValue }) => {
	try {
		const body: Record<string, string | number | boolean> = {};
		const assignIfDefined = (key: string, val: string | number | boolean | null | undefined) => {
			if (val !== undefined && val !== null && val !== '') body[key] = val;
		};

		assignIfDefined('name', data.name);
		assignIfDefined('code', data.code);
		assignIfDefined('warehouse_type', data.warehouse_type);
		assignIfDefined('description', data.description);

		if (data.maximum_capacity !== undefined && data.maximum_capacity !== null) {
			body.maximum_capacity = Number(data.maximum_capacity);
		}
		if (data.manager_id !== undefined && data.manager_id !== null) {
			body.manager_id = Number(data.manager_id);
		}
		assignIfDefined('address', data.address);
		if (data.commune_id !== undefined && data.commune_id !== null) {
			body.commune_id = Number(data.commune_id);
		}
		assignIfDefined('schedule', data.schedule);
		if (data.is_active !== undefined) body.is_active = Boolean(data.is_active);
		if (data.requires_serial_tracking !== undefined) body.requires_serial_tracking = Boolean(data.requires_serial_tracking);

		const response = await ApiService.fetchData<{ data?: IWarehouse }>({
			url: `/branches/${branchId}/warehouses`,
			method: 'post',
			data: body,
		});
		const warehouse = response.data?.data ?? response.data;
		return warehouse as IWarehouse;
	} catch (error: unknown) {
		return rejectWithValue(extractApiError(error));
	}
});

export const updateWarehouse = createAsyncThunk<
	IWarehouse,
	{ branchId: number; warehouseId: number; data: IUpdateWarehouseRequest },
	{ rejectValue: IWarehouseApiError }
>('warehouses/updateWarehouse', async ({ branchId, warehouseId, data }, { rejectWithValue }) => {
	try {
		const body: Record<string, string | number | boolean | null> = {};
		const assignIfDefined = (key: string, val: string | number | boolean | null | undefined) => {
			if (val !== undefined && val !== null && val !== '') body[key] = val;
		};

		assignIfDefined('name', data.name);
		assignIfDefined('code', data.code);
		assignIfDefined('warehouse_type', data.warehouse_type);
		assignIfDefined('description', data.description);

		if (data.maximum_capacity !== undefined) {
			body.maximum_capacity = data.maximum_capacity === null ? null : Number(data.maximum_capacity);
		}
		if (data.manager_id !== undefined) {
			body.manager_id = data.manager_id === null ? null : Number(data.manager_id);
		}
		assignIfDefined('address', data.address);
		if (data.commune_id !== undefined) {
			body.commune_id = data.commune_id === null ? null : Number(data.commune_id);
		}
		assignIfDefined('schedule', data.schedule);
		if (data.is_active !== undefined) body.is_active = Boolean(data.is_active);
		if (data.requires_serial_tracking !== undefined) body.requires_serial_tracking = Boolean(data.requires_serial_tracking);

		const response = await ApiService.fetchData<{ data?: IWarehouse }>({
			url: `/branches/${branchId}/warehouses/${warehouseId}`,
			method: 'patch',
			data: body,
		});
		const warehouse = response.data?.data ?? response.data;
		return warehouse as IWarehouse;
	} catch (error: unknown) {
		return rejectWithValue(extractApiError(error));
	}
});

export const deleteWarehouse = createAsyncThunk<
	number,
	{ branchId: number; warehouseId: number },
	{ rejectValue: IWarehouseApiError }
>('warehouses/deleteWarehouse', async ({ branchId, warehouseId }, { rejectWithValue }) => {
	try {
		await ApiService.fetchData({
			url: `/branches/${branchId}/warehouses/${warehouseId}`,
			method: 'delete',
		});
		return warehouseId;
	} catch (error: unknown) {
		return rejectWithValue(extractApiError(error));
	}
});

export const attachWarehouseProducts = createAsyncThunk<
	IWarehouseDetail,
	{ branchId: number; warehouseId: number; data: IAttachProductRequest },
	{ rejectValue: IWarehouseApiError }
>('warehouses/attachProducts', async ({ branchId, warehouseId, data }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: IWarehouseDetail }, IAttachProductRequest>({
			url: `/branches/${branchId}/warehouses/${warehouseId}/products`,
			method: 'post',
			data,
		});
		const warehouse = response.data?.data ?? response.data;
		return warehouse as IWarehouseDetail;
	} catch (error: unknown) {
		return rejectWithValue(extractApiError(error));
	}
});

export const detachWarehouseProduct = createAsyncThunk<
	IWarehouseDetail,
	{ branchId: number; warehouseId: number; data: IDetachProductRequest },
	{ rejectValue: IWarehouseApiError }
>('warehouses/detachProduct', async ({ branchId, warehouseId, data }, { rejectWithValue }) => {
	try {
		const response = await ApiService.fetchData<{ data?: IWarehouseDetail }, IDetachProductRequest>({
			url: `/branches/${branchId}/warehouses/${warehouseId}/products`,
			method: 'delete',
			data,
		});
		const warehouse = response.data?.data ?? response.data;
		return warehouse as IWarehouseDetail;
	} catch (error: unknown) {
		return rejectWithValue(extractApiError(error));
	}
});

// ==================== Slice ====================

const warehouseSlice = createSlice({
	name: 'warehouses/warehouseSlice',
	initialState,
	reducers: {
		clearWarehouseError: (state) => {
			state.error = null;
			state.warehouseDetailError = null;
		},
		clearWarehouseDetail: (state) => {
			state.warehouseDetail = null;
			state.warehouseDetailError = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchWarehouses.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchWarehouses.fulfilled, (state, action) => {
				state.loading = false;
				state.warehouses = action.payload.items;
				state.meta = action.payload.meta;
				state.stats = action.payload.stats;
			})
			.addCase(fetchWarehouses.rejected, (state, action) => {
				state.loading = false;
				state.error = defaultError(action, 'No se pudieron cargar las bodegas');
			})
			.addCase(fetchWarehouseDetail.pending, (state) => {
				state.warehouseDetailLoading = true;
				state.warehouseDetailError = null;
			})
			.addCase(fetchWarehouseDetail.fulfilled, (state, action) => {
				state.warehouseDetailLoading = false;
				state.warehouseDetail = action.payload;
			})
			.addCase(fetchWarehouseDetail.rejected, (state, action) => {
				state.warehouseDetailLoading = false;
				state.warehouseDetailError = defaultError(action, 'No se pudo obtener el detalle');
			})
			.addCase(createWarehouse.pending, (state) => {
				state.creating = true;
				state.error = null;
			})
			.addCase(createWarehouse.fulfilled, (state, action) => {
				state.creating = false;
				state.warehouses.unshift(action.payload);
				state.stats = computeWarehouseStats(state.warehouses);
				state.meta.total += 1;
			})
			.addCase(createWarehouse.rejected, (state, action) => {
				state.creating = false;
				state.error = defaultError(action, 'No se pudo crear la bodega');
			})
			.addCase(updateWarehouse.pending, (state) => {
				state.updating = true;
				state.error = null;
			})
			.addCase(updateWarehouse.fulfilled, (state, action) => {
				state.updating = false;
				const index = state.warehouses.findIndex((w) => w.id === action.payload.id);
				if (index !== -1) {
					state.warehouses[index] = action.payload;
					state.stats = computeWarehouseStats(state.warehouses);
				}
				if (state.warehouseDetail && state.warehouseDetail.id === action.payload.id) {
					state.warehouseDetail = { ...state.warehouseDetail, ...action.payload };
				}
			})
			.addCase(updateWarehouse.rejected, (state, action) => {
				state.updating = false;
				state.error = defaultError(action, 'No se pudo actualizar la bodega');
			})
			.addCase(deleteWarehouse.pending, (state) => {
				state.deleting = true;
				state.error = null;
			})
			.addCase(deleteWarehouse.fulfilled, (state, action) => {
				state.deleting = false;
				state.warehouses = state.warehouses.filter((w) => w.id !== action.payload);
				state.meta.total = Math.max(0, state.meta.total - 1);
				state.stats = computeWarehouseStats(state.warehouses);
				if (state.warehouseDetail && state.warehouseDetail.id === action.payload) {
					state.warehouseDetail = null;
				}
			})
			.addCase(deleteWarehouse.rejected, (state, action) => {
				state.deleting = false;
				state.error = defaultError(action, 'No se pudo eliminar la bodega');
			})
			.addCase(attachWarehouseProducts.pending, (state) => {
				state.attachingProducts = true;
				state.warehouseDetailError = null;
			})
			.addCase(attachWarehouseProducts.fulfilled, (state, action) => {
				state.attachingProducts = false;
				state.warehouseDetail = action.payload;
				const index = state.warehouses.findIndex((w) => w.id === action.payload.id);
				if (index !== -1) {
					state.warehouses[index] = { ...state.warehouses[index], ...action.payload };
					state.stats = computeWarehouseStats(state.warehouses);
				}
			})
			.addCase(attachWarehouseProducts.rejected, (state, action) => {
				state.attachingProducts = false;
				state.warehouseDetailError = defaultError(action, 'No se pudieron agregar los productos');
			})
			.addCase(detachWarehouseProduct.pending, (state) => {
				state.detachingProduct = true;
				state.warehouseDetailError = null;
			})
			.addCase(detachWarehouseProduct.fulfilled, (state, action) => {
				state.detachingProduct = false;
				state.warehouseDetail = action.payload;
				const index = state.warehouses.findIndex((w) => w.id === action.payload.id);
				if (index !== -1) {
					state.warehouses[index] = { ...state.warehouses[index], ...action.payload };
					state.stats = computeWarehouseStats(state.warehouses);
				}
			})
			.addCase(detachWarehouseProduct.rejected, (state, action) => {
				state.detachingProduct = false;
				state.warehouseDetailError = defaultError(action, 'No se pudo quitar el producto');
			});
	},
});

export const { clearWarehouseError, clearWarehouseDetail } = warehouseSlice.actions;
export default warehouseSlice.reducer;
