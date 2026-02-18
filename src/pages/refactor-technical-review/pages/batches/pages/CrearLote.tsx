import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import type { MultiValue } from 'react-select';

import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import Label from '@/components/form/Label';
import Badge from '@/components/ui/Badge';
import Tooltip from '@/components/ui/Tooltip';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';

import { useAppDispatch, useAppSelector } from '@/store';
import { createBatch, selectBatchesLoading } from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { fetchWarehouses, createWarehouse } from '@/store/slices/warehouses/warehouseSlice';
import {
	fetchCustomerSuppliers,
	createCustomerSupplier,
	attachSuppliersToCustomerSupplier,
} from '@/store/slices/customerSuppliers/customerSuppliersSlice';
import { selectPersonalizacionUsuario } from '@/store/slices/personalizacion/personalizacionSlice';
import { fetchSuppliers, createSupplier } from '@/store/slices/suppliers/suppliersSlice';

import CreateWarehouseModal from '@/pages/catalogos/bodegas/modals/CreateWarehouseModal';
import CreateCustomerSupplierModal from '../../../components/modals/CreateCustomerSupplierModal';
import CreateSupplierModal from '../components/modals/CreateSupplierModal';

import type { ICreateWarehouseRequest } from '@/interface/warehouse.interface';
import type {
	ICreateCustomerSupplierRequest,
	ICustomerSupplier,
} from '@/interface/customerSupplier.interface';
import type { ICreateSupplierRequest, ISupplier } from '@/interface/supplier.interface';

// ─── Validation ────────────────────────────────────────────────
const validationSchema = Yup.object({
	warehouse_id: Yup.number()
		.required('Selecciona una bodega')
		.min(1, 'Selecciona una bodega válida'),
	customer_supplier_id: Yup.number()
		.required('Selecciona un Cliente/Proveedor')
		.min(1, 'Selecciona un Cliente/Proveedor válido'),
	entry_date: Yup.string().required('Ingresa la fecha de entrada'),
	expected_quantity: Yup.number()
		.required('Ingresa una cantidad esperada válida')
		.positive('Debe ser mayor a 0')
		.integer('Debe ser un número entero'),
	notes: Yup.string().max(999, 'Máximo 999 caracteres'),
});

// ─── Helper ────────────────────────────────────────────────────
const normalizeSelectValue = (
	option: TSelectOption | MultiValue<TSelectOption> | null,
): TSelectOption | null => {
	if (!option) return null;
	if (Array.isArray(option)) return option[0] ?? null;
	return option as TSelectOption;
};

