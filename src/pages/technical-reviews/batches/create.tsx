/**
 * Technical Reviews - Create Batch
 * Formulario para crear un nuevo lote
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { useAppDispatch, useAppSelector } from '@/store';
import { createBatch, selectBatchesLoading } from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import Textarea from '@/components/form/Textarea';
import { fetchWarehouses } from '@/store/slices/warehouses/warehouseSlice';
import { fetchSuppliers } from '@/store/slices/suppliers/suppliersSlice';
import { selectPersonalizacionUsuario } from '@/store/slices/personalizacion/personalizacionSlice';

// Tipo local para el payload del formulario
interface CreateBatchFormData {
	warehouse_id: number;
	customer_supplier_id: number;
	entry_date: string;
	expected_quantity: number;
	notes?: string;
}

const CreateBatchPage: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const loading = useAppSelector(selectBatchesLoading);
	const { branchId, hasValidBranch } = useCurrentBranch();

	// Obtener datos del store
	const currentUser = useAppSelector((s) => s.auth.user);
	const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);
	const warehouses = useAppSelector((s) => s.warehouse.warehouses);
	const warehousesLoading = useAppSelector((s) => s.warehouse.loading);
	const suppliers = useAppSelector((s) => s.suppliers.items);
	const suppliersLoading = useAppSelector((s) => s.suppliers.loading);

	// Obtener subsidiaryId del usuario
	const subsidiaryId = useMemo(() => {
		return (
			personalizacionUsuario?.subsidiary_id ??
			currentUser?.subsidiary?.id ??
			currentUser?.branch?.subsidiary?.id ??
			null
		);
	}, [personalizacionUsuario, currentUser]);

	const [formData, setFormData] = useState<CreateBatchFormData>({
		warehouse_id: 0,
		customer_supplier_id: 0,
		entry_date: '',
		expected_quantity: 0,
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	// Cargar bodegas y proveedores al montar el componente
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
				fetchSuppliers({
					subsidiaryId,
					with_customers: false,
				}),
			);
		}
	}, [dispatch, subsidiaryId]);

	// Convertir bodegas a opciones para el SelectReact
	const warehouseOptions: TSelectOption[] = useMemo(() => {
		if (!warehouses || warehouses.length === 0) {
			return [{ value: '', label: 'No hay bodegas disponibles' }];
		}
		return warehouses.map((warehouse) => ({
			value: String(warehouse.id),
			label: `${warehouse.name} (${warehouse.code})`,
		}));
	}, [warehouses]);

	// Convertir proveedores a opciones para el SelectReact
	const supplierOptions: TSelectOption[] = useMemo(() => {
		if (!suppliers || suppliers.length === 0) {
			return [{ value: '', label: 'No hay proveedores disponibles' }];
		}
		return suppliers.map((supplier) => ({
			value: String(supplier.id),
			label: supplier.name,
		}));
	}, [suppliers]);

	const handleChange = (field: keyof CreateBatchFormData, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Limpiar error del campo
		if (errors[field]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[field];
				return newErrors;
			});
		}
	};

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.warehouse_id) {
			newErrors.warehouse_id = 'Selecciona una bodega';
		}
		if (!formData.customer_supplier_id) {
			newErrors.customer_supplier_id = 'Selecciona un proveedor';
		}
		if (!formData.entry_date) {
			newErrors.entry_date = 'Ingresa la fecha de entrada';
		}
		if (!formData.expected_quantity || formData.expected_quantity <= 0) {
			newErrors.expected_quantity = 'Ingresa una cantidad esperada válida';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) return;

		if (!branchId) {
			console.error('No hay branchId disponible');
			// TODO: Mostrar notificación de error
			return;
		}

		try {
			const result = await dispatch(
				createBatch({ branchId: branchId, data: formData }),
			).unwrap();

			// Navegar al lote creado
			navigate(`/technical-reviews/batches/${result.id}`);
		} catch (error: any) {
			console.error('Error al crear lote:', error);
			// TODO: Mostrar notificación de error
		}
	};

	const handleCancel = () => {
		navigate('/technical-reviews/batches');
	};

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

				{/* Formulario */}
				<form onSubmit={handleSubmit}>
					<Card>
						<CardHeader>
							<h3 className='text-lg font-semibold'>Información del Lote</h3>
						</CardHeader>
						<CardBody>
							<div className='space-y-6'>
								{/* Bodega */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Bodega <span className='text-red-500'>*</span>
									</label>
									<SelectReact
										name='warehouse_id'
										placeholder='Seleccionar bodega'
										options={warehouseOptions}
										value={
											warehouseOptions.find(
												(opt) =>
													opt.value === String(formData.warehouse_id),
											) || null
										}
										onChange={(option) => {
											const selectedOption = option as TSelectOption | null;
											handleChange(
												'warehouse_id',
												selectedOption ? parseInt(selectedOption.value) : 0,
											);
										}}
										className={errors.warehouse_id ? 'border-red-500' : ''}
									/>
									{errors.warehouse_id && (
										<p className='mt-1 text-xs text-red-500'>
											{errors.warehouse_id}
										</p>
									)}
								</div>
								{/* Proveedor */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Proveedor <span className='text-red-500'>*</span>
									</label>
									<SelectReact
										name='customer_supplier_id'
										placeholder='Seleccionar proveedor'
										options={supplierOptions}
										value={
											supplierOptions.find(
												(opt) =>
													opt.value ===
													String(formData.customer_supplier_id),
											) || null
										}
										onChange={(option) => {
											const selectedOption = option as TSelectOption | null;
											handleChange(
												'customer_supplier_id',
												selectedOption ? parseInt(selectedOption.value) : 0,
											);
										}}
										className={
											errors.customer_supplier_id ? 'border-red-500' : ''
										}
									/>
									{errors.customer_supplier_id && (
										<p className='mt-1 text-xs text-red-500'>
											{errors.customer_supplier_id}
										</p>
									)}
								</div>{' '}
								{/* Fecha de Entrada */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Fecha de Entrada <span className='text-red-500'>*</span>
									</label>
									<Input
										name='entry_date'
										type='date'
										value={formData.entry_date}
										onChange={(e: any) =>
											handleChange('entry_date', e.target.value)
										}
										className={errors.entry_date ? 'border-red-500' : ''}
									/>
									{errors.entry_date && (
										<p className='mt-1 text-xs text-red-500'>
											{errors.entry_date}
										</p>
									)}
								</div>
								{/* Cantidad Esperada */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Cantidad Esperada <span className='text-red-500'>*</span>
									</label>
									<Input
										name='expected_quantity'
										type='number'
										min='1'
										value={formData.expected_quantity}
										onChange={(e: any) =>
											handleChange(
												'expected_quantity',
												parseInt(e.target.value),
											)
										}
										className={errors.expected_quantity ? 'border-red-500' : ''}
										placeholder='Ej: 50'
									/>
									{errors.expected_quantity && (
										<p className='mt-1 text-xs text-red-500'>
											{errors.expected_quantity}
										</p>
									)}
								</div>
								{/* Comentarios */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Notas/Comentarios
									</label>
									<Textarea
										name='notes'
										value={formData.notes || ''}
										onChange={(e) => handleChange('notes', e.target.value)}
										className='w-full rounded-lg border border-gray-300 p-2.5 text-sm'
										rows={4}
										placeholder='Notas adicionales sobre el lote...'
									/>
								</div>
							</div>
						</CardBody>
					</Card>

					{/* Botones de acción */}
					<div className='mt-6 flex justify-end gap-3'>
						<Button variant='outline' onClick={handleCancel} isDisable={loading}>
							Cancelar
						</Button>
						<Button onClick={handleSubmit as any} isDisable={loading}>
							{loading ? (
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
