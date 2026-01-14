import { createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import { EquipmentType, ReviewStatus } from '../../../../interface/technicalReviews.interface';

const TECHNICAL_REVIEWS_PREFIX = (import.meta as any)?.env?.VITE_API_TECHNICAL_REVIEWS_PREFIX || '';
const join = (a: string, b: string) => `${a}${b}`.replace(/([^:])\/\/+/, '$1/');
const ep = (branchId: number, path: string) =>
    join(TECHNICAL_REVIEWS_PREFIX, `/branches/${branchId}/technical-reviews${path}`);

export const fetchDashboardStats = createAsyncThunk<
    { total: number; pending: number; approved: number; rejected: number },
    { branchId: number },
    { rejectValue: string }
>('technicalReviews/fetchDashboardStats', async ({ branchId }, { rejectWithValue }) => {
    try {
        // We use per_page=1 because we only care about the meta.total
        const fetchCount = async (params: any) => {
            const response = await ApiService.fetchData<{ meta?: { total: number } }>({
                url: ep(branchId, '/items'),
                method: 'get',
                params: { ...params, per_page: 1, page: 1 }
            });
            return response.data?.meta?.total || 0;
        };

        const [total, pendingCount, inReviewCount, approved, rejected] = await Promise.all([
            fetchCount({}), // Total items
            fetchCount({ review_status: 'pending' }),
            fetchCount({ review_status: 'in_review' }),
            fetchCount({ review_status: 'approved' }), // Assuming 'approved' is the status for "Aprobados"
            fetchCount({ current_status: 'returned' }) // Assuming 'returned' or similar for "Rechazados" / "Devolución"
        ]);

        const pending = pendingCount + inReviewCount;

        return { total, pending, approved, rejected };

    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        return rejectWithValue(
            error?.response?.data?.message ?? error?.message ?? 'Error fetching dashboard stats'
        );
    }
});
