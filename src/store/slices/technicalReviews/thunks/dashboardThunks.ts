import { createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type { RootState } from '@/store/rootReducer';
import {
	buildTechnicalReviewsEndpoint,
	resolveTechnicalReviewsContext,
} from '../technicalReviewsContext';
import { setTechnicalReviewsContext } from '../slice/technicalReviewsSlice';

export const fetchDashboardStats = createAsyncThunk<
	{ total: number; pending: number; approved: number; rejected: number },
	{ branchId?: number | null; subsidiaryId?: number | null },
	{ state: RootState; rejectValue: string }
>(
	'technicalReviews/fetchDashboardStats',
	async ({ branchId, subsidiaryId }, { getState, dispatch, rejectWithValue }) => {
		try {
			const context = resolveTechnicalReviewsContext(getState(), { branchId, subsidiaryId });
			dispatch(
				setTechnicalReviewsContext({
					branchId: context.branchId,
					subsidiaryId: context.subsidiaryId,
				}),
			);

			const fetchCount = async (params: any) => {
				const response = await ApiService.fetchData<{ meta?: { total: number } }>({
					url: buildTechnicalReviewsEndpoint(context, '/items'),
					method: 'get',
					params: { ...params, per_page: 1, page: 1 },
				});
				return response.data?.meta?.total || 0;
			};

			const [total, pendingCount, inReviewCount, approved, rejected] = await Promise.all([
				fetchCount({}),
				fetchCount({ review_status: 'pending' }),
				fetchCount({ review_status: 'in_review' }),
				fetchCount({ review_status: 'approved' }),
				fetchCount({ current_status: 'returned' }),
			]);

			const pending = pendingCount + inReviewCount;

			return { total, pending, approved, rejected };
		} catch (error: any) {
			console.error('Error fetching dashboard stats:', error);
			return rejectWithValue(
				error?.response?.data?.message ??
					error?.message ??
					'Error fetching dashboard stats',
			);
		}
	},
);
