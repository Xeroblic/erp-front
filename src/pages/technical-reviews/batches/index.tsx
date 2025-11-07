/**
 * Technical Reviews - Batches List (Modo A)
 * Listado de lotes con filtros y búsqueda por serie
 */
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchBatches,
	selectBatches,
	selectBatchesMeta,
	selectBatchesLoading,
	selectBatchesError,
	type FetchBatchesParams,
	type CommercialStatus,
} from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { fetchWarehouses } from '@/store/slices/warehouses/warehouseSlice';

const BatchesListPage: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();

	const batches = useAppSelector(selectBatches);
	const meta = useAppSelector(selectBatchesMeta);
	const loading = useAppSelector(selectBatchesLoading);
	const error = useAppSelector(selectBatchesError);
	const warehouses = useAppSelector((s) => s.warehouse.warehouses);
	const warehousesLoading = useAppSelector((s) => s.warehouse.loading);

	const [filters, setFilters] = useState<FetchBatchesParams>({
		page: 1,
		per_page: 20,
	});

	const [searchSerial, setSearchSerial] = useState('');

	// Cargar bodegas al montar el componente
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

	// Convertir bodegas a opciones para el SelectReact
	const warehouseOptions: TSelectOption[] = useMemo(() => {
		const options: TSelectOption[] = [{ value: '', label: 'Todas' }];
		if (warehouses && warehouses.length > 0) {
			warehouses.forEach((warehouse) => {
				options.push({
					value: String(warehouse.id),
					label: `${warehouse.name} (${warehouse.code})`,
				});
			});
		}
		return options;
	}, [warehouses]);

	const statusOptions: TSelectOption[] = [
		{ value: '', label: 'Todos' },
		{ value: 'received', label: 'Recibido' },
		{ value: 'available_for_sale', label: 'En Venta' },
		{ value: 'sold', label: 'Vendido' },
	];

	useEffect(() => {
		if (!branchId) return;
		dispatch(fetchBatches({ branchId, params: filters }));
	}, [dispatch, filters, branchId]);

	const handleSearch = () => {
		setFilters((prev) => ({
			...prev,
			search: searchSerial,
			page: 1,
		}));
	};

	const handleResetFilters = () => {
		setSearchSerial('');
		setFilters({
			page: 1,
			per_page: 20,
		});
	};

	const handleViewBatch = (batchId: number) => {
		navigate(`/technical-reviews/batches/${batchId}`);
	};

	const handleCreateBatch = () => {
		navigate('/technical-reviews/batches/create');
	};

	return (
		<PageWrapper name='technical-reviews-batches'>
			<Container>
				{/* Header */}
				<div className='mb-6 flex items-center justify-between'>
					<div>
						<h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
							Lotes de Revisión
						</h1>
						<p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
							Gestiona lotes y sus equipos organizados por tipo
						</p>
					</div>
					<Button onClick={handleCreateBatch}>
						<Icon icon='HeroPlus' className='mr-2 h-4 w-4' />
						Crear Lote
					</Button>
				</div>

				{/* Error */}
				{error && (
					<Card className='mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'>
						<CardBody>
							<p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
						</CardBody>
					</Card>
				)}

				{/* Filtros */}
				<Card className='mb-6'>
					<CardHeader>
						<h3 className='text-lg font-semibold'>Filtros y Búsqueda</h3>
					</CardHeader>
					<CardBody>
						<div className='space-y-4'>
							{/* Buscador por serie (como CTRL+F en Excel) */}
							<div>
								<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Buscar por Número de Serie
								</label>
								<div className='flex gap-2'>
									<Input
										name='serial_tracking'
										type='text'
										placeholder='Ej: SN001234...'
										value={searchSerial}
										onChange={(e) => setSearchSerial(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') handleSearch();
										}}
										className='flex-1'
									/>
									<Button onClick={handleSearch} isDisable={loading}>
										<Icon icon='HeroMagnifyingGlass' className='mr-2 h-4 w-4' />
										Buscar
									</Button>
								</div>
								<p className='mt-1 text-xs text-gray-500'>
									Busca series dentro de los ítems de cualquier lote
								</p>
							</div>
							{/* Filtros adicionales (warehouse, status, year, dates) */}
							<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
								{/* Bodega */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Bodega
									</label>
									<SelectReact
										name='warehouse_id'
										placeholder='Todas'
										options={warehouseOptions}
										value={
											warehouseOptions.find(
												(opt) =>
													opt.value ===
													String(filters.warehouse_id ?? ''),
											) || warehouseOptions[0]
										}
										onChange={(option) => {
											const selectedOption = option as TSelectOption | null;
											setFilters((prev) => ({
												...prev,
												warehouse_id: selectedOption?.value
													? parseInt(selectedOption.value)
													: undefined,
												page: 1,
											}));
										}}
									/>
								</div>

								{/* Estado */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Estado
									</label>
									<SelectReact
										name='status'
										placeholder='Todos'
										options={statusOptions}
										value={
											statusOptions.find(
												(opt) => opt.value === (filters.status ?? ''),
											) || statusOptions[0]
										}
										onChange={(option) => {
											const selectedOption = option as TSelectOption | null;
											const statusValue = selectedOption?.value;
											setFilters((prev) => ({
												...prev,
												status:
													statusValue && statusValue !== ''
														? (statusValue as CommercialStatus)
														: undefined,
												page: 1,
											}));
										}}
									/>
								</div>

								{/* Año */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Año
									</label>
									<Input
										name='year'
										type='number'
										placeholder='2024'
										value={filters.year ?? ''}
										onChange={(e: any) =>
											setFilters((prev) => ({
												...prev,
												year: e.target.value
													? parseInt(e.target.value)
													: undefined,
											}))
										}
									/>
								</div>
							</div>{' '}
							<div className='flex justify-end gap-2'>
								<Button variant='outline' onClick={handleResetFilters}>
									Limpiar Filtros
								</Button>
							</div>
						</div>
					</CardBody>
				</Card>

				{/* Tabla de lotes */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<h3 className='text-lg font-semibold'>Lotes ({meta.total})</h3>
						</div>
					</CardHeader>
					<CardBody>
						{loading ? (
							<div className='py-12 text-center'>
								<div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent' />
								<p className='mt-2 text-sm text-gray-600'>Cargando lotes...</p>
							</div>
						) : batches.length === 0 ? (
							<div className='py-12 text-center text-gray-500'>
								<Icon
									icon='HeroInboxStack'
									className='mx-auto mb-3 h-12 w-12 text-gray-400'
								/>
								<p>No se encontraron lotes</p>
								<p className='mt-1 text-sm'>
									{searchSerial
										? 'Intenta con otro número de serie'
										: 'Crea tu primer lote para comenzar'}
								</p>
							</div>
						) : (
							<>
								<div className='overflow-x-auto'>
									<table className='w-full'>
										<thead className='border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'>
											<tr>
												<th className='px-4 py-3 text-left text-sm font-semibold'>
													ID
												</th>
												<th className='px-4 py-3 text-left text-sm font-semibold'>
													Código
												</th>
												<th className='px-4 py-3 text-left text-sm font-semibold'>
													Bodega
												</th>
												<th className='px-4 py-3 text-left text-sm font-semibold'>
													Proveedor
												</th>
												<th className='px-4 py-3 text-left text-sm font-semibold'>
													Fecha Entrada
												</th>
												<th className='px-4 py-3 text-left text-sm font-semibold'>
													Cant. Esperada
												</th>
												<th className='px-4 py-3 text-left text-sm font-semibold'>
													Estado
												</th>
												<th className='px-4 py-3 text-right text-sm font-semibold'>
													Acciones
												</th>
											</tr>
										</thead>
										<tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
											{batches.map((batch) => (
												<tr
													key={batch.id}
													className='hover:bg-gray-50 dark:hover:bg-gray-800'>
													<td className='px-4 py-3 text-sm'>
														#{batch.id}
													</td>
													<td className='px-4 py-3 text-sm font-medium'>
														{batch.code || `Lote #${batch.id}`}
													</td>
													<td className='px-4 py-3 text-sm'>
														{batch.warehouse?.name ||
															`Bodega #${batch.warehouse_id}`}
													</td>
													<td className='px-4 py-3 text-sm'>
														{batch.customer_supplier?.name ||
															`Proveedor #${batch.customer_supplier_id}`}
													</td>
													<td className='px-4 py-3 text-sm'>
														{batch.entry_date}
													</td>
													<td className='px-4 py-3 text-sm'>
														{batch.expected_quantity}
													</td>
													<td className='px-4 py-3 text-sm'>
														<span className='inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800'>
															{batch.status}
														</span>
													</td>
													<td className='px-4 py-3 text-right text-sm'>
														<Button
															variant='outline'
															size='sm'
															icon='HeroEye'
                                                            onClick={() =>
																handleViewBatch(batch.id)
															}>
															
														</Button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>

								{/* Paginación */}
								{meta.last_page > 1 && (
									<div className='mt-4 flex items-center justify-between'>
										<p className='text-sm text-gray-600'>
											Página {meta.current_page} de {meta.last_page}
										</p>
										<div className='flex gap-2'>
											<Button
												variant='outline'
												size='sm'
												isDisable={meta.current_page === 1}
												onClick={() =>
													setFilters((prev) => ({
														...prev,
														page: (prev.page ?? 1) - 1,
													}))
												}>
												Anterior
											</Button>
											<Button
												variant='outline'
												size='sm'
												isDisable={meta.current_page === meta.last_page}
												onClick={() =>
													setFilters((prev) => ({
														...prev,
														page: (prev.page ?? 1) + 1,
													}))
												}>
												Siguiente
											</Button>
										</div>
									</div>
								)}
							</>
						)}
					</CardBody>
				</Card>
			</Container>
		</PageWrapper>
	);
};

export default BatchesListPage;
