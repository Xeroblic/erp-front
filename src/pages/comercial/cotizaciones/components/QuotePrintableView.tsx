import React from 'react';
import type { IQuote, IQuoteItem } from '../../../../interface/quotes.interface';
import Badge from '@/components/ui/Badge';

interface QuotePrintableViewProps {
	quote: IQuote;
}

const formatDate = (value?: string | null) => {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '—';
	return date.toLocaleDateString('es-CL', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
};

const parseNumber = (value: any): number => {
	const num = Number(value);
	return Number.isNaN(num) ? 0 : num;
};

const formatCurrency = (value: any) =>
	new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(
		parseNumber(value),
	);

const computeItemTotal = (item: IQuoteItem) => {
	const quantity = parseNumber(item.quantity || 0);
	const unit = parseNumber(item.unit_price || 0);
	const discount = parseNumber((item as any).discount_amount ?? 0);
	const total = quantity * unit - discount;
	return total;
};

const QuotePrintableView: React.FC<QuotePrintableViewProps> = ({ quote }) => {
	const items = quote.items ?? [];
	const totalsNetFromItems = items.reduce((sum, item) => sum + computeItemTotal(item), 0);
	const totalNet = parseNumber(
		quote.totals?.total_net ?? quote.total_net ?? quote.subtotal ?? totalsNetFromItems,
	);
	const discountAmount = parseNumber(quote.discount_amount ?? (quote as any).fixed_discount ?? 0);
	const taxRateInput = parseNumber(
		quote.totals?.tax_rate ?? quote.tax_rate ?? quote.tax_percentage ?? 0.19,
	);
	const normalizedTaxRate = taxRateInput > 1 && taxRateInput <= 2 ? taxRateInput - 1 : taxRateInput;
	const taxAmount = parseNumber(
		quote.totals?.tax_amount ??
			quote.total_tax ??
			quote.tax_amount ??
			(totalNet - discountAmount) * normalizedTaxRate,
	);
	const grandTotal = parseNumber(
		quote.totals?.grand_total ?? quote.total_amount ?? quote.subtotal ?? totalNet - discountAmount + taxAmount,
	);

	const customerName =
		(quote.customer as any)?.billing_company ||
		(quote.customer as any)?.company_name ||
		(quote.customer as any)?.name ||
		(quote.customer as any)?.contact_name ||
		`Cliente #${quote.customer_id}`;

	const customerRut = (quote.customer as any)?.rut || (quote.customer as any)?.tax_number || '—';
	const customerEmail = (quote.customer as any)?.email || '—';
	const customerPhone = (quote.customer as any)?.phone || (quote.customer as any)?.mobile_phone || '—';

	const termsEntries = quote.metadata?.terms ?? quote.terms_conditions ?? {};

	return (
		<div className='space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
			<header className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
				<div>
					<p className='text-sm uppercase tracking-wide text-gray-500'>Cotización</p>
					<h1 className='text-2xl font-bold text-gray-900'>
						{quote.quote_number ?? `ID #${quote.id}`}
					</h1>
					<div className='mt-2 flex flex-wrap gap-3 text-sm text-gray-600'>
						<span>Emisión: {formatDate(quote.quote_date)}</span>
						<span>Válida hasta: {formatDate(quote.expiry_date || (quote as any).valid_until)}</span>
					</div>
				</div>
				<div className='flex flex-col items-start gap-2 md:items-end'>
					<Badge variant='outline'>{quote.status?.toString().toUpperCase()}</Badge>
					<div className='text-sm text-gray-600'>
						<p>ID interno: #{quote.id}</p>
						{quote.salesperson_id && <p>Vendedor: #{quote.salesperson_id}</p>}
					</div>
				</div>
			</header>

			<section className='grid gap-4 md:grid-cols-2'>
				<div className='rounded-lg border border-gray-200 p-4'>
					<h2 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>Cliente</h2>
					<div className='mt-3 space-y-2 text-sm text-gray-700'>
						<p className='font-semibold text-gray-900'>{customerName}</p>
						<p>RUT: {customerRut}</p>
						<p>Email: {customerEmail}</p>
						<p>Teléfono: {customerPhone}</p>
						{(quote.customer as any)?.address && <p>Dirección: {(quote.customer as any).address}</p>}
					</div>
				</div>
				<div className='rounded-lg border border-gray-200 p-4'>
					<h2 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>Condiciones</h2>
					<div className='mt-3 space-y-2 text-sm text-gray-700'>
						<p>Método de pago: {quote.payment_method ?? 'No especificado'}</p>
						<p>Órden de compra: {quote.purchase_order ?? '—'}</p>
						<p>
							Términos de pago:{' '}
							{quote.payment_terms ? `${quote.payment_terms} días` : 'No especificado'}
						</p>
						{Object.keys(termsEntries).length > 0 &&
							Object.entries(termsEntries).map(([key, value]) => (
								<p key={key}>
									<span className='capitalize'>{key}:</span> {String(value)}
								</p>
							))}
					</div>
				</div>
			</section>

			<section>
				<h2 className='mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500'>Ítems</h2>
				<div className='overflow-hidden rounded-lg border border-gray-200'>
					<table className='min-w-full divide-y divide-gray-200 text-sm'>
						<thead className='bg-gray-50 text-gray-600'>
							<tr>
								<th className='px-4 py-3 text-left font-medium'>Descripción</th>
								<th className='px-4 py-3 text-left font-medium'>SKU</th>
								<th className='px-4 py-3 text-right font-medium'>Cantidad</th>
								<th className='px-4 py-3 text-right font-medium'>Unitario (NETO)</th>
								<th className='px-4 py-3 text-right font-medium'>Total (NETO)</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-gray-100 bg-white text-gray-800'>
							{items.length === 0 ? (
								<tr>
									<td colSpan={5} className='px-4 py-6 text-center text-sm text-gray-500'>
										Esta cotización aún no tiene ítems cargados.
									</td>
								</tr>
							) : (
								items.map((item, index) => (
									<tr key={item.id ?? index}>
										<td className='px-4 py-3'>
											<p className='font-medium text-gray-900'>
												{item.customer_name || item.product?.name || 'Ítem sin nombre'}
											</p>
											{item.description && (
												<p className='text-xs text-gray-500'>{item.description}</p>
											)}
										</td>
										<td className='px-4 py-3 text-gray-600'>
											{item.customer_sku || item.product?.sku || '—'}
										</td>
										<td className='px-4 py-3 text-right'>{item.quantity}</td>
										<td className='px-4 py-3 text-right'>{formatCurrency(item.unit_price)}</td>
										<td className='px-4 py-3 text-right'>
											{formatCurrency(item.total_net ?? computeItemTotal(item))}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</section>

			<section className='grid gap-4 md:grid-cols-2'>
				<div className='rounded-lg border border-gray-200 p-4'>
					<h2 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>
						Observaciones
					</h2>
					<div className='mt-3 space-y-2 text-sm text-gray-700'>
						<p>
							<strong>Notas externas:</strong> {quote.notes ?? 'Sin notas'}
						</p>
						<p>
							<strong>Notas internas:</strong> {quote.internal_notes ?? 'Sin notas internas'}
						</p>
					</div>
				</div>
				<div className='rounded-lg border border-gray-200 p-4'>
					<h2 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>
						Resumen Financiero
					</h2>
					<div className='mt-3 space-y-2 text-sm text-gray-700'>
						<div className='flex justify-between'>
							<span>Subtotal (neto)</span>
							<span>{formatCurrency(totalNet)}</span>
						</div>
						<div className='flex justify-between'>
							<span>Descuentos</span>
							<span>- {formatCurrency(discountAmount)}</span>
						</div>
						<div className='flex justify-between'>
							<span>IVA ({Math.round(normalizedTaxRate * 100)}%)</span>
							<span>{formatCurrency(taxAmount)}</span>
						</div>
						<div className='flex justify-between border-t border-gray-200 pt-3 text-lg font-bold text-gray-900'>
							<span>Total</span>
							<span>{formatCurrency(grandTotal)}</span>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
};

export default QuotePrintableView;
