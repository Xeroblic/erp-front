import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useAppDispatch } from '@/store';
import { updateItemDetails } from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
// import useAuthorization from '@/hooks/useAuthorization';
import EquipmentFormRouter from '../../../components/forms';
import { ReviewPhotosProvider } from '../../../components/forms/shared/gallery/ReviewPhotosContext';
import useAutoSave from '../../../hooks/useAutoSave';
import AutoSaveConfirmModal from '../../../components/modals/AutoSaveConfirmModal';
import PrefillReviewModal from '../../../components/modals/PrefillReviewModal';
import { sanitizeByAllowedValues } from '../../../components/validation/constants/allowedValuesMap';
import Icon from '@/components/icon/Icon';

interface Step2FullReviewProps {
	equipmentType: string;
	serialNumber: string;
	initialData?: any;
	onBack: () => void;
	onComplete: () => Promise<void>;
	loading?: boolean;
	readOnly?: boolean;
	/** Initial section key to jump to (e.g. 'gallery' shortcut) */
	initialSectionKey?: string;
	/** Called after the gallery has been opened via shortcut */
	onGalleryOpened?: () => void;
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
	initialSectionKey,
	onGalleryOpened,
}) => {
	const dispatch = useAppDispatch();
	const { branchId, subsidiaryId } = useCurrentBranch();
	// const { isSuperAdmin, hasRole } = useAuthorization();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showSavingBadge, setShowSavingBadge] = useState(false);

	// ─── Prefill Integration ──────────────────────────────────────────────────
	const [isPrefillModalOpen, setIsPrefillModalOpen] = useState(false);
	const [prefillMergeValues, setPrefillMergeValues] = useState<Record<string, any>>({});
	const [formKey, setFormKey] = useState(0);

	const handlePrefillSelect = useCallback((details: Record<string, any>) => {
		setPrefillMergeValues(details);
		setFormKey((prev) => prev + 1);
		toast.info(
			'Campos pre-rellenados. Debes guardar o presionar "Siguiente" para conservar estos cambios.',
		);
	}, []);

	// const isEligibleForPrefill =
	// 	(isSuperAdmin || hasRole('super-admin')) && !readOnly;

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

	// Dynamic transformer: strips any constrained field value that is not
	// in the backend's allowed_values list for the current equipment type.
	// Works for ALL equipment types (notebook, desktop, aio, docking, monitor).
	const transformData = useCallback(
		(data: Record<string, unknown>) => {
			return sanitizeByAllowedValues(data, equipmentType);
		},
		[equipmentType],
	);

	const { saveNow, isSaving, lastSavedAt, showIdleSaveModal, dismissIdleSaveModal } = useAutoSave(
		{
			branchId: branchId ?? null,
			itemId: initialData?.id ?? null,
			getFormData,
			enabled: !readOnly && !!initialData?.id && !!branchId,
			idleTimeoutMs: 20_000,
			equipmentType,
			transformData,
		},
	);

	useEffect(() => {
		if (!isSaving) {
			setShowSavingBadge(false);
			return;
		}

		setShowSavingBadge(true);
		const timeoutId = window.setTimeout(() => {
			setShowSavingBadge(false);
		}, 3000);

		return () => window.clearTimeout(timeoutId);
	}, [isSaving]);

	// Clear initialSectionKey after it has been consumed by the form
	useEffect(() => {
		if (initialSectionKey && onGalleryOpened) {
			const id = requestAnimationFrame(() => {
				onGalleryOpened();
			});
			return () => cancelAnimationFrame(id);
		}
	}, [initialSectionKey, onGalleryOpened]);

	// ─── Step Change Handler (auto-save on section navigation) ────────────
	const handleStepChange = useCallback(
		async (_direction: 'next' | 'prev') => {
			// Save current form data when navigating between sections
			await saveNow(true);
		},
		[saveNow],
	);

	// Prepare default values by merging empty fields with factory attributes
	const mergedDefaultValues = React.useMemo(() => {
		const result = { ...(initialData?.details || {}) };

		// Optional: Fallback to attributes_json from item or product to pre-select known specs
		const baseAttributes =
			initialData?.attributes_json || initialData?.product?.attributes_json || {};

		// We only want to pre-fill fields that have no value yet
		for (const key of Object.keys(baseAttributes)) {
			if (result[key] === undefined || result[key] === null || result[key] === '') {
				result[key] = baseAttributes[key];
			}
		}

		return { ...result, ...prefillMergeValues };
	}, [initialData, prefillMergeValues]);

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
					equipmentType, // Provide equipmentType to avoid SQL errors
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
					{/* Prefill button */}
					{/* {isEligibleForPrefill && ( */}
					<Button
						variant='outline'
						color='blue'
						className='h-10 border-blue-600 bg-blue-300/50 px-3 hover:bg-blue-300 dark:border-blue-900/50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20'
						icon='HeroBolt'
						onClick={() => setIsPrefillModalOpen(true)}
						title='Pre-rellenar con equipo similar'>
						Pre-rellenar
					</Button>
					{/* )} */}

					{/* Auto-save indicator */}
					{showSavingBadge && (
						<Badge
							variant='outline'
							color='amber'
							className='inline-flex h-10 animate-pulse items-center whitespace-nowrap border-amber-600 bg-amber-300/35 px-3 font-bold text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300'>
							<span className='inline-flex items-center gap-0.5'>
								<span>Guardando</span>
								<span className='inline-flex'>
									{[0, 150, 300].map((delay, idx) => (
										<span
											key={idx}
											className='inline-block animate-bounce leading-none'
											style={{ animationDelay: `${delay}ms` }}>
											.
										</span>
									))}
								</span>
							</span>
						</Badge>
					)}
					{!showSavingBadge && lastSavedAt && (
						<Badge
							variant='outline'
							color='emerald'
							className='inline-flex h-10 items-center whitespace-nowrap border-emerald-600 bg-emerald-300/35 px-3 font-bold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'>
							<span className='inline-flex items-center gap-1.5'>
								<span>
									Guardado a las {new Date(lastSavedAt).toLocaleTimeString()}
								</span>
								<Icon icon='HeroCheck' className='h-4 w-4' />
							</span>
						</Badge>
					)}
					<Badge
						variant='outline'
						color='blue'
						className='inline-flex h-10 items-center whitespace-nowrap border-blue-600 bg-sky-300/40 px-3 font-bold text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300'>
						{readOnly ? 'Solo Lectura' : 'En Progreso'}
					</Badge>
				</div>
			</div>

			{/* Form Router (envuelto para exponer contexto de fotos a la pestaña Galería) */}
			<ReviewPhotosProvider
				subsidiaryId={subsidiaryId ?? null}
				itemId={initialData?.id ?? null}>
				<EquipmentFormRouter
					key={`form-router-${formKey}`}
					equipmentType={equipmentType}
					defaultValues={mergedDefaultValues}
					onSubmit={handleFormSubmit}
					onBack={onBack}
					isSubmitting={isSubmitting || loading}
					readOnly={readOnly}
					onStepChange={handleStepChange}
					registerGetFormValues={registerGetFormValues}
					isSaving={isSaving}
					initialSectionKey={initialSectionKey}
				/>
			</ReviewPhotosProvider>

			{/* Auto-Save Confirmation Modal */}
			<AutoSaveConfirmModal
				isOpen={showIdleSaveModal}
				onClose={dismissIdleSaveModal}
				savedAt={lastSavedAt}
			/>

			{/* Prefill from same Batch/Product Modal */}
			<PrefillReviewModal
				isOpen={isPrefillModalOpen}
				onClose={() => setIsPrefillModalOpen(false)}
				batchId={initialData?.batch_id || initialData?.batch?.id}
				productId={initialData?.product_id}
				equipmentType={equipmentType}
				currentItemId={initialData?.id}
				onSelectSource={handlePrefillSelect}
			/>
		</div>
	);
};

export default Step2FullReview;
