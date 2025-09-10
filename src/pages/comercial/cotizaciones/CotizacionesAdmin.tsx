/**
 * Vista principal del módulo de Cotizaciones
 * Integra tabla, filtros, modales y todas las funcionalidades CRUD
 */
import React, { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { IQuote, QuoteStatus } from '../../../interface';
import useQuotationsManager, { QuotationsFilters } from './hooks/useQuotationsManager';
import QuotationsTable from './components/tables/QuotationsTable';
import CreateEditQuotationModal from './components/modals/CreateEditQuotationModal';
import { QuotationDetailsModal } from './components/modals/QuotationDetailsModal';
import DuplicateQuotationModal from './components/modals/DuplicateQuotationModal';
import DeleteQuotationModal from './components/modals/DeleteQuotationModal';

// UI Components
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Icon from '@/components/icon/Icon';

const CotizacionesAdmin: React.FC = () => {
	// Estados locales
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [editingQuotation, setEditingQuotation] = useState<IQuote | null>(null);
	const [showFilters, setShowFilters] = useState(false);
	const [viewingQuotation, setViewingQuotation] = useState<IQuote | null>(null);
	const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

	// Estados para los nuevos modales
	const [duplicatingQuotation, setDuplicatingQuotation] = useState<IQuote | null>(null);
	const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
	const [deletingQuotation, setDeletingQuotation] = useState<IQuote | null>(null);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isActionLoading, setIsActionLoading] = useState(false);

	// Hook de gestión
	const {
		quotations,
		filteredQuotations,
		loading,
		error,
		totalItems,
		filters,
		setFilters,
		currentPage,
		setCurrentPage,
		itemsPerPage,
		setItemsPerPage,
		stats,
		createQuotation,
		updateQuotation,
		deleteQuotation,
		duplicateQuotation,
		changeStatus,
		convertToSale,
		refreshData,
		exportQuotations,
		getQuotationById,
		resetFilters,
	} = useQuotationsManager();

	// Datos paginados
	const paginatedQuotations = useMemo(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		return filteredQuotations.slice(startIndex, startIndex + itemsPerPage);
	}, [filteredQuotations, currentPage, itemsPerPage]);

	const totalPages = Math.ceil(totalItems / itemsPerPage);

	// Handlers
	const handleCreate = () => {
		setEditingQuotation(null);
		setIsCreateModalOpen(true);
	};

	const handleEdit = (quotation: IQuote) => {
		setEditingQuotation(quotation);
		setIsCreateModalOpen(true);
	};

	const handleSubmit = async (
		quotationData: Omit<IQuote, 'id' | 'created_at' | 'updated_at'>,
	) => {
		try {
			if (editingQuotation) {
				await updateQuotation(editingQuotation.id, quotationData);
			} else {
				await createQuotation(quotationData);
			}
			setIsCreateModalOpen(false);
			setEditingQuotation(null);
		} catch (error) {
			console.error('Error al procesar cotización:', error);
		}
	};

	const handleChangeStatus = async (id: number, status: QuoteStatus) => {
		const statusText: Record<QuoteStatus, string> = {
			DRAFT: 'borrador',
			SENT: 'enviada',
			APPROVED: 'aprobada',
			REJECTED: 'rechazada',
			CONVERTED: 'convertida',
			EXPIRED: 'vencida',
			ACCEPTED: 'aceptada',
			WAITING: 'en espera',
			CREDIT_30: 'crédito 30 días',
			PAID: 'pagada',
		};

		const text = statusText[status] || status;

		if (window.confirm(`¿Confirma cambiar el estado a "${text}"?`)) {
			await changeStatus(id, status);
		}
	};

	const handleView = (quotation: IQuote) => {
		setViewingQuotation(quotation);
		setIsDetailsModalOpen(true);
	};

	const handleConvertToSale = async (id: number) => {
		if (window.confirm('¿Desea convertir esta cotización en una venta?')) {
			await convertToSale(id);
		}
	};

	// Nuevas funciones para los modales de confirmación
	const handleDuplicateClick = (id: number) => {
		const quotation = quotations.find((q) => q.id === id);
		if (quotation) {
			setDuplicatingQuotation(quotation);
			setIsDuplicateModalOpen(true);
		}
	};

	const handleDuplicateConfirm = async () => {
		if (!duplicatingQuotation) return;

		setIsActionLoading(true);
		try {
			await duplicateQuotation(duplicatingQuotation.id);
			toast.success('Cotización duplicada exitosamente');
			setIsDuplicateModalOpen(false);
			setDuplicatingQuotation(null);
		} catch (error) {
			toast.error('Error al duplicar la cotización');
			console.error('Error al duplicar:', error);
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleDeleteClick = (id: number) => {
		const quotation = quotations.find((q) => q.id === id);
		if (quotation) {
			setDeletingQuotation(quotation);
			setIsDeleteModalOpen(true);
		}
	};

	const handleDeleteConfirm = async () => {
		if (!deletingQuotation) return;

		setIsActionLoading(true);
		try {
			await deleteQuotation(deletingQuotation.id);
			toast.success('Cotización eliminada exitosamente');
			setIsDeleteModalOpen(false);
			setDeletingQuotation(null);
		} catch (error) {
			toast.error('Error al eliminar la cotización');
			console.error('Error al eliminar:', error);
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleCloseModals = () => {
		setIsDuplicateModalOpen(false);
		setIsDeleteModalOpen(false);
		setDuplicatingQuotation(null);
		setDeletingQuotation(null);
	};

	// Formatear moneda
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
		}).format(amount);
	};

	// Componente de filtros
	const FiltersSection: React.FC = () => (
		<Card className='mb-6'>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle>Filtros</CardTitle>
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4'>
					<Input
						name='search'
						placeholder='Buscar por número o notas...'
						value={filters.search || ''}
						onChange={(e) => setFilters({ ...filters, search: e.target.value })}
					/>

					<Select
						name='status'
						value={filters.status || ''}
						onChange={(e) =>
							setFilters({
								...filters,
								status: e.target.value as QuoteStatus | undefined,
							})
						}>
						<option value=''>Todos los estados</option>
						<option value='DRAFT'>Borrador</option>
						<option value='SENT'>Enviada</option>
						<option value='APPROVED'>Aprobada</option>
						<option value='REJECTED'>Rechazada</option>
						<option value='EXPIRED'>Vencida</option>
						<option value='CONVERTED'>Convertida</option>
						<option value='ACCEPTED'>Aceptada</option>
						<option value='WAITING'>En Espera</option>
						<option value='CREDIT_30'>Crédito 30d</option>
						<option value='PAID'>Pagada</option>
					</Select>

					<Input
						name='customer'
						placeholder='Cliente...'
						value={filters.customerId?.toString() || ''}
						onChange={(e) =>
							setFilters({
								...filters,
								customerId: e.target.value ? Number(e.target.value) : undefined,
							})
						}
					/>

					<div className='flex space-x-2'>
						<Button variant='outline' onClick={resetFilters} icon='HeroXMark'>
							Limpiar
						</Button>
						<Button onClick={() => setShowFilters(!showFilters)} icon='HeroFunnel'>
							{showFilters ? 'Ocultar' : 'Más filtros'}
						</Button>
					</div>
				</div>

				{showFilters && (
					<div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
						<Input
							name='dateFrom'
							type='date'
							placeholder='Fecha desde'
							value={filters.dateFrom || ''}
							onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
						/>
						<Input
							name='dateTo'
							type='date'
							placeholder='Fecha hasta'
							value={filters.dateTo || ''}
							onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
						/>
						<Input
							name='minAmount'
							type='number'
							placeholder='Monto mínimo'
							value={filters.minAmount || ''}
							onChange={(e) =>
								setFilters({
									...filters,
									minAmount: e.target.value ? Number(e.target.value) : undefined,
								})
							}
						/>
						<Input
							name='maxAmount'
							type='number'
							placeholder='Monto máximo'
							value={filters.maxAmount || ''}
							onChange={(e) =>
								setFilters({
									...filters,
									maxAmount: e.target.value ? Number(e.target.value) : undefined,
								})
							}
						/>
					</div>
				)}
			</CardBody>
		</Card>
	);

	// Tarjetas de estadísticas
	const StatsCards: React.FC = () => (
		<div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5'>
			<Card>
				<CardBody>
					<div className='flex items-center'>
						<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100'>
							<Icon icon='HeroDocumentText' className='h-6 w-6 text-blue-600' />
						</div>
						<div>
							<p className='text-sm font-medium text-gray-600'>Total</p>
							<p className='text-2xl font-bold text-gray-900'>{stats.total}</p>
						</div>
					</div>
				</CardBody>
			</Card>

			<Card>
				<CardBody>
					<div className='flex items-center'>
						<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100'>
							<Icon icon='HeroPencilSquare' className='h-6 w-6 text-gray-600' />
						</div>
						<div>
							<p className='text-sm font-medium text-gray-600'>Borradores</p>
							<p className='text-2xl font-bold text-gray-900'>
								{stats.byStatus.DRAFT || 0}
							</p>
						</div>
					</div>
				</CardBody>
			</Card>

			<Card>
				<CardBody>
					<div className='flex items-center'>
						<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100'>
							<Icon icon='HeroPaperAirplane' className='h-6 w-6 text-amber-600' />
						</div>
						<div>
							<p className='text-sm font-medium text-gray-600'>Enviadas</p>
							<p className='text-2xl font-bold text-gray-900'>
								{stats.byStatus.SENT || 0}
							</p>
						</div>
					</div>
				</CardBody>
			</Card>

			<Card>
				<CardBody>
					<div className='flex items-center'>
						<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100'>
							<Icon icon='HeroCheckCircle' className='h-6 w-6 text-green-600' />
						</div>
						<div>
							<p className='text-sm font-medium text-gray-600'>Aprobadas</p>
							<p className='text-2xl font-bold text-gray-900'>
								{stats.byStatus.APPROVED || 0}
							</p>
						</div>
					</div>
				</CardBody>
			</Card>

			<Card>
				<CardBody>
					<div className='flex items-center'>
						<div className='mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100'>
							<Icon icon='HeroCurrencyDollar' className='h-6 w-6 text-emerald-600' />
						</div>
						<div>
							<p className='text-sm font-medium text-gray-600'>Valor Total</p>
							<p className='text-lg font-bold text-gray-900'>
								{formatCurrency(stats.totalAmount)}
							</p>
						</div>
					</div>
				</CardBody>
			</Card>
		</div>
	);

	return (
		<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
			{/* Header */}
			<div className='flex items-center justify-between py-4'>
				<div>
					<h1 className='text-3xl font-semibold text-gray-900'>Cotizaciones</h1>
					<p className='text-gray-600'>Gestión completa de cotizaciones comerciales</p>
				</div>

				<div className='flex space-x-2'>
					<Button
						variant='outline'
						onClick={exportQuotations}
						icon='HeroArrowDown'
						isDisable={loading}>
						Exportar
					</Button>

					<Button
						variant='outline'
						onClick={refreshData}
						icon='HeroArrowPath'
						isDisable={loading}>
						Actualizar
					</Button>

					<Button onClick={handleCreate} icon='HeroPlus'>
						Nueva Cotización
					</Button>
				</div>
			</div>

			{/* Estadísticas */}
			<StatsCards />

			{/* Filtros */}
			<FiltersSection />

			{/* Tabla */}
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle>Lista de Cotizaciones ({totalItems})</CardTitle>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<QuotationsTable
						data={paginatedQuotations}
						loading={loading}
						onEdit={handleEdit}
						onDelete={handleDeleteClick}
						onDuplicate={handleDuplicateClick}
						onView={handleView}
						onChangeStatus={handleChangeStatus}
						onConvertToSale={handleConvertToSale}
					/>

					{totalItems > 0 && (
						<div className='mt-4 flex items-center justify-between'>
							<div className='flex items-center space-x-2'>
								<span className='text-sm text-gray-700'>
									Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
									{Math.min(currentPage * itemsPerPage, totalItems)} de{' '}
									{totalItems} resultados
								</span>
							</div>

							<div className='flex items-center space-x-2'>
								<Button
									variant='outline'
									size='sm'
									onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
									isDisable={currentPage === 1}>
									Anterior
								</Button>

								<div className='flex items-center space-x-1'>
									{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
										const pageNumber = Math.max(1, currentPage - 2) + i;
										if (pageNumber > totalPages) return null;

										return (
											<Button
												key={pageNumber}
												variant={
													pageNumber === currentPage ? 'solid' : 'outline'
												}
												size='sm'
												onClick={() => setCurrentPage(pageNumber)}>
												{pageNumber}
											</Button>
										);
									})}
								</div>

								<Button
									variant='outline'
									size='sm'
									onClick={() =>
										setCurrentPage(Math.min(totalPages, currentPage + 1))
									}
									isDisable={currentPage === totalPages}>
									Siguiente
								</Button>
							</div>
						</div>
					)}
				</CardBody>
			</Card>

			{/* Modal de Crear/Editar */}
			<CreateEditQuotationModal
				isOpen={isCreateModalOpen}
				onClose={() => {
					setIsCreateModalOpen(false);
					setEditingQuotation(null);
				}}
				onSubmit={handleSubmit}
				quotation={editingQuotation}
				loading={loading}
			/>

			{/* Modal de Detalles */}
			<QuotationDetailsModal
				isOpen={isDetailsModalOpen}
				onClose={() => {
					setIsDetailsModalOpen(false);
					setViewingQuotation(null);
				}}
				quotation={viewingQuotation}
			/>

			{/* Modal de Confirmación de Duplicación */}
			<DuplicateQuotationModal
				isOpen={isDuplicateModalOpen}
				onClose={handleCloseModals}
				onConfirm={handleDuplicateConfirm}
				quotation={duplicatingQuotation}
				isLoading={isActionLoading}
			/>

			{/* Modal de Confirmación de Eliminación */}
			<DeleteQuotationModal
				isOpen={isDeleteModalOpen}
				onClose={handleCloseModals}
				onConfirm={handleDeleteConfirm}
				quotation={deletingQuotation}
				isLoading={isActionLoading}
			/>
		</Container>
	);
};

export default CotizacionesAdmin;
