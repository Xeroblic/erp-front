/**
 * Technical Reviews - Create Batch
 * Formulario para crear un nuevo lote (Formik + Yup)
 */

import React, { useEffect, useMemo, useState } from 'react';
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

import { useAppDispatch, useAppSelector } from '@/store';
import { createBatch, selectBatchesLoading } from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { fetchWarehouses } from '@/store/slices/warehouses/warehouseSlice';
import { fetchCustomerSuppliers } from '@/store/slices/customerSuppliers/customerSuppliersSlice';
import { selectPersonalizacionUsuario } from '@/store/slices/personalizacion/personalizacionSlice';
import Label from '@/components/form/Label';

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

const normalizeSelectValue = (
	option: TSelectOption | MultiValue<TSelectOption> | null,
): TSelectOption | null => {
	if (!option) return null;
	if (Array.isArray(option)) {
		return option[0] ?? null;
	}
	return option as TSelectOption;
};

const CreateBatchPage: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const loading = useAppSelector(selectBatchesLoading);
	const { branchId } = useCurrentBranch();

	const currentUser = useAppSelector((s) => s.auth.user);
	const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);
	const warehouses = useAppSelector((s) => s.warehouse.warehouses);
	const customer_supplier = useAppSelector((s) => s.customerSuppliers.items);

	const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);

	const subsidiaryId = useMemo(() => {
		return (
			personalizacionUsuario?.subsidiary_id ??
			currentUser?.subsidiary?.id ??
			currentUser?.branch?.subsidiary?.id ??
			null
		);
	}, [personalizacionUsuario, currentUser]);

	// Cargar bodegas y proveedores al montar
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

	// Opciones de selects
	const warehouseOptions: TSelectOption[] = useMemo(() => {
		if (!warehouses?.length) return [{ value: '', label: 'No hay bodegas disponibles' }];
		return warehouses.map((warehouse) => ({
			value: String(warehouse.id),
			label: `${warehouse.name} (${warehouse.code})`,
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
				navigate(`/technical-reviews/batches/${result.id}`);
			} catch (error) {
				console.error('Error al crear lote:', error);
				toast.error('Error al crear el lote. Inténtalo nuevamente.');
			} finally {
				setSubmitting(false);
			}
		},
	});
	const selectedCustomer = useMemo(() => {
		return customer_supplier.find((c) => c.id === formik.values.customer_supplier_id) || null;
	}, [customer_supplier, formik?.values?.customer_supplier_id]);

	const supplierOptions: TSelectOption[] = useMemo(() => {
		if (!selectedCustomer?.suppliers?.length) return [];
		return selectedCustomer.suppliers.map((supplier) => ({
			value: String(supplier.id),
			label: supplier.name || 'Proveedor sin nombre',
		}));
	}, [selectedCustomer]);

	useEffect(() => {
		if (
			selectedSupplierId !== null &&
			!supplierOptions.some((opt) => opt.value === String(selectedSupplierId))
		) {
			setSelectedSupplierId(null);
		}
	}, [supplierOptions, selectedSupplierId]);

	const handleCancel = () => navigate('/technical-reviews/batches');
	const handleCreateBatch = () => formik.handleSubmit();

	return (
		<PageWrapper name='create-batch'>
			<Container>
				{/* Header */}
				<div className='mb-6 flex items-center gap-4'>
					<Button variant='outline' onClick={handleCancel}>
						<Icon icon='HeroArrowLeft' className='h-4 w-4' />
					</Button>
					<div>
						<h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
							Crear Nuevo Lote
						</h1>
						<p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
							Registra un nuevo lote de equipos para revisión técnica
						</p>
					</div>
				</div>

				<div className='mb-8 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-transparent p-4 shadow-sm dark:border-blue-900 dark:from-blue-900/40 dark:via-slate-900 dark:to-transparent'>
					<div className='flex items-start gap-4'>
						<div className='rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-300'>
							<Icon icon='HeroClipboardDocumentCheck' className='h-6 w-6' />
						</div>
						<div>
							<p className='text-base font-semibold text-gray-900 dark:text-gray-100'>
								Resumen rápido del lote
							</p>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								Completa los campos obligatorios para registrar la bodega destino,
								proveedor de origen y la cantidad esperada. Puedes dejar notas
								internas para el equipo técnico.
							</p>
						</div>
					</div>
				</div>

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
									<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
										Datos mínimos para clasificar y trazar el ingreso.
									</p>
								</div>
							</div>
						</CardHeader>
						<CardBody>
							<div className='space-y-6'>
								{/* Bodega */}
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
									{formik.touched.warehouse_id && formik.errors.warehouse_id && (
										<p className='mt-1 text-xs text-red-500'>
											{formik.errors.warehouse_id}
										</p>
									)}
								</div>

								{/* Cliente/Proveedor */}
								<div>
									<Label
										htmlFor='customer_supplier_id'
										className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Cliente/Proveedor <span className='text-red-500'>*</span>
									</Label>
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
									{supplierOptions.length > 0 && (
										<div className='mt-4'>
											<Label
												htmlFor='proveedor_asociado'
												className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
												Proveedor asociado
											</Label>
											<SelectReact
												name='supplier_id'
												placeholder='Seleccionar proveedor'
												options={supplierOptions}
												value={
													selectedSupplierId !== null
														? supplierOptions.find(
																(opt) =>
																	opt.value ===
																	String(selectedSupplierId),
															) || null
														: null
												}
												onChange={(option) => {
													const selectedOption =
														normalizeSelectValue(option);
													setSelectedSupplierId(
														selectedOption
															? parseInt(selectedOption.value)
															: null,
													);
												}}
											/>
										</div>
									)}
									{formik.touched.customer_supplier_id &&
										formik.errors.customer_supplier_id && (
											<p className='mt-1 text-xs text-red-500'>
												{formik.errors.customer_supplier_id}
											</p>
										)}
								</div>

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
										asociado para tener trazabilidad comercial completa.
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

					{/* Botones de acción */}
					<div className='mt-6 flex justify-end gap-3'>
						<Button
							variant='outline'
							onClick={handleCancel}
							isDisable={loading || formik.isSubmitting}>
							Cancelar
						</Button>
						<Button
							onClick={handleCreateBatch}
							isDisable={loading || formik.isSubmitting}
							isLoading={formik.isSubmitting}>
							{formik.isSubmitting ? (
								<>
									<div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
									Creando...
								</>
							) : (
								<>
									<Icon icon='HeroCheck' className='mr-2 h-4 w-4' />
									Crear Lote
								</>
							)}
						</Button>
					</div>
				</form>
			</Container>
		</PageWrapper>
	);
};

export default CreateBatchPage;
