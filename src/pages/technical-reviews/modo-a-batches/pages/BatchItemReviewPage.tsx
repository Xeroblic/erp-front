/**
 * Technical Reviews - Item Review (3-Step Flow)
 * Flujo de revisión técnica en 3 pasos:
 * 1. Basic Info (serial + product + type)
 * 2. Full Review (formulario específico por tipo)
 * 3. Automatic Grading (calificación automática + aprobación)
 */
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import type { TSelectOption } from '@/components/form/SelectReact';
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
import { Step1BasicInfo, Step2FullReview, Step3GradeReview } from '../components/steps';
import { useAutoSaveReview } from '@/hooks/useAutoSaveReview';
import HiddenAside from '@/components/ui/HiddenAside/HiddenAside';
import FloatingInfo from '@/components/ui/FloatingInfo/FloatingInfo';

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

	const  [color, setColor] = useState();
	// Step 2: Review Details (ejemplo para notebook)
	const [reviewDetails, setReviewDetails] = useState<any>({});

	// Step 3: Grading
	const [automaticGrade, setAutomaticGrade] = useState<string | null>(null);

	const isDark = useAppSelector((s) => s.personalizacion?.darkMode);
	
	// Traducciones de campos al español
	const FIELD_TRANSLATIONS: Record<string, string> = {
		// Identificadores
		id: 'ID',
		review_item_id: 'ID de Revisión',
		
		// Información básica
		brand: 'Marca',
		model: 'Modelo',
		line: 'Línea',
		processor: 'Procesador',
		
		// RAM
		ram_size: 'Tamaño de RAM',
		ram_slots: 'Slots de RAM',
		ram_type: 'Tipo de RAM',
		
		// Almacenamiento
		storage_size: 'Tamaño de Almacenamiento',
		storage_technology: 'Tecnología de Almacenamiento',
		
		// Cargador
		includes_charger: 'Incluye Cargador',
		charger_status: 'Estado del Cargador',
		
		// Condiciones
		general_condition: 'Condición General',
		cover_condition: 'Condición de Tapa',
		
		// Conectividad
		has_wifi: 'Tiene WiFi',
		has_bluetooth: 'Tiene Bluetooth',
		has_cd_drive: 'Tiene Lector CD',
		
		// Puertos
		usb_a_ports: 'Puertos USB-A',
		usb_c_ports: 'Puertos USB-C',
		vga_ports: 'Puertos VGA',
		hdmi_ports: 'Puertos HDMI',
		displayport_ports: 'Puertos DisplayPort',
		sd_readers: 'Lectores SD',
		rj45_ports: 'Puertos RJ45',
		all_ports_functional: 'Todos los Puertos Funcionales',
		defective_ports_count: 'Cantidad de Puertos Defectuosos',
		
		// Sistema
		operating_system: 'Sistema Operativo',
		observations: 'Observaciones',
	};

	// Traducciones de valores
	const VALUE_TRANSLATIONS: Record<string, string> = {
		// Condiciones
		like_new: 'Como Nuevo',
		excellent: 'Excelente',
		good: 'Bueno',
		ok: 'Aceptable',
		fair: 'Regular',
		poor: 'Malo',
		
		// Estados de revisión
		pending: 'Pendiente',
		in_review: 'En Revisión',
		reviewed: 'Revisado',
		approved: 'Aprobado',
		rejected: 'Rechazado',
		
		// Tipos de equipo
		notebook: 'Notebook',
		desktop: 'Desktop',
		aio: 'All-in-One',
		docking: 'Docking Station',
		
		// Booleanos
		true: 'Sí',
		false: 'No',
		null: '-',
		
		// Tecnologías
		m2: 'M.2',
		ssd: 'SSD',
		hdd: 'HDD',
		ddr4: 'DDR4',
		ddr5: 'DDR5',
	};

	// Helper: Traducir nombre de campo
	const translateField = (field: string): string => {
		return FIELD_TRANSLATIONS[field.toLowerCase()] || field.replace(/_/g, ' ');
	};

	// Helper: Traducir valor
	const translateValue = (value: any): string => {
		if (value === null || value === undefined) return '-';
		
		// Si es un objeto, extraer el valor primero
		if (typeof value === 'object' && value !== null) {
			const extractedValue = value.value || value.label || value.description;
			if (extractedValue) {
				value = extractedValue;
			} else {
				return '-';
			}
		}
		
		const strValue = String(value).toLowerCase();
		return VALUE_TRANSLATIONS[strValue] || String(value);
	};

	// Helper: Extraer valor de objeto o devolver string
	const extractValue = (field: any): string => {
		if (!field) return 'N/A';
		if (typeof field === 'object') {
			return field.value || field.label || JSON.stringify(field);
		}
		return String(field);
	};

	if (!branchId) {
		return (
			<PageWrapper name='technical-review-batch' title='Revisión Técnica por Lote'>
				<Container>
					<Card>
						<CardHeader>
							<h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
								Error: No hay sucursal seleccionada
							</h2>
						</CardHeader>
						<CardBody>
							<p className='text-gray-700 dark:text-gray-300'>
								Por favor, selecciona una sucursal para continuar.
							</p>
						</CardBody>
					</Card>
				</Container>
			</PageWrapper>
		);
	}

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
		equipmentType,
		onSaveSuccess: (savedItemId) => {
			if (itemId === 'create' && batchId) {
				navigate(`/technical-reviews/batches/${batchId}/items/${savedItemId}`, {
					replace: true,
				});
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

	const canContinue = Boolean(serialNumber && productId);
	const batchDisplayLabel = useMemo(() => {
		const fromItem =
			item?.batch?.code ||
			item?.batch?.name ||
			item?.batch?.label ||
			(item?.batch && `Lote #${item.batch.id}`);
		if (fromItem) return fromItem;
		if (batchId) return `Lote #${batchId}`;
		return 'Sin lote';
	}, [item?.batch, batchId]);

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

			// Guardar info básica y crear item en el lote
			const createdItemId = await saveBasicInfo({
				batch_id: parsedBatchId,
				serial_number: serialNumber,
				product_id: productId,
				equipment_type: equipmentType,
			});

			if (createdItemId == null) {
				return;
			}

			const result = await dispatch(
				startReview({
					branchId,
					itemId: createdItemId,
				}),
			).unwrap();

			setItem(result);
			// Avanzar explícitamente al Paso 2 (Revisión Técnica)
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

			setAutomaticGrade(grading?.grade ?? grading?.suggested_grade ?? null);
			setItem((prev: any) => ({
				...prev,
				...grading,
				review_status: grading?.review_status ?? 'reviewed',
				suggested_grade:
					grading?.grade ?? grading?.suggested_grade ?? prev?.suggested_grade,
			})); // Actualizar item con datos de grading
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
				review_status: grading?.review_status ?? prevItem?.review_status, // Actualizar estado también
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
	const normalizedReviewStatus = extractValue(item?.review_status);

	// Verificar si el item está aprobado (no se puede editar)
	const isApproved =
		item?.review_status === 'approved' || item?.review_status?.value === 'approved';

    const step2InitialValues = useMemo(() => item?.details || item?.attributes_json || {}, [item]);

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

		if (
			stepId === 'grading' &&
			normalizedReviewStatus !== 'reviewed' &&
			normalizedReviewStatus !== 'approved'
		) {
			toast.warn('Debes finalizar la revisión antes de aprobar');
			return;
		}

		// Permitir navegación libre entre los pasos disponibles
		setCurrentStep(stepId);
	};

	return (
		<PageWrapper name='technical-review-batch' title='Revisión Técnica por Lote'>
			<Container>
				{/* Header */}
				<div className='mb-6 flex items-center gap-4'>
					<Button variant='outline' onClick={handleBack}>
						<Icon icon='HeroArrowLeft' className='h-4 w-4' />
					</Button>
					<div className='flex-1'>
						<h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
							{item ? `Revisión #${item.serial_number}` : 'Nueva Revisión'}
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
					<Step1BasicInfo
						serialNumber={serialNumber}
						onSerialChange={setSerialNumber}
						productId={productId}
						onProductChange={(id) => setProductId(id)}
						productOptions={productOptions}
						productsLoading={productsLoading}
						equipmentType={equipmentType}
						onEquipmentTypeChange={(type) => setEquipmentType(type)}
						canContinue={canContinue}
						loading={loading}
						onBack={handleBack}
						onSubmit={handleStep1Submit}
						batchLabel={batchDisplayLabel}
					/>
				)}

				{/* STEP 2: Full Review */}
				{currentStep === 'review' && item && (
					<Step2FullReview
						branchId={branchId}
						itemId={item.id}
						equipmentType={equipmentType}
						initialValues={step2InitialValues}
						onBack={() => setCurrentStep('basic')}
						onComplete={handleStep2Complete}
						onItemUpdate={(updatedItem) => {
							// toast.info(`Item actualizado desde Step2: ${updatedItem}`);
							setItem(updatedItem);
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
						suggestedGrade={
							item.approved_at ? item.grade : (item.suggested_grade || 'M')
						}
						confidence={item.scoring_confidence || 0}
						breakdown={item.breakdown || {}}
						serialNumber={serialNumber || item.serial_number}
						equipmentType={String(equipmentType)}
						reviewStatus={normalizedReviewStatus}
						onBack={() => setCurrentStep('review')}
						onComplete={handleBack}
						onRecalculate={handleRecalculateGrade}
						onModifyReview={handleModifyReview}
						onReviewCompleted={(updated) => {
							setItem((prev: any) => ({
								...prev,
								...updated,
								review_status: updated?.review_status ?? prev?.review_status,
							}));
							if (updated?.grade || updated?.suggested_grade) {
								setAutomaticGrade(
									updated.grade ?? updated.suggested_grade ?? automaticGrade,
								);
							}
						}}
					/>
				)}
			</Container>
			{/* <FloatingInfo value='pene' color='red' colorText='white'></FloatingInfo>			Hidden Aside Panel */}
			<HiddenAside color='zinc' asideWidth='w-96'>
				<div className='space-y-6'>
					<h2 className='text-2xl font-bold text-white'>Resumen del Equipo</h2>
					<div className='space-y-4'>
						<div className='rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm'>
							<h3 className='mb-2 text-lg font-semibold text-white'>Identificación</h3>
							<div className='space-y-2 text-sm text-white/80'>
								<div className='flex justify-between border-b border-white/10 pb-1'>
									<span className='opacity-70'>S/N:</span>
									<span className='font-mono font-bold'>
										{translateValue(serialNumber || item?.serial_number) || '-'}
									</span>
								</div>
								<div className='flex justify-between border-b border-white/10 pb-1'>
									<span className='opacity-70'>Tipo:</span>
									<span className='capitalize'>{translateValue(equipmentType) || '-'}</span>
								</div>
								<div className='flex justify-between border-b border-white/10 pb-1'>
									<span className='opacity-70'>Estado:</span>
									<span className='font-semibold uppercase'>
										{translateValue(normalizedReviewStatus) || 'Pendiente'}
									</span>
								</div>
							</div>
						</div>

						{(automaticGrade || item?.grade || item?.suggested_grade) && (
							<div className='rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm'>
								<h3 className='mb-2 text-lg font-semibold text-white'>Resultado</h3>
								<div className='flex items-center justify-between'>
									<div>
										<p className='text-xs uppercase text-white/60'>Grado</p>
										<p className='text-4xl font-black text-white'>
											{translateValue(automaticGrade || item?.grade || item?.suggested_grade) || '-'}
										</p>
									</div>
									{item?.scoring_confidence !== undefined && (
										<div className='text-right'>
											<p className='text-xs uppercase text-white/60'>
												Confianza
											</p>
											<p className='text-xl font-bold text-white'>
												{Math.round(item.scoring_confidence * 100)}%
											</p>
										</div>
									)}
								</div>
							</div>
						)}

						{Object.keys(step2InitialValues).length > 0 && (
							<div className='rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm'>
								<h3 className='mb-2 text-lg font-semibold text-white'>Detalles</h3>
								<div className='max-h-80 overflow-y-auto pr-2 space-y-1 text-xs text-white/80'>
									{Object.entries(step2InitialValues).map(([key, value]) => (
										<div
											key={key}
											className='flex justify-between gap-4 border-b border-white/5 py-1'>
											<span className='capitalize opacity-70'>
												{translateField(key)}
											</span>
											<span className='text-right font-medium'>
												{translateValue(value)}
											</span>
										</div>
									))}
								</div>
							</div>
						)}

						<Button
							variant='solid'
							color='blue'
							className='w-full'
							onClick={() => {
								const info = [
									`S/N: ${serialNumber || item?.serial_number || '-'}`,
									`Tipo: ${translateValue(equipmentType) || '-'}`,
									`Estado: ${translateValue(normalizedReviewStatus) || 'Pendiente'}`,
									`Grado: ${automaticGrade || item?.grade || item?.suggested_grade || '-'}`,
									item?.scoring_confidence !== undefined
										? `Confianza: ${Math.round(item.scoring_confidence * 100)}%`
										: null,
									'',
									'DETALLES:',
									...Object.entries(step2InitialValues).map(
										([key, value]) =>
											`${translateField(key)}: ${translateValue(value)}`,
									),
								]
									.filter((line) => line !== null)
									.join('\n');

								navigator.clipboard.writeText(info);
								toast.success('Información copiada al portapapeles');
							}}>
							<Icon icon='HeroClipboardDocument' className='mr-2 h-4 w-4' />
							Copiar Información
						</Button>
					</div>
				</div>
			</HiddenAside>


		</PageWrapper>
		
	);
};

export default ItemReviewPage;
