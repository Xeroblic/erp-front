/**
 * Technical Reviews - Items List (Modo B - Global View)
 * Vista global de todos los items sin agrupar por lote
 */
import React, { useEffect, useState } from 'react';
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
	fetchItems,
	selectItemsLoading,
	selectItemsError,
	type FetchItemsParams,
	type EquipmentType,
	type ReviewStatus,
	type CommercialStatus,
} from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';

const ItemsListPage: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { branchId } = useCurrentBranch();

	const loading = useAppSelector(selectItemsLoading);
	const error = useAppSelector(selectItemsError);

	// TODO: Obtener items del selector (actualmente no existe selectItems genérico)
	const items: any[] = [];
	const meta = { total: 0, current_page: 1, last_page: 1 };

	const [filters, setFilters] = useState<FetchItemsParams>({
		page: 1,
		per_page: 20,
	});

	const [searchSerial, setSearchSerial] = useState('');

	const equipmentTypeOptions: TSelectOption[] = [
		{ value: '', label: 'Todos' },
		{ value: 'notebook', label: 'Notebook' },
		{ value: 'desktop', label: 'Desktop' },
		{ value: 'aio', label: 'All-in-One' },
		{ value: 'docking', label: 'Docking' },
		{ value: 'monitor', label: 'Monitor' },
	];

	const reviewStatusOptions: TSelectOption[] = [
		{ value: '', label: 'Todos' },
		{ value: 'pending', label: 'Pendiente' },
		{ value: 'in_review', label: 'En Revisión' },
		{ value: 'reviewed', label: 'Revisado' },
		{ value: 'approved', label: 'Aprobado' },
	];

	const commercialStatusOptions: TSelectOption[] = [
		{ value: '', label: 'Todos' },
		{ value: 'unknown', label: 'Desconocido' },
		{ value: 'received', label: 'Recibido' },
		{ value: 'available_for_sale', label: 'En Venta' },
		{ value: 'in_quotation', label: 'En Cotización' },
		{ value: 'sold', label: 'Vendido' },
		{ value: 'reserved', label: 'Reservado' },
	];

	useEffect(() => {
		if (!branchId) return;
		dispatch(fetchItems({ branchId: branchId, params: filters }));
	}, [dispatch, filters, branchId]);

	const handleSearch = () => {
		setFilters((prev: any) => ({
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

	const handleViewItem = (itemId: number) => {
		navigate(`/technical-reviews/items/${itemId}`);
	};

	const handleCreateItem = () => {
		navigate('/technical-reviews/items/create');
	};

	return (
		<PageWrapper name='technical-reviews-items'>
			<Container>
				{/* Header */}
				<div className='mb-6 flex items-center justify-between'>
					<div>
						<h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
							Ítems Globales
						</h1>
						<p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
							Vista global de todos los equipos sin agrupar por lote
						</p>
					</div>
					<Button onClick={handleCreateItem}>
						<Icon icon='HeroPlus' className='mr-2 h-4 w-4' />
						Nueva Revisión
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
							{/* Buscador por serie */}
							<div>
								<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
									Buscar por Número de Serie
								</label>
								<div className='flex gap-2'>
									<Input
										name='search_serial'
										type='text'
										placeholder='Ej: SN001234...'
										value={searchSerial}
										onChange={(e: any) => setSearchSerial(e.target.value)}
										onKeyDown={(e: any) => {
											if (e.key === 'Enter') handleSearch();
										}}
										className='flex-1'
									/>
									<Button onClick={handleSearch} isDisable={loading}>
										<Icon icon='HeroMagnifyingGlass' className='mr-2 h-4 w-4' />
										Buscar
									</Button>
								</div>
							</div>
							{/* Filtros adicionales */}
							<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
								{/* Tipo de Equipo */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Tipo de Equipo
									</label>
									<SelectReact
										name='equipment_type'
										placeholder='Todos'
										options={equipmentTypeOptions}
										value={
											equipmentTypeOptions.find(
												(opt) =>
													opt.value === (filters.equipment_type ?? ''),
											) || equipmentTypeOptions[0]
										}
										onChange={(option) => {
											const selectedOption = option as TSelectOption | null;
											setFilters((prev: any) => ({
												...prev,
												equipment_type: selectedOption?.value || undefined,
												page: 1,
											}));
										}}
									/>
								</div>

								{/* Estado de Revisión */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Estado de Revisión
									</label>
									<SelectReact
										name='review_status'
										placeholder='Todos'
										options={reviewStatusOptions}
										value={
											reviewStatusOptions.find(
												(opt) =>
													opt.value === (filters.review_status ?? ''),
											) || reviewStatusOptions[0]
										}
										onChange={(option) => {
											const selectedOption = option as TSelectOption | null;
											setFilters((prev: any) => ({
												...prev,
												review_status: selectedOption?.value || undefined,
												page: 1,
											}));
										}}
									/>
								</div>

								{/* Estado Comercial */}
								<div>
									<label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
										Estado Comercial
									</label>
									<SelectReact
										name='current_status'
										placeholder='Todos'
										options={commercialStatusOptions}
										value={
											commercialStatusOptions.find(
												(opt) =>
													opt.value === (filters.current_status ?? ''),
											) || commercialStatusOptions[0]
										}
										onChange={(option) => {
											const selectedOption = option as TSelectOption | null;
											setFilters((prev: any) => ({
												...prev,
												current_status: selectedOption?.value || undefined,
												page: 1,
											}));
										}}
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

				{/* Tabla de items */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<h3 className='text-lg font-semibold'>Ítems ({meta.total})</h3>
						</div>
					</CardHeader>
					<CardBody>
						{loading ? (
							<div className='py-12 text-center'>
								<div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent' />
								<p className='mt-2 text-sm text-gray-600'>Cargando ítems...</p>
							</div>
						) : items.length === 0 ? (
							<div className='py-12 text-center text-gray-500'>
								<Icon
									icon='HeroInboxStack'
									className='mx-auto mb-3 h-12 w-12 text-gray-400'
								/>
								<p>No se encontraron ítems</p>
								<p className='mt-1 text-sm'>
									{searchSerial
										? 'Intenta con otro número de serie'
										: 'Crea tu primera revisión para comenzar'}
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
													Serie
												</th>
												<th className='px-4 py-3 text-left text-sm font-semibold'>
													Tipo
												</th>
												<th className='px-4 py-3 text-left text-sm font-semibold'>
													Producto
												</th>
												<th className='px-4 py-3 text-left text-sm font-semibold'>
													Lote
												</th>
												<th className='px-4 py-3 text-left text-sm font-semibold'>
													Estado Revisión
												</th>
												<th className='px-4 py-3 text-left text-sm font-semibold'>
													Estado Comercial
												</th>
												<th className='px-4 py-3 text-right text-sm font-semibold'>
													Acciones
												</th>
											</tr>
										</thead>
										<tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
											{items.map((item: any) => (
												<tr
													key={item.id}
													className='hover:bg-gray-50 dark:hover:bg-gray-800'>
													<td className='px-4 py-3 text-sm'>
														#{item.id}
													</td>
													<td className='px-4 py-3 font-mono text-sm'>
														{item.serial_number}
													</td>
													<td className='px-4 py-3 text-sm'>
														<span className='inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800'>
															{item.equipment_type}
														</span>
													</td>
													<td className='px-4 py-3 text-sm'>
														Producto #{item.product_id}
													</td>
													<td className='px-4 py-3 text-sm'>
														{item.batch_id ? (
															`Lote #${item.batch_id}`
														) : (
															<span className='text-gray-400'>
																Sin lote
															</span>
														)}
													</td>
													<td className='px-4 py-3 text-sm'>
														<span className='inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800'>
															{item.review_status}
														</span>
													</td>
													<td className='px-4 py-3 text-sm'>
														<span className='inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800'>
															{item.commercial_status}
														</span>
													</td>
													<td className='px-4 py-3 text-right text-sm'>
														<Button
															variant='outline'
															size='sm'
															onClick={() => handleViewItem(item.id)}>
															Ver Revisión
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
													setFilters((prev: any) => ({
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
													setFilters((prev: any) => ({
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

export default ItemsListPage;
