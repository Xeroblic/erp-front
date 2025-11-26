import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Icon from '@/components/icon/Icon';
import { useWarehouseManagement } from './hooks/useWarehouseManagement';
import WarehousesTable from './tables/WarehousesTable';
import CreateWarehouseModal from './modals/CreateWarehouseModal';
import EditWarehouseModal from './modals/EditWarehouseModal';
import DeleteWarehouseModal from './modals/DeleteWarehouseModal';
import WarehousesCharts from './components/WarehousesCharts';
import type { IWarehouse } from '@/interface/warehouse.interface';
import Card, { CardBody } from '@/components/ui/Card';

/**
 * Página principal de listado de bodegas
 * Sigue el estándar del proyecto con búsqueda, filtros y acciones
 */
const WarehouseListPage: React.FC = () => {
	const navigate = useNavigate();
	const user = useAppSelector((s) => s.auth.user);
	const personalizacionState = useAppSelector((s) => s.personalizacion);

	// Obtener branchId del usuario autenticado
	const branchId =
		personalizacionState?.personalizacionUsuario?.sucursal_principal ||
		user?.branch?.id ||
		(user?.personalizacion?.sucursal_principal ?? 0);

	const {
		warehouses,
		stats,
		loading,
		loadWarehouses,
		handleCreateWarehouse,
		handleUpdateWarehouse,
		handleDeleteWarehouse,
	} = useWarehouseManagement(branchId);

	const [globalFilter, setGlobalFilter] = useState('');
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [selectedWarehouse, setSelectedWarehouse] = useState<IWarehouse | null>(null);

	// Cargar bodegas al montar el componente
	useEffect(() => {
		if (branchId) {
			loadWarehouses({ page: 1, per_page: 15 });
		}
	}, [branchId, loadWarehouses]);

	// Filtrar bodegas por búsqueda global
	const filteredWarehouses = warehouses.filter((warehouse) => {
		const searchLower = globalFilter.toLowerCase();
		return (
			warehouse.name.toLowerCase().includes(searchLower) ||
			warehouse.code.toLowerCase().includes(searchLower) ||
			warehouse.warehouse_type.toLowerCase().includes(searchLower)
		);
	});

	const handleEdit = (warehouse: IWarehouse) => {
		setSelectedWarehouse(warehouse);
		setEditModalOpen(true);
	};

	const handleViewDetail = (warehouse: IWarehouse) => {
		// Navegar a la página de detalle
		navigate(`/catalogos/bodegas/${warehouse.id}`);
	};

	const handleDelete = (warehouse: IWarehouse) => {
		setSelectedWarehouse(warehouse);
		setDeleteModalOpen(true);
	};

	const confirmDelete = async () => {
		if (!selectedWarehouse) return false;
		const success = await handleDeleteWarehouse(selectedWarehouse.id);
		if (success) {
			setSelectedWarehouse(null);
			loadWarehouses({ page: 1, per_page: 15 });
		}
		return success;
	};

	return (
		<PageWrapper isProtectedRoute title='Bodegas' name='bodegas'>
			<Subheader>
				<SubheaderLeft>
					<div>
						<div className='flex items-center gap-3'>
							<div className='flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/20'>
								<Icon icon='HeroHomeModern' className='size-7 text-blue-600 dark:text-blue-400' />
							</div>
							<div>
								<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Bodegas</h1>
								<p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
									{stats.total} bodega{stats.total !== 1 ? 's' : ''} registrada
									{stats.total !== 1 ? 's' : ''} • {stats.actives} activa
									{stats.actives !== 1 ? 's' : ''}
								</p>
							</div>
						</div>
						<div className='flex flex-col gap-2'>
							<p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
								Administración de las bodegas asociadas a la sucursal principal.
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight className='flex items-center gap-3'>
					<div className='relative'>
						<Input
							name='warehouse-search'
							placeholder='Buscar por nombre, código o tipo...'
							value={globalFilter}
							onChange={(e) => setGlobalFilter(e.target.value)}
							className='w-64'
							dimension='lg'
						/>
						{globalFilter && (
							<button
								onClick={() => setGlobalFilter('')}
								className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'>
								<Icon icon='HeroXMark' className='size-5' />
							</button>
						)}
					</div>
					<Button
						variant='solid'
						color='blue'
						icon='HeroPlus'
						size='lg'
						onClick={() => setCreateModalOpen(true)}>
						Nueva Bodega
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container className='pt-4'>
				{/* Estadísticas rápidas */}
				{!loading && warehouses.length > 0 && (
					<div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
						<Card className='rounded-lg p-4'>
							<CardBody className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
										Total
									</p>
									<p className='mt-1 text-2xl font-semibold text-gray-900 dark:text-white'>
										{stats.total}
									</p>
								</div>
								<Icon icon='HeroHomeModern' className='size-8 text-blue-600' />
							</CardBody>
						</Card>

						<Card className='rounded-lg p-4'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
										Activas
									</p>
									<p className='mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400'>
										{stats.actives}
									</p>
								</div>
								<Icon icon='HeroCheckCircle' className='size-8 text-emerald-600' />
							</div>
						</Card>

						<Card className='rounded-lg p-4'>
							<CardBody className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
										Con productos
									</p>
									<p className='mt-1 text-2xl font-semibold text-blue-600 dark:text-blue-400'>
										{stats.with_products}
									</p>
								</div>
								<Icon icon='HeroArchiveBox' className='size-8 text-blue-600' />
							</CardBody>
						</Card>

						<Card className='rounded-lg p-4'>
							<CardBody className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
										Cerca capacidad
									</p>
									<p className='mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400'>
										{stats.near_capacity}
									</p>
								</div>
								<Icon
									icon='HeroExclamationTriangle'
									className='size-8 text-amber-600'
								/>
							</CardBody>
						</Card>
					</div>
				)}

				{/* Charts de análisis */}
				{!loading && warehouses.length > 0 && <WarehousesCharts warehouses={warehouses} />}

				{/* Tabla de bodegas */}
				<WarehousesTable
					warehouses={filteredWarehouses}
					loading={loading}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>
			</Container>

			{/* Modales */}
			<CreateWarehouseModal
				isOpen={createModalOpen}
				setIsOpen={setCreateModalOpen}
				onSubmit={handleCreateWarehouse}
				branchId={branchId}
			/>

			<EditWarehouseModal
				isOpen={editModalOpen}
				setIsOpen={setEditModalOpen}
				warehouse={selectedWarehouse}
				onSubmit={handleUpdateWarehouse}
				branchId={branchId}
			/>

			<DeleteWarehouseModal
				isOpen={deleteModalOpen}
				setIsOpen={setDeleteModalOpen}
				warehouse={selectedWarehouse}
				onConfirm={confirmDelete}
			/>
		</PageWrapper>
	);
};

export default WarehouseListPage;
