import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchItemDetail,
	startReview,
	updateItemDetails,
	completeReview,
	approveItem,
	reopenReview,
	selectItemsLoading,
	selectStartingReview,
	selectCompletingReview,
	selectApproving,
	type EquipmentType,
} from '@/store/slices/technicalReviews';
import { fetchProducts } from '@/store/slices/products/productsSlice';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import type { TSelectOption } from '@/components/form/SelectReact';

export type ReviewStep = 'basic' | 'review' | 'grading';

export interface UseItemReviewReturn {
	// State
	currentStep: ReviewStep;
	item: any;
	serialNumber: string;
	productId: number | null;
	equipmentType: EquipmentType;
	automaticGrade: string | null;
	batchDisplayLabel: string;

	// Products
	productOptions: TSelectOption[];
	productsLoading: boolean;

	// Loading states
	loading: boolean;
	startingReview: boolean;
	completingReview: boolean;
	approving: boolean;

	// Setters
	setSerialNumber: (v: string) => void;
	setProductId: (v: number | null) => void;
	setEquipmentType: (v: EquipmentType) => void;

	// Computed
	canContinue: boolean;
	currentStepIndex: number;
	isApproved: boolean;
	normalizedReviewStatus: string;

	// Handlers
	handleBack: () => void;
	handleStepClick: (stepId: ReviewStep) => void;
	handleStep1Submit: () => Promise<void>;
	handleStep2Complete: () => Promise<void>;
	handleStep3Submit: (grade: string, overrideSuggestion?: boolean, overrideReason?: string) => Promise<void>;
	handleRecalculateGrade: () => Promise<void>;
	handleModifyReview: () => Promise<void>;
}

export const REVIEW_STEPS = [
	{ id: 'basic' as ReviewStep, label: 'Información Básica', icon: 'HeroDocumentText', step: 1 },
	{ id: 'review' as ReviewStep, label: 'Revisión Completa', icon: 'HeroClipboardDocumentCheck', step: 2 },
	{ id: 'grading' as ReviewStep, label: 'Calificación', icon: 'HeroCheckBadge', step: 3 },
];

const extractValue = (field: any): string => {
	if (!field) return '';
	if (typeof field === 'object') return field.value || field.label || '';
	return String(field);
};

