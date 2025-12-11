import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector, injectReducer } from '@/store';
import salesReducer, {
	loadSaleDetail,
	loadSaleItems,
	selectSaleDetail,
	selectSaleItems,
	selectSalesLoading,
} from '@/store/slices/salesSlice';
import { formatCLP, translateStatus } from '../../../utils';
import SaleItemsTable from '../tables/SaleItemsTable';
import CloseSaleModal from './CloseSaleModal';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import { formatDate } from '@/utils/format.utils';
import ApiService from '@/services/ApiService';

interface Props {
	subsidiaryId: number;
	saleId: number;
	isOpen: boolean;
	onClose: () => void;
}

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
		const skipCode = (val?: string): boolean =>
			!val || /^CL(_?\d+)?$/i.test(val.trim()) || val.trim().toLowerCase() === 'cl';

		const orderedFields = [
			address?.company,
			address?.name,
			address?.address1 ?? address?.address_1,
			address?.address2 ?? address?.address_2,
			skipCode(address?.city) ? '' : address?.city,
			skipCode(address?.state) ? '' : address?.state,
			skipCode(address?.country) ? '' : address?.country,
			address?.postcode ?? address?.zip,
		]
			.map((value) => (typeof value === 'string' ? value.trim() : ''))
			.filter(Boolean);

		if (orderedFields.length) return orderedFields.join(', ');

		const fallback = Object.values(address ?? {})
			.map((value) => (typeof value === 'string' ? value.trim() : ''))
			.filter(Boolean);

		return fallback.length ? fallback.join(', ') : JSON.stringify(address);
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
	const detail = useAppSelector(selectSaleDetail);
	const items = useAppSelector(selectSaleItems);
	const loading = useAppSelector(selectSalesLoading);

	const [closeOpen, setCloseOpen] = useState(false);
	const [creatingQuote, setCreatingQuote] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		if (!subsidiaryId || !saleId) return;
		dispatch(loadSaleDetail({ subsidiaryId, saleId }));
		dispatch(loadSaleItems({ subsidiaryId, saleId }));
	}, [dispatch, subsidiaryId, saleId, isOpen]);

	const canClose = useMemo(() => {
		const invFinalized = detail?.documents_metadata?.inventory_finalized === true;
		const invDelivered = detail?.inventory_delivered === true;
		return !invFinalized && !invDelivered;
	}, [detail]);

	const itemsCount = detail?.items_count ?? items.length ?? 0;

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
						// fallback si el backend algún día no envía total
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
			const response = await ApiService.fetchData<{ message?: string }>({
				url: `/subsidiaries/${subsidiaryId}/sales/${saleId}/create-quote`,
				method: 'post',
			});
			const message = response.data?.message || 'Cotización creada correctamente';
			toast.success(message);
		} catch (error) {
			const err = error as { response?: { data?: { message?: string } } };
			const message = err?.response?.data?.message || 'No se pudo crear la cotización';
			toast.error(message);
		} finally {
			setCreatingQuote(false);
		}
	}, [subsidiaryId, saleId, creatingQuote]);

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='xl' isScrollable isStaticBackdrop>
			<ModalHeader>
				<Badge>Detalle de Venta</Badge> 
				{/* #{detail?.id ?? saleId} */}
				<Badge variant='solid' color='blue' className='w-fit text-sm ml-4'>
								{translateStatus(detail?.status)}
							</Badge>
			</ModalHeader>

			<ModalBody className='space-y-4'>
				<Card className='mb-2 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80'>
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
							{/* <Badge variant='solid' color='blue' className='w-fit'>
								{translateStatus(detail?.status)}
							</Badge> */}
							{/* <div className='text-right'>
								<p className='text-xs uppercase tracking-wide text-zinc-500'>
									Total
								</p>
								<p className='text-xl font-semibold text-zinc-900 dark:text-zinc-100'>
									{formatCLP(detail?.total_amount ?? 0)}
								</p>
								<p className='text-xs text-zinc-400'>{itemsCount} Ítems</p>
							</div> */}
							{canClose && (
								<Button
								variant='outline'
									color='emerald'
									icon='HeroCheckCircle'
									iconColor='text-emerald-700'
									className='mt-2 md:mt-0 border border-dashed bg-emerald-400/20 text-emerald-700 hover:bg-emerald-400/20 hover:text-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-100'
									onClick={() => setCloseOpen(true)}>
									Cerrar venta
								</Button>
							)}
						</div>
					</CardBody>
				</Card>
				<div className='grid gap-4 lg:grid-cols-3'>
					<Card className='bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80'>
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

					<Card className='bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80'>
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

					<Card className='bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80'>
						<CardHeader>
							<CardTitle>Direcciones</CardTitle>
						</CardHeader>
						<CardBody className='space-y-3'>
							<div>
								<p className='text-xs font-semibold uppercase tracking-wide text-zinc-500'>
									Billing
								</p>
								<div className='rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100'>
									{billingAddress}
								</div>
							</div>
							<div>
								<p className='text-xs font-semibold uppercase tracking-wide text-zinc-500'>
									Shipping
								</p>
								<div className='rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100'>
									{shippingAddress}
								</div>
							</div>
						</CardBody>
					</Card>
				</div>

				<Card className='bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80'>
					<CardHeader className='flex items-center justify-between'>
						<CardTitle>Ítems de la venta</CardTitle>
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
						items={items}
						onSuccess={() => {
							dispatch(loadSaleDetail({ subsidiaryId, saleId }));
							dispatch(loadSaleItems({ subsidiaryId, saleId }));
						}}
					/>
				)}

				{loading && (
					<div className='rounded-md border border-dashed border-zinc-300 p-3 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-300'>
						Cargando información actualizada...
					</div>
				)}
				<ModalFooter className='flex justify-end rounded-md p-3'>
					<ModalFooterChild className='ml-auto'>
						<Button
							variant='outline'
							color='violet'
							className='border border-dashed bg-violet-400/10 text-violet-700 hover:bg-violet-400/20 hover:text-violet-900 dark:text-violet-300 dark:hover:bg-violet-500/20 dark:hover:text-violet-100'
							onClick={handleCreateQuote}>
							Crear cotización desde venta
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</ModalBody>
		</Modal>
	);
};

export default SaleDetailPage;
