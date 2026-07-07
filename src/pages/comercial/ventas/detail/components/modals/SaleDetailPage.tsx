import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector, injectReducer } from '@/store';
import salesReducer, {
	loadSaleDetail,
	loadSaleItems,
	closeSaleThunk,
	selectSaleDetail,
	selectSaleItems,
	selectSalesLoading,
} from '@/store/slices/salesSlice';
import { formatCLP, translateStatus } from '../../../utils';
import SaleItemsTable from '../tables/SaleItemsTable';
import CloseSaleModal from './CloseSaleModal';
import CorrectSerialModal from './CorrectSerialModal';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProtectedButton from '@/components/ui/ProtectedButton';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import { formatDate } from '@/utils/format.utils';
import ApiService from '@/services/ApiService';
import { downloadShippingLabel } from '@/store/slices/sales/salesSlice';
import salesService, { type ConfirmReturnResponse } from '@/services/salesService';
import { getFirstCapitalize } from '@/utils/getFirstLetter';
import { useNavigate } from 'react-router-dom';
import { IQuote } from '@/interface';
import { AxiosError } from 'axios';
import Icon from '@/components/icon/Icon';
import Tooltip from '@/components/ui/Tooltip';
import Spinner from '@/components/ui/Spinner';
interface Props {
	subsidiaryId: number;
	saleId: number;
	isOpen: boolean;
	onClose: () => void;
}

interface CreateQuoteFromSaleResponse {
	message?: string;
	quote?: Pick<IQuote, 'id'> | null;
	id?: number | string | null;
	quote_id?: number | string | null;
	quoteId?: number | string | null;
	// sale_id se ignora intencionalmente - no se usa para navegación
}

const extractQuoteIdFromResponse = (
	payload?: CreateQuoteFromSaleResponse | null,
): number | null => {
	if (!payload) return null;
	const rawId = payload.quote?.id ?? payload.quote_id ?? payload.quoteId ?? payload.id;
	if (typeof rawId === 'number') {
		return Number.isFinite(rawId) && rawId > 0 ? rawId : null;
	}
	if (typeof rawId === 'string') {
		const parsed = Number(rawId);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
	}
	return null;
};

const formatAddress = (address: any): string => {
	if (!address) return '-';
	if (typeof address === 'string') return address;
	if (Array.isArray(address)) {
		return address
			.map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
			.filter(Boolean)
			.join(', ');
	}

	if (typeof address === 'object') {
		const pretty = [address?.address1, address?.address_1]
			.map((value) => (typeof value === 'string' ? value.trim() : ''))
			.find((value) => Boolean(value));
		return pretty || '-';
	}

	return String(address);
};

const parseAmount = (value: number | string | null | undefined): number => {
	const n = typeof value === 'string' ? parseFloat(value) : Number(value);
	return Number.isFinite(n) ? n : 0;
};

injectReducer('salesModule', salesReducer);

