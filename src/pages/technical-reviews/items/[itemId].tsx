/**
 * Technical Reviews - Item Review (Modo B - Without Batch)
 * Revisión individual sin lote - mismo flujo de 3 pasos
 * Reutiliza la misma lógica que [batchId]/[itemId].tsx pero sin batch_id
 */
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
	fetchBatchById,
	selectSelectedBatch,
	type EquipmentType,
} from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { fetchProducts } from '@/store/slices/products/productsSlice';
import { Step2FullReview, Step3GradeReview } from '../components/items/ReviewSteps';
import ItemDetail from '../components/items/ItemDetail';
import type { UpdateItemDetailsPayload } from '@/interface/technicalReviews.interface';
import { useAutoSaveReview } from '@/hooks/useAutoSaveReview';

type ReviewStep = 'basic' | 'review' | 'grading';

// Helper: Extraer valor de objeto o devolver string
const extractValue = (field: any): string => {
	if (!field) return '';
	if (typeof field === 'object') {
		return field.value || field.label || '';
	}
	return String(field);
};

const ItemReviewStandalonePage: React.FC = () => {
	const { itemId, batchId: batchIdFromPath } = useParams<{ itemId: string; batchId?: string }>();
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
	const [equipmentType, setEquipmentType] = useState<EquipmentType | null>(null);
	const [hasUserSelectedType, setHasUserSelectedType] = useState(false);

	// Step 3: Grading
	const [automaticGrade, setAutomaticGrade] = useState<string | null>(null);

	// STEP 1: Obtener batch_id (del path o query para compatibilidad)
	const location = useLocation();
	const query = new URLSearchParams(location.search);
	const batchIdFromQuery = query.get('batch_id');
	const batchIdToUse = batchIdFromPath || batchIdFromQuery;

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
			console.log('✅ Guardado exitoso, item ID:', savedItemId);
			// Si era creación, actualizar URL con el ID real
			if (itemId === 'create') {
				if (batchIdToUse) {
					navigate(`/technical-reviews/batches/${batchIdToUse}/items/${savedItemId}`, {
						replace: true,
					});
				} else {
					navigate(`/technical-reviews/items/${savedItemId}`, { replace: true });
				}
			}
		},
		onSaveError: (error) => {
			console.error('❌ Error al guardar:', error);
		},
	});

	// Cargar productos
	useEffect(() => {
		if (branchId) {
			dispatch(fetchProducts({ branchId, params: { page: 1, per_page: 100 } }));
		}
	}, [dispatch, branchId]);

	// Filtrar solo productos con seguimiento por serie
	const productsWithSerial = products.filter((p) => p.serial_tracking === true);

	useEffect(() => {
		if (!itemId || itemId === 'create' || !branchId) return;

		const parsedItemId = parseInt(itemId);

		dispatch(fetchItemDetail({ branchId, itemId: parsedItemId }));
	}, [dispatch, itemId, branchId]);

	const handleBack = () => {
		if (batchIdToUse) {
			navigate(`/technical-reviews/batches/${batchIdToUse}`);
		} else {
			navigate('/technical-reviews/items');
		}
	};

	// Si venimos con batch_id en query, intentar obtener el lote seleccionado
	const selectedBatch = useAppSelector(selectSelectedBatch);

	useEffect(() => {
		if (!batchIdToUse) return;
		const parsed = Number(batchIdToUse);
		if (isNaN(parsed)) return;

		// Si no tenemos el batch en el store o es otro, traerlo
		if (!selectedBatch || selectedBatch.id !== parsed) {
			dispatch(fetchBatchById({ branchId: branchId!, batchId: parsed }));
		}
	}, [batchIdToUse, selectedBatch, dispatch, branchId]);

	// Cuando tengamos el batch en el store, preseleccionar el tipo de equipo dominante
	// SOLO si el usuario NO ha seleccionado manualmente un tipo
	useEffect(() => {
		if (!batchIdToUse || !selectedBatch || hasUserSelectedType) return;
		const parsed = Number(batchIdToUse);
		if (isNaN(parsed) || selectedBatch.id !== parsed) return;

		const byType = selectedBatch.items_summary?.by_equipment_type;
		if (!byType) return;

		// Escoger el tipo con mayor cantidad
		const entries = Object.entries(byType) as Array<[EquipmentType, number]>;
		if (entries.length === 0) return;
		entries.sort((a, b) => b[1] - a[1]);
		const dominant = entries[0][0];
		setEquipmentType(dominant);
	}, [batchIdToUse, selectedBatch, hasUserSelectedType]);

	const handleStep1Submit = async () => {
		if (!branchId) {
			console.error('No hay branchId disponible');
			return;
		}

		if (!equipmentType || !serialNumber || !productId) {
			console.error('Faltan datos obligatorios');
			return;
		}

		try {
			const batchIdValue = batchIdToUse ? Number(batchIdToUse) : 0;

			console.log('🚀 Creando item con:', {
				batch_id: batchIdValue,
				serial_number: serialNumber,
				product_id: productId,
				equipment_type: equipmentType,
			});

			// Usar el hook de auto-save para guardar info básica
			const createdItemId = await saveBasicInfo({
				batch_id: batchIdValue,
				serial_number: serialNumber,
				product_id: productId,
				equipment_type: equipmentType,
			});

			if (!createdItemId) {
				console.error('No se pudo crear el item');
				return;
			}

			console.log('✅ Item creado:', createdItemId);

			// Iniciar la revisión (cambia status a in_review)
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
			console.error('❌ Error al recalcular grado:', error);
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
			console.error('❌ Error al volver a in_review:', error);
			throw error;
		}
	};

	return (
		<PageWrapper name='item-review-standalone'>
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
							{batchIdToUse
								? `Lote #${batchIdToUse}`
								: 'Revisión individual (sin lote)'}
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

				{/* Item Detail Card - Solo si existe el item */}
				{item && currentStep !== 'basic' && (
					<ItemDetail
						item={item}
						loading={loading}
						onEditClick={() => setCurrentStep('review')}
						onApproveClick={() => setCurrentStep('grading')}
						showActions={false}
					/>
				)}

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
										type='text'
										name='serial_number'
										value={serialNumber}
										onChange={(e) => setSerialNumber(e.target.value)}
										className='font-mono'
										placeholder='Ej: SN001234567'
									/>
								</div>

								{/* Product ID */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Producto <span className='text-red-500'>*</span>
									</label>
									{productsLoading ? (
										<div className='text-sm text-gray-500'>
											Cargando productos...
										</div>
									) : (
										<SelectReact
											name='product_id'
											options={productsWithSerial.map((p) => ({
												value: String(p.id),
												label: `${p.name} - ${p.sku}`,
											}))}
											value={
												productId
													? productsWithSerial
															.map((p) => ({
																value: String(p.id),
																label: `${p.name} - ${p.sku}`,
															}))
															.find(
																(opt) =>
																	opt.value === String(productId),
															)
													: null
											}
											onChange={(option) => {
												const selectedOption =
													option as TSelectOption | null;
												setProductId(
													selectedOption
														? parseInt(selectedOption.value)
														: null,
												);
											}}
											placeholder='Seleccionar producto con seguimiento por serie'
											isDisabled={productsLoading}
										/>
									)}
									{productsWithSerial.length === 0 && !productsLoading && (
										<p className='mt-1 text-xs text-amber-600 dark:text-amber-400'>
											⚠️ No hay productos con seguimiento por serie
											disponibles. Debe activar "Seguimiento por Serie" en la
											configuración del producto.
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
												onClick={() => {
													setEquipmentType(type.value as EquipmentType);
													setHasUserSelectedType(true);
												}}
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
										{itemId && itemId !== 'create' ? 'Volver' : 'Cancelar'}
									</Button>

									{/* Mostrar botón Continuar si es creación O Ir a Revisión si ya existe */}
									{itemId === 'create' || !itemId ? (
										<Button
											onClick={handleStep1Submit}
											isDisable={loading || !serialNumber || !productId}>
											Continuar
											<Icon icon='HeroArrowRight' className='ml-2 h-4 w-4' />
										</Button>
									) : (
										<Button
											variant='outline'
											onClick={() => setCurrentStep('review')}
											isDisable={loading}>
											Ir a Revisión Técnica
											<Icon icon='HeroArrowRight' className='ml-2 h-4 w-4' />
										</Button>
									)}
								</div>
							</div>
						</CardBody>
					</Card>
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
							console.log('📋 InitialValues para Step2:', attrs);
							console.log('📋 Item completo:', item);
							return attrs;
						})()}
						onBack={() => setCurrentStep('basic')}
						onComplete={async () => {
							// Extraer el valor del review_status (puede venir como objeto o string)
							const reviewStatus = extractValue(item.review_status);

							// Si el item ya fue revisado, ir directo al Step 3 (sin volver a completar)
							if (reviewStatus === 'reviewed' || reviewStatus === 'approved') {
								console.log(
									'⚠️ Item ya revisado, saltando al Step 3 sin llamar complete-review',
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