export const useItemReview = (): UseItemReviewReturn => {
	const { batchId, itemId } = useParams<{ batchId: string; itemId: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();

	const loading = useAppSelector(selectItemsLoading);
	const startingReview = useAppSelector(selectStartingReview);
	const completingReview = useAppSelector(selectCompletingReview);
	const approving = useAppSelector(selectApproving);
	const products = useAppSelector((s) => s.products.items);
	const productsLoading = useAppSelector((s) => s.products.loading);

	const [currentStep, setCurrentStep] = useState<ReviewStep>('basic');
	const [item, setItem] = useState<any>(null);
	const [serialNumber, setSerialNumber] = useState('');
	const [productId, setProductId] = useState<number | null>(null);
	const [equipmentType, setEquipmentType] = useState<EquipmentType>('notebook');
	const [automaticGrade, setAutomaticGrade] = useState<string | null>(null);

	// Load products
	useEffect(() => {
		if (branchId) {
			dispatch(fetchProducts({ branchId, params: { page: 1, per_page: 100 } }));
		}
	}, [dispatch, branchId]);

	// Load item detail
	useEffect(() => {
		if (!itemId || itemId === 'create' || !branchId) return;

		const parsedItemId = parseInt(itemId);

		dispatch(fetchItemDetail({ branchId, itemId: parsedItemId }))
			.unwrap()
			.then((loadedItem) => {
				setItem(loadedItem);
				if (loadedItem.serial_number) setSerialNumber(loadedItem.serial_number);
				if (loadedItem.product_id) setProductId(loadedItem.product_id);

				const equipType = extractValue(loadedItem.equipment_type);
				if (equipType) setEquipmentType(equipType as EquipmentType);

				const reviewStatus = extractValue(loadedItem.review_status);

				if (reviewStatus === 'approved' || reviewStatus === 'reviewed') {
					setCurrentStep('grading');
					setAutomaticGrade(loadedItem.suggested_grade || null);
				} else if (reviewStatus === 'in_review') {
					setCurrentStep('review');
				} else if (reviewStatus === 'pending') {
					dispatch(startReview({ branchId, itemId: parsedItemId }))
						.unwrap()
						.then((reviewedItem) => {
							setItem(reviewedItem);
							setCurrentStep('review');
						})
						.catch((error) => {
							toast.error(`Error al iniciar revisión: ${error}`);
						});
				}
			})
			.catch((error) => {
				toast.error(`Error al cargar item: ${error}`);
			});
	}, [dispatch, itemId, branchId]);

	const productOptions: TSelectOption[] = useMemo(() => {
		if (!products || products.length === 0) {
			return [{ value: '', label: 'No hay productos disponibles' }];
		}
		return [
			{ value: '', label: 'Seleccionar producto con seguimiento por serie' },
			...products.map((product) => ({
				value: String(product.id),
				label: `${product.name} - ${product.sku || ''}`,
			})),
		];
	}, [products]);

	const canContinue = Boolean(serialNumber && productId);

	const batchDisplayLabel = useMemo(() => {
		const fromItem =
			item?.batch?.code ||
			item?.batch?.name ||
			(item?.batch && `Lote #${item.batch.id}`);
		if (fromItem) return fromItem;
		if (batchId) return `Lote #${batchId}`;
		return 'Sin lote';
	}, [item?.batch, batchId]);

	const currentStepIndex = REVIEW_STEPS.findIndex((s) => s.id === currentStep);
	const normalizedReviewStatus = extractValue(item?.review_status);
	const isApproved =
		item?.review_status === 'approved' || item?.review_status?.value === 'approved';

	const handleBack = () => {
		if (batchId) {
			navigate(`/technical-reviews/lotes/${batchId}`);
		} else {
			navigate('/technical-reviews/lotes');
		}
	};

	const handleStepClick = (stepId: ReviewStep) => {
		// When approved: allow free navigation for read-only browsing
		if (isApproved) {
			setCurrentStep(stepId);
			return;
		}
		if (!item && stepId !== 'basic') return;
		if (
			stepId === 'grading' &&
			normalizedReviewStatus !== 'reviewed' &&
			normalizedReviewStatus !== 'approved'
		) {
			toast.warn('Debes finalizar la revisión antes de calificar');
			return;
		}
		setCurrentStep(stepId);
	};

	const handleStep1Submit = async () => {
		if (!branchId || !batchId) {
			toast.error('No hay sucursal o lote disponible');
			return;
		}
		if (!serialNumber || !productId) {
			toast.warn('Número de serie y producto son obligatorios');
			return;
		}

		try {
			const parsedBatchId = parseInt(batchId);

			// Create item
			const createdItem = await dispatch(
				(await import('@/store/slices/technicalReviews')).createItem({
					branchId,
					data: {
						batch_id: parsedBatchId,
						serial_number: serialNumber,
						product_id: productId,
						equipment_type: equipmentType,
					},
				}),
			).unwrap();

			const createdItemId = createdItem.id;

			// Start review
			const result = await dispatch(
				startReview({ branchId, itemId: createdItemId }),
			).unwrap();

			setItem(result);
			setCurrentStep('review');

			// Update URL
			navigate(`/technical-reviews/batches/${batchId}/items/${createdItemId}`, {
				replace: true,
			});
		} catch (error: any) {
			const msg = error?.message || error?.detail || String(error);
			if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('serial')) {
				toast.error(`Serie duplicada: "${serialNumber}" ya existe en este lote`);
			} else {
				toast.error(`Error al crear item: ${msg}`);
			}
		}
	};

	const handleStep2Complete = async () => {
		if (!branchId || !item) {
			toast.error('No hay datos disponibles');
			return;
		}

		const reviewStatus = extractValue(item.review_status);
		if (reviewStatus === 'reviewed' || reviewStatus === 'approved') {
			setCurrentStep('grading');
			return;
		}

		try {
			const grading = await dispatch(
				completeReview({ branchId, itemId: item.id }),
			).unwrap();

			setAutomaticGrade(grading?.grade ?? grading?.suggested_grade ?? null);
			setItem((prev: any) => ({
				...prev,
				...grading,
				review_status: grading?.review_status ?? 'reviewed',
				suggested_grade: grading?.grade ?? grading?.suggested_grade ?? prev?.suggested_grade,
			}));
			setCurrentStep('grading');
		} catch (error) {
			toast.error(`Error al completar revisión: ${error}`);
		}
	};

	const handleStep3Submit = async (
		grade: string,
		overrideSuggestion?: boolean,
		overrideReason?: string,
	) => {
		if (!branchId || !item) {
			toast.error('No hay datos disponibles');
			return;
		}

		try {
			await dispatch(
				approveItem({
					branchId,
					itemId: item.id,
					data: {
						grade: grade ?? automaticGrade ?? 'C',
						...(overrideSuggestion !== undefined && { override_suggestion: overrideSuggestion }),
						...(overrideReason && { override_reason: overrideReason }),
					},
				}),
			).unwrap();

			toast.success('Item aprobado correctamente');
			handleBack();
		} catch (error) {
			toast.error(`Error al aprobar item: ${error}`);
			throw error;
		}
	};

	const handleRecalculateGrade = async () => {
		if (!branchId || !item) return;

		try {
			await dispatch(reopenReview({ branchId, itemId: item.id })).unwrap();

			const grading = await dispatch(
				completeReview({ branchId, itemId: item.id }),
			).unwrap();

			setItem((prevItem: any) => ({
				...prevItem,
				suggested_grade: grading?.grade || grading?.suggested_grade,
				confidence: grading?.confidence,
				breakdown: grading?.breakdown,
				review_status: grading?.review_status ?? prevItem?.review_status,
			}));
			setAutomaticGrade(grading?.grade ?? null);
			toast.success('Grado recalculado');
		} catch (error) {
			toast.error(`Error al recalcular grado: ${error}`);
			throw error;
		}
	};

	const handleModifyReview = async () => {
		if (!branchId || !item) return;

		try {
			const updatedItem = await dispatch(
				reopenReview({ branchId, itemId: item.id }),
			).unwrap();

			setItem(updatedItem);
			setCurrentStep('review');
		} catch (error) {
			toast.error(`Error al reabrir revisión: ${error}`);
			throw error;
		}
	};

	return {
		currentStep,
		item,
		serialNumber,
		productId,
		equipmentType,
		automaticGrade,
		batchDisplayLabel,
		productOptions,
		productsLoading,
		loading,
		startingReview,
		completingReview,
		approving,
		setSerialNumber,
		setProductId,
		setEquipmentType,
		canContinue,
		currentStepIndex,
		isApproved,
		normalizedReviewStatus,
		handleBack,
		handleStepClick,
		handleStep1Submit,
		handleStep2Complete,
		handleStep3Submit,
		handleRecalculateGrade,
		handleModifyReview,
	};
};
