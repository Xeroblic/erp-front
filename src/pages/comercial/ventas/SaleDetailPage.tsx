import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector, injectReducer } from '@/store';
import salesReducer, {
	loadSaleDetail,
	loadSaleItems,
	selectSaleDetail,
	selectSaleItems,
	selectSalesLoading,
} from '@/store/slices/salesSlice';
import { formatCLP, translateStatus } from './utils';
import SaleItemsTable from './components/SaleItemsTable';
import CloseSaleModal from './components/CloseSaleModal';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import { formatDate } from '@/utils/format.utils';

interface Props {
	subsidiaryId: number;
	saleId: number;
}

const formatAddress = (address: any): string => {
	if (!address) return '—';
	if (typeof address === 'string') return address;
	if (Array.isArray(address)) {
		return address
			.map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
			.filter(Boolean)
			.join(', ');
	}

	if (typeof address === 'object') {
		const orderedFields = [
			address?.company,
			address?.name,
			address?.address1 ?? address?.address_1,
			address?.address2 ?? address?.address_2,
			address?.city,
			address?.state,
			address?.country,
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

// Inyectar reducer dinámicamente bajo la llave 'salesModule'
injectReducer('salesModule', salesReducer);

const SaleDetailPage: React.FC<Props> = ({ subsidiaryId, saleId }) => {
	const dispatch = useAppDispatch();
	const detail = useAppSelector(selectSaleDetail);
	const items = useAppSelector(selectSaleItems);
	const loading = useAppSelector(selectSalesLoading);

	const [closeOpen, setCloseOpen] = useState(false);

	useEffect(() => {
		if (!subsidiaryId || !saleId) return;
		dispatch(loadSaleDetail({ subsidiaryId, saleId }));
		dispatch(loadSaleItems({ subsidiaryId, saleId }));
	}, [dispatch, subsidiaryId, saleId]);

	const canClose = useMemo(() => {
		const invFinalized = detail?.documents_metadata?.inventory_finalized === true;
		const invDelivered = detail?.inventory_delivered === true;
		return !invFinalized && !invDelivered;
	}, [detail]);

	const itemsCount = detail?.items_count ?? items.length ?? 0;

	const quickFields = useMemo(
		() => [
			{ label: 'Nº Venta', value: detail?.sale_number || `#${saleId}` },
			{
				label: 'Nº Woo',
				value: detail?.wc_order_number || detail?.wc_order_id || '—',
			},
			{
				label: 'Fecha de venta',
				value: detail?.sale_date ? formatDate(detail.sale_date) : '—',
			},
			{ label: 'Ítems', value: String(itemsCount ?? '—') },
			{
				label: 'Inventario',
				value: detail?.inventory_delivered ? 'Entregado' : 'Pendiente',
			},
			{
				label: 'Pagado',
				value: formatCLP(detail?.paid_amount ?? 0),
			},
		],
		[detail, itemsCount, saleId],
	);

	const totals = useMemo(
		() => [
			{ label: 'Subtotal', value: formatCLP(detail?.subtotal ?? 0) },
			{ label: 'Impuestos', value: formatCLP(detail?.tax_amount ?? 0) },
			{ label: 'Envío', value: formatCLP(detail?.shipping_total ?? 0) },
			{
				label: 'Total',
				value: formatCLP(detail?.total_amount ?? 0),
				highlight: true,
			},
			{
				label: 'Pendiente',
				value: formatCLP(detail?.pending_amount ?? 0),
			},
		],
		[detail],
	);
	const billingAddress = useMemo(
		() => formatAddress(detail?.billing_snapshot),
		[detail?.billing_snapshot],
	);

	const shippingAddress = useMemo(
		() => formatAddress(detail?.shipping_snapshot),
		[detail?.shipping_snapshot],
	);

	return (
		<div className='space-y-6'>
			<Card>
				<CardBody className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
					<div>
						<p className='text-sm text-zinc-500'>Venta</p>
						<CardTitle className='text-2xl font-semibold text-zinc-900 dark:text-zinc-100'>
							{detail?.sale_number || `#${saleId}`}
						</CardTitle>
						<div className='text-sm text-zinc-600 dark:text-zinc-300'>
							Nº Woo: {detail?.wc_order_number || detail?.wc_order_id || '—'}
						</div>
						<div className='text-xs text-zinc-500'>
							Fecha de venta: {detail?.sale_date ? formatDate(detail.sale_date) : '—'}
						</div>
					</div>
					<div className='flex flex-col gap-4 text-right sm:flex-row sm:items-center sm:gap-6'>
						<div className='flex items-center justify-end gap-2'>
							<Badge variant='solid' color='blue'>
								{translateStatus(detail?.status)}
							</Badge>
						</div>
						<div>
							<p className='text-xs uppercase tracking-wide text-zinc-500'>Total</p>
							<p className='text-2xl font-semibold text-zinc-900 dark:text-zinc-100'>
								{formatCLP(detail?.total_amount ?? 0)}
							</p>
							<p className='text-xs text-zinc-400'>{itemsCount} ítems</p>
						</div>
						{canClose && (
							<Button
								color='emerald'
								icon='HeroCheckCircle'
								onClick={() => setCloseOpen(true)}>
								Cerrar venta
							</Button>
						)}
					</div>
				</CardBody>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Información general</CardTitle>
				</CardHeader>
				<CardBody>
					<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
						{quickFields.map((field) => (
							<div key={field.label} className='space-y-1'>
								<label className='text-xs font-semibold uppercase tracking-wide text-zinc-500'>
									{field.label}
								</label>
								<Input
									name='informacion_general'
									value={field.value}
									readOnly
									className='cursor-text bg-white text-sm dark:bg-zinc-900'
								/>
							</div>
						))}
					</div>
				</CardBody>
			</Card>

			<div className='grid gap-4 lg:grid-cols-3'>
				<Card>
					<CardHeader>
						<CardTitle>Totales</CardTitle>
					</CardHeader>
					<CardBody>
						<dl className='space-y-3 text-sm text-zinc-700 dark:text-zinc-200'>
							{totals.map((item) => (
								<div
									key={item.label}
									className={`flex items-center justify-between rounded-md border border-transparent px-2 py-1 ${
										item.highlight
											? 'bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
											: ''
									}`}>
									<dt>{item.label}</dt>
									<dd>{item.value}</dd>
								</div>
							))}
						</dl>
					</CardBody>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Cliente</CardTitle>
					</CardHeader>
					<CardBody className='space-y-4'>
						<div className='space-y-1'>
							<label className='text-xs font-semibold uppercase tracking-wide text-zinc-500'>
								Nombre
							</label>
							<Input
								name='cliente_nombre'
								value={detail?.customer?.name || '—'}
								readOnly
								className='cursor-text bg-white text-sm dark:bg-zinc-900'
							/>
						</div>
						<div className='space-y-1'>
							<label className='text-xs font-semibold uppercase tracking-wide text-zinc-500'>
								RUT
							</label>
							<Input
								name='cliente_rut'
								value={detail?.customer?.rut || '—'}
								readOnly
								className='cursor-text bg-white text-sm dark:bg-zinc-900'
							/>
						</div>
						<div className='space-y-1'>
							<label className='text-xs font-semibold uppercase tracking-wide text-zinc-500'>
								Email
							</label>
							<Input
								name='cliente_email'
								value={detail?.customer?.email || '—'}
								readOnly
								className='cursor-text bg-white text-sm dark:bg-zinc-900'
							/>
						</div>
					</CardBody>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Direcciones</CardTitle>
					</CardHeader>
					<CardBody className='space-y-4'>
						<div>
							<p className='text-xs font-semibold uppercase tracking-wide text-zinc-500'>
								Billing
							</p>
							<p className='rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200'>
								{billingAddress}
							</p>
						</div>
						<div>
							<p className='text-xs font-semibold uppercase tracking-wide text-zinc-500'>
								Shipping
							</p>
							<p className='rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-200'>
								{shippingAddress}
							</p>
						</div>
					</CardBody>
				</Card>
			</div>

			<Card>
				<CardHeader className='flex items-center justify-between'>
					<CardTitle>Ítems de la venta</CardTitle>
					<Badge variant='outline'>{itemsCount} ítems</Badge>
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
		</div>
	);
};

export default SaleDetailPage;
