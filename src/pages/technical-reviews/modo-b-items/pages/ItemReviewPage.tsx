/**
 * Technical Reviews - Standalone Item Review (WITHOUT BATCH)
 * ⚠️ FLUJO INDEPENDIENTE - NO MEZCLAR CON BATCHES ⚠️
 *
 * Este componente maneja la revisión de items INDIVIDUALES sin lote asociado.
 * El paso 1 solo solicita número de serie, producto y tipo de equipo (auto-detectado).
 *
 * URL: /technical-reviews/items/{itemId}
 * URL Create: /technical-reviews/items/create
 *
 * DIFERENCIAS CON BATCH FLOW:
 * - ❌ NO acepta batch_id (siempre null)
 * - ✅ Solo requiere serial + producto + tipo (auto)
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchItemDetail,
	createItem,
	startReview,
	completeReview,
	reopenReview,
	selectItemsLoading,
	selectSelectedItem,
	type EquipmentType,
} from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import type { TSelectOption } from '@/components/form/SelectReact';
import { fetchProducts } from '@/store/slices/products/productsSlice';
import { Step1BasicInfo, Step2FullReview, Step3GradeReview } from '../components/steps';
import type { UpdateItemDetailsPayload } from '@/interface/technicalReviews.interface';
import { useAutoSaveReview } from '@/hooks/useAutoSaveReview';
import { toast } from 'react-toastify';
import ApiService from '@/services/ApiService';
// Importar constantes compartidas
import {
	EQUIPMENT_TYPE_OPTIONS,
	REVIEW_STEPS,
	getStepFromReviewStatus,
	getStepIndex,
	extractFieldValue,
	type ReviewStep,
} from '@/pages/technical-reviews/constants';

const mapProductTypeToEquipment = (productType?: string | null): EquipmentType => {
	if (!productType) return 'notebook';
	const normalized = productType.toLowerCase();
	switch (normalized) {
		case 'desktop':
		case 'desktop_pc':
			return 'desktop';
		case 'aio':
			return 'aio';
		case 'docking':
			return 'docking';
		case 'monitor':
			return 'monitor';
		case 'notebook':
			return 'notebook';
		default:
			return 'notebook';
	}
};

const TECHNICAL_REVIEWS_PREFIX =
	(import.meta as any)?.env?.VITE_API_TECHNICAL_REVIEWS_PREFIX || '';
const join = (a: string, b: string) => `${a}${b}`.replace(/([^:])\/\/+/, '$1/');
const ep = (branchId: number, path: string) =>
	join(TECHNICAL_REVIEWS_PREFIX, `/branches/${branchId}/technical-reviews${path}`);

const ItemReviewStandalonePage: React.FC = () => {
	// ⚠️ IMPORTANTE: Solo acepta itemId, NO batchId
	const { itemId } = useParams<{ itemId: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();

	const loading = useAppSelector(selectItemsLoading);
	const products = useAppSelector((s) => s.products.items);
	const productsLoading = useAppSelector((s) => s.products.loading);
	const selectedItemStore = useAppSelector(selectSelectedItem);

	const [currentStep, setCurrentStep] = useState<ReviewStep>('basic');
	const [item, setItem] = useState<any>(null);

	// Step 1: Basic Info
	const [serialNumber, setSerialNumber] = useState('');
	const [productId, setProductId] = useState<number | null>(null);
	const [equipmentType, setEquipmentType] = useState<EquipmentType | null>(null);
	const [hasUserSelectedType, setHasUserSelectedType] = useState(false);
	const [batchOptions, setBatchOptions] = useState<TSelectOption[]>([]);
	const [selectedBatchOption, setSelectedBatchOption] = useState<TSelectOption | null>(null);
	const [batchError, setBatchError] = useState<string | null>(null);
	const [manualBatchId, setManualBatchId] = useState<number | null>(null);
	const [manualBatchLabel, setManualBatchLabel] = useState<string | null>(null);
	const [manualBatchLoading, setManualBatchLoading] = useState(false);

	// Step 3: Grading
	const [automaticGrade, setAutomaticGrade] = useState<string | null>(null);

	// Auto-save hook
	const {
		isDirty,
		isSaving,
		lastSaved,
		saveBasicInfo,
		markDetailsChanged,
		saveDetailsNow,
		resetDirty,
	} = useAutoSaveReview({
		branchId,
		itemId: itemId && itemId !== 'create' ? parseInt(itemId) : undefined,
		reviewStatus: item?.review_status,
		equipmentType: equipmentType || undefined,
		onSaveSuccess: (savedItemId) => {
			// ✅ STANDALONE FLOW: Siempre navegar a /items (nunca a batch)
			if (itemId === 'create') {
				navigate(`/technical-reviews/items/${savedItemId}`, { replace: true });
			}
		},
		onSaveError: (error) => {
			toast.error(`Error: ${error}`, {
				position: 'top-right',
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
			});
		},
	});

	// Cargar productos
useEffect(() => {
	if (branchId) {
		dispatch(fetchProducts({ branchId, params: { page: 1, per_page: 100 } }));
	}
}, [dispatch, branchId]);

useEffect(() => {
	if (!branchId) return;
	let active = true;
	const fetchManualBatch = async () => {
		setManualBatchLoading(true);
		try {
			const response = await ApiService.fetchData<{ data?: any[] }>({
				url: ep(branchId, '/batches'),
				method: 'get',
				params: { per_page: 200 },
			});
			const rawList = Array.isArray(response.data?.data)
				? response.data?.data
				: Array.isArray(response.data)
					? (response.data as any[])
					: [];
			const openBatches = rawList.filter((batch: any) => {
				const status = (batch?.status || '').toLowerCase();
				return status !== 'closed' && status !== 'completed' && status !== 'finished';
			});
			const manual = openBatches.find((batch: any) => {
				const base =
					`${batch?.name ?? ''} ${batch?.code ?? ''} ${batch?.slug ?? ''}`.toLowerCase();
				return base.includes('manual');
			});
			const target = manual ?? openBatches[0];
			if (!active) return;
			const options = openBatches.map((batch: any) => ({
				value: String(batch.id),
				label: batch.code || batch.name || `Lote #${batch.id}`,
			}));
			setBatchOptions(options);
			if (target?.id) {
				const opt = options.find((o) => o.value === String(target.id)) ?? null;
				setSelectedBatchOption(opt);
				setManualBatchId(Number(target.id));
				setManualBatchLabel(opt?.label ?? `Lote #${target.id}`);
				setBatchError(null);
			} else {
				setSelectedBatchOption(null);
				setManualBatchId(null);
				setManualBatchLabel(null);
				setBatchError('No hay lotes abiertos disponibles. Crea uno en la sección de Lotes.');
			}
		} catch (error) {
			console.error('Error al obtener lote manual para revisión técnica', error);
			if (active) {
				setBatchOptions([]);
				setSelectedBatchOption(null);
				setManualBatchId(null);
				setManualBatchLabel(null);
				setBatchError('No se pudieron cargar los lotes abiertos.');
			}
		} finally {
			if (active) setManualBatchLoading(false);
		}
	};
	fetchManualBatch();
	return () => {
		active = false;
	};
}, [branchId]);

	// Filtrar solo productos con seguimiento por serie
	const productsWithSerial = useMemo(
		() => products.filter((p) => p.serial_tracking === true),
		[products],
	);

	const productOptions = useMemo(() => {
		return productsWithSerial.map((p) => ({
			value: String(p.id),
			label: `${p.name} - ${p.sku}`,
		}));
	}, [productsWithSerial]);

	const selectedProductOption = useMemo(() => {
		return productId
			? (productOptions.find((opt) => opt.value === String(productId)) ?? null)
			: null;
	}, [productId, productOptions]);

	useEffect(() => {
		if (!productId) {
			if (!hasUserSelectedType) {
				setEquipmentType(null);
			}
			return;
		}
		const product = productsWithSerial.find((p) => p.id === productId);
		if (!product) return;
		if (!hasUserSelectedType) {
			setEquipmentType(mapProductTypeToEquipment(product.product_type));
		}
	}, [productId, productsWithSerial, hasUserSelectedType]);

const canContinue = Boolean(serialNumber && productId && equipmentType && manualBatchId);
const manualBatchDisplayLabel = manualBatchLabel ?? (manualBatchId ? `#${manualBatchId}` : null);

const handleSerialChange = (value: string) => {
	setSerialNumber(value);
};

const handleProductSelection = (value: number | null) => {
	setProductId(value);
	setHasUserSelectedType(false);
};

const handleEquipmentSelection = (value: EquipmentType) => {
	setEquipmentType(value);
	setHasUserSelectedType(true);
};

const handleBatchOptionChange = (option: TSelectOption | null) => {
	setSelectedBatchOption(option);
	if (option) {
		setManualBatchId(Number(option.value));
		setManualBatchLabel(option.label);
		setBatchError(null);
	} else {
		setManualBatchId(null);
		setManualBatchLabel(null);
		setBatchError('Debes seleccionar un lote abierto.');
	}
};

	// Inicializar modo create
	useEffect(() => {
		if (itemId === 'create') {
			setCurrentStep('basic');
			setItem(null);
			setSerialNumber('');
			setProductId(null);
			setEquipmentType(null);
			setHasUserSelectedType(false);
			return;
		}

		if (!itemId || !branchId) return;

		const parsedItemId = parseInt(itemId);
		dispatch(fetchItemDetail({ branchId, itemId: parsedItemId }));
	}, [dispatch, itemId, branchId]);

	useEffect(() => {
		if (
			!selectedItemStore ||
			!itemId ||
			itemId === 'create' ||
			selectedItemStore.id !== Number(itemId)
		) {
			return;
		}

	setItem(selectedItemStore);
	setSerialNumber(selectedItemStore.serial_number || '');
	setProductId(selectedItemStore.product_id ?? selectedItemStore.product?.id ?? null);
	const normalizedType =
		typeof selectedItemStore.equipment_type === 'object' &&
			selectedItemStore.equipment_type !== null
				? (selectedItemStore.equipment_type as any)?.value
				: selectedItemStore.equipment_type;
	if (normalizedType) {
		setEquipmentType(normalizedType as EquipmentType);
	}
	setHasUserSelectedType(true);
	const existingBatchId = selectedItemStore.batch_id ?? selectedItemStore.batch?.id ?? null;
	if (existingBatchId) {
		const label =
			selectedItemStore.batch?.code ||
			selectedItemStore.batch?.name ||
			`Lote #${existingBatchId}`;
		const option = { value: String(existingBatchId), label };
		setSelectedBatchOption(option);
		setManualBatchId(existingBatchId);
		setManualBatchLabel(label);
		setBatchError(null);
	}

		// Determinar el step correcto basado en el estado del item
		const reviewStatus =
			typeof selectedItemStore.review_status === 'object' &&
			selectedItemStore.review_status !== null
				? (selectedItemStore.review_status as any).value
				: selectedItemStore.review_status;

		if (reviewStatus === 'approved') {
			setCurrentStep('grading');
		} else if (reviewStatus === 'reviewed') {
			setCurrentStep('grading');
		} else if (reviewStatus === 'in_review') {
			setCurrentStep('review');
		} else {
			// Si es 'pending', iniciar en basic pero permitir ir a review
			setCurrentStep('basic');
		}
	}, [selectedItemStore, itemId]);

	// ✅ STANDALONE FLOW: Siempre navegar a lista de items
	const handleBack = () => {
		navigate('/technical-reviews/items');
	};

	// ✅ Lógica simple para items standalone - No necesitamos cargar batch store

	const handleStep1Submit = async () => {
		if (!branchId) {
			console.error('No hay branchId disponible');
			return;
		}

		if (!equipmentType || !serialNumber || !productId) {
			console.error('Faltan datos obligatorios (equipmentType, serialNumber, productId)');
			return;
		}

		if (!manualBatchId) {
			toast.error('Debe existir un lote abierto para asociar la revisión.');
			return;
		}

		try {
			const createdItemId = await saveBasicInfo({
				serial_number: serialNumber,
				product_id: productId,
				equipment_type: equipmentType,
				batch_id: manualBatchId,
			});

			if (!createdItemId) {
				return;
			}

			const result = await dispatch(
				startReview({
					branchId,
					itemId: createdItemId,
				}),
			).unwrap();

			setItem(result);
			setCurrentStep('review');
		} catch (error) {
			console.error('Error al iniciar revisión:', error);
		}
	};

	const steps = [
		{ id: 'basic', label: 'Información Básica', icon: 'HeroDocumentText' },
		{ id: 'review', label: 'Revisión Completa', icon: 'HeroClipboardDocumentCheck' },
		{ id: 'grading', label: 'Calificación', icon: 'HeroCheckBadge' },
	];

	const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

	// Verificar si el item está aprobado (no se puede editar)
	const isApproved =
		item?.review_status === 'approved' || item?.review_status?.value === 'approved';

	// Handler para navegar entre pasos haciendo click
	const handleStepClick = (stepId: ReviewStep) => {
		// No permitir navegación si está aprobado
		if (isApproved) {
			return;
		}

		// Si es creación (no hay item), solo permitir estar en 'basic'
		if (!item && stepId !== 'basic') {
			return;
		}

		// Permitir navegación libre entre los pasos disponibles
		setCurrentStep(stepId);
	};

	// STEP 3: Recalcular grado después de modificaciones
	const handleRecalculateGrade = async () => {
		if (!branchId || !item) {
			console.error('No hay branchId o item disponible para recalcular');
			return;
		}

		try {
			console.log('🔄 Recalculando grado del item...');

			// Paso 1: Volver el item a estado "in_review" (requerido por el backend)
			console.log('📝 Paso 1: Volviendo item a estado in_review...');
			await dispatch(
				reopenReview({
					branchId,
					itemId: item.id,
				}),
			).unwrap();

			// Paso 2: Completar revisión para calcular el nuevo grado
			console.log('📝 Paso 2: Calculando nuevo grado...');
			const grading = await dispatch(
				completeReview({
					branchId,
					itemId: item.id,
				}),
			).unwrap();

			console.log('✅ Grado recalculado:', grading);

			// Actualizar el item con los nuevos valores de gradación
			setItem((prevItem: any) => ({
				...prevItem,
				suggested_grade: grading?.grade || grading?.suggested_grade,
				confidence: grading?.confidence,
				breakdown: grading?.breakdown,
				review_status: grading?.review_status, // Actualizar estado también
			}));

			setAutomaticGrade(grading?.grade ?? null);
		} catch (error) {
			console.error('Error al recalcular grado:', error);
			throw error;
		}
	};

	// STEP 3: Modificar revisión (volver a in_review)
	const handleModifyReview = async () => {
		if (!branchId || !item) {
			console.error('No hay branchId o item disponible para modificar');
			return;
		}

		try {
			console.log('🔙 Volviendo a modo revisión (in_review)...');
			const updatedItem = await dispatch(
				reopenReview({
					branchId,
					itemId: item.id,
				}),
			).unwrap();

			console.log('✅ Item vuelto a in_review:', updatedItem);
			setItem(updatedItem);
		} catch (error) {
			console.error('Error al volver a in_review:', error);
			throw error;
		}
	};

	return (
		<PageWrapper
			name='technical-review-standalone'
			title={itemId === 'create' ? 'Nueva Revisión Global' : `Gestionar Serie #${itemId}`}>
			<Container>
				{/* Header */}
				<div className='mb-6 flex items-center gap-4'>
					<Button variant='outline' onClick={handleBack}>
						<Icon icon='HeroArrowLeft' className='h-4 w-4' />
					</Button>
					<div className='flex-1'>
						<h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
							{item ? `Revisión #${item.id}` : 'Nueva Revisión'}
						</h1>
						<p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
							Revisión individual de item
						</p>
					</div>
				</div>

				{/* Progress Steps */}
				<Card className='mb-6'>
					<CardBody>
						<div className='flex items-center justify-between'>
							{steps.map((step, index) => {
								const canNavigate = !isApproved && (item || step.id === 'basic');
								return (
									<React.Fragment key={step.id}>
										<div
											onClick={() =>
												canNavigate &&
												handleStepClick(step.id as ReviewStep)
											}
											className={`flex items-center gap-3 ${
												index <= currentStepIndex
													? 'text-blue-600 dark:text-blue-400'
													: 'text-gray-400'
											} ${canNavigate ? 'cursor-pointer transition-all hover:scale-105' : 'cursor-not-allowed opacity-60'}`}>
											<div
												className={`flex h-10 w-10 items-center justify-center rounded-full ${
													index < currentStepIndex
														? 'bg-blue-600 text-white'
														: index === currentStepIndex
															? 'border-2 border-blue-600 bg-white text-blue-600 dark:bg-gray-900'
															: 'border-2 border-gray-300 bg-white text-gray-400 dark:bg-gray-900'
												}`}>
												{index < currentStepIndex ? (
													<Icon icon='HeroCheck' className='h-5 w-5' />
												) : (
													<Icon icon={step.icon} className='h-5 w-5' />
												)}
											</div>
											<div className='hidden md:block'>
												<p className='text-sm font-semibold'>
													{step.label}
												</p>
												<p className='text-xs text-gray-500'>
													Paso {index + 1}
												</p>
											</div>
										</div>
										{index < steps.length - 1 && (
											<div
												className={`h-0.5 flex-1 ${
													index < currentStepIndex
														? 'bg-blue-600'
														: 'bg-gray-300'
												}`}
											/>
										)}
									</React.Fragment>
								);
							})}
						</div>
					</CardBody>
				</Card>

				{/* COMENTADO: Item Detail Card - No es necesario durante el flujo de revisión 
			     Usuario debe poder navegar por los steps sin este resumen visual
			{item &&
				itemId &&
				itemId !== 'create' &&
				item.id &&
				item.id === Number(itemId) &&
				currentStep !== 'basic' && (
					<ItemDetail
						item={item}
						loading={loading}
						onEditClick={() => setCurrentStep('review')}
						onApproveClick={() => setCurrentStep('grading')}
						showActions={false}
					/>
				)}
			*/}

				{/* STEP 1: Basic Info */}
				{currentStep === 'basic' && (
					<Step1BasicInfo
						serialNumber={serialNumber}
						onSerialChange={handleSerialChange}
						productId={productId}
						onProductChange={handleProductSelection}
						productOptions={productOptions}
						productsLoading={productsLoading}
						equipmentType={equipmentType}
						onEquipmentTypeChange={handleEquipmentSelection}
						manualBatchLabel={manualBatchDisplayLabel}
						batchOptions={batchOptions}
						selectedBatchOption={selectedBatchOption}
						onBatchChange={handleBatchOptionChange}
						manualBatchLoading={manualBatchLoading}
						manualBatchError={batchError}
						canContinue={canContinue}
						loading={loading}
						onBack={handleBack}
						onSubmit={handleStep1Submit}
					/>
				)}

				{/* STEP 2: Full Review */}
				{currentStep === 'review' && item && branchId && equipmentType && (
					<Step2FullReview
						branchId={branchId}
						itemId={item.id}
						equipmentType={equipmentType}
						initialValues={(() => {
							const attrs = (item.attributes_json ||
								{}) as Partial<UpdateItemDetailsPayload>;
							return attrs;
						})()}
						onBack={() => setCurrentStep('basic')}
						onComplete={async () => {
							// ✅ Usar extractFieldValue desde constantes compartidas
							const reviewStatus = extractFieldValue(item.review_status);

							// Si el item ya fue revisado, ir directo al Step 3 (sin volver a completar)
							if (reviewStatus === 'reviewed' || reviewStatus === 'approved') {
								console.log(
									' Item ya revisado, saltando al Step 3 sin llamar complete-review',
								);
								setCurrentStep('grading');
								return;
							}

							// Solo llamar complete-review si está en 'in_review'
							try {
								console.log(
									'📋 Item en revisión, completando para calcular grado...',
								);
								const grading = await dispatch(
									completeReview({
										branchId,
										itemId: item.id,
									}),
								).unwrap();

								console.log('✅ Grading completo:', grading);
								setAutomaticGrade(grading?.suggested_grade ?? null);
								setItem(grading);
								setCurrentStep('grading');
							} catch (error) {
								console.error('Error al completar revisión:', error);
							}
						}}
						onItemUpdate={(updatedItem) => {
							console.log('📥 Item actualizado desde Step2:', updatedItem);
							setItem(updatedItem); // Actualizar el estado local del item
						}}
						onFieldChange={markDetailsChanged} // Auto-save después de 30s de inactividad
						isDirty={isDirty}
						isSaving={isSaving}
						lastSaved={lastSaved}
					/>
				)}

				{/* STEP 3: Automatic Grading */}
				{currentStep === 'grading' && item && branchId && equipmentType && (
					<Step3GradeReview
						branchId={branchId}
						itemId={item.id}
						suggestedGrade={item.suggested_grade || automaticGrade || 'C'}
						confidence={item.confidence}
						breakdown={item.breakdown}
						serialNumber={serialNumber}
						equipmentType={equipmentType}
						onBack={() => setCurrentStep('review')}
						onComplete={handleBack}
						onRecalculate={handleRecalculateGrade}
						onModifyReview={handleModifyReview}
					/>
				)}
			</Container>
		</PageWrapper>
	);
};

export default ItemReviewStandalonePage;
