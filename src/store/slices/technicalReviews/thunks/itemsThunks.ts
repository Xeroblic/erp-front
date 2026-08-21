/**
 * Items Thunks - Gestión de Series/Ítems (Vista Global)
 * Endpoints relacionados con la gestión individual de series de equipos
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type { RootState } from '@/store/rootReducer';
import type {
	IItem,
	FetchItemsParams,
	EquipmentType,
} from '../../../../interface/technicalReviews.interface';
import {
	buildTechnicalReviewsEndpoint,
	resolveTechnicalReviewsContext,
} from '../technicalReviewsContext';
import { setTechnicalReviewsContext } from '../slice/technicalReviewsSlice';

const normalizeArray = (payload: any): any[] => {
	const raw = payload?.data ?? payload;
	return Array.isArray(raw) ? raw : [];
};

const normalizeObject = (payload: any): any => payload?.data ?? payload ?? null;


export const fetchItems = createAsyncThunk<
	{ items: IItem[]; meta?: any },
	{ branchId?: number | null; subsidiaryId?: number | null; params?: FetchItemsParams },
	{ state: RootState; rejectValue: string }
>('technicalReviews/fetchItems', async ({ branchId, subsidiaryId, params }, { getState, dispatch, rejectWithValue }) => {
	try {
		const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
		dispatch(
			setTechnicalReviewsContext({
				branchId: context.branchId,
				subsidiaryId: context.subsidiaryId,
			}),
		);
		const response = await ApiService.fetchData<{ data?: any[]; meta?: any }>({
			url: buildTechnicalReviewsEndpoint(context, '/items'),
			method: 'get',
			params: {
				batch_id: params?.batch_id,
				warehouse_id: params?.warehouse_id,
				equipment_type: params?.equipment_type,
				review_status: params?.review_status,
				current_status: params?.current_status,
				grade: params?.grade,
				serial_number: params?.serial_number,
				search: params?.search,
				page: params?.page ?? 1,
				per_page: params?.per_page ?? 30,
			},
		});

		const items = normalizeArray(response.data) as IItem[];
		const meta = response.data?.meta ?? null;

		return { items, meta };
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'No se pudieron cargar las series',
		);
	}
});

/**
 * Detalle de Serie
 * GET /api/branches/{branch}/technical-reviews/items/{item}
 */
export const fetchItemDetail = createAsyncThunk<
	IItem,
	{ branchId?: number | null; subsidiaryId?: number | null; itemId: number },
	{ state: RootState; rejectValue: string }
>('technicalReviews/fetchItemDetail', async ({ branchId, subsidiaryId, itemId }, { getState, dispatch, rejectWithValue }) => {
	try {
		const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
		dispatch(
			setTechnicalReviewsContext({
				branchId: context.branchId,
				subsidiaryId: context.subsidiaryId,
			}),
		);
		const response = await ApiService.fetchData<{ data?: any }>({
			url: buildTechnicalReviewsEndpoint(context, `/items/${itemId}`),
			method: 'get',
		});

		return normalizeObject(response.data) as IItem;
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ??
				error?.message ??
				'No se pudo cargar el detalle de la serie',
		);
	}
});

/**
 * Registrar nueva serie en el sistema
 * POST /api/branches/{branch}/technical-reviews/items
 * Efecto: review_status=pending, current_status=received
 */
export const createItem = createAsyncThunk<
	IItem,
	{
		branchId?: number | null;
		subsidiaryId?: number | null;
		data: {
			batch_id?: number | null;
			serial_number: string;
			product_id?: number;
			warehouse_id?: number;
			customer_supplier_id?: number | null;
			equipment_type?: EquipmentType;
			extra_attributes?: Record<string, any>;
		};
	},
	{ state: RootState; rejectValue: string }
>('technicalReviews/createItem', async ({ branchId, subsidiaryId, data }, { getState, dispatch, rejectWithValue }) => {
	try {
		const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
		dispatch(
			setTechnicalReviewsContext({
				branchId: context.branchId,
				subsidiaryId: context.subsidiaryId,
			}),
		);
		const response = await ApiService.fetchData<{ data?: any }>({
			url: buildTechnicalReviewsEndpoint(context, '/items'),
			method: 'post',
			data,
		});

		return normalizeObject(response.data) as IItem;
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'No se pudo ingresar la serie',
		);
	}
});

/**
 * Actualizar datos básicos del ítem
 * PATCH /api/branches/{branch}/technical-reviews/items/{item}
 */
export const updateItem = createAsyncThunk<
	IItem,
	{
		branchId?: number | null;
		subsidiaryId?: number | null;
		itemId: number;
		data: Partial<{
			batch_id: number;
			serial_number: string;
			product_id: number;
			equipment_type: EquipmentType;
			warehouse_id: number;
			customer_supplier_id: number | null;
		}>;
	},
	{ state: RootState; rejectValue: string }
>('technicalReviews/updateItem', async ({ branchId, subsidiaryId, itemId, data }, { getState, dispatch, rejectWithValue }) => {
	try {
		const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
		dispatch(
			setTechnicalReviewsContext({
				branchId: context.branchId,
				subsidiaryId: context.subsidiaryId,
			}),
		);
		const response = await ApiService.fetchData<{ data?: any }>({
			url: buildTechnicalReviewsEndpoint(context, `/items/${itemId}`),
			method: 'patch',
			data,
		});

		return normalizeObject(response.data) as IItem;
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'No se pudo actualizar el ítem',
		);
	}
});


export const deleteItem = createAsyncThunk<
	number,
	{ branchId?: number | null; subsidiaryId?: number | null; itemId: number },
	{ state: RootState; rejectValue: string }
>('technicalReviews/deleteItem', async ({ branchId, subsidiaryId, itemId }, { getState, dispatch, rejectWithValue }) => {
	try {

		const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });

		dispatch(
			setTechnicalReviewsContext({
				branchId: context.branchId,
				subsidiaryId: context.subsidiaryId,
			}),
		);
		await ApiService.fetchData({
			url: buildTechnicalReviewsEndpoint(context, `/items/${itemId}`),
			method: 'delete',
		});
		return itemId;
	} catch (error: any) {
		return rejectWithValue(
			error?.response?.data?.message ?? error?.message ?? 'No se pudo eliminar la serie',
		);
	}
});
