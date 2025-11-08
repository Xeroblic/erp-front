/**
 * Technical Reviews - Standalone Item Review (WITHOUT BATCH)
 * ⚠️ FLUJO INDEPENDIENTE - NO MEZCLAR CON BATCHES ⚠️
 *
 * Este componente maneja la revisión de items INDIVIDUALES sin lote asociado.
 * Requiere warehouse_id y customer_supplier_id obligatorios.
 *
 * URL: /technical-reviews/items/{itemId}
 * URL Create: /technical-reviews/items/create
 *
 * DIFERENCIAS CON BATCH FLOW:
 * - ❌ NO acepta batch_id (siempre null)
 * - ✅ Requiere warehouse_id
 * - ✅ Requiere customer_supplier_id
 * - ✅ Opcionalmente permite asociar a lote manual
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
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { fetchProducts } from '@/store/slices/products/productsSlice';
import { fetchWarehouses } from '@/store/slices/warehouses/warehouseSlice';
import { fetchCustomerSuppliers } from '@/store/slices/customerSuppliers/customerSuppliersSlice';
import { selectPersonalizacionUsuario } from '@/store/slices/personalizacion/personalizacionSlice';
import { Step2FullReview, Step3GradeReview } from '../components/items/ReviewSteps';
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
	type ReviewStep,
} from '../constants';
import { extractFieldValue } from '../constants/field-helpers.constant';

const TECHNICAL_REVIEWS_PREFIX = (import.meta as any)?.env?.VITE_API_TECHNICAL_REVIEWS_PREFIX || '';
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
	const warehouses = useAppSelector((s) => s.warehouse.warehouses);
	const warehousesLoading = useAppSelector((s) => s.warehouse.loading);
	const customerSuppliers = useAppSelector((s) => s.customerSuppliers.items);
	const customerSuppliersLoading = useAppSelector((s) => s.customerSuppliers.loading);
	const selectedItemStore = useAppSelector(selectSelectedItem);
	const currentUser = useAppSelector((s) => s.auth.user);
	const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);

	const [currentStep, setCurrentStep] = useState<ReviewStep>('basic');
	const [item, setItem] = useState<any>(null);

	// Step 1: Basic Info
	const [serialNumber, setSerialNumber] = useState('');
	const [productId, setProductId] = useState<number | null>(null);
	const [equipmentType, setEquipmentType] = useState<EquipmentType | null>(null);
	const [hasUserSelectedType, setHasUserSelectedType] = useState(false);
	const [warehouseId, setWarehouseId] = useState<number | null>(null);
	const [customerSupplierId, setCustomerSupplierId] = useState<number | null>(null);

	// ⚠️ OPCIONAL: Asociación manual a lote (solo para lotes manuales)
	const [batchOptions, setBatchOptions] = useState<TSelectOption[]>([]);
	const [selectedBatchOption, setSelectedBatchOption] = useState<TSelectOption | null>(null);
	const [manualBatchId, setManualBatchId] = useState<number | null>(null);
	const [loadingBatches, setLoadingBatches] = useState(false);
	const [batchesError, setBatchesError] = useState<string | null>(null);

	// Step 3: Grading
	const [automaticGrade, setAutomaticGrade] = useState<string | null>(null);

	const subsidiaryId = useMemo(() => {
		return (
			personalizacionUsuario?.subsidiary_id ??
			currentUser?.subsidiary?.id ??
			currentUser?.branch?.subsidiary?.id ??
			null
		);
	}, [personalizacionUsuario, currentUser]);

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
		if (branchId) {
			dispatch(
				fetchWarehouses({
					branchId,
					params: { page: 1, per_page: 100, is_active: true },
				}),
			);
		}
	}, [dispatch, branchId]);

	useEffect(() => {
		if (subsidiaryId) {
			dispatch(
				fetchCustomerSuppliers({
					subsidiaryId,
					with_suppliers: true,
				}),
			);
		}
	}, [dispatch, subsidiaryId]);

	// ⚠️ OPCIONAL: Cargar lotes abiertos para asociación manual
	useEffect(() => {
		if (branchId) {
			fetchOpenBatches();
		}
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

	const fetchOpenBatches = async () => {
		if (!branchId) return;
		setLoadingBatches(true);
		try {
			const url = ep(branchId, '/batches');
			console.log('🔍 Fetching batches from:', url);

			const response = await ApiService.fetchData<{ data?: any[] }>({
				url,
				method: 'get',
				params: { per_page: 200 }, // ⚠️ Sin filtro status, traemos todos
			});

			console.log('📦 Response data:', response.data);

			const rawList = Array.isArray(response.data?.data)
				? response.data?.data
				: Array.isArray(response.data)
					? (response.data as any[])
					: [];

			// Filtrar del lado del cliente: solo lotes que NO estén closed
			const list = rawList.filter((batch: any) => {
				const status = (batch.status || '').toLowerCase();
				return status !== 'closed' && status !== 'completed' && status !== 'finished';
			});

			console.log('📋 Total lotes:', rawList.length, '| Lotes abiertos:', list.length, list);

			const options = list.map((batch: any) => {
				const entryDate = batch.entry_date
					? new Date(batch.entry_date).toLocaleDateString('es-CL')
					: null;
				const status = batch.status ? ` [${batch.status}]` : '';
				return {
					value: String(batch.id),
					label: `${batch.code || batch.name || `Lote #${batch.id}`}${status} ${
						entryDate ? `• ${entryDate}` : ''
					}`,
				};
			});
			setBatchOptions(options);

			const manual = list.find((batch: any) => {
				const base =
					`${batch.name ?? ''} ${batch.slug ?? ''} ${batch.code ?? ''}`.toLowerCase();
				return base.includes('manual');
			});

			if (manual) {
				console.log('✅ Lote Manual encontrado:', manual);
				setManualBatchId(manual.id);
				if (!selectedBatchOption) {
					const opt = options.find((o) => o.value === String(manual.id)) ?? null;
					setSelectedBatchOption(opt);
				}
			} else {
				console.log('⚠️ No se encontró lote Manual');
				setManualBatchId(null);
			}
			setBatchesError(null);
		} catch (error: any) {
			console.error('❌ Error al cargar lotes:', error);
			setBatchesError(error?.message ?? 'No se pudieron cargar los lotes');
		} finally {
			setLoadingBatches(false);
		}
	};
	const warehouseOptions = useMemo(() => {
		if (!warehouses || warehouses.length === 0) {
			return [];
		}
		return warehouses.map((warehouse) => ({
			value: String(warehouse.id),
			label: `${warehouse.name} (${warehouse.code})`,
		}));
	}, [warehouses]);

	const customerSupplierOptions = useMemo(() => {
		if (!customerSuppliers || customerSuppliers.length === 0) {
			return [];
		}
		return customerSuppliers.map((cs) => ({
			value: String(cs.id),
			label: cs.name || `Cliente/Proveedor #${cs.id}`,
		}));
	}, [customerSuppliers]);

	const selectedWarehouseOption = useMemo(() => {
		return warehouseId
			? (warehouseOptions.find((opt) => opt.value === String(warehouseId)) ?? null)
			: null;
	}, [warehouseId, warehouseOptions]);

	const selectedCustomerSupplierOption = useMemo(() => {
		return customerSupplierId
			? (customerSupplierOptions.find((opt) => opt.value === String(customerSupplierId)) ??
					null)
			: null;
	}, [customerSupplierId, customerSupplierOptions]);

	// ✅ STANDALONE FLOW: Siempre requiere warehouse_id
	const canContinue = Boolean(serialNumber && productId && equipmentType && warehouseId);

	// Inicializar modo create
	useEffect(() => {
		if (itemId === 'create') {
			setCurrentStep('basic');
			setItem(null);
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
		setWarehouseId(selectedItemStore.warehouse_id ?? selectedItemStore.warehouse?.id ?? null);
		setCustomerSupplierId(
			selectedItemStore.customer_supplier_id ??
				selectedItemStore.customer_supplier?.id ??
				null,
		);

		// ⚠️ OPCIONAL: Si el item ya tiene batch asociado, mostrarlo
		const existingBatchId = selectedItemStore.batch_id ?? selectedItemStore.batch?.id ?? null;
		if (existingBatchId) {
			setSelectedBatchOption({
				value: String(existingBatchId),
				label: `Lote #${existingBatchId}`,
			});
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

		// ✅ STANDALONE FLOW: warehouse_id es OBLIGATORIO
		if (!equipmentType || !serialNumber || !productId || !warehouseId) {
			console.error(
				'Faltan datos obligatorios (equipmentType, serialNumber, productId, warehouseId)',
			);
			return;
		}

		// ⚠️ OPCIONAL: batch_id solo si usuario seleccionó un lote manual
		let finalBatchId: number | null = null;
		if (selectedBatchOption) {
			finalBatchId = Number(selectedBatchOption.value);
		} else if (manualBatchId) {
			finalBatchId = manualBatchId;
		}

		try {
			const batchIdValue = finalBatchId ?? undefined;

			const createdItemId = await saveBasicInfo({
				batch_id: batchIdValue,
				serial_number: serialNumber,
				product_id: productId,
				equipment_type: equipmentType,
				warehouse_id: warehouseId,
				customer_supplier_id: customerSupplierId ?? undefined,
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
							{/* ✅ STANDALONE: Siempre es revisión individual */}
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

								{/* Warehouse */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Bodega <span className='text-red-500'>*</span>
									</label>
									{/* ✅ STANDALONE: Siempre selector de bodega */}
									{warehousesLoading ? (
										<div className='text-sm text-gray-500'>
											Cargando bodegas...
										</div>
									) : (
										<SelectReact
											name='warehouse_id'
											placeholder='Seleccionar bodega'
											options={warehouseOptions}
											value={selectedWarehouseOption}
											onChange={(option) => {
												const selectedOption =
													option as TSelectOption | null;
												setWarehouseId(
													selectedOption
														? parseInt(selectedOption.value)
														: null,
												);
											}}
											isDisabled={warehousesLoading}
										/>
									)}
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
											options={productOptions}
											value={selectedProductOption}
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
											No hay productos con seguimiento por serie disponibles.
											Debe activar "Seguimiento por Serie" en la configuración
											del producto.
										</p>
									)}
								</div>

								{/* Customer Supplier (optional) */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Cliente / Proveedor (opcional)
									</label>
									<SelectReact
										name='customer_supplier_id'
										placeholder='Seleccionar cliente/proveedor'
										options={customerSupplierOptions}
										value={selectedCustomerSupplierOption}
										onChange={(option) => {
											const selectedOption = option as TSelectOption | null;
											setCustomerSupplierId(
												selectedOption
													? parseInt(selectedOption.value)
													: null,
											);
										}}
										isLoading={customerSuppliersLoading}
										isClearable
									/>
								</div>

								{/* ⚠️ OPCIONAL: Batch selection (standalone items can optionally associate to manual batch) */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Lote de Revisión (Opcional)
									</label>
									<SelectReact
										name='batch_id'
										placeholder='Seleccionar lote abierto'
										options={batchOptions}
										value={selectedBatchOption}
										onChange={(option) => {
											setSelectedBatchOption(option as TSelectOption | null);
											setBatchesError(null);
										}}
										isLoading={loadingBatches}
									/>
									{batchesError && (
										<p className='mt-1 text-xs text-red-500'>{batchesError}</p>
									)}
									{!loadingBatches && manualBatchId === null && (
										<p className='mt-1 text-xs text-amber-600'>
											💡 Tip: Puedes asociar este item a un lote manual si
											existe uno
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
											isDisable={loading || !canContinue}>
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
