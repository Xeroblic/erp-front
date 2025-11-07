/**
 * Technical Reviews - Item Review (Modo B - Without Batch)
 * Revisión individual sin lote - mismo flujo de 3 pasos
 * Reutiliza la misma lógica que [batchId]/[itemId].tsx pero sin batch_id
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
	completeReview,
	selectItemsLoading,
	type EquipmentType,
} from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { fetchProducts } from '@/store/slices/products/productsSlice';
import { Step2FullReview, Step3GradeReview } from '../components/items/ReviewSteps';
import ItemDetail from '../components/items/ItemDetail';
import type { UpdateItemDetailsPayload } from '@/interface/technicalReviews.interface';

type ReviewStep = 'basic' | 'review' | 'grading';

const ItemReviewStandalonePage: React.FC = () => {
	const { itemId } = useParams<{ itemId: string }>();
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

	// Step 3: Grading
	const [automaticGrade, setAutomaticGrade] = useState<string | null>(null);

	// Cargar productos
	useEffect(() => {
		if (branchId) {
			dispatch(fetchProducts({ branchId, params: { page: 1, per_page: 100 } }));
		}
	}, [dispatch, branchId]);

	useEffect(() => {
		if (!itemId || itemId === 'create' || !branchId) return;

		const parsedItemId = parseInt(itemId);

		dispatch(fetchItemDetail({ branchId, itemId: parsedItemId }));
	}, [dispatch, itemId, branchId]);

	const handleBack = () => {
		navigate('/technical-reviews/items');
	};

	// STEP 1: Crear item sin lote
	const handleStep1Submit = async () => {
		if (!branchId) {
			console.error('No hay branchId disponible');
			return;
		}

		try {
			// Primero crear el item (sin batch_id = 0)
			const createdItem = await dispatch(
				createItem({
					branchId,
					data: {
						batch_id: 0, // Sin lote
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

	const steps = [
		{ id: 'basic', label: 'Información Básica', icon: 'HeroDocumentText' },
		{ id: 'review', label: 'Revisión Completa', icon: 'HeroClipboardDocumentCheck' },
		{ id: 'grading', label: 'Calificación', icon: 'HeroCheckBadge' },
	];

	const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

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
							Revisión individual (sin lote)
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
											options={products.map((p) => ({
												value: String(p.id),
												label: `${p.name} - ${p.sku}`,
											}))}
											value={
												productId
													? {
															value: String(productId),
															label:
																products.find(
																	(p) => p.id === productId,
																)?.name || '',
														}
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
											placeholder='Seleccionar producto'
											isDisabled={productsLoading}
										/>
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
				{currentStep === 'review' && item && branchId && (
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
							// Si el item ya fue revisado, ir directo al Step 3
							if (
								item.review_status === 'reviewed' ||
								item.review_status === 'approved'
							) {
								console.log('⚠️ Item ya revisado, saltando al Step 3');
								setCurrentStep('grading');
								return;
							}

							// Completar revisión para obtener calificación automática
							try {
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
					/>
				)}

				{/* STEP 3: Automatic Grading */}
				{currentStep === 'grading' && item && branchId && (
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
					/>
				)}
			</Container>
		</PageWrapper>
	);
};

export default ItemReviewStandalonePage;
