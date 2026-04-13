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
import type { IWarehouse } from '@/interface/warehouse.interface';
import Card, { CardBody } from '@/components/ui/Card';
import WarehouseStats from './components/WarehouseStats';

// Importaciones Lazy
const WarehousesCharts = React.lazy(() => import('./components/WarehousesCharts'));
const CreateWarehouseModal = React.lazy(() => import('./modals/CreateWarehouseModal'));
const EditWarehouseModal = React.lazy(() => import('./modals/EditWarehouseModal'));
const DeleteWarehouseModal = React.lazy(() => import('./modals/DeleteWarehouseModal'));

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
		navigate(`/inventario/bodegas/${warehouse.id}`);
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
						<div className='flex items-center gap-2'>
							<Icon icon='HeroHomeModern' className='text-3xl' />
							<span className='text-2xl font-bold'>Bodegas</span>
						</div>
						<div className='flex flex-col gap-2'>
							<p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
								Administración de las bodegas asociadas a la sucursal principal.
							</p>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								{stats.total} bodega{stats.total !== 1 ? 's' : ''} registrada
								{stats.total !== 1 ? 's' : ''} • {stats.actives} activa
								{stats.actives !== 1 ? 's' : ''}
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
				{/* Estadísticas rápidas - Componente Extrído */}
				{!loading && warehouses.length > 0 && (
					<WarehouseStats
						total={stats.total}
						actives={stats.actives}
						withProducts={stats.with_products}
						nearCapacity={stats.near_capacity}
					/>
				)}

				{/* Charts de análisis */}
				{!loading && warehouses.length > 0 && (
					<React.Suspense
						fallback={
							<div className='h-64 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800'></div>
						}>
						<WarehousesCharts warehouses={warehouses} />
					</React.Suspense>
				)}

				{/* Tabla de bodegas */}
				<WarehousesTable
					warehouses={filteredWarehouses}
					loading={loading}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>
			</Container>

			{/* Modales con Lazy Loading */}
			<React.Suspense
				fallback={
					<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
						<div className='h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent' />
					</div>
				}>
				{createModalOpen && (
					<CreateWarehouseModal
						isOpen={createModalOpen}
						setIsOpen={setCreateModalOpen}
						onSubmit={handleCreateWarehouse}
						branchId={branchId}
					/>
				)}

				{editModalOpen && (
					<EditWarehouseModal
						isOpen={editModalOpen}
						setIsOpen={setEditModalOpen}
						warehouse={selectedWarehouse}
						onSubmit={handleUpdateWarehouse}
						branchId={branchId}
					/>
				)}

				{deleteModalOpen && (
					<DeleteWarehouseModal
						isOpen={deleteModalOpen}
						setIsOpen={setDeleteModalOpen}
						warehouse={selectedWarehouse}
						onConfirm={confirmDelete}
					/>
				)}
			</React.Suspense>
		</PageWrapper>
	);
};

export default WarehouseListPage;
