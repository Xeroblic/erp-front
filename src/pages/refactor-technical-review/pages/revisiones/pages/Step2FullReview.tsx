import React from 'react';
import { toast } from 'react-toastify';
import Badge from '@/components/ui/Badge';
import { useAppDispatch } from '@/store';
import { updateItemDetails } from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import EquipmentFormRouter from '../../../components/forms';

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

	// Generic submit handler for all equipment types
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
				<Badge variant='outline' color='blue'>
					{readOnly ? 'Solo Lectura' : 'En Progreso'}
				</Badge>
			</div>

			{/* Form Router */}
			<EquipmentFormRouter
				equipmentType={equipmentType}
				defaultValues={initialData}
				onSubmit={handleFormSubmit}
				onBack={onBack}
				isSubmitting={isSubmitting || loading}
				readOnly={readOnly}
			/>
		</div>
	);
};

export default Step2FullReview;
