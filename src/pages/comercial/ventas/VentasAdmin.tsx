import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import SelectReact from '@/components/form/SelectReact';
import { ISale, SaleStatus, PaymentMethod } from './types/sales.types';
import useSalesManager from './hooks/useSalesManager';
import SalesTable from './components/tables/SalesTable';
import CreateEditSaleModal from './components/modals/CreateEditSaleModal';
import RecordPaymentModal from './components/modals/RecordPaymentModal';
import DeleteSaleModal from './components/modals/DeleteSaleModal';
import InvoiceModal from './components/modals/InvoiceModal';
import SaleDetailModal from './components/modals/SaleDetailModal';
import { TSelectOption, TSelectOptions } from '@/components/form/SelectReact';

const VentasAdmin: React.FC = () => {
	// Hook personalizado para manejo de ventas
	const {
		sales,
		loading,
		currentPage,
		itemsPerPage,
		totalItems,
		filters,
		stats,
		setFilters,
		createSale,
		updateSale,
		recordPayment,
		generateDocument,
		exportSales,
	} = useSalesManager();

	// Estados para modales
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [paymentModalOpen, setPaymentModalOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
	const [detailModalOpen, setDetailModalOpen] = useState(false);
	const [selectedSale, setSelectedSale] = useState<ISale | null>(null);
	const [quotationData, setQuotationData] = useState<any>(null);

	// Estados para filtros
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedStatus, setSelectedStatus] = useState<string>('');
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
	const [dateRange, setDateRange] = useState({ start: '', end: '' });

	// Opciones para filtros
	const statusOptions: TSelectOptions = [
		{ value: '', label: 'Todos los estados' },
		{ value: 'PENDING', label: 'Pendiente' },
		{ value: 'COMPLETED', label: 'Completada' },
		{ value: 'CANCELLED', label: 'Cancelada' },
	];

	const paymentMethodOptions: TSelectOptions = [
		{ value: '', label: 'Todos los métodos' },
		{ value: 'CASH', label: 'Efectivo' },
		{ value: 'DEBIT', label: 'Débito' },
		{ value: 'CREDIT', label: 'Crédito' },
		{ value: 'TRANSFER', label: 'Transferencia' },
	];

	// Aplicar filtros cuando cambian
	useEffect(() => {
		const newFilters = {
			search: searchTerm,
			status: selectedStatus as SaleStatus | undefined,
			paymentMethod: selectedPaymentMethod as PaymentMethod | undefined,
			dateFrom: dateRange.start || undefined,
			dateTo: dateRange.end || undefined,
		};
		setFilters(newFilters);
	}, [searchTerm, selectedStatus, selectedPaymentMethod, dateRange, setFilters]);

	// Formatear moneda
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
		}).format(amount);
	};

	// Obtener color del badge según estado
	const getStatusBadgeColor = (status: SaleStatus) => {
		const colors: Record<SaleStatus, string> = {
			PENDING: 'bg-yellow-100 text-yellow-800',
			COMPLETED: 'bg-green-100 text-green-800',
			CANCELLED: 'bg-red-100 text-red-800',
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	};

	// Manejar acciones de la tabla
	const handleEdit = (sale: ISale) => {
		setSelectedSale(sale);
		setEditModalOpen(true);
	};

	const handleDelete = async (sale: ISale) => {
		setSelectedSale(sale);
		setDeleteModalOpen(true);
	};

	const handleConfirmDelete = async (sale: ISale) => {
		// TODO: Implementar cancelación de venta
		console.log('Eliminar venta:', sale.id);
		setDeleteModalOpen(false);
		setSelectedSale(null);
	};

	const handleDuplicate = async (sale: ISale) => {
		// TODO: Implementar duplicación de venta
		console.log('Duplicar venta:', sale.id);
	};

	const handleRecordPayment = (sale: ISale) => {
		setSelectedSale(sale);
		setPaymentModalOpen(true);
	};

	const handleGenerateDocument = async (sale: ISale) => {
		setSelectedSale(sale);
		setInvoiceModalOpen(true);
	};

	const handleViewDetails = (sale: ISale) => {
		setSelectedSale(sale);
		setDetailModalOpen(true);
	};

	const handleCreateFromQuotation = (quotationId: number) => {
		// Aquí se cargarían los datos de la cotización
		setQuotationData({ quotationId });
		setCreateModalOpen(true);
	};

	// Manejar envío de formularios
	const handleCreateSubmit = async (saleData: Partial<ISale>) => {
		// Validar que tenga los campos obligatorios
		if (saleData.customer_id && saleData.items && saleData.items.length > 0) {
			const completeData = {
				...saleData,
				customer_id: saleData.customer_id,
				items: saleData.items,
				total_amount: saleData.total_amount || 0,
				subtotal: saleData.subtotal || 0,
				tax_total: saleData.tax_total || 0,
				discount_total: saleData.discount_total || 0,
				status: saleData.status || 'PENDING',
				sale_date: saleData.sale_date || new Date().toISOString(),
			} as Omit<ISale, 'id' | 'sale_number' | 'created_at' | 'updated_at'>;

			await createSale(completeData);
		}
		setCreateModalOpen(false);
		setQuotationData(null);
	};

	const handleEditSubmit = async (saleData: Partial<ISale>) => {
		if (selectedSale) {
			await updateSale(selectedSale.id, saleData);
			setEditModalOpen(false);
			setSelectedSale(null);
		}
	};

	const handlePaymentSubmit = async (saleId: number, payments: any[]) => {
		// Procesar cada pago individualmente
		for (const payment of payments) {
			await recordPayment(saleId, payment);
		}
		setPaymentModalOpen(false);
		setSelectedSale(null);
	};

	return (
		<PageWrapper>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-2'>
						<Icon icon='HeroCurrencyDollar' className='h-6 w-6 text-blue-600' />
						<div>
							<h1 className='text-3xl font-bold text-gray-900'>Gestión de Ventas</h1>
							<p className='mt-1 text-sm text-gray-500'>
								Administra y controla todas las ventas del sistema
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<div className='flex space-x-2'>
						<Button
							onClick={() => exportSales()}
							variant='outline'
							icon='HeroArrowDownTray'>
							Exportar
						</Button>
						<Button onClick={() => setCreateModalOpen(true)} icon='HeroPlus'>
							Nueva Venta
						</Button>
					</div>
				</SubheaderRight>
			</Subheader>

			<Container>
				{/* Estadísticas */}
				<div className='mb-6'>
					<div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
						<Card>
							<CardBody>
								<div className='flex items-center'>
									<div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'>
										<Icon
											icon='HeroCurrencyDollar'
											className='h-6 w-6 text-blue-600 dark:text-blue-400'
										/>
									</div>
									<div className='ml-4'>
										<p className='text-sm font-medium text-gray-600 dark:text-gray-300'>
											Ventas Totales
										</p>
										<p className='text-2xl font-bold text-gray-900 dark:text-white'>
											{stats.total}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card>
							<CardBody>
								<div className='flex items-center'>
									<div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'>
										<Icon
											icon='HeroBanknotes'
											className='h-6 w-6 text-green-600 dark:text-green-400'
										/>
									</div>
									<div className='ml-4'>
										<p className='text-sm font-medium text-gray-600 dark:text-gray-300'>
											Ingresos Totales
										</p>
										<p className='text-2xl font-bold text-gray-900 dark:text-white'>
											{formatCurrency(stats.totalAmount)}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card>
							<CardBody>
								<div className='flex items-center'>
									<div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border-2 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'>
										<Icon
											icon='HeroClock'
											className='h-6 w-6 text-yellow-600 dark:text-yellow-400'
										/>
									</div>
									<div className='ml-4'>
										<p className='text-sm font-medium text-gray-600 dark:text-gray-300'>
											Pendientes
										</p>
										<p className='text-2xl font-bold text-gray-900 dark:text-white'>
											{stats.byStatus.PENDING}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>

						<Card>
							<CardBody>
								<div className='flex items-center'>
									<div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border-2 border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20'>
										<Icon
											icon='HeroReceiptPercent'
											className='h-6 w-6 text-purple-600 dark:text-purple-400'
										/>
									</div>
									<div className='ml-4'>
										<p className='text-sm font-medium text-gray-600 dark:text-gray-300'>
											Por Cobrar
										</p>
										<p className='text-2xl font-bold text-gray-900 dark:text-white'>
											{formatCurrency(stats.pendingPayments)}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>
					</div>
				</div>

				{/* Filtros */}
				<Card className='mb-6'>
					<CardHeader>
						<CardTitle>Filtros y Búsqueda</CardTitle>
					</CardHeader>
					<CardBody>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5'>
							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700'>
									Buscar
								</label>
								<Input
									name='search'
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									placeholder='Número, cliente...'
								/>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700'>
									Estado
								</label>
								<SelectReact
									name='statusFilter'
									options={statusOptions}
									value={statusOptions.find(
										(opt) => opt.value === selectedStatus,
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										setSelectedStatus(option?.value || '');
									}}
								/>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700'>
									Método de Pago
								</label>
								<SelectReact
									name='paymentMethodFilter'
									options={paymentMethodOptions}
									value={paymentMethodOptions.find(
										(opt) => opt.value === selectedPaymentMethod,
									)}
									onChange={(selectedOption) => {
										const option = selectedOption as TSelectOption;
										setSelectedPaymentMethod(option?.value || '');
									}}
								/>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700'>
									Fecha Desde
								</label>
								<Input
									name='dateFrom'
									type='date'
									value={dateRange.start}
									onChange={(e) =>
										setDateRange((prev) => ({ ...prev, start: e.target.value }))
									}
								/>
							</div>

							<div>
								<label className='mb-1 block text-sm font-medium text-gray-700'>
									Fecha Hasta
								</label>
								<Input
									name='dateTo'
									type='date'
									value={dateRange.end}
									onChange={(e) =>
										setDateRange((prev) => ({ ...prev, end: e.target.value }))
									}
								/>
							</div>
						</div>

						<div className='mt-4 flex justify-end space-x-2'>
							<Button
								variant='outline'
								onClick={() => {
									setSearchTerm('');
									setSelectedStatus('');
									setSelectedPaymentMethod('');
									setDateRange({ start: '', end: '' });
								}}>
								Limpiar Filtros
							</Button>
						</div>
					</CardBody>
				</Card>

				{/* Tabla de Ventas */}
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<CardTitle>
								Lista de Ventas ({totalItems}{' '}
								{totalItems === 1 ? 'registro' : 'registros'})
							</CardTitle>
							<div className='flex items-center space-x-2 text-sm text-gray-500'>
								<span>
									Página {currentPage} de {Math.ceil(totalItems / itemsPerPage)}
								</span>
							</div>
						</div>
					</CardHeader>
					<CardBody>
						<SalesTable
							data={sales}
							loading={loading}
							onView={handleViewDetails}
							onEdit={handleEdit}
							onRecordPayment={handleRecordPayment}
							onGenerateDocument={handleGenerateDocument}
							onSendDocument={() => {}}
							onCancel={handleDelete}
						/>
					</CardBody>
				</Card>

				{/* Modales */}
				<CreateEditSaleModal
					isOpen={createModalOpen}
					onClose={() => {
						setCreateModalOpen(false);
						setQuotationData(null);
					}}
					onSubmit={handleCreateSubmit}
					sale={null}
					isLoading={loading}
					quotationData={quotationData}
				/>

				<CreateEditSaleModal
					isOpen={editModalOpen}
					onClose={() => {
						setEditModalOpen(false);
						setSelectedSale(null);
					}}
					onSubmit={handleEditSubmit}
					sale={selectedSale}
					isLoading={loading}
				/>

				<RecordPaymentModal
					isOpen={paymentModalOpen}
					onClose={() => {
						setPaymentModalOpen(false);
						setSelectedSale(null);
					}}
					onSubmit={handlePaymentSubmit}
					sale={selectedSale}
					isLoading={loading}
				/>

				<DeleteSaleModal
					isOpen={deleteModalOpen}
					onClose={() => {
						setDeleteModalOpen(false);
						setSelectedSale(null);
					}}
					onConfirm={handleConfirmDelete}
					sale={selectedSale}
					loading={loading}
				/>

				<InvoiceModal
					isOpen={invoiceModalOpen}
					onClose={() => {
						setInvoiceModalOpen(false);
						setSelectedSale(null);
					}}
					sale={selectedSale}
					onDownload={(sale) => generateDocument(sale.id, 'FACTURA')}
					onPrint={() => window.print()}
				/>

				<SaleDetailModal
					isOpen={detailModalOpen}
					onClose={() => {
						setDetailModalOpen(false);
						setSelectedSale(null);
					}}
					sale={selectedSale}
					onEdit={(sale) => {
						setDetailModalOpen(false);
						setSelectedSale(sale);
						setEditModalOpen(true);
					}}
					onGenerateInvoice={(sale) => {
						setDetailModalOpen(false);
						setSelectedSale(sale);
						setInvoiceModalOpen(true);
					}}
				/>
			</Container>
		</PageWrapper>
	);
};

export default VentasAdmin;
