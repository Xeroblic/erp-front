import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	clearDeferredPaymentDetail,
	fetchDeferredPaymentById,
} from '@/store/slices/deferredPayments/deferredPaymentsSlice';

interface AbortableDetailRequest {
	abort: () => void;
}

const useDeferredPaymentDetail = (documentId: number | null) => {
	const dispatch = useAppDispatch();
	const { branchId, subsidiaryId } = useCurrentBranch();
	const current = useAppSelector((state) => state.deferredPayments.current);
	const loading = useAppSelector((state) => state.deferredPayments.loadingDetail);
	const error = useAppSelector((state) => state.deferredPayments.errorDetail);
	const activeRequestRef = useRef<AbortableDetailRequest | null>(null);
	const effectiveSubsidiaryId = subsidiaryId;
	const document = current?.id === documentId ? current : null;

	const refresh = useCallback(() => {
		activeRequestRef.current?.abort();
		activeRequestRef.current = null;

		if (documentId === null || effectiveSubsidiaryId === null) {
			dispatch(clearDeferredPaymentDetail());
			return undefined;
		}

		const request = dispatch(
			fetchDeferredPaymentById({
				subsidiaryId: effectiveSubsidiaryId,
				documentId,
			}),
		);
		activeRequestRef.current = request;
		return request;
	}, [dispatch, documentId, effectiveSubsidiaryId]);

	useEffect(() => {
		const request = refresh();

		return () => {
			request?.abort();
			activeRequestRef.current?.abort();
			activeRequestRef.current = null;
			dispatch(clearDeferredPaymentDetail());
		};
	}, [dispatch, refresh]);

	return useMemo(
		() => ({
			document,
			loading,
			error,
			actions: { refresh },
			branch: { branchId, subsidiaryId },
			hasDataContext: effectiveSubsidiaryId !== null,
		}),
		[branchId, document, effectiveSubsidiaryId, error, loading, refresh, subsidiaryId],
	);
};

export default useDeferredPaymentDetail;
