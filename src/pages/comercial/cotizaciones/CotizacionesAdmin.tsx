import React, { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { IQuote, QuoteStatus } from '../../../interface';
import useQuotationsManager from './hooks/useQuotationsManager';
import QuotationsTable from './components/tables/QuotationsTable';
import CreateQuotationModal from './components/modals/ModalCreacion/CreateQuotationModal';
import EditQuotationModal from './components/modals/ModalEditar/EditQuotationModal';
import { QuotationDetailsModal } from './components/modals/QuotationDetailsModal';
import DuplicateQuotationModal from './components/modals/DuplicateQuotationModal';
import DeleteQuotationModal from './components/modals/DeleteQuotationModal';
import { getQuoteStatusLabel, normalizeQuoteStatusValue } from './constants/quoteStatuses';

import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import { FiltersSection } from './components/FiltersSection';
import { StatsCards } from './components/StatsCards';

const CotizacionesAdmin: React.FC = () => {
	// Estados locales
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editingQuotation, setEditingQuotation] = useState<IQuote | null>(null);
	const [showFilters, setShowFilters] = useState(false);
	const [viewingQuotation, setViewingQuotation] = useState<IQuote | null>(null);
	const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
	const [detailsLoading, setDetailsLoading] = useState(false);

	// Estados modales
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
		// error, // Unused var warning
		totalItems,
		filters,
		setFilters,
		currentPage,
		setCurrentPage,
		itemsPerPage,
		// setItemsPerPage, // Unused var warning
		stats,
		createQuotation,
		updateQuotation,
		deleteQuotation,
		duplicateQuotation,
		changeStatus,
		convertToSale,
		refreshData,
		exportQuotations,
		// getQuotationById, // Unused var warning
		resetFilters,
		loadQuotationDetails,
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

	const handleEdit = async (quotation: IQuote) => {
		setIsActionLoading(true);
		try {
			const detail = await loadQuotationDetails(quotation.id);
			setEditingQuotation(detail);
			setIsEditModalOpen(true);
		} catch (error) {
			toast.error('No se pudo cargar la cotización para editar');
			console.error('Error al editar cotización:', error);
		} finally {
			setIsActionLoading(false);
		}
	};

	const handleCreateSubmit = async (
		quotationData: Omit<IQuote, 'id' | 'created_at' | 'updated_at'>,
	) => {
		try {
			await createQuotation(quotationData);
			setIsCreateModalOpen(false);
		} catch (error) {
			console.error('Error al crear cotización:', error);
		}
	};

	const handleEditSubmit = async (
		quotationData: Omit<IQuote, 'id' | 'created_at' | 'updated_at'>,
	) => {
		if (!editingQuotation) return;
		try {
			await updateQuotation(editingQuotation.id, quotationData);
			setIsEditModalOpen(false);
			setEditingQuotation(null);
		} catch (error) {
			console.error('Error al actualizar cotización:', error);
		}
	};

	const handleChangeStatus = async (id: number, status: QuoteStatus) => {
		const normalizedStatus = normalizeQuoteStatusValue(status) as QuoteStatus;
		const text = getQuoteStatusLabel(normalizedStatus);

		if (window.confirm(`¿Confirma cambiar el estado a "${text}"?`)) {
			await changeStatus(id, normalizedStatus);
		}
	};

	const handleView = async (quotation: IQuote) => {
		setIsDetailsModalOpen(true);
		setDetailsLoading(true);
		setViewingQuotation(null);
		try {
			const fullQuote = await loadQuotationDetails(quotation.id);
			setViewingQuotation(fullQuote);
		} catch (error) {
			toast.error('No se pudieron cargar los detalles de la cotización');
			console.error('Error al cargar detalles:', error);
			setIsDetailsModalOpen(false);
		} finally {
			setDetailsLoading(false);
		}
	};

	const handleConvertToSale = async (id: number) => {
		if (window.confirm('¿Desea convertir esta cotización en una venta?')) {
			await convertToSale(id);
		}
	};

	const handleDownloadPdf = async (id: number) => {
		setIsActionLoading(true);
		try {
			// 1. Cargamos los datos
			const detail = await loadQuotationDetails(id);

			// 2. Importamos las librerías pesadas SOLO AHORA
			const { saveAs } = await import('file-saver');
			const { generateQuotePdf } = await import('./utils/pdf/generateQuotePdf');

			// 3. Generamos el PDF
			const blob = await generateQuotePdf(detail);
			// const filename = `cotizacion-${detail.quote_number ?? detail.id}.pdf`;
			const filename = `cotizacion-${detail.id}.pdf`;
			saveAs(blob, filename);
		} catch (error) {
			toast.error('No se pudo generar el PDF');
			console.error('Error al generar PDF:', error);
		} finally {
			setIsActionLoading(false);
		}
	};

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

	return (
		<PageWrapper name='cotizaciones-admin'>
			<Subheader className='p-2'>
				<SubheaderLeft>
					<div className='start-0'>
						<Badge className='text-3xl font-semibold'>Cotizaciones</Badge>
						<p className=''>Gestión completa de cotizaciones comerciales</p>
					</div>
				</SubheaderLeft>
				<SubheaderRight className='flex space-x-2'>
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
				</SubheaderRight>
			</Subheader>
			<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
				{/* Estadísticas (Componente Externo) */}
				<StatsCards stats={stats} />

				{/* Filtros (Componente Externo) */}
				<FiltersSection
					filters={filters}
					setFilters={setFilters}
					showFilters={showFilters}
					setShowFilters={setShowFilters}
					resetFilters={resetFilters}
				/>
				

				{/* Tabla */}
				<Card>
					<CardHeader>
						<CardHeaderChild>
							<CardTitle>Lista de Cotizaciones</CardTitle>
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
							onDownloadPdf={handleDownloadPdf}
						/>
					</CardBody>
				</Card>

				<CreateQuotationModal
					isOpen={isCreateModalOpen}
					onClose={() => setIsCreateModalOpen(false)}
					onSubmit={handleCreateSubmit}
					loading={loading}
				/>

				{editingQuotation && (
					<EditQuotationModal
						isOpen={isEditModalOpen}
						onClose={() => {
							setIsEditModalOpen(false);
							setEditingQuotation(null);
						}}
						onSubmit={handleEditSubmit}
						quotation={editingQuotation}
						loading={loading}
					/>
				)}

				<QuotationDetailsModal
					isOpen={isDetailsModalOpen}
					onClose={() => {
						setIsDetailsModalOpen(false);
						setViewingQuotation(null);
					}}
					quotation={viewingQuotation}
					isLoading={detailsLoading}
					onDownloadPdf={handleDownloadPdf}
				/>

				<DuplicateQuotationModal
					isOpen={isDuplicateModalOpen}
					onClose={handleCloseModals}
					onConfirm={handleDuplicateConfirm}
					quotation={duplicatingQuotation}
					isLoading={isActionLoading}
				/>

				<DeleteQuotationModal
					isOpen={isDeleteModalOpen}
					onClose={handleCloseModals}
					onConfirm={handleDeleteConfirm}
					quotation={deletingQuotation}
					isLoading={isActionLoading}
				/>
			</Container>
		</PageWrapper>
	);
};

export default CotizacionesAdmin;