// ─── Component ─────────────────────────────────────────────────
const CrearLote: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const loading = useAppSelector(selectBatchesLoading);
	const { branchId } = useCurrentBranch();

	const currentUser = useAppSelector((s) => s.auth.user);
	const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);
	const warehouses = useAppSelector((s) => s.warehouse.warehouses);
	const warehouseLoading = useAppSelector((s) => s.warehouse.loading || s.warehouse.creating);
	const customer_supplier = useAppSelector((s) => s.customerSuppliers.items);
	const customerSupplierLoading = useAppSelector(
		(s) => s.customerSuppliers.loading || s.customerSuppliers.creating,
	);
	const suppliers = useAppSelector((s) => s.suppliers.items);
	const suppliersLoading = useAppSelector((s) => s.suppliers.loading || s.suppliers.creating);

	const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
	const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
	const [customerSupplierModalOpen, setCustomerSupplierModalOpen] = useState(false);
	const [supplierModalOpen, setSupplierModalOpen] = useState(false);

	const subsidiaryId = useMemo(() => {
		return (
			personalizacionUsuario?.subsidiary_id ??
			currentUser?.subsidiary?.id ??
			currentUser?.branch?.subsidiary?.id ??
			null
		);
	}, [personalizacionUsuario, currentUser]);

	// ── Data loading ───────────────────────────────────────────
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
			dispatch(fetchCustomerSuppliers({ subsidiaryId, with_suppliers: true }));
			dispatch(fetchSuppliers({ subsidiaryId, with_customers: true }));
		}
	}, [dispatch, subsidiaryId]);

	// ── Modal handlers ─────────────────────────────────────────
	const handleCreateWarehouse = useCallback(
		async (data: ICreateWarehouseRequest): Promise<boolean> => {
			if (!branchId) {
				toast.error('No hay sucursal activa seleccionada.');
				return false;
			}
			try {
				await dispatch(createWarehouse({ branchId, data })).unwrap();
				toast.success('Bodega creada correctamente');
				setWarehouseModalOpen(false);
				return true;
			} catch (error: any) {
				toast.error(error?.message || 'No se pudo crear la bodega');
				return false;
			}
		},
		[branchId, dispatch],
	);

	const handleCreateCustomerSupplier = useCallback(
		async (data: ICreateCustomerSupplierRequest): Promise<ICustomerSupplier | null> => {
			if (!subsidiaryId) {
				toast.error('Selecciona una subsidiaria para crear el cliente/proveedor');
				return null;
			}
			try {
				const created = await dispatch(
					createCustomerSupplier({ subsidiaryId, data }),
				).unwrap();
				dispatch(fetchCustomerSuppliers({ subsidiaryId, with_suppliers: true }));
				toast.success('Cliente/Proveedor creado correctamente');
				setCustomerSupplierModalOpen(false);
				return created;
			} catch (error: any) {
				toast.error(error?.message || 'No se pudo crear el cliente/proveedor');
				return null;
			}
		},
		[dispatch, subsidiaryId],
	);

	const handleCreateSupplier = useCallback(
		async (data: ICreateSupplierRequest): Promise<ISupplier | null> => {
			if (!subsidiaryId) {
				toast.error('Selecciona una subsidiaria para crear el proveedor');
				return null;
			}
			try {
				const created = await dispatch(createSupplier({ subsidiaryId, data })).unwrap();
				dispatch(fetchSuppliers({ subsidiaryId, with_customers: true }));
				toast.success('Proveedor creado correctamente');
				setSupplierModalOpen(false);
				return created;
			} catch (error: any) {
				toast.error(error?.message || 'No se pudo crear el proveedor');
				return null;
			}
		},
		[dispatch, subsidiaryId],
	);

	// ── Select options ─────────────────────────────────────────
	const warehouseOptions: TSelectOption[] = useMemo(() => {
		if (!warehouses?.length) return [{ value: '', label: 'No hay bodegas disponibles' }];
		return warehouses.map((w) => ({
			value: String(w.id),
			label: `${w.name} (${w.code})`,
		}));
	}, [warehouses]);

	const customerOptions: TSelectOption[] = useMemo(() => {
		if (!customer_supplier?.length)
			return [{ value: '', label: 'No hay clientes disponibles' }];
		return customer_supplier.map((c) => ({
			value: String(c.id),
			label: c.name || 'N/A',
		}));
	}, [customer_supplier]);

	const allSupplierOptions: TSelectOption[] = useMemo(() => {
		if (!suppliers?.length) return [];
		return suppliers.map((s) => ({
			value: String(s.id),
			label: s.name || 'Proveedor sin nombre',
		}));
	}, [suppliers]);

	// ── Formik ──────────────────────────────────────────────────
	const formik = useFormik({
		initialValues: {
			warehouse_id: 0,
			customer_supplier_id: 0,
			entry_date: '',
			expected_quantity: 0,
			notes: '',
		},
		validationSchema,
		onSubmit: async (values, { setSubmitting }) => {
			if (!branchId) {
				toast.error('No hay sucursal activa seleccionada.');
				setSubmitting(false);
				return;
			}
			try {
				const result = await dispatch(
					createBatch({
						branchId,
						data: {
							warehouse_id: Number(values.warehouse_id),
							customer_supplier_id: Number(values.customer_supplier_id),
							entry_date: values.entry_date,
							expected_quantity: Number(values.expected_quantity),
							notes: values.notes,
						},
					}),
				).unwrap();
				toast.success('Lote creado exitosamente 🎉');
				navigate(`/technical-reviews/lotes`);
			} catch {
				toast.error('Error al crear el lote. Inténtalo nuevamente.');
			} finally {
				setSubmitting(false);
			}
		},
	});

	// ── Derived state ──────────────────────────────────────────
	const selectedCustomer = useMemo(() => {
		return customer_supplier.find((c) => c.id === formik.values.customer_supplier_id) || null;
	}, [customer_supplier, formik.values.customer_supplier_id]);

	const linkedSupplierOptions: TSelectOption[] = useMemo(() => {
		if (!selectedCustomer?.suppliers?.length) return [];
		return selectedCustomer.suppliers.map((s) => ({
			value: String(s.id),
			label: s.name || 'Proveedor sin nombre',
		}));
	}, [selectedCustomer]);

	useEffect(() => {
		if (!linkedSupplierOptions.length || selectedSupplierId === null) return;
		const stillExists = linkedSupplierOptions.some(
			(opt) => opt.value === String(selectedSupplierId),
		);
		if (!stillExists) setSelectedSupplierId(null);
	}, [linkedSupplierOptions, selectedSupplierId]);

	const handleCancel = () => navigate('/technical-reviews/lotes');
	const handleCreateBatch = () => formik.handleSubmit();

	const showEmptyWarehouses = !warehouseLoading && (!warehouses || warehouses.length === 0);
	const showEmptyCustomers =
		!customerSupplierLoading && (!customer_supplier || customer_supplier.length === 0);

	return (
		<PageWrapper name='crear-lote' title='Crear Lote'>
			{/* Header */}
			<Subheader>
				<SubheaderLeft>
					<Button variant='outline' onClick={handleCancel} icon='HeroArrowLeft' />
					<div>
						<Badge className='mb-1 text-2xl font-semibold'>Nuevo Lote</Badge>
						<p className='text-sm text-zinc-500'>
							Registra un nuevo lote de equipos para revisión técnica.
						</p>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Tooltip text='Crear Lote'>
						<Button
							variant='solid'
							icon='HeroPlus'
							onClick={handleCreateBatch}
							isDisable={loading || formik.isSubmitting}
							isLoading={formik.isSubmitting}>
							Crear Lote
						</Button>
					</Tooltip>
				</SubheaderRight>
			</Subheader>

			<Container>
				{/* Info card */}
				<Card className='mb-6 border border-zinc-200/80 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/60'>
					<CardBody className='flex items-start gap-4'>
						<div className='flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'>
							<Icon icon='HeroClipboardDocumentCheck' className='h-5 w-5' />
						</div>
						<div className='space-y-1'>
							<p className='text-base font-semibold text-zinc-900 dark:text-zinc-50'>
								Resumen del lote
							</p>
							<p className='text-sm text-zinc-500 dark:text-zinc-400'>
								Completa la bodega destino, el cliente/proveedor y la cantidad
								esperada. Agrega notas internas si lo necesitas.
							</p>
						</div>
					</CardBody>
				</Card>

				{/* Formulario */}
				<form onSubmit={formik.handleSubmit}>
					<Card>
						<CardHeader className='flex items-center gap-3'>
							<div className='flex items-start gap-4'>
								<div className='rounded-full bg-green-500/10 p-2 text-green-600 dark:text-green-300'>
									<Icon icon='HeroInboxStack' className='h-5 w-5' />
								</div>
								<div>
									<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
										Información del Lote
									</h3>
									<p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
										Datos mínimos para clasificar y trazar el ingreso.
									</p>
								</div>
							</div>
						</CardHeader>
						<CardBody>
							{/* Empty warnings */}
							{showEmptyWarehouses && (
								<div className='mb-4 flex items-center justify-between rounded-lg border border-dashed border-amber-400/60 bg-amber-50/40 px-4 py-3 dark:border-amber-400/40 dark:bg-amber-900/10'>
									<div className='flex items-center gap-3'>
										<span className='flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-800/40 dark:text-amber-200'>
											<Icon icon='DuoHome' className='h-6 w-6' />
										</span>
										<div>
											<p className='text-sm font-semibold text-amber-800 dark:text-amber-100'>
												No tienes ninguna bodega para crear lotes.
											</p>
											<p className='text-xs text-amber-700/80 dark:text-amber-200/80'>
												Crea una bodega para poder registrar el ingreso.
											</p>
										</div>
									</div>
									<Button
										variant='outline'
										onClick={() => setWarehouseModalOpen(true)}>
										Crear bodega
									</Button>
								</div>
							)}

							{showEmptyCustomers && (
								<div className='mb-4 flex items-center justify-between rounded-lg border border-dashed border-blue-400/60 bg-blue-50/40 px-4 py-3 dark:border-blue-400/40 dark:bg-blue-900/10'>
									<div className='flex items-center gap-3'>
										<span className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-800/40 dark:text-blue-200'>
											<Icon icon='DuoUser' className='h-6 w-6' />
										</span>
										<div>
											<p className='text-sm font-semibold text-blue-800 dark:text-blue-100'>
												No tienes clientes/proveedores disponibles.
											</p>
											<p className='text-xs text-blue-700/80 dark:text-blue-200/80'>
												Crea uno para asociarlo al nuevo lote.
											</p>
										</div>
									</div>
									<Button
										variant='outline'
										onClick={() => setCustomerSupplierModalOpen(true)}>
										Crear cliente/proveedor
									</Button>
								</div>
							)}

							<div className='space-y-6'>
								{/* Bodega */}
								{!showEmptyWarehouses && (
									<div>
										<Label
											htmlFor='warehouse_id'
											className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
											Bodega <span className='text-red-500'>*</span>
										</Label>
										<SelectReact
											name='warehouse_id'
											placeholder='Seleccionar bodega'
											options={warehouseOptions}
											value={
												warehouseOptions.find(
													(opt) =>
														opt.value ===
														String(formik.values.warehouse_id),
												) || null
											}
											onChange={(option) => {
												const selected = normalizeSelectValue(option);
												formik.setFieldValue(
													'warehouse_id',
													selected ? parseInt(selected.value) : 0,
												);
											}}
											className={
												formik.touched.warehouse_id &&
												formik.errors.warehouse_id
													? 'border-red-500'
													: ''
											}
										/>
										{formik.touched.warehouse_id &&
											formik.errors.warehouse_id && (
												<p className='mt-1 text-xs text-red-500'>
													{formik.errors.warehouse_id}
												</p>
											)}
									</div>
								)}

								{/* Cliente/Proveedor */}
								{!showEmptyCustomers && (
									<div>
										<div className='mb-2 flex items-center justify-between'>
											<Label
												htmlFor='customer_supplier_id'
												className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
												Cliente/Proveedor{' '}
												<span className='text-red-500'>*</span>
											</Label>
											<Button
												variant='outline'
												size='xs'
												icon='HeroPlus'
												color='emerald'
												className='text-emerald-500'
												onClick={() => setCustomerSupplierModalOpen(true)}>
												Nuevo
											</Button>
										</div>
										<SelectReact
											name='customer_supplier_id'
											placeholder='Seleccionar cliente/proveedor'
											options={customerOptions}
											value={
												customerOptions.find(
													(opt) =>
														opt.value ===
														String(formik.values.customer_supplier_id),
												) || null
											}
											onChange={(option) => {
												const selected = normalizeSelectValue(option);
												formik.setFieldValue(
													'customer_supplier_id',
													selected ? parseInt(selected.value) : 0,
												);
												setSelectedSupplierId(null);
											}}
											className={
												formik.touched.customer_supplier_id &&
												formik.errors.customer_supplier_id
													? 'border-red-500'
													: ''
											}
										/>

										{/* Linked supplier selector */}
										{linkedSupplierOptions.length > 0 && (
											<div className='mt-4'>
												<Label
													htmlFor='proveedor_asociado'
													className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
													Proveedor asociado
												</Label>
												<SelectReact
													name='supplier_id'
													placeholder='Seleccionar proveedor'
													options={linkedSupplierOptions}
													value={
														selectedSupplierId !== null
															? linkedSupplierOptions.find(
																	(opt) =>
																		opt.value ===
																		String(selectedSupplierId),
																) || null
															: null
													}
													onChange={(option) => {
														const opt = normalizeSelectValue(option);
														setSelectedSupplierId(
															opt ? parseInt(opt.value) : null,
														);
													}}
												/>
											</div>
										)}

										{/* Attach existing supplier */}
										{linkedSupplierOptions.length === 0 &&
											allSupplierOptions.length > 0 && (
												<div className='mt-4 space-y-2'>
													<div className='mb-2 flex items-center justify-between'>
														<Label
															htmlFor='attach_supplier'
															className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
															Asociar proveedor existente
														</Label>
														<Button
															variant='outline'
															size='xs'
															icon='HeroPlus'
															color='emerald'
															className='text-emerald-500'
															onClick={() =>
																setSupplierModalOpen(true)
															}>
															Nuevo
														</Button>
													</div>
													<div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
														<SelectReact
															name='attach_supplier'
															placeholder='Seleccionar proveedor'
															options={allSupplierOptions}
															value={
																selectedSupplierId !== null
																	? allSupplierOptions.find(
																			(opt) =>
																				opt.value ===
																				String(
																					selectedSupplierId,
																				),
																		) || null
																	: null
															}
															onChange={(option) => {
																const opt =
																	normalizeSelectValue(option);
																setSelectedSupplierId(
																	opt ? Number(opt.value) : null,
																);
															}}
														/>
														<Button
															variant='outline'
															isDisable={
																!selectedCustomer ||
																selectedSupplierId === null
															}
															onClick={async () => {
																if (
																	!selectedCustomer ||
																	selectedSupplierId === null
																)
																	return;
																try {
																	await dispatch(
																		attachSuppliersToCustomerSupplier(
																			{
																				subsidiaryId:
																					selectedCustomer.subsidiary_id,
																				customerSupplierId:
																					selectedCustomer.id,
																				payload: {
																					supplier_ids: [
																						selectedSupplierId,
																					],
																				},
																			},
																		),
																	).unwrap();
																	toast.success(
																		'Proveedor asociado',
																	);
																	setSelectedSupplierId(null);
																	dispatch(
																		fetchCustomerSuppliers({
																			subsidiaryId:
																				selectedCustomer.subsidiary_id,
																			with_suppliers: true,
																		}),
																	);
																} catch (err: any) {
																	toast.error(
																		err?.message ||
																			'No se pudo asociar el proveedor',
																	);
																}
															}}>
															Asociar
														</Button>
													</div>
													<p className='text-xs text-gray-500 dark:text-gray-400'>
														Primero crea el cliente, luego selecciona un
														proveedor ya creado y asócialo.
													</p>
												</div>
											)}

										{formik.touched.customer_supplier_id &&
											formik.errors.customer_supplier_id && (
												<p className='mt-1 text-xs text-red-500'>
													{formik.errors.customer_supplier_id}
												</p>
											)}
									</div>
								)}

								{/* Fecha de Entrada */}
								<div>
									<Label
										htmlFor='entry_date'
										className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Fecha de Entrada <span className='text-red-500'>*</span>
									</Label>
									<Input
										name='entry_date'
										type='date'
										value={formik.values.entry_date}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										className={
											formik.touched.entry_date && formik.errors.entry_date
												? 'border-red-500'
												: ''
										}
									/>
									{formik.touched.entry_date && formik.errors.entry_date && (
										<p className='mt-1 text-xs text-red-500'>
											{formik.errors.entry_date}
										</p>
									)}
								</div>

								{/* Cantidad Esperada */}
								<div>
									<Label
										htmlFor='expected_quantity'
										className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Cantidad Esperada <span className='text-red-500'>*</span>
									</Label>
									<Input
										name='expected_quantity'
										type='number'
										min='1'
										value={formik.values.expected_quantity}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										className={
											formik.touched.expected_quantity &&
											formik.errors.expected_quantity
												? 'border-red-500'
												: ''
										}
										placeholder='Ej: 50'
									/>
									{formik.touched.expected_quantity &&
										formik.errors.expected_quantity && (
											<p className='mt-1 text-xs text-red-500'>
												{formik.errors.expected_quantity}
											</p>
										)}
								</div>

								{/* Notas */}
								<div>
									<Label
										htmlFor='notes'
										className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Notas/Comentarios
									</Label>
									<Textarea
										name='notes'
										rows={4}
										value={formik.values.notes}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										className='w-full rounded-lg border border-gray-300 p-2.5 text-sm'
										placeholder='Notas adicionales sobre el lote...'
									/>
									{formik.touched.notes && formik.errors.notes && (
										<p className='mt-1 text-xs text-red-500'>
											{formik.errors.notes}
										</p>
									)}
								</div>
							</div>
						</CardBody>
					</Card>

					{/* Info tips */}
					<div className='mt-6 grid gap-4 sm:grid-cols-2'>
						<div className='rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/30'>
							<div className='flex items-center gap-3'>
								<div className='rounded-xl bg-white/70 p-2 text-emerald-600 shadow-sm dark:bg-emerald-900/40 dark:text-emerald-300'>
									<Icon icon='AddUser' className='h-6 w-6' />
								</div>
								<div>
									<p className='text-sm font-semibold text-emerald-900 dark:text-emerald-200'>
										Vincula un proveedor
									</p>
									<p className='text-xs text-emerald-800/80 dark:text-emerald-200/70'>
										Selecciona el cliente y, si corresponde, su proveedor
										asociado para trazabilidad comercial completa.
									</p>
								</div>
							</div>
						</div>
						<div className='rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900 dark:bg-indigo-950/30'>
							<div className='flex items-center gap-3'>
								<div className='rounded-xl bg-white/70 p-2 text-indigo-600 shadow-sm dark:bg-indigo-900/40 dark:text-indigo-200'>
									<Icon icon='HeroCalendarDays' className='h-6 w-6' />
								</div>
								<div>
									<p className='text-sm font-semibold text-indigo-900 dark:text-indigo-100'>
										Controla el flujo de llegada
									</p>
									<p className='text-xs text-indigo-800/80 dark:text-indigo-200/70'>
										Registra la fecha y la cantidad esperada para alinear al
										equipo de recepción y revisión.
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Action buttons */}
					<div className='mt-6 flex justify-end gap-3'>
						<Button
							variant='outline'
							onClick={handleCancel}
							isDisable={loading || formik.isSubmitting}>
							Cancelar
						</Button>
						<Button
							variant='solid'
							onClick={handleCreateBatch}
							isDisable={loading || formik.isSubmitting}
							isLoading={formik.isSubmitting}
							icon='HeroCheck'>
							{formik.isSubmitting ? 'Creando...' : 'Crear Lote'}
						</Button>
					</div>
				</form>
			</Container>

			{/* Modals */}
			<CreateWarehouseModal
				isOpen={warehouseModalOpen}
				setIsOpen={setWarehouseModalOpen}
				onSubmit={handleCreateWarehouse}
				branchId={branchId ?? undefined}
			/>

			<CreateCustomerSupplierModal
				isOpen={customerSupplierModalOpen}
				setIsOpen={setCustomerSupplierModalOpen}
				onCreate={handleCreateCustomerSupplier}
				loading={customerSupplierLoading || suppliersLoading}
			/>

			<CreateSupplierModal
				isOpen={supplierModalOpen}
				setIsOpen={setSupplierModalOpen}
				onCreate={handleCreateSupplier}
				loading={suppliersLoading}
			/>
		</PageWrapper>
	);
};

export default CrearLote;
