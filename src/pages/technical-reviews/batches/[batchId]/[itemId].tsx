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
	selectItemsLoading,
	type EquipmentType,
} from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { fetchProducts } from '@/store/slices/products/productsSlice';
import Textarea from '@/components/form/Textarea';
import Step2FullReview from '@/pages/technical-reviews/components/items/ReviewSteps/Step2FullReview';
import Step3GradeReview from '@/pages/technical-reviews/components/items/ReviewSteps/Step3GradeReview';

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

		// Si itemId es "create", estamos creando un nuevo item, no cargamos
		if (itemId === 'create') {
			console.log('🆕 Modo creación de nuevo item');
			return;
		}

		const parsedItemId = parseInt(itemId);

		// Validar que el ID sea un número válido
		if (isNaN(parsedItemId)) {
			console.error('❌ itemId inválido:', itemId);
			return;
		}

		// Cargar el item si ya existe
		dispatch(fetchItemDetail({ branchId, itemId: parsedItemId }))
			.unwrap()
			.then((loadedItem) => {
				// Sincronizar estados locales con el item cargado
				setItem(loadedItem);
				if (loadedItem.serial_number) setSerialNumber(loadedItem.serial_number);
				if (loadedItem.product_id) setProductId(loadedItem.product_id);
				if (loadedItem.equipment_type) setEquipmentType(loadedItem.equipment_type);

				// Si el item ya está en revisión, ir directamente al paso 2
				if (loadedItem.review_status === 'in_review') {
					setCurrentStep('review');
				} else if (loadedItem.review_status === 'reviewed' || loadedItem.suggested_grade) {
					setCurrentStep('grading');
					setAutomaticGrade(loadedItem.suggested_grade || null);
				}
			})
			.catch((error) => {
				console.error('❌ Error al cargar item:', error);
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

	// STEP 1: Crear item con info básica
	const handleStep1Submit = async () => {
		if (!branchId) {
			console.error('No hay branchId disponible');
			return;
		}

		try {
			const parsedBatchId = batchId ? parseInt(batchId) : 0;

			// Primero crear el item
			const createdItem = await dispatch(
				createItem({
					branchId,
					data: {
						batch_id: parsedBatchId,
						serial_number: serialNumber,
						product_id: productId!,
						equipment_type: equipmentType,
					},
				}),
			).unwrap();

			// Luego iniciar la revisión
			const result = await dispatch(
				startReview({
					branchId,
					itemId: createdItem.id,
				}),
			).unwrap();

			setItem(result);
			setCurrentStep('review');
		} catch (error) {
			console.error('Error al iniciar revisión:', error);
		}
	};

	// STEP 2: Actualizar detalles técnicos (formulario específico por tipo)
	const handleStep2Submit = async () => {
		if (!branchId) {
			console.error('No hay branchId disponible');
			return;
		}

		try {
			await dispatch(
				updateItemDetails({
					branchId,
					itemId: item.id,
					data: reviewDetails,
					equipmentType: item.equipment_type, // Pasar el tipo de equipo
				}),
			).unwrap();

			// Completar revisión para obtener calificación automática
			const grading = await dispatch(
				completeReview({
					branchId,
					itemId: item.id,
				}),
			).unwrap();

			setAutomaticGrade(grading?.grade ?? null);
			setCurrentStep('grading');
		} catch (error) {
			console.error('Error al actualizar detalles:', error);
		}
	};

	// STEP 2 Complete: Handler para cuando Step2FullReview completa
	const handleStep2Complete = async () => {
		if (!branchId || !item) {
			console.error('No hay branchId o item disponible');
			return;
		}

		// Si el item ya fue revisado, ir directo al Step 3
		if (item.review_status === 'reviewed' || item.review_status === 'approved') {
			console.log('⚠️ Item ya revisado, saltando al Step 3');
			setCurrentStep('grading');
			return;
		}

		try {
			// Completar revisión para obtener calificación automática
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
			console.error('Error al completar revisión:', error);
		}
	};

	// STEP 3: Aprobar ítem
	const handleStep3Submit = async () => {
		if (!branchId) {
			console.error('No hay branchId disponible');
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
			console.error('Error al aprobar ítem:', error);
		}
	};

	const steps = [
		{ id: 'basic', label: 'Información Básica', icon: 'HeroDocumentText' },
		{ id: 'review', label: 'Revisión Completa', icon: 'HeroClipboardDocumentCheck' },
		{ id: 'grading', label: 'Calificación', icon: 'HeroCheckBadge' },
	];

	const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

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
							{steps.map((step, index) => (
								<React.Fragment key={step.id}>
									<div
										className={`flex items-center gap-3 ${
											index <= currentStepIndex
												? 'text-blue-600 dark:text-blue-400'
												: 'text-gray-400'
										}`}>
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
											<p className='text-sm font-semibold'>{step.label}</p>
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
							))}
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
											productOptions.find(
												(opt) => opt.value === String(productId ?? ''),
											) || productOptions[0]
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

								<div className='flex justify-end gap-3'>
									<Button
										variant='outline'
										onClick={handleBack}
										isDisable={loading}>
										Cancelar
									</Button>
									<Button
										onClick={handleStep1Submit}
										isDisable={loading || !serialNumber || !productId}>
										Continuar
										<Icon icon='HeroArrowRight' className='ml-2 h-4 w-4' />
									</Button>
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
						initialValues={item?.attributes_json || {}}
						onBack={() => setCurrentStep('basic')}
						onComplete={handleStep2Complete}
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
						equipmentType={equipmentType}
						onBack={() => setCurrentStep('review')}
						onComplete={handleBack}
					/>
				)}
			</Container>
		</PageWrapper>
	);
};

export default ItemReviewPage;
