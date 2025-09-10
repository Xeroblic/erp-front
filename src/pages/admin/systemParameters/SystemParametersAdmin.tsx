import React, { useEffect } from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import Badge from '@/components/ui/Badge';
import { SystemParameter, SystemParameterCreate, SystemParameterUpdate } from '@/interface';

import { SystemParametersTable } from './components/tables';
import {
	SystemParameterDetailsModal,
	DeleteSystemParameterModal,
	CreateEditSystemParameterModal,
} from './components/modals';
import { useSystemParametersManagement } from './hooks/useSystemParametersManagement';

const SystemParametersAdmin: React.FC = () => {
	const {
		// Estado
		parameters,
		isLoading,
		pagination,
		filters,
		stats,

		// Estados de modales
		isCreateModalOpen,
		isEditModalOpen,
		isDeleteModalOpen,
		isDetailsModalOpen,
		selectedParameter,

		// Manejadores de modales
		openCreateModal,
		closeCreateModal,
		openEditModal,
		closeEditModal,
		openDeleteModal,
		closeDeleteModal,
		openDetailsModal,
		closeDetailsModal,

		// Manejadores de filtros y paginación
		handleFilterChange,
		handlePageChange,
		handlePageSizeChange,

		// Acciones CRUD
		handleCreateParameter,
		handleUpdateParameter,
		handleDeleteParameter,
		refreshParameters,

		// Estados de carga
		loadingActions,
	} = useSystemParametersManagement();

	useEffect(() => {
		refreshParameters();
	}, []);

	return (
		<PageWrapper title='Parámetros del Sistema' isProtectedRoute name='Parámetros del Sistema'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30'>
							<Icon
								icon='HeroCog6Tooth'
								className='h-6 w-6 text-blue-600 dark:text-blue-400'
							/>
						</div>
						<div>
							<h1 className='text-xl font-bold text-zinc-900 dark:text-zinc-100'>
								Parámetros del Sistema
							</h1>
							<p className='text-sm text-zinc-600 dark:text-zinc-400'>
								Configura los parámetros que controlan el comportamiento del sistema
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button variant='solid' icon='HeroPlus' onClick={openCreateModal}>
						Nuevo Parámetro
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
				<div className='space-y-6'>
					{/* Estadísticas */}
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
						<Card className='transition-shadow hover:shadow-md'>
							<CardBody className='p-6'>
								<div className='flex items-center'>
									<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30'>
										<Icon
											icon='HeroCog6Tooth'
											className='h-6 w-6 text-blue-600 dark:text-blue-400'
										/>
									</div>
									<div>
										<p className='text-sm font-medium text-zinc-500 dark:text-zinc-400'>
											Total
										</p>
										<p className='text-2xl font-bold text-zinc-900 dark:text-zinc-100'>
											{stats.total}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card className='transition-shadow hover:shadow-md'>
							<CardBody className='p-6'>
								<div className='flex items-center'>
									<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30'>
										<Icon
											icon='HeroPencil'
											className='h-6 w-6 text-green-600 dark:text-green-400'
										/>
									</div>
									<div>
										<p className='text-sm font-medium text-zinc-500 dark:text-zinc-400'>
											Editables
										</p>
										<p className='text-2xl font-bold text-zinc-900 dark:text-zinc-100'>
											{stats.editable}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card className='transition-shadow hover:shadow-md'>
							<CardBody className='p-6'>
								<div className='flex items-center'>
									<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30'>
										<Icon
											icon='HeroLockClosed'
											className='h-6 w-6 text-red-600 dark:text-red-400'
										/>
									</div>
									<div>
										<p className='text-sm font-medium text-zinc-500 dark:text-zinc-400'>
											Protegidos
										</p>
										<p className='text-2xl font-bold text-zinc-900 dark:text-zinc-100'>
											{stats.systemControlled}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card className='transition-shadow hover:shadow-md'>
							<CardBody className='p-6'>
								<div className='flex items-center'>
									<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30'>
										<Icon
											icon='HeroRectangleGroup'
											className='h-6 w-6 text-purple-600 dark:text-purple-400'
										/>
									</div>
									<div>
										<p className='text-sm font-medium text-zinc-500 dark:text-zinc-400'>
											Categorías
										</p>
										<p className='text-2xl font-bold text-zinc-900 dark:text-zinc-100'>
											{Object.keys(stats.byCategory).length}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>
					</div>

					{/* Filtros */}
					<Card>
						<CardBody className='p-6'>
							<div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5'>
								<div>
									<Label htmlFor='search'>Buscar</Label>
									<Input
										id='search'
										name='search'
										placeholder='Clave, descripción o valor...'
										value={filters.search || ''}
										onChange={(e) =>
											handleFilterChange({
												search: e.target.value || undefined,
											})
										}
									/>
								</div>

								<div>
									<Label htmlFor='category'>Categoría</Label>
									<Select
										id='category'
										name='category'
										value={filters.category || ''}
										onChange={(e) =>
											handleFilterChange({
												category: (e.target.value as any) || undefined,
											})
										}>
										<option value=''>Todas las categorías</option>
										<option value='general'>General</option>
										<option value='system'>Sistema</option>
										<option value='email'>Email</option>
										<option value='security'>Seguridad</option>
										<option value='integration'>Integración</option>
										<option value='ui'>Interfaz</option>
										<option value='business'>Negocio</option>
									</Select>
								</div>

								<div>
									<Label htmlFor='data_type'>Tipo de Dato</Label>
									<Select
										id='data_type'
										name='data_type'
										value={filters.data_type || ''}
										onChange={(e) =>
											handleFilterChange({
												data_type: (e.target.value as any) || undefined,
											})
										}>
										<option value=''>Todos los tipos</option>
										<option value='string'>Texto</option>
										<option value='number'>Número</option>
										<option value='boolean'>Booleano</option>
										<option value='json'>JSON</option>
										<option value='date'>Fecha</option>
									</Select>
								</div>

								<div>
									<Label htmlFor='editable'>Editable</Label>
									<Select
										id='editable'
										name='editable'
										value={
											filters.is_editable !== undefined
												? filters.is_editable.toString()
												: ''
										}
										onChange={(e) =>
											handleFilterChange({
												is_editable: e.target.value
													? e.target.value === 'true'
													: undefined,
											})
										}>
										<option value=''>Todos</option>
										<option value='true'>Editables</option>
										<option value='false'>Protegidos</option>
									</Select>
								</div>

								<div className='flex items-end'>
									<Button
										variant='outline'
										icon='HeroArrowPath'
										onClick={() => handleFilterChange({})}
										className='w-full'>
										Limpiar
									</Button>
								</div>
							</div>
						</CardBody>
					</Card>

					{/* Distribución por categorías */}
					{Object.keys(stats.byCategory).length > 0 && (
						<Card>
							<CardBody className='p-6'>
								<h3 className='mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
									Distribución por Categorías
								</h3>
								<div className='flex flex-wrap gap-2'>
									{Object.entries(stats.byCategory).map(([category, count]) => (
										<div
											key={category}
											className='cursor-pointer'
											onClick={() =>
												handleFilterChange({
													category: category as any,
												})
											}>
											<Badge color='blue' className='capitalize'>
												{category} ({count})
											</Badge>
										</div>
									))}
								</div>
							</CardBody>
						</Card>
					)}

					{/* Tabla */}
					<SystemParametersTable
						parameters={parameters}
						isLoading={isLoading}
						pagination={pagination}
						onPageChange={handlePageChange}
						onPageSizeChange={handlePageSizeChange}
						onViewDetails={openDetailsModal}
						onEdit={openEditModal}
						onDelete={openDeleteModal}
						loadingActions={loadingActions}
					/>
				</div>
			</Container>

			{/* Modales */}
			<SystemParameterDetailsModal
				isOpen={isDetailsModalOpen}
				onClose={closeDetailsModal}
				parameter={selectedParameter}
			/>

			<CreateEditSystemParameterModal
				isOpen={isCreateModalOpen}
				onClose={closeCreateModal}
				onSubmit={
					handleCreateParameter as (
						data: SystemParameterCreate | SystemParameterUpdate,
					) => void
				}
				isLoading={loadingActions.has(0)} // 0 para create
			/>

			<CreateEditSystemParameterModal
				isOpen={isEditModalOpen}
				onClose={closeEditModal}
				onSubmit={(data) =>
					selectedParameter && handleUpdateParameter(selectedParameter.id, data)
				}
				parameter={selectedParameter || undefined}
				isLoading={selectedParameter ? loadingActions.has(selectedParameter.id) : false}
			/>

			<DeleteSystemParameterModal
				isOpen={isDeleteModalOpen}
				onClose={closeDeleteModal}
				onConfirm={() => selectedParameter && handleDeleteParameter(selectedParameter.id)}
				parameter={selectedParameter}
				isLoading={selectedParameter ? loadingActions.has(selectedParameter.id) : false}
			/>
		</PageWrapper>
	);
};

export default SystemParametersAdmin;
