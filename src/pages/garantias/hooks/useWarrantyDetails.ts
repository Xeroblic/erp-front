import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	getDaysRemainingLabel,
	getWarrantyPeriod,
	getWarrantyTypeLabel,
} from '../utils/warranty.utils';
import { fetchWarrantyDetails } from '@/store/slices/garantias/thunks';
import { clearDetail } from '@/store/slices/garantias/garantiasSlice';

export const useWarrantyDetails = (subsidiaryId?: number | null, warrantyId?: number | null) => {
	const dispatch = useAppDispatch();
	const { detail, loading, error } = useAppSelector((state) => state.garantias);

	const loadDetail = useCallback(async () => {
		if (!subsidiaryId || !warrantyId) return;
		await dispatch(fetchWarrantyDetails({ subsidiaryId, warrantyId }));
	}, [dispatch, subsidiaryId, warrantyId]);

	useEffect(() => {
		loadDetail();
		return () => {
			dispatch(clearDetail());
		};
	}, [loadDetail, dispatch]);

	const decoratedDetail = useMemo(() => {
		if (!detail) return null;
		return {
			...detail,
			warrantyTypeLabel: getWarrantyTypeLabel(detail.product),
			periodLabel: getWarrantyPeriod(detail.start_date, detail.end_date),
			daysRemaining: getDaysRemainingLabel(detail.end_date),
		};
	}, [detail]);

	return {
		detail: decoratedDetail,
		loading,
		error,
		reload: loadDetail,
	};
};
