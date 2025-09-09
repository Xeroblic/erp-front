import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchQuotes,
	setFilters,
	clearFilters,
	convertQuoteToSale,
	sendQuote,
	selectQuotes,
	selectQuotesLoading,
	selectQuotesPagination,
	selectQuoteFilters,
	selectQuoteActionLoading,
} from '@/store/slices/quotes/quotesSlice';

// Components
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table, { TBody, Td, TFoot, THead, Th, Tr } from '@/components/ui/Table';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Pagination from '@/components/ui/Pagination';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import type { IQuote, QuoteStatus } from '@/interface/quotes.interface';
import { formatCurrency, formatDate } from '@/utils/format.utils';

const Cotizaciones: React.FC = () => {
	const dispatch = useAppDispatch();

	// Redux state
	const quotes = useAppSelector(selectQuotes);
	const loading = useAppSelector(selectQuotesLoading);
	const pagination = useAppSelector(selectQuotesPagination);
	const filters = useAppSelector(selectQuoteFilters);
	const actionLoading = useAppSelector(selectQuoteActionLoading);

	// Local state
	const [selectedQuote, setSelectedQuote] = useState<IQuote | null>(null);
	const [showConvertModal, setShowConvertModal] = useState(false);
	const [showCreateModal, setShowCreateModal] = useState(false);

	// Filtros locales
	const [localFilters, setLocalFilters] = useState({
		status: '',
		customer_id: '',
		date_from: '',
		date_to: '',
		valid_until_from: '',
		valid_until_to: '',
	});

	// Cargar cotizaciones al montar
	useEffect(() => {
		dispatch(fetchQuotes({ page: 1, filters }));
	}, [dispatch, filters]);

	// Handlers
	const handleApplyFilters = () => {
		const activeFilters = Object.fromEntries(
			Object.entries(localFilters).filter(([_, value]) => value !== ''),
		);
		dispatch(setFilters(activeFilters));
	};

	const handleClearFilters = () => {
		setLocalFilters({
			status: '',
			customer_id: '',
			date_from: '',
			date_to: '',
			valid_until_from: '',
			valid_until_to: '',
		});
		dispatch(clearFilters());
	};

	const handlePageChange = (page: number) => {
		dispatch(fetchQuotes({ page, filters }));
	};

	const handleConvertToSale = async () => {
		if (!selectedQuote) return;

		try {
			await dispatch(
				convertQuoteToSale({
					id: selectedQuote.id,
					data: {
						sale_date: new Date().toISOString().split('T')[0],
					},
				}),
			).unwrap();

			setShowConvertModal(false);
			setSelectedQuote(null);

			// Recargar lista
			dispatch(fetchQuotes({ page: pagination.currentPage, filters }));
		} catch (error) {
			// Error ya manejado en el slice
		}
	};

	const handleSendQuote = async (quoteId: number) => {
		try {
			await dispatch(sendQuote(quoteId)).unwrap();
			dispatch(fetchQuotes({ page: pagination.currentPage, filters }));
		} catch (error) {
			// Error ya manejado en el slice
		}
	};

	const getStatusBadge = (status: QuoteStatus) => {
		const statusConfig = {
			DRAFT: { color: 'gray' as const, text: 'Borrador' },
			SENT: { color: 'blue' as const, text: 'Enviada' },
			APPROVED: { color: 'emerald' as const, text: 'Aprobada' },
			REJECTED: { color: 'red' as const, text: 'Rechazada' },
			CONVERTED: { color: 'violet' as const, text: 'Convertida' },
			EXPIRED: { color: 'amber' as const, text: 'Expirada' },
		};

		const config = statusConfig[status] || statusConfig['DRAFT'];
		return <Badge color={config.color}>{config.text}</Badge>;
	};

	const isExpired = (validUntil: string) => {
		return new Date(validUntil) < new Date();
	};

	const canConvert = (quote: IQuote) => {
		return quote.status === 'APPROVED' && !isExpired(quote.valid_until);
	};

	const canSend = (quote: IQuote) => {
		return quote.status === 'DRAFT';
	};

	return (
		<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
			{/* Header */}
			<div className='flex items-center justify-between py-4'>
				<div>
					<h1 className='text-3xl font-semibold'>Cotizaciones</h1>
					<p className='text-zinc-500'>Gestión de cotizaciones comerciales</p>
				</div>

				<div className='flex space-x-2'>
					<PermissionGuard permissions={[ERP_PERMISSIONS.QUOTES.CREATE]}>
						<Button
							variant='solid'
							onClick={() => setShowCreateModal(true)}
							icon='HeroPlus'>
							Nueva Cotización
						</Button>
					</PermissionGuard>

					<PermissionGuard permissions={[ERP_PERMISSIONS.REPORTS.QUOTE_CONVERSION]}>
						<Button
							variant='outline'
							onClick={() =>
								window.open('/reportes/cotizaciones/conversion', '_blank')
							}
							icon='HeroChartBar'>
							Reporte Conversión
						</Button>
					</PermissionGuard>
				</div>
			</div>

			{/* Filtros */}
			<Card className='mb-6'>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle>Filtros</CardTitle>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
						<Select
							name='status'
							placeholder='Estado'
							value={localFilters.status}
							onChange={(e) =>
								setLocalFilters({ ...localFilters, status: e.target.value })
							}>
							<option value=''>Todos</option>
							<option value='DRAFT'>Borrador</option>
							<option value='SENT'>Enviada</option>
							<option value='APPROVED'>Aprobada</option>
							<option value='REJECTED'>Rechazada</option>
							<option value='CONVERTED'>Convertida</option>
							<option value='EXPIRED'>Expirada</option>
						</Select>

						<Input
							name='date_from'
							type='date'
							placeholder='Fecha desde'
							value={localFilters.date_from}
							onChange={(e) =>
								setLocalFilters({ ...localFilters, date_from: e.target.value })
							}
						/>

						<Input
							name='date_to'
							type='date'
							placeholder='Fecha hasta'
							value={localFilters.date_to}
							onChange={(e) =>
								setLocalFilters({ ...localFilters, date_to: e.target.value })
							}
						/>

						<div className='flex space-x-2'>
							<Button onClick={handleApplyFilters} icon='HeroMagnifyingGlass'>
								Filtrar
							</Button>

							<Button variant='outline' onClick={handleClearFilters} icon='HeroXMark'>
								Limpiar
							</Button>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* Estadísticas rápidas */}
			<div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-4'>
				<Card>
					<CardBody>
						<div className='flex items-center'>
							<div className='mr-3 rounded-lg bg-blue-100 p-2'>
								<span className='text-xl text-blue-600'>📄</span>
							</div>
							<div>
								<p className='text-sm text-gray-600'>Total Cotizaciones</p>
								<p className='text-2xl font-bold'>{pagination.totalQuotes}</p>
							</div>
						</div>
					</CardBody>
				</Card>

				<Card>
					<CardBody>
						<div className='flex items-center'>
							<div className='mr-3 rounded-lg bg-green-100 p-2'>
								<span className='text-xl text-green-600'>✅</span>
							</div>
							<div>
								<p className='text-sm text-gray-600'>Aprobadas</p>
								<p className='text-2xl font-bold'>
									{quotes.filter((q) => q.status === 'APPROVED').length}
								</p>
							</div>
						</div>
					</CardBody>
				</Card>

				<Card>
					<CardBody>
						<div className='flex items-center'>
							<div className='mr-3 rounded-lg bg-purple-100 p-2'>
								<span className='text-xl text-purple-600'>🔄</span>
							</div>
							<div>
								<p className='text-sm text-gray-600'>Convertidas</p>
								<p className='text-2xl font-bold'>
									{quotes.filter((q) => q.status === 'CONVERTED').length}
								</p>
							</div>
						</div>
					</CardBody>
				</Card>

				<Card>
					<CardBody>
						<div className='flex items-center'>
							<div className='mr-3 rounded-lg bg-orange-100 p-2'>
								<span className='text-xl text-orange-600'>⏰</span>
							</div>
							<div>
								<p className='text-sm text-gray-600'>Por Vencer</p>
								<p className='text-2xl font-bold'>
									{
										quotes.filter(
											(q) =>
												q.status === 'SENT' &&
												new Date(q.valid_until).getTime() - Date.now() <
													7 * 24 * 60 * 60 * 1000,
										).length
									}
								</p>
							</div>
						</div>
					</CardBody>
				</Card>
			</div>

			{/* Tabla de cotizaciones */}
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<CardTitle>Lista de Cotizaciones ({pagination.totalQuotes})</CardTitle>
					</CardHeaderChild>
				</CardHeader>
				<CardBody className='overflow-x-auto'>
					<Table className='table-fixed max-md:min-w-[70rem]'>
						<THead>
							<Tr>
								<Th className='w-32'>Número</Th>
								<Th>Cliente</Th>
								<Th>Estado</Th>
								<Th>Fecha</Th>
								<Th>Válido Hasta</Th>
								<Th>Items</Th>
								<Th>Total</Th>
								<Th className='w-48'>Acciones</Th>
							</Tr>
						</THead>
						<TBody>
							{loading ? (
								<Tr>
									<Td colSpan={8} className='py-8 text-center'>
										Cargando cotizaciones...
									</Td>
								</Tr>
							) : quotes.length === 0 ? (
								<Tr>
									<Td colSpan={8} className='py-8 text-center'>
										No hay cotizaciones registradas
									</Td>
								</Tr>
							) : (
								quotes.map((quote) => (
									<Tr key={quote.id}>
										<Td className='font-mono'>{quote.quote_number}</Td>
										<Td>{quote.customer?.name || 'Cliente N/A'}</Td>
										<Td>
											<div className='flex items-center space-x-2'>
												{getStatusBadge(quote.status)}
												{isExpired(quote.valid_until) &&
													quote.status !== 'CONVERTED' && (
														<Badge color='red'>Expirada</Badge>
													)}
											</div>
										</Td>
										<Td>{formatDate(quote.quote_date)}</Td>
										<Td>
											<div
												className={
													isExpired(quote.valid_until)
														? 'text-red-600'
														: ''
												}>
												{formatDate(quote.valid_until)}
											</div>
										</Td>
										<Td>{quote.items_count || 0}</Td>
										<Td className='font-mono'>
											{formatCurrency(quote.total_amount)}
										</Td>
										<Td>
											<div className='flex flex-wrap gap-1'>
												<PermissionGuard
													permissions={[ERP_PERMISSIONS.QUOTES.VIEW]}>
													<Button
														size='sm'
														variant='outline'
														icon='HeroEye'
														onClick={() => {
															window.location.href = `/comercial/cotizaciones/${quote.id}`;
														}}
													/>
												</PermissionGuard>

												{canSend(quote) && (
													<PermissionGuard
														permissions={[ERP_PERMISSIONS.QUOTES.SEND]}>
														<Button
															size='sm'
															color='blue'
															icon='HeroPaperAirplane'
															isLoading={actionLoading.send}
															onClick={() =>
																handleSendQuote(quote.id)
															}
														/>
													</PermissionGuard>
												)}

												<PermissionGuard
													permissions={[
														ERP_PERMISSIONS.QUOTES.GENERATE_PDF,
													]}>
													<Button
														size='sm'
														color='gray'
														icon='HeroDocumentText'
														onClick={() => {
															window.open(
																`/api/quotes/${quote.id}/pdf`,
																'_blank',
															);
														}}
													/>
												</PermissionGuard>

												{canConvert(quote) && (
													<PermissionGuard
														permissions={[
															ERP_PERMISSIONS.QUOTES.CONVERT,
														]}>
														<Button
															size='sm'
															color='emerald'
															icon='HeroArrowRight'
															isLoading={actionLoading.convert}
															onClick={() => {
																setSelectedQuote(quote);
																setShowConvertModal(true);
															}}
														/>
													</PermissionGuard>
												)}

												{quote.status === 'DRAFT' && (
													<PermissionGuard
														permissions={[
															ERP_PERMISSIONS.QUOTES.UPDATE,
														]}>
														<Button
															size='sm'
															color='amber'
															icon='HeroPencil'
															onClick={() => {
																window.location.href = `/comercial/cotizaciones/${quote.id}/editar`;
															}}
														/>
													</PermissionGuard>
												)}
											</div>
										</Td>
									</Tr>
								))
							)}
						</TBody>
					</Table>

					{pagination.totalPages > 1 && (
						<TFoot>
							<Tr>
								<Td colSpan={8}>
									<div className='flex justify-center py-4'>
										<Pagination
											currentPage={pagination.currentPage}
											totalPages={pagination.totalPages}
											onPageChange={handlePageChange}
										/>
									</div>
								</Td>
							</Tr>
						</TFoot>
					)}
				</CardBody>
			</Card>

			{/* Modal de conversión a venta */}
			<Modal isOpen={showConvertModal} setIsOpen={setShowConvertModal}>
				<ModalHeader>
					<h3 className='text-lg font-semibold'>Convertir Cotización a Venta</h3>
				</ModalHeader>
				<ModalBody>
					<p>
						¿Está seguro que desea convertir esta cotización a una venta? Esta acción
						creará automáticamente una nueva venta con todos los items de la cotización.
					</p>
					{selectedQuote && (
						<div className='mt-4 rounded-lg bg-gray-50 p-3'>
							<p>
								<strong>Número:</strong> {selectedQuote.quote_number}
							</p>
							<p>
								<strong>Cliente:</strong> {selectedQuote.customer?.name}
							</p>
							<p>
								<strong>Total:</strong> {formatCurrency(selectedQuote.total_amount)}
							</p>
							<p>
								<strong>Items:</strong> {selectedQuote.items_count}
							</p>
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<Button
						variant='outline'
						onClick={() => {
							setShowConvertModal(false);
							setSelectedQuote(null);
						}}>
						Cancelar
					</Button>
					<Button
						color='emerald'
						isLoading={actionLoading.convert}
						onClick={handleConvertToSale}>
						Convertir a Venta
					</Button>
				</ModalFooter>
			</Modal>
		</Container>
	);
};

export default Cotizaciones;
