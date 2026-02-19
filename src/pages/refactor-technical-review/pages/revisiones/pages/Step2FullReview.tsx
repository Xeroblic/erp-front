import React, { useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import Badge from '@/components/ui/Badge';
import { useAppDispatch } from '@/store';
import { updateItemDetails } from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import EquipmentFormRouter from '../../../components/forms';
import useAutoSave from '../../../hooks/useAutoSave';
import AutoSaveConfirmModal from '../../../components/modals/AutoSaveConfirmModal';

interface Step2FullReviewProps {
	equipmentType: string;
	serialNumber: string;
	initialData?: any;
	onBack: () => void;
	onComplete: () => Promise<void>;
	loading?: boolean;
	readOnly?: boolean;
}

const EQUIPMENT_LABEL_MAP: Record<string, string> = {
	notebook: 'Notebook',
	desktop: 'Desktop',
	aio: 'All-in-One',
	docking: 'Docking Station',
	monitor: 'Monitor',
};

const Step2FullReview: React.FC<Step2FullReviewProps> = ({
	equipmentType,
	serialNumber,
	initialData,
	onBack,
	onComplete,
	loading = false,
	readOnly = false,
}) => {
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	// ─── Auto-Save Integration ───────────────────────────────────────────────
	// Ref to hold the getter function registered by the form
	const getFormValuesRef = useRef<(() => Record<string, unknown>) | null>(null);

	const registerGetFormValues = useCallback((getter: () => Record<string, unknown>) => {
		getFormValuesRef.current = getter;
	}, []);

	const getFormData = useCallback((): Record<string, unknown> => {
		if (getFormValuesRef.current) {
			return getFormValuesRef.current();
		}
		return {};
	}, []);

	const { saveNow, isSaving, lastSavedAt, showIdleSaveModal, dismissIdleSaveModal } = useAutoSave(
		{
			branchId: branchId ?? null,
			itemId: initialData?.id ?? null,
			getFormData,
			enabled: !readOnly && !!initialData?.id && !!branchId,
			idleTimeoutMs: 20_000,
			equipmentType,
		},
	);

	// ─── Step Change Handler (auto-save on section navigation) ────────────
	const handleStepChange = useCallback(
		async (_direction: 'next' | 'prev') => {
			// Save current form data when navigating between sections
			await saveNow(true);
		},
		[saveNow],
	);

	// ─── Final Submit (original behavior) ────────────────────────────────────
	const handleFormSubmit = async (data: any) => {
		if (!branchId || !initialData?.id) {
			toast.error('No se pudo identificar el item para guardar');
			return;
		}

		setIsSubmitting(true);
		try {
			await dispatch(
				updateItemDetails({
					branchId,
					itemId: initialData.id,
					data,
				}),
			).unwrap();

			await onComplete();
		} catch (error: any) {
			console.error(error);
			toast.error(error?.message || 'Error al guardar la revisión');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='space-y-4'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h2 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>
						Revisión de{' '}
						{EQUIPMENT_LABEL_MAP[equipmentType.toLowerCase()] || equipmentType}
					</h2>
					<p className='text-sm text-zinc-500'>
						Serie: <span className='font-mono font-semibold'>{serialNumber}</span>
					</p>
				</div>
				<div className='flex items-center gap-2'>
					{/* Auto-save indicator */}
					{isSaving && (
						<Badge variant='outline' color='amber' className='animate-pulse'>
							Guardando...
						</Badge>
					)}
					{!isSaving && lastSavedAt && (
						<Badge variant='outline' color='emerald'>
							Guardado ✓
						</Badge>
					)}
					<Badge variant='outline' color='blue'>
						{readOnly ? 'Solo Lectura' : 'En Progreso'}
					</Badge>
				</div>
			</div>

			{/* Form Router */}
			<EquipmentFormRouter
				equipmentType={equipmentType}
				defaultValues={initialData?.details || {}}
				onSubmit={handleFormSubmit}
				onBack={onBack}
				isSubmitting={isSubmitting || loading}
				readOnly={readOnly}
				onStepChange={handleStepChange}
				registerGetFormValues={registerGetFormValues}
				isSaving={isSaving}
			/>

			{/* Auto-Save Confirmation Modal */}
			<AutoSaveConfirmModal
				isOpen={showIdleSaveModal}
				onClose={dismissIdleSaveModal}
				savedAt={lastSavedAt}
			/>
		</div>
	);
};

export default Step2FullReview;
