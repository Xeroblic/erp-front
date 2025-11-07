/**
 * Technical Reviews - Item Review (3-Step Flow)
 * Flujo de revisión técnica en 3 pasos:
 * 1. Basic Info (serial + product + type)
 * 2. Full Review (formulario específico por tipo)
 * 3. Automatic Grading (calificación automática + aprobación)
 */
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchItemDetail,
	createItem,
	startReview,
	updateItemDetails,
	completeReview,
	approveItem,
	reopenReview,
	selectItemsLoading,
	type EquipmentType,
} from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { fetchProducts } from '@/store/slices/products/productsSlice';
import Textarea from '@/components/form/Textarea';
import Step2FullReview from '@/pages/technical-reviews/components/items/ReviewSteps/Step2FullReview';
import Step3GradeReview from '@/pages/technical-reviews/components/items/ReviewSteps/Step3GradeReview';
import { useAutoSaveReview } from '@/hooks/useAutoSaveReview';
import { toast } from 'react-toastify';

type ReviewStep = 'basic' | 'review' | 'grading';

const ItemReviewPage: React.FC = () => {
	const { batchId, itemId } = useParams<{ batchId: string; itemId: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();

	const loading = useAppSelector(selectItemsLoading);
	const products = useAppSelector((s) => s.products.items);
	const productsLoading = useAppSelector((s) => s.products.loading);

	const [currentStep, setCurrentStep] = useState<ReviewStep>('basic');
	const [item, setItem] = useState<any>(null);

	// Step 1: Basic Info
	const [serialNumber, setSerialNumber] = useState('');
	const [productId, setProductId] = useState<number | null>(null);
	const [equipmentType, setEquipmentType] = useState<EquipmentType>('notebook');

	// Step 2: Review Details (ejemplo para notebook)
	const [reviewDetails, setReviewDetails] = useState<any>({});

	// Step 3: Grading
	const [automaticGrade, setAutomaticGrade] = useState<string | null>(null);

	// Helper: Extraer valor de objeto o devolver string
	const extractValue = (field: any): string => {
		if (!field) return 'N/A';
		if (typeof field === 'object') {
			return field.value || field.label || JSON.stringify(field);
		}
		return String(field);
	};

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
		reviewStatus: item?.review_status?.value || item?.review_status,
		equipmentType: equipmentType,
		onSaveSuccess: (savedItemId) => {
			if (itemId === 'create' && batchId) {
				navigate(`/technical-reviews/batches/${batchId}/items/${savedItemId}`, {
					replace: true,
				});
			}
		},
		onSaveError: (error) => {
			toast.error(`Error al guardar: ${error}`);
		},
	});

	// Cargar productos al montar el componente
	useEffect(() => {
		if (branchId) {
			dispatch(
				fetchProducts({
					branchId,
					params: { page: 1, per_page: 100 },
				}),
			);
		}
	}, [dispatch, branchId]);

	useEffect(() => {
		if (!itemId || !branchId) return;

		const parsedItemId = parseInt(itemId);

		dispatch(fetchItemDetail({ branchId, itemId: parsedItemId }))
			.unwrap()
			.then((loadedItem) => {
				setItem(loadedItem);
				if (loadedItem.serial_number) setSerialNumber(loadedItem.serial_number);
				if (loadedItem.product_id) setProductId(loadedItem.product_id);

				const equipType =
					typeof loadedItem.equipment_type === 'object'
						? (loadedItem.equipment_type as any)?.value
						: loadedItem.equipment_type;
				if (equipType) setEquipmentType(equipType as EquipmentType);

				const reviewStatus =
					typeof loadedItem.review_status === 'object'
						? (loadedItem.review_status as any)?.value
						: loadedItem.review_status;
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
				} else {
					toast.error(`Item en estado desconocido: ${reviewStatus}`);
				}
			})
			.catch((error) => {
				toast.error(`Error al cargar item: ${error}`);
			});
	}, [dispatch, itemId, branchId]);

	// Convertir productos a opciones para SelectReact
	const productOptions: TSelectOption[] = useMemo(() => {
		if (!products || products.length === 0) {
			return [{ value: '', label: 'No hay productos disponibles' }];
		}
		return [
			{ value: '', label: 'Seleccionar producto' },
			...products.map((product) => ({
				value: String(product.id),
				label: `${product.name} - ${product.sku || ''}`,
			})),
		];
	}, [products]);

	const handleBack = () => {
		if (batchId) {
			navigate(`/technical-reviews/batches/${batchId}`);
		} else {
			navigate('/technical-reviews/items');
		}
	};

	// STEP 1: Crear item con info básica (status=pending) y luego iniciar revisión (status=in_review)
	const handleStep1Submit = async () => {
		if (!branchId || !batchId) {
			toast.error('No hay branchId o batchId disponible');
			return;
		}

		if (!serialNumber || !productId) {
			toast.warn('Faltan datos obligatorios');
			return;
		}

		try {
			const parsedBatchId = parseInt(batchId);

			// Usar el hook de auto-save para guardar info básica
			const createdItemId = await saveBasicInfo({
				batch_id: parsedBatchId,
				serial_number: serialNumber,
				product_id: productId,
				equipment_type: equipmentType,
			});

			if (!createdItemId) {
				toast.error('No se pudo crear el item');
				return;
			}

			// Iniciar revisión (cambia status a in_review)
			const result = await dispatch(
				startReview({
					branchId,
					itemId: createdItemId,
				}),
			).unwrap();

			setItem(result);
			setCurrentStep('review');
		} catch (error) {
			toast.error(`Error al iniciar revisión: ${error}`);
		}
	};

	// STEP 2: Actualizar detalles técnicos (formulario específico por tipo)
	const handleStep2Submit = async () => {
		if (!branchId) {
			toast.error('No hay branchId disponible');
			return;
		}

		try {
			await dispatch(
				updateItemDetails({
					branchId,
					itemId: item.id,
					data: reviewDetails,
					equipmentType: item.equipment_type,
				}),
			).unwrap();

			const grading = await dispatch(
				completeReview({
					branchId,
					itemId: item.id,
				}),
			).unwrap();

			setAutomaticGrade(grading?.grade ?? null);
			setCurrentStep('grading');
		} catch (error) {
			toast.error(`Error al actualizar detalles: ${error}`);
		}
	};

	const handleStep2Complete = async () => {
		if (!branchId || !item) {
			toast.error('No hay branchId o item disponible');
			return;
		}
		const reviewStatus = extractValue(item.review_status);

		if (reviewStatus === 'reviewed' || reviewStatus === 'approved') {
			setCurrentStep('grading');
			return;
		}

		try {
			const grading = await dispatch(
				completeReview({
					branchId,
					itemId: item.id,
				}),
			).unwrap();

			setAutomaticGrade(grading?.grade ?? null);
			setItem({ ...item, ...grading }); // Actualizar item con datos de grading
			setCurrentStep('grading');
		} catch (error) {
			toast.error(`Error al completar revisión: ${error}`);
		}
	};

	// STEP 3: Recalcular grado después de modificaciones
	const handleRecalculateGrade = async () => {
		if (!branchId || !item) {
			toast.error('No hay branchId o item disponible para recalcular');
			return;
		}

		try {
			await dispatch(
				reopenReview({
					branchId,
					itemId: item.id,
				}),
			).unwrap();

			const grading = await dispatch(
				completeReview({
					branchId,
					itemId: item.id,
				}),
			).unwrap();

			setItem((prevItem: any) => ({
				...prevItem,
				suggested_grade: grading?.grade || grading?.suggested_grade,
				confidence: grading?.confidence,
				breakdown: grading?.breakdown,
				review_status: grading?.review_status, // Actualizar estado también
			}));

			setAutomaticGrade(grading?.grade ?? null);
		} catch (error) {
			toast.error(`Error al recalcular grado: ${error}`);
			throw error;
		}
	};

	// STEP 3: Modificar revisión (volver a in_review)
	const handleModifyReview = async () => {
		if (!branchId || !item) {
			return;
		}

		try {
			const updatedItem = await dispatch(
				reopenReview({
					branchId,
					itemId: item.id,
				}),
			).unwrap();

			setItem(updatedItem);
		} catch (error) {
			throw error;
		}
	};

	// STEP 3: Aprobar ítem
	const handleStep3Submit = async () => {
		if (!branchId) {
			toast.error('No hay branchId disponible');
			return;
		}

		try {
			await dispatch(
				approveItem({
					branchId,
					itemId: item.id,
					data: {
						grade: automaticGrade ?? 'C', // Usar el grado automático o C por defecto
					},
				}),
			).unwrap();

			// Volver al listado
			handleBack();
		} catch (error) {
			toast.error(`Error al aprobar ítem: ${error}`);
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

	return (
		<PageWrapper name='item-review'>
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
							{batchId ? `Lote #${batchId}` : 'Revisión global (sin lote)'}
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

				{/* STEP 1: Basic Info */}
				{currentStep === 'basic' && (
					<Card>
						<CardHeader>
							<h3 className='text-lg font-semibold'>Paso 1: Información Básica</h3>
							<p className='text-sm text-gray-600'>
								Ingresa el número de serie, producto y tipo de equipo
							</p>
						</CardHeader>
						<CardBody>
							<div className='space-y-6'>
								{/* Serial Number */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Número de Serie <span className='text-red-500'>*</span>
									</label>
									<Input
										name='serial_number'
										type='text'
										value={serialNumber}
										onChange={(e: any) => setSerialNumber(e.target.value)}
										className='font-mono'
										placeholder='Ej: SN001234567'
									/>
								</div>

								{/* Product ID */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Producto <span className='text-red-500'>*</span>
									</label>
									<SelectReact
										name='product_id'
										placeholder='Seleccionar producto'
										options={productOptions}
										value={
											productId
												? productOptions.find(
														(opt) => opt.value === String(productId),
													) || null
												: null
										}
										onChange={(option) => {
											const selectedOption = option as TSelectOption | null;
											setProductId(
												selectedOption?.value
													? parseInt(selectedOption.value)
													: null,
											);
										}}
										isDisabled={productsLoading}
									/>
									{productsLoading && (
										<p className='mt-1 text-xs text-gray-500'>
											Cargando productos...
										</p>
									)}
								</div>

								{/* Equipment Type */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Tipo de Equipo <span className='text-red-500'>*</span>
									</label>
									<div className='grid grid-cols-2 gap-3 md:grid-cols-5'>
										{[
											{
												value: 'notebook',
												label: 'Notebook',
												icon: 'HeroComputerDesktop',
											},
											{
												value: 'desktop',
												label: 'Desktop',
												icon: 'HeroServerStack',
											},
											{
												value: 'aio',
												label: 'All-in-One',
												icon: 'HeroDeviceTablet',
											},
											{
												value: 'docking',
												label: 'Docking',
												icon: 'HeroCube',
											},
											{
												value: 'monitor',
												label: 'Monitor',
												icon: 'HeroTv',
											},
										].map((type) => (
											<button
												key={type.value}
												type='button'
												onClick={() =>
													setEquipmentType(type.value as EquipmentType)
												}
												className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
													equipmentType === type.value
														? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950'
														: 'border-gray-300 hover:border-blue-300'
												}`}>
												<Icon icon={type.icon} className='h-8 w-8' />
												<span className='text-sm font-medium'>
													{type.label}
												</span>
											</button>
										))}
									</div>
								</div>

								{/* Botones de acción */}
								<div className='flex justify-between gap-3'>
									<Button
										variant='outline'
										onClick={handleBack}
										isDisable={loading}>
										{itemId && itemId !== 'create'
											? 'Volver al Lote'
											: 'Cancelar'}
									</Button>

									{/* Mostrar botón Continuar si es creación O si ya existe pero queremos avanzar */}
									{itemId === 'create' || !itemId ? (
										<Button
											onClick={handleStep1Submit}
											isDisable={loading || !serialNumber || !productId}>
											Continuar
											<Icon icon='HeroArrowRight' className='ml-2 h-4 w-4' />
										</Button>
									) : (
										<div className='flex gap-3'>
											<Button
												variant='outline'
												onClick={() => setCurrentStep('review')}
												isDisable={loading}>
												Ir a Revisión Técnica
												<Icon
													icon='HeroArrowRight'
													className='ml-2 h-4 w-4'
												/>
											</Button>
										</div>
									)}
								</div>
							</div>
						</CardBody>
					</Card>
				)}

				{/* STEP 2: Full Review */}
				{currentStep === 'review' && item && (
					<Step2FullReview
						branchId={branchId}
						itemId={item.id}
						equipmentType={equipmentType}
						initialValues={item?.details || item?.attributes_json || {}}
						onBack={() => setCurrentStep('basic')}
						onComplete={handleStep2Complete}
						onItemUpdate={(updatedItem) => {
							toast.info(`Item actualizado desde Step2: ${updatedItem}`);
							setItem(updatedItem); // Actualizar el estado local del item
						}}
						onFieldChange={undefined} // Desactivar auto-save, solo guardado manual
						isDirty={isDirty}
						isSaving={isSaving}
						lastSaved={lastSaved}
					/>
				)}

				{/* STEP 3: Automatic Grading */}
				{currentStep === 'grading' && item && (
					<Step3GradeReview
						branchId={branchId}
						itemId={item.id}
						suggestedGrade={item.suggested_grade || automaticGrade || 'C'}
						confidence={item.confidence || 0}
						breakdown={item.breakdown || {}}
						serialNumber={serialNumber || item.serial_number}
						equipmentType={String(equipmentType)}
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

export default ItemReviewPage;