const SaleDetailPage: React.FC<Props> = ({ subsidiaryId, saleId, isOpen, onClose }) => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const detail = useAppSelector(selectSaleDetail);
	const items = useAppSelector(selectSaleItems);
	const loading = useAppSelector(selectSalesLoading);

	const [closeOpen, setCloseOpen] = useState(false);
	const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
	const [isClosing, setIsClosing] = useState(false);
	const [confirmReturnOpen, setConfirmReturnOpen] = useState(false);
	const [isConfirmingReturn, setIsConfirmingReturn] = useState(false);
	const [correctSerialOpen, setCorrectSerialOpen] = useState(false);
	const [creatingQuote, setCreatingQuote] = useState(false);
	const [createdQuoteId, setCreatedQuoteId] = useState<number | null>(null);
	// IDs de ítems que el backend marca como pendientes de asignar serie.
	// Fuente de la verdad: endpoint pending-serial-assignment (su serialized_items).
	const [serialItemIds, setSerialItemIds] = useState<Set<number>>(new Set());




	useEffect(() => {
		if (!isOpen) return;
		if (!subsidiaryId || !saleId) return;
		dispatch(loadSaleDetail({ subsidiaryId, saleId }));
		dispatch(loadSaleItems({ subsidiaryId, saleId }));
	}, [dispatch, subsidiaryId, saleId, isOpen]);

	// Averigua qué ítems de esta venta requieren número de serie. El payload de
	// /sales/{id}/items no distingue serializados de normales (ambos pueden tener
	// reserva), así que consultamos al backend, que ya calcula esa lista.
	useEffect(() => {
		if (!isOpen || !subsidiaryId || !saleId) return;
		let cancelled = false;
		setSerialItemIds(new Set());
		(async () => {
			try {
				const resp = await ApiService.fetchData<{
					data?: Array<{
						id: number;
						serialized_items?: Array<{ sale_item_id: number }>;
					}>;
				}>({
					url: `/subsidiaries/${subsidiaryId}/sales/pending-serial-assignment`,
					method: 'get',
					params: { per_page: 200 },
					cacheTTLms: 15_000,
					dedupe: true,
				});
				if (cancelled) return;
				const sale = resp.data?.data?.find((s) => s.id === saleId);
				const ids = (sale?.serialized_items ?? []).map((si) => si.sale_item_id);
				setSerialItemIds(new Set(ids));
			} catch {
				if (!cancelled) setSerialItemIds(new Set());
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [isOpen, subsidiaryId, saleId]);

	useEffect(() => {
		setCreatedQuoteId(null);
	}, [saleId]);

	useEffect(() => {
		if (!isOpen) {
			setCreatedQuoteId(null);
		}
	}, [isOpen]);

	// const itemsCount = detail?.items_count ?? items.length ?? 0;

	const lineTotals = useMemo(() => {
		const subtotal = items.reduce(
			(sum, it) => sum + parseAmount(it.subtotal ?? it.total ?? 0),
			0,
		);
		const tax = items.reduce((sum, it) => sum + parseAmount(it.tax_amount ?? 0), 0);
		const total = items.reduce(
			(sum, it) =>
				sum +
				parseAmount(
					it.total ??
						parseAmount(it.subtotal ?? 0) + parseAmount(it.tax_amount ?? 0),
				),
			0,
		);
		return { subtotal, tax, total };
	}, [items]);

	const shippingTotal = useMemo(
		() => parseAmount(detail?.shipping_total ?? detail?.shipping_amount ?? 0),
		[detail?.shipping_total, detail?.shipping_amount],
	);

	// ¿Hay ítems con series conocidas (vendidas/devueltas) que se puedan corregir?
	const hasSerialItems = useMemo(
		() =>
			items.some((it) => {
				const reservation = (it.meta_json as Record<string, unknown> | undefined)
					?.reservation as Record<string, unknown> | undefined;
				const sold = (reservation?.sold_serials as string[] | undefined) ?? [];
				const returned = (reservation?.returned_serials as string[] | undefined) ?? [];
				return [...sold, ...returned].some(
					(s) => typeof s === 'string' && s.trim() !== '',
				);
			}),
		[items],
	);

	const totals = useMemo(
		() => [
			{ label: 'Subtotal', value: formatCLP(lineTotals.subtotal) },
			{ label: 'Impuestos', value: formatCLP(lineTotals.tax) },
			{ label: 'Envío', value: formatCLP(shippingTotal) },
			{
				label: 'Total',
				value: formatCLP(lineTotals.total + shippingTotal),
				highlight: true,
			},
			{
				label: 'Pendiente',
				value: formatCLP(detail?.pending_amount ?? 0),
			},
		],
		[lineTotals, shippingTotal, detail?.pending_amount],
	);

	const billingAddress = useMemo(
		() => formatAddress(detail?.billing_snapshot),
		[detail?.billing_snapshot],
	);

	const shippingAddress = useMemo(
		() => formatAddress(detail?.shipping_snapshot),
		[detail?.shipping_snapshot],
	);

	if (!isOpen) return null;

	const handleCreateQuote = useCallback(async () => {
		if (!subsidiaryId || !saleId || creatingQuote) return;

		try {
			setCreatingQuote(true);
			const response = await ApiService.fetchData<CreateQuoteFromSaleResponse>({
				url: `/subsidiaries/${subsidiaryId}/sales/${saleId}/create-quote`,
				method: 'post',
			});
			const message = response.data?.message || 'Cotización creada correctamente';
			const resolvedQuoteId = extractQuoteIdFromResponse(response.data);
			if (resolvedQuoteId) {
				setCreatedQuoteId(resolvedQuoteId);
			}
			const successMessage = resolvedQuoteId
				? `${message}, número de cotización: ${resolvedQuoteId}`
				: message;
			toast.success(successMessage);
		} catch (error) {
			const axiosError = error as AxiosError<CreateQuoteFromSaleResponse>;
			const status = axiosError.response?.status;
			const responseData = axiosError.response?.data;
			const existingQuoteId = extractQuoteIdFromResponse(responseData);
			if (status === 409 && existingQuoteId) {
				setCreatedQuoteId(existingQuoteId);
				toast.info(
					`Ya existe una cotización para esta venta, con el número: ${existingQuoteId}`,
				);
				navigate(`/comercial/cotizaciones/${existingQuoteId}`);
				return;
			}
			const message = responseData?.message || 'No se pudo crear la cotización';
			toast.error(message);
		} finally {
			setCreatingQuote(false);
		}
	}, [subsidiaryId, saleId, creatingQuote, navigate]);

	const existingQuoteId =
		detail?.quote_id ?? (detail?.documents_metadata as any)?.origin_quote_id;
	const effectiveQuoteId = createdQuoteId ?? existingQuoteId;

	const handleViewQuote = () => {
		if (effectiveQuoteId) {
			navigate(`/comercial/cotizaciones/${effectiveQuoteId}`);
		}
	};

	// Un ítem requiere serie sólo si el backend lo lista como pendiente de asignar
	// serie (serialized_items). Los productos normales no entran: se cierran/marcan
	// como completados por su propio flujo, sin pedir serie.
	const isItemTrackable = (it: { id: number }): boolean => serialItemIds.has(it.id);

	const handleCloseSale = async () => {
		const needsSerials = items.some(isItemTrackable);

		if (needsSerials) {
			setCloseOpen(true);
			return;
		}
		setConfirmCloseOpen(true);
	};

	const handleConfirmClose = async () => {
		setConfirmCloseOpen(false);
		setIsClosing(true);
		try {
			const res = await dispatch(
				closeSaleThunk({ subsidiaryId, saleId, items: [] }),
			).unwrap();

			dispatch(loadSaleDetail({ subsidiaryId, saleId }));
			dispatch(loadSaleItems({ subsidiaryId, saleId }));
			toast.success('Venta cerrada correctamente');
		} catch (err) {

			console.error('Direct close failed', err);
			toast.info('Se requiere ingresar números de serie. Abriendo formulario...');
			setCloseOpen(true);
		} finally {
			setIsClosing(false);
		}
	};

	const handleConfirmReturn = async () => {
		if (!subsidiaryId || !saleId || isConfirmingReturn) return;
		setIsConfirmingReturn(true);
		try {
			const res: ConfirmReturnResponse = await salesService.confirmSaleReturn(
				subsidiaryId,
				saleId,
			);
			const seriesCount = res.confirmed_serials?.length ?? 0;
			const restockCount = res.restocked_items?.length ?? 0;
			const detailParts: string[] = [];
			if (seriesCount > 0) detailParts.push(`${seriesCount} serie(s) devuelta(s) al stock`);
			if (restockCount > 0) detailParts.push(`${restockCount} ítem(es) reingresado(s)`);
			const summary = detailParts.length ? ` (${detailParts.join(', ')})` : '';
			toast.success(
				`${res.message || 'Recepción confirmada correctamente'}${summary}`,
			);
			setConfirmReturnOpen(false);
			dispatch(loadSaleDetail({ subsidiaryId, saleId }));
			dispatch(loadSaleItems({ subsidiaryId, saleId }));
		} catch (error) {
			const axiosError = error as AxiosError<{ message?: string }>;
			const status = axiosError.response?.status;
			const message = axiosError.response?.data?.message;
			if (status === 422) {
				// No hay ítems en espera de recepción física.
				toast.info(message || 'No hay devoluciones pendientes para confirmar en esta venta.');
				setConfirmReturnOpen(false);
			} else if (status === 403) {
				toast.error(message || 'No tienes permiso para confirmar esta devolución.');
			} else {
				toast.error(message || 'No se pudo confirmar la recepción de la devolución.');
			}
		} finally {
			setIsConfirmingReturn(false);
		}
	};

	const quoteButtonLabel = effectiveQuoteId
		? 'Ver cotización asociada'
		: 'Crear cotización desde venta';
	const quoteButtonHandler = effectiveQuoteId ? handleViewQuote : handleCreateQuote;

	const quoteButtonClass = effectiveQuoteId
		? 'border-rose-500 bg-rose-500 text-rose-700 hover:bg-rose-100 hover:text-rose-900 dark:text-rose-200 dark:hover:bg-rose-500/20 dark:hover:text-rose-100'
		: 'border-violet-500 bg-violet-500 text-violet-700 hover:bg-violet-100 hover:text-violet-900 dark:text-violet-300 dark:hover:bg-violet-500/20 dark:hover:text-violet-100';


	const statusColorMap: Record<string, string> = {
		'draft': 'zinc',
		'pending': 'amber',
		'on-hold': 'orange',
		'confirmed': 'sky',
		'processing': 'indigo',
		'paid': 'teal',
		'completed': 'emerald',
		'delivered': 'violet',
		'cancelled': 'red',
		'refunded': 'slate',
	};

	// Estado de la venta → qué acciones aplican. Nunca coexisten "Cerrar venta"
	// y "Confirmar recepción de devolución": cerrar solo aplica a ventas abiertas.
	const saleStatus = String(detail?.status ?? '');
	const isSaleClosed = saleStatus === 'completed' || saleStatus === 'closed';
	const isSaleRefunded = saleStatus === 'refunded';
	const isSaleCancelled = saleStatus === 'cancelled';
	const canCloseSale = !isSaleClosed && !isSaleRefunded && !isSaleCancelled;

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='xl' isScrollable isStaticBackdrop>
			<ModalHeader className='flex items-center justify-between'>
				<Badge>
					Detalle de Venta -{' '}
					<span className='ml-2 text-lg text-teal-600 dark:text-teal-100'>
						N° Venta {detail?.id}
					</span>
				</Badge>
				{/* #{detail?.id ?? saleId} */}
				<Badge variant='solid' color={`${statusColorMap[detail?.status ?? 'draft']}`} className='ml-4 w-fit px-2 text-sm text-white'>
					{translateStatus(detail?.status)}
				</Badge>
			</ModalHeader>

			<ModalBody className='space-y-4'>
				<Card className='mb-2 bg-white/90 shadow-sm'>
					<CardBody className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
						<div className='flex flex-col gap-1'>
							<span className='text-xs font-semibold uppercase tracking-wide text-zinc-500'>
								Venta
							</span>
							<span className='text-xl font-bold text-zinc-900 dark:text-zinc-100'>
								{detail?.sale_number || `#${saleId}`}
							</span>
							{/* <div className='text-sm text-zinc-600 dark:text-zinc-300'>
								N° Woo: {detail?.wc_order_number || detail?.wc_order_id || '-'}
							</div> */}
							<div className='text-xs text-zinc-500'>
								Fecha de venta:{' '}
								{detail?.sale_date ? formatDate(detail.sale_date) : '-'}
							</div>
						</div>
						<div className='flex flex-col gap-2 md:flex-row md:items-center md:gap-4'>
							<div className='flex flex-row items-center justify-center space-y-3'>
								<p className='mr-4 uppercase tracking-wide font-medium'>Detalle de Pago</p>
								<div className='flex flex-col items-center justify-center gap-2 space-y-2 rounded-md border-2 border-dashed border-yellow-500 p-2 px-4 dark:border-white'>
									<Badge variant='solid' color='teal' className='w-fit px-2'>
										{getFirstCapitalize(translateStatus(detail?.document_type))}
									</Badge>
									<p className='text-xs uppercase tracking-wide text-violet-500'>
										{getFirstCapitalize(detail?.payment_method_title ?? '') ||
											'-'}
									</p>
								</div>
							</div>

							{/* Header solo informativo: las acciones viven en el footer. */}
							{isSaleClosed && (
								<Badge variant='solid' color='green' className='px-2 py-1 text-sm'>
									Venta cerrada{' '}
									{(detail as any)?.completed_at
										? `el ${formatDate((detail as any).completed_at)}`
										: ''}
								</Badge>
							)}
							{isSaleRefunded && (
								<Badge variant='solid' color='slate' className='px-2 py-1 text-sm'>
									Venta reembolsada
								</Badge>
							)}
							{isSaleCancelled && (
								<Badge variant='solid' color='red' className='px-2 py-1 text-sm'>
									Venta cancelada
								</Badge>
							)}
						</div>
					</CardBody>
				</Card>
				<div className='grid gap-4 lg:grid-cols-3'>
					<Card className='bg-white/90 shadow-sm'>
						<CardHeader>
							<CardTitle>Totales</CardTitle>
						</CardHeader>
						<CardBody>
							<dl className='space-y-3 text-sm text-zinc-700 dark:text-zinc-200'>
								{totals.map((item) => (
									<div
										key={item.label}
										className={`flex items-center justify-between rounded-md px-2 py-1 ${
											item.highlight
												? 'bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
												: 'bg-zinc-50 text-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200'
										}`}>
										<dt>{item.label}</dt>
										<dd>{item.value}</dd>
									</div>
								))}
							</dl>
						</CardBody>
					</Card>

					<Card className='bg-white/90 shadow-sm'>
						<CardHeader>
							<CardTitle>Cliente</CardTitle>
						</CardHeader>
						<CardBody className='space-y-3'>
							<div>
								<p className='text-xs font-semibold uppercase tracking-wide text-zinc-500'>
									Nombre
								</p>
								<div className='rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100'>
									{detail?.customer?.name || '-'}
								</div>
							</div>
							<div>
								<p className='text-xs font-semibold uppercase tracking-wide text-zinc-500'>
									RUT
								</p>
								<div className='rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100'>
									{detail?.customer?.rut || '-'}
								</div>
							</div>
							<div>
								<p className='text-xs font-semibold uppercase tracking-wide text-zinc-500'>
									Email
								</p>
								<div className='rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100'>
									{detail?.customer?.email || '-'}
								</div>
							</div>
						</CardBody>
					</Card>

					<Card className='bg-white/90 shadow-sm'>
						<CardHeader>
							<CardTitle>Direcciones</CardTitle>
						</CardHeader>
						<CardBody className='space-y-3'>
							<div>
								<p className='text-xs font-semibold uppercase tracking-wide text-zinc-500'>
									Dirección de facturación
								</p>
								<div className='rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100'>
									{billingAddress}
								</div>
							</div>
							<div>
								<p className='text-xs font-semibold uppercase tracking-wide text-zinc-500'>
									Dirección de envío
								</p>
								<div className='rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100'>
									{shippingAddress}
								</div>
							</div>
						</CardBody>
					</Card>
				</div>

				{detail?.notes ? (
					<Card className='bg-emerald-500/40 shadow-sm'>
						<CardHeader>
							<CardTitle>Notas del Cliente</CardTitle>
						</CardHeader>
						<CardBody>
							<p>
								{detail?.notes}
							</p>
						</CardBody>
					</Card>
				) :(
					<Card className='bg-red-500/40 shadow-sm'>
						<CardHeader>
							<CardTitle>Notas del Cliente</CardTitle>
						</CardHeader>
						<CardBody>
							<p>No hay notas del cliente</p>
						</CardBody>
					</Card>
				)}
				<Card className='bg-white/90 shadow-sm'>
					<CardHeader className='flex items-center justify-between'>
						<CardTitle>Ítems de la venta</CardTitle>
						{(isSaleClosed || isSaleRefunded) && hasSerialItems && (
							<Tooltip text='Corregir serie' placement='left-end'>
								<ProtectedButton
									permission='correct-sale-serials'
									subsidiaryId={subsidiaryId}
									scope='access'
									fallbackMode='hidden'
									variant='solid'
									color='sky'
									size='sm'
									className='font-bold border-2 border-sky-600 hover:bg-sky-700/20'
									onClick={() => setCorrectSerialOpen(true)}>
										<Icon color='white' icon='HeroArrowsRightLeft' className="text-xl mr-1 font-bold" />
										Corregir serie
								</ProtectedButton>
							</Tooltip>
						)}
					</CardHeader>
					<CardBody>
						<SaleItemsTable items={items} />
					</CardBody>
				</Card>

				{closeOpen && (
					<CloseSaleModal
						open={closeOpen}
						onClose={() => setCloseOpen(false)}
						subsidiaryId={subsidiaryId}
						saleId={saleId}
						items={items.filter(isItemTrackable)}
						onSuccess={() => {
							dispatch(loadSaleDetail({ subsidiaryId, saleId }));
							dispatch(loadSaleItems({ subsidiaryId, saleId }));
						}}
					/>
				)}

				{correctSerialOpen && (
					<CorrectSerialModal
						open={correctSerialOpen}
						onClose={() => setCorrectSerialOpen(false)}
						subsidiaryId={subsidiaryId}
						saleId={saleId}
						items={items}
						onSuccess={() => {
							dispatch(loadSaleDetail({ subsidiaryId, saleId }));
							dispatch(loadSaleItems({ subsidiaryId, saleId }));
						}}
					/>
				)}

				<Modal
					isOpen={confirmCloseOpen}
					setIsOpen={setConfirmCloseOpen}
					size='sm'
					isCentered>
					<ModalHeader>Confirmar cierre de venta</ModalHeader>
					<ModalBody>
						<div className='text-zinc-600 dark:text-zinc-300'>
							¿Seguro que desea cerrar esta venta? No se requieren números de serie.
						</div>
					</ModalBody>
					<ModalFooter>
						<ModalFooterChild className='justify-end'>
							<Button
								variant='outline'
								color='red'
								onClick={() => setConfirmCloseOpen(false)}>
								Cancelar
							</Button>
							<Button
								variant='solid'
								color='emerald'
								onClick={handleConfirmClose}
								isLoading={isClosing}>
								Confirmar
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</Modal>

				<Modal
					isOpen={confirmReturnOpen}
					setIsOpen={setConfirmReturnOpen}
					size='sm'
					isCentered>
					<ModalHeader>Confirmar recepción de devolución</ModalHeader>
					<ModalBody>
						<div className='text-zinc-600 dark:text-zinc-300'>
							Se registrará la recepción física en bodega de los productos
							devueltos de esta venta: las series se devolverán a stock disponible
							y el stock no serializado se reingresará al inventario. Esta acción
							no se puede deshacer.
						</div>
					</ModalBody>
					<ModalFooter>
						<ModalFooterChild className='justify-end'>
							<Button
								variant='outline'
								color='red'
								onClick={() => setConfirmReturnOpen(false)}
								isDisable={isConfirmingReturn}>
								Cancelar
							</Button>
							<Button
								variant='solid'
								color='amber'
								onClick={handleConfirmReturn}
								isLoading={isConfirmingReturn}>
								Confirmar recepción
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</Modal>

				{loading && (
					<Spinner nombre='Cargando información actualizada...'/>
				)}
				<ModalFooter className='flex flex-wrap justify-end gap-2 rounded-md p-3'>
					<ModalFooterChild className='ml-auto flex flex-wrap items-center justify-end gap-2'>
						<Tooltip text='Descargar etiqueta de envío'>
							<Button
								variant='solid'
								color='blue'
								className='border-2 border-blue-600 hover:bg-blue-700/20 bg-blue-500'
								isDisable={!subsidiaryId}
								onClick={async () =>{
									try{
										await dispatch(
											downloadShippingLabel({
												subsidiaryId: Number(subsidiaryId),
												id: saleId,
												
											})
										);
									}catch(e: any){
										if (e.statusCode === 404) {
											toast.error('No se encontró la etiqueta de envío.');
										} else if (e.statusCode === 422) {
											if (e.message) {
												toast.error(e.message);
											} else {
												toast.error('La venta no cumple los requisitos para generar etiqueta de envío.');
											}
										} else {
											toast.error('Error al descargar etiqueta.');
										}
									}
								}}>
									<Icon color='white' className="text-2xl mr-1 font-bold" icon='DuoFile' />
								Descargar etiqueta
							</Button>
						</Tooltip>
						{canCloseSale && (
							<Tooltip text='Cerrar venta'>
								<Button
									variant='solid'
									color='emerald'
									icon='HeroCheckCircle'
									onClick={handleCloseSale}>
									Cerrar venta
								</Button>
							</Tooltip>
						)}
						{isSaleRefunded && (
							<Tooltip text='Confirmar recepcion de envio'>
								<ProtectedButton
									permission='confirm-sale-return'
									subsidiaryId={subsidiaryId}
									scope='access'
									fallbackMode='hidden'
									variant='solid'
									color='amber'
									className='border-2 border-amber-600 hover:bg-amber-700/20'
									isLoading={isConfirmingReturn}
									onClick={() => setConfirmReturnOpen(true)}>
										<Icon color='white' icon='HeroInboxArrowDown'  className='mr-1 font-bold text-2xl'/>
									Confirmar recepción de devolución
								</ProtectedButton>
							</Tooltip>
						)}
						<Tooltip text={effectiveQuoteId ? 'Ver cotización' : 'Crear cotización'}>
							<Button
								variant='solid'
								color={effectiveQuoteId ? 'rose' : 'violet'}
								className={quoteButtonClass}
								onClick={quoteButtonHandler}
								isLoading={creatingQuote}
								disabled={creatingQuote && !effectiveQuoteId}
								icon={effectiveQuoteId ? 'HeroEye' : 'HeroPlus'}>
								{quoteButtonLabel}
							</Button>
						</Tooltip>
					</ModalFooterChild>
				</ModalFooter>
			</ModalBody>
		</Modal>
	);
};

export default SaleDetailPage;
