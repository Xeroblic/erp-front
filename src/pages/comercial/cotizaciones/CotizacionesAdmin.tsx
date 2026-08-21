import React, { useState, useMemo, useEffect } from 'react';
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
import { useNavigate, useParams } from 'react-router-dom';

import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import { FiltersSection } from './components/FiltersSection';
import { StatsCards } from './components/StatsCards';
import { ConfirmSaleModal } from './components/modals/ConfirmSale';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Icon from '@/components/icon/Icon';

const QUOTES_BASE_PATH = '/comercial/cotizaciones';

const CotizacionesAdmin: React.FC = () => {
	const navigate = useNavigate();
	const { quoteId: quoteIdParam } = useParams<{ quoteId?: string }>();
	const parsedQuoteId = quoteIdParam ? Number(quoteIdParam) : null;
	const activeQuoteId =
		typeof parsedQuoteId === 'number' && Number.isFinite(parsedQuoteId) && parsedQuoteId > 0
			? parsedQuoteId
			: null;
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

	useEffect(() => {
		if (!activeQuoteId) {
			setIsDetailsModalOpen(false);
			setViewingQuotation(null);
			return;
		}

		let isCancelled = false;
		setIsDetailsModalOpen(true);
		setDetailsLoading(true);
		setViewingQuotation(null);

		const fetchDetails = async () => {
			try {
				const fullQuote = await loadQuotationDetails(activeQuoteId);
				if (!isCancelled) {
					setViewingQuotation(fullQuote);
				}
			} catch (error) {
				if (!isCancelled) {
					toast.error('No se pudieron cargar los detalles de la cotización');
					console.error('Error al cargar detalles:', error);
					setIsDetailsModalOpen(false);
					navigate(QUOTES_BASE_PATH, { replace: true });
				}
			} finally {
				if (!isCancelled) {
					setDetailsLoading(false);
				}
			}
		};

		fetchDetails();

		return () => {
			isCancelled = true;
		};
	}, [activeQuoteId, loadQuotationDetails, navigate]);

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
			// Validacion adicional antes de enviar
			if (!quotationData.customer_id) {
				toast.error('No se puede crear sin cliente');
				return;
			}

			if (!quotationData.items || quotationData.items.length === 0) {
				toast.error('No se puede crear sin items');
				return;
			}

			await createQuotation(quotationData);
			toast.success('Cotizacion creada correctamente');
			setIsCreateModalOpen(false);
		} catch (error: any) {
			const errorMessage =
				error?.response?.data?.message ||
				error?.message ||
				'Error desconocido al crear cotizacion';

			toast.error(`BACKEND ERROR: ${errorMessage}`);
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

	const [confirmStatusModalOpen, setConfirmStatusModalOpen] = useState(false);
	const [statusToChange, setStatusToChange] = useState<{
		id: number;
		status: QuoteStatus;
	} | null>(null);

	const handleChangeStatus = (id: number, status: QuoteStatus) => {
		setStatusToChange({ id, status });
		setConfirmStatusModalOpen(true);
	};

	const handleConfirmStatusChange = async () => {
		if (statusToChange) {
			const { id, status } = statusToChange;
			const normalizedStatus = normalizeQuoteStatusValue(status) as QuoteStatus;
			setIsActionLoading(true);
			try {
				await changeStatus(id, normalizedStatus);
				toast.success(`Estado cambiado a "${getQuoteStatusLabel(normalizedStatus)}"`);
			} catch (error) {
				console.error('Error al cambiar el estado:', error);
			} finally {
				setIsActionLoading(false);
				setConfirmStatusModalOpen(false);
				setStatusToChange(null);
			}
		}
	};

	const handleView = (quotation: IQuote) => {
		setIsDetailsModalOpen(true);
		setDetailsLoading(true);
		setViewingQuotation(null);
		navigate(`${QUOTES_BASE_PATH}/${quotation.id}`);
	};

	const [confirmSaleModalOpen, setConfirmSaleModalOpen] = useState(false);
	const [confirmSaleQuotation, setConfirmSaleQuotation] = useState<IQuote | null>(null);
	const handleConvertToSale = async (id: number) => {
		const quotation = quotations.find((q) => q.id === id);
		if (quotation) {
			setConfirmSaleQuotation(quotation);
			setConfirmSaleModalOpen(true);
		}
	};

	// Conversión real al confirmar en el modal. Antes el onConfirm apuntaba a
	// handleConvertToSale, que solo REABRÍA el modal y nunca convertía.
	const handleConfirmConvertToSale = async (id: number) => {
		await convertToSale(id);
		setConfirmSaleModalOpen(false);
		setConfirmSaleQuotation(null);
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

	const handleDownloadExcel = async (id: number) => {
		setIsActionLoading(true);
		try {
			// 1. Cargamos los datos
			const detail = await loadQuotationDetails(id);

			// 2. Importamos las librerías pesadas SOLO AHORA
			const { saveAs } = await import('file-saver');
			const { generateQuoteExcel } = await import('./utils/excel/generateQuoteExcel');

			// 3. Generamos el Excel
			const blob = await generateQuoteExcel(detail);
			saveAs(blob, `cotizacion-${detail.id}.xlsx`);
		} catch (error) {
			toast.error('No se pudo generar el Excel');
			console.error('Error al generar Excel:', error);
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

	const handleCloseDetailsModal = () => {
		setIsDetailsModalOpen(false);
		setViewingQuotation(null);
		setDetailsLoading(false);
		navigate(QUOTES_BASE_PATH, { replace: true });
	};

	// Aprueba la cotización abierta en el detalle (status → approved) y recarga el
	// detalle para que los botones reflejen el nuevo estado (habilita "Generar Venta").
	const handleApproveViewingQuotation = async () => {
		if (!viewingQuotation) return;
		await changeStatus(viewingQuotation.id, 'approved');
		const fresh = await loadQuotationDetails(viewingQuotation.id);
		setViewingQuotation(fresh);
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
						className='bg-purple-400/20'
						color='purple'
						onClick={exportQuotations}
						icon='HeroArrowDown'
						isDisable={loading}>
						Exportar
					</Button>

					<Button
						variant='outline'
						className='bg-sky-400/20'
						onClick={refreshData}
						color='sky'
						icon='HeroArrowPath'
						isDisable={loading}>
						Actualizar
					</Button>

					<Button
						variant='outline'
						className='bg-emerald-400/30'
						onClick={handleCreate}
						icon='HeroPlus'
						color='emerald'>
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
							data={filteredQuotations}
							loading={loading}
							pageSize={itemsPerPage}
							onEdit={handleEdit}
							onDelete={handleDeleteClick}
							onDuplicate={handleDuplicateClick}
							onView={handleView}
							onChangeStatus={handleChangeStatus}
							onConvertToSale={handleConvertToSale}
							onDownloadPdf={handleDownloadPdf}
							onDownloadExcel={handleDownloadExcel}
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
					onClose={handleCloseDetailsModal}
					quotation={viewingQuotation}
					isLoading={detailsLoading}
					onDownloadPdf={handleDownloadPdf}
					onApprove={handleApproveViewingQuotation}
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

				{confirmSaleQuotation && (
					<ConfirmSaleModal
						open={confirmSaleModalOpen}
						onClose={() => {
							setConfirmSaleModalOpen(false);
							setConfirmSaleQuotation(null);
						}}
						onConfirm={handleConfirmConvertToSale}
						quotationId={confirmSaleQuotation.id}
						quotation={confirmSaleQuotation}
					/>
				)}

				{/* Modal de confirmación de cambio de estado centrado */}
				<Modal
					isOpen={confirmStatusModalOpen}
					setIsOpen={setConfirmStatusModalOpen}
					size='sm'
					isCentered>
					<ModalHeader>
						<div className='flex items-center space-x-3'>
							<div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950'>
								<Icon
									icon='HeroQuestionMarkCircle'
									className='h-6 w-6 text-blue-600 dark:text-blue-400'
								/>
							</div>
							<div>
								<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-50'>
									Confirmar Cambio de Estado
								</h3>
								<p className='text-sm text-gray-500 dark:text-gray-400'>
									Se actualizará el estado de la cotización
								</p>
							</div>
						</div>
					</ModalHeader>
					<ModalBody>
						{statusToChange && (
							<div className='py-2 text-sm text-gray-600 dark:text-gray-300'>
								¿Confirma cambiar el estado de la cotización a{' '}
								<strong>
									&quot;{getQuoteStatusLabel(statusToChange.status)}&quot;
								</strong>
								?
							</div>
						)}
					</ModalBody>
					<ModalFooter>
						<ModalFooterChild>
							<Button
								variant='outline'
								color='gray'
								onClick={() => {
									setConfirmStatusModalOpen(false);
									setStatusToChange(null);
								}}
								isDisable={isActionLoading}>
								<Icon icon='HeroXMark' className='mr-2 h-4 w-4' />
								Cancelar
							</Button>
							<Button
								color='blue'
								onClick={() => void handleConfirmStatusChange()}
								isDisable={isActionLoading}
								isLoading={isActionLoading}>
								Confirmar
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</Modal>
			</Container>
		</PageWrapper>
	);
};

export default CotizacionesAdmin;
