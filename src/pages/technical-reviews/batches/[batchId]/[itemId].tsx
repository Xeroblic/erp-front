/**
 * Technical Reviews - Item Review (3-Step Flow)
 * Flujo de revisión técnica en 3 pasos:
 * 1. Basic Info (serial + product + type)
 * 2. Full Review (formulario específico por tipo)
 * 3. Automatic Grading (calificación automática + aprobación)
 */
import React, { useEffect, useState } from 'react';
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
	updateItemDetails,
	completeReview,
	approveItem,
	selectItemsLoading,
	type EquipmentType,
} from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';

type ReviewStep = 'basic' | 'review' | 'grading';

const ItemReviewPage: React.FC = () => {
	const { batchId, itemId } = useParams<{ batchId: string; itemId: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();

	const loading = useAppSelector(selectItemsLoading);

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

	useEffect(() => {
		if (!itemId || !branchId) return;

		const parsedItemId = parseInt(itemId);

		// Cargar el item si ya existe
		dispatch(fetchItemDetail({ branchId, itemId: parsedItemId }));
	}, [dispatch, itemId, branchId]);

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
									<input
										type='text'
										value={serialNumber}
										onChange={(e) => setSerialNumber(e.target.value)}
										className='w-full rounded-lg border border-gray-300 p-2.5 font-mono text-sm'
										placeholder='Ej: SN001234567'
									/>
								</div>

								{/* Product ID */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Producto <span className='text-red-500'>*</span>
									</label>
									<select
										value={productId ?? ''}
										onChange={(e) =>
											setProductId(
												e.target.value ? parseInt(e.target.value) : null,
											)
										}
										className='w-full rounded-lg border border-gray-300 p-2.5 text-sm'>
										<option value=''>Seleccionar producto</option>
										{/* TODO: Cargar productos dinámicamente */}
										<option value='1'>Producto A</option>
										<option value='2'>Producto B</option>
									</select>
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
				{currentStep === 'review' && (
					<Card>
						<CardHeader>
							<h3 className='text-lg font-semibold'>
								Paso 2: Revisión Técnica Completa
							</h3>
							<p className='text-sm text-gray-600'>
								Formulario específico para {equipmentType}
							</p>
						</CardHeader>
						<CardBody>
							<div className='space-y-6'>
								<div className='rounded-lg bg-yellow-50 p-4 dark:bg-yellow-950'>
									<p className='text-sm text-yellow-800 dark:text-yellow-300'>
										<Icon
											icon='HeroExclamationTriangle'
											className='mr-2 inline h-5 w-5'
										/>
										TODO: Implementar formulario específico para {equipmentType}
									</p>
									<p className='mt-2 text-xs text-yellow-700 dark:text-yellow-400'>
										Aquí se renderizará el formulario correspondiente
										(NotebookForm, DesktopForm, AioForm, etc.)
									</p>
								</div>

								{/* Ejemplo de campos genéricos */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Observaciones
									</label>
									<textarea
										value={reviewDetails.observations || ''}
										onChange={(e) =>
											setReviewDetails({
												...reviewDetails,
												observations: e.target.value,
											})
										}
										className='w-full rounded-lg border border-gray-300 p-2.5 text-sm'
										rows={4}
										placeholder='Notas sobre el estado del equipo...'
									/>
								</div>

								<div className='flex justify-between'>
									<Button
										variant='outline'
										onClick={() => setCurrentStep('basic')}>
										<Icon icon='HeroArrowLeft' className='mr-2 h-4 w-4' />
										Volver
									</Button>
									<Button onClick={handleStep2Submit} isDisable={loading}>
										Finalizar Revisión
										<Icon icon='HeroArrowRight' className='ml-2 h-4 w-4' />
									</Button>
								</div>
							</div>
						</CardBody>
					</Card>
				)}

				{/* STEP 3: Automatic Grading */}
				{currentStep === 'grading' && (
					<Card>
						<CardHeader>
							<h3 className='text-lg font-semibold'>
								Paso 3: Calificación Automática
							</h3>
							<p className='text-sm text-gray-600'>
								Revisión completada, calificación generada
							</p>
						</CardHeader>
						<CardBody>
							<div className='space-y-6'>
								{/* Automatic Grade Display */}
								<div className='rounded-lg bg-green-50 p-6 text-center dark:bg-green-950'>
									<Icon
										icon='HeroCheckBadge'
										className='mx-auto h-16 w-16 text-green-600 dark:text-green-400'
									/>
									<p className='mt-4 text-2xl font-bold text-green-800 dark:text-green-300'>
										Calificación: {automaticGrade || 'Calculando...'}
									</p>
									<p className='mt-2 text-sm text-green-700 dark:text-green-400'>
										La calificación se calculó automáticamente según los
										criterios configurados
									</p>
								</div>

								{/* Summary */}
								<div className='rounded-lg border border-gray-200 p-4'>
									<h4 className='mb-3 font-semibold'>Resumen de la Revisión</h4>
									<dl className='space-y-2 text-sm'>
										<div className='flex justify-between'>
											<dt className='text-gray-600'>Serie:</dt>
											<dd className='font-mono font-medium'>
												{serialNumber}
											</dd>
										</div>
										<div className='flex justify-between'>
											<dt className='text-gray-600'>Tipo:</dt>
											<dd className='font-medium'>{equipmentType}</dd>
										</div>
										<div className='flex justify-between'>
											<dt className='text-gray-600'>Producto:</dt>
											<dd className='font-medium'>#{productId}</dd>
										</div>
									</dl>
								</div>

								<div className='flex justify-between'>
									<Button
										variant='outline'
										onClick={() => setCurrentStep('review')}>
										<Icon icon='HeroArrowLeft' className='mr-2 h-4 w-4' />
										Modificar Revisión
									</Button>
									<Button onClick={handleStep3Submit} isDisable={loading}>
										<Icon icon='HeroCheck' className='mr-2 h-4 w-4' />
										Aprobar y Finalizar
									</Button>
								</div>
							</div>
						</CardBody>
					</Card>
				)}
			</Container>
		</PageWrapper>
	);
};

export default ItemReviewPage;
