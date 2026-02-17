import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchBatchById,
	updateBatch,
	selectSelectedBatch,
	selectBatchesLoading,
	selectUpdating,
} from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { TColors } from '@/types/colors.type';

export const useDetalleLote = () => {
	const { batchId } = useParams<{ batchId: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();

	const batch = useAppSelector(selectSelectedBatch);
	const loading = useAppSelector(selectBatchesLoading);
	const updatingBatch = useAppSelector(selectUpdating);

	// ── Editable expected quantity ──────────────────────────────
	const [isEditingExpectedQty, setIsEditingExpectedQty] = useState(false);
	const [expectedQtyDraft, setExpectedQtyDraft] = useState('0');
	const [expectedQtyError, setExpectedQtyError] = useState<string | null>(null);

	// ── Fetch batch on mount ───────────────────────────────────
	useEffect(() => {
		if (branchId && batchId) {
			dispatch(fetchBatchById({ branchId, batchId: Number(batchId) }));
		}
	}, [dispatch, branchId, batchId]);

	// Sync draft when batch loads
	useEffect(() => {
		if (batch) {
			setExpectedQtyDraft(String(batch.expected_quantity ?? 0));
		}
	}, [batch?.expected_quantity]);

	// ── Expected Qty handlers ──────────────────────────────────
	const handleStartEditingExpectedQty = () => {
		setExpectedQtyDraft(String(batch?.expected_quantity ?? 0));
		setExpectedQtyError(null);
		setIsEditingExpectedQty(true);
	};

	const handleCancelExpectedQty = () => {
		setExpectedQtyDraft(String(batch?.expected_quantity ?? 0));
		setExpectedQtyError(null);
		setIsEditingExpectedQty(false);
	};

	const handleSaveExpectedQty = async () => {
		const parsedValue = Number(expectedQtyDraft);
		if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
			setExpectedQtyError('Ingresa una cantidad válida mayor a 0');
			return;
		}
		if (!branchId || !batch) {
			setExpectedQtyError('Selecciona una sucursal válida antes de guardar');
			return;
		}
		if (parsedValue === (batch.expected_quantity || 0)) {
			setIsEditingExpectedQty(false);
			return;
		}
		try {
			await dispatch(
				updateBatch({
					branchId,
					batchId: batch.id,
					data: { expected_quantity: parsedValue },
				}),
			).unwrap();
			setIsEditingExpectedQty(false);
			setExpectedQtyError(null);
		} catch (error: any) {
			const message =
				typeof error === 'string'
					? error
					: (error?.message ?? 'No se pudo actualizar la cantidad esperada');
			setExpectedQtyError(message);
		}
	};

	// ── Derived values ─────────────────────────────────────────
	const expectedQty = batch?.expected_quantity || 0;
	const receivedQty = batch?.received_quantity || 0;
	const completedQty = batch?.completed_quantity || 0;
	const pendingQty = receivedQty - completedQty;
	const progressPercentage = expectedQty > 0 ? Math.round((completedQty / expectedQty) * 100) : 0;

	const statusColor = (): TColors => {
		if (!batch) return 'zinc';
		const status = String(batch.status).toUpperCase();
		switch (status) {
			case 'DRAFT':
				return 'blue';
			case 'IN_PROGRESS':
				return 'amber';
			case 'COMPLETED':
				return 'emerald';
			case 'CANCELLED':
				return 'red';
			default:
				return 'zinc';
		}
	};

	return {
		batch,
		loading,
		updatingBatch,
		navigate,
		// Expected quantity editing
		isEditingExpectedQty,
		expectedQtyDraft,
		setExpectedQtyDraft,
		expectedQtyError,
		setExpectedQtyError,
		handleStartEditingExpectedQty,
		handleCancelExpectedQty,
		handleSaveExpectedQty,
		// Derived values
		expectedQty,
		receivedQty,
		completedQty,
		pendingQty,
		progressPercentage,
		statusColor,
	};
};
