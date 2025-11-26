import React, { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
// BORRADO: import { saveAs } from 'file-saver';  <-- Lo llamaremos dinámicamente
import { IQuote, QuoteStatus } from '../../../interface';
import useQuotationsManager from './hooks/useQuotationsManager';
import QuotationsTable from './components/tables/QuotationsTable';
import CreateEditQuotationModal from './components/modals/CreateEditQuotationModal';
import { QuotationDetailsModal } from './components/modals/QuotationDetailsModal';
import DuplicateQuotationModal from './components/modals/DuplicateQuotationModal';
import DeleteQuotationModal from './components/modals/DeleteQuotationModal';
import {
    getQuoteStatusLabel,
    normalizeQuoteStatusValue,
    quoteStatusOptions,
} from './constants/quoteStatuses';

// UI Components
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Icon from '@/components/icon/Icon';
// BORRADO: import { generateQuotePdf } from './utils/pdf/generateQuotePdf'; <-- Lo llamaremos dinámicamente
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
// BORRADO: import { Page } from '@react-pdf/renderer'; <-- BASURA QUE NO USABAS
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';

// --- MOVÍ ESTOS COMPONENTES FUERA PARA QUE REACT NO LLORE ---
const FiltersSection = ({ filters, setFilters, showFilters, setShowFilters, resetFilters }: any) => (
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
                    onChange={(e: any) => setFilters({ ...filters, search: e.target.value })}
                />

                <Select
                    name='status'
                    value={filters.status ? normalizeQuoteStatusValue(filters.status) : ''}
                    onChange={(e: any) =>
                        setFilters({
                            ...filters,
                            status: e.target.value
                                ? (e.target.value as QuoteStatus)
                                : undefined,
                        })
                    }>
                    <option value=''>Todos los estados</option>
                    {quoteStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Select>

                <Input
                    name='customer'
                    placeholder='Cliente...'
                    value={filters.customerId?.toString() || ''}
                    onChange={(e: any) =>
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
                        onChange={(e: any) => setFilters({ ...filters, dateFrom: e.target.value })}
                    />
                    <Input
                        name='dateTo'
                        type='date'
                        placeholder='Fecha hasta'
                        value={filters.dateTo || ''}
                        onChange={(e: any) => setFilters({ ...filters, dateTo: e.target.value })}
                    />
                    <Input
                        name='minAmount'
                        type='number'
                        placeholder='Monto mínimo'
                        value={filters.minAmount || ''}
                        onChange={(e: any) =>
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
                        onChange={(e: any) =>
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

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
    }).format(amount);
};

const StatsCards = ({ stats }: { stats: any }) => (
    <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5'>
        <Card>
            <CardBody>
                <div className='flex items-center'>
                    <div className='mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100'>
                        <Icon icon='HeroDocumentText' className='h-6 w-6 text-blue-600' />
                    </div>
                    <div>
                        <p className='text-sm font-medium'>Total</p>
                        <p className='text-2xl font-bold '>{stats.total}</p>
                    </div>
                </div>
            </CardBody>
        </Card>
        {/* ... (El resto de las cards iguales, solo asegúrate de pasar props) ... */}
        {/* AHORRE ESPACIO AQUÍ PERO DEBES PONER LAS OTRAS 4 CARDS IGUAL QUE ANTES */}
         <Card>
            <CardBody>
                <div className='flex items-center'>
                    <div className='mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100'>
                        <Icon icon='HeroPencilSquare' className='h-6 w-6 ' />
                    </div>
                    <div>
                        <p className='text-sm font-medium '>Borradores</p>
                        <p className='text-2xl font-bold '>{stats.byStatus.draft || 0}</p>
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
                        <p className='text-sm font-medium '>Enviadas</p>
                        <p className='text-2xl font-bold '>{stats.byStatus.sent || 0}</p>
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
                        <p className='text-sm font-medium '>Aprobadas</p>
                        <p className='text-2xl font-bold '>{stats.byStatus.approved || 0}</p>
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
                        <p className='text-sm font-medium '>Valor Total</p>
                        <p className='text-lg font-bold '>{formatCurrency(stats.totalAmount)}</p>
                    </div>
                </div>
            </CardBody>
        </Card>
    </div>
);

const CotizacionesAdmin: React.FC = () => {
    // Estados locales
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
            setIsCreateModalOpen(true);
        } catch (error) {
            toast.error('No se pudo cargar la cotización para editar');
            console.error('Error al editar cotización:', error);
        } finally {
            setIsActionLoading(false);
        }
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

    // --- AQUÍ ESTÁ LA MAGIA DEL LAZY LOAD ---
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
                        <Badge className='text-3xl font-semibold '>Cotizaciones</Badge>
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
                            onDownloadPdf={handleDownloadPdf}
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
                                                        pageNumber === currentPage
                                                            ? 'solid'
                                                            : 'outline'
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

                {/* Modales... (Sin cambios en la lógica, solo render) */}
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