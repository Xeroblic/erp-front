import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { useAppDispatch } from '@/store';
import { fetchSubsidiariaDetail } from '@/store/slices/subempresa/subEmpresaSlice';
import type { IQuote } from '@/interface';
import { getFirstCapitalize } from '../../../../utils/getFirstLetter';
import {
	getCompanyInfo,
	getCustomerInfo,
	resolveUnitPrice,
	resolveLineTotal,
	getProductSku,
	getProductName,
	getProductDetail,
	getPaymentMethodsLabel,
	getDocumentType,
	getQuoteTotals,
	getQuoteTaxRate,
	getSaleNumber,
} from './quote-data-mapper';
import { formatDate } from '@/utils/format.utils';
import { priceFormat, priceFormatWhitDecimals } from '@/utils/priceFormat.util';

interface QuotePrintableViewProps {
	quote: IQuote;
}

const ITEMS_PER_PAGE = 15;
const ROWS_PER_PAGE = 15;

const paginateItems = (items: any[], perPage: number): any[][] => {
	if (!items || items.length === 0) return [[]];
	const pages: any[][] = [];
	for (let i = 0; i < items.length; i += perPage) {
		pages.push(items.slice(i, i + perPage));
	}
	return pages;
};

const QuotePrintableView: React.FC<QuotePrintableViewProps> = ({ quote }) => {
	const dispatch = useAppDispatch();
	// Optimizamos el selector para evitar re-renders innecesarios por cambios en otras partes del estado
	const subEmpresa = useSelector((state: RootState) => state.subEmpresa);
	const personalizacion = useSelector((state: RootState) => state.personalizacion);

	// Construimos un objeto de estado parcial que satisface lo que necesita getCompanyInfo
	// getCompanyInfo usa: state.subEmpresa y state.personalizacion
	const stateForMapper = { subEmpresa, personalizacion };

	// Usar helpers centralizados para obtener datos
	const company = getCompanyInfo(quote, stateForMapper);

	// Efecto para cargar datos de la subsidiaria si faltan
	useEffect(() => {
		if (quote.subsidiary_id && (!company.name || company.name === 'EcoTI')) {
			// Si el nombre es genérico o vacío, intentamos cargar el detalle
			// Validamos que no estemos ya cargando para evitar loops (aunque el thunk suele manejarlo)
			if (!subEmpresa.loading && subEmpresa.detalle?.id !== quote.subsidiary_id) {
				dispatch(fetchSubsidiariaDetail(quote.subsidiary_id));
			}
		}
	}, [quote.subsidiary_id, company.name, dispatch, subEmpresa.loading, subEmpresa.detalle?.id]);

	const customer = getCustomerInfo((quote as any).customer, {
		billingSnapshot: (quote as any).billing_snapshot,
		shippingSnapshot: (quote as any).shipping_snapshot,
	});
	const items = Array.isArray(quote.items) ? quote.items : [];
	const pagesItems = paginateItems(items, ITEMS_PER_PAGE);
	const totalPages = pagesItems.length;
	const showPageNumber = totalPages > 1;
	const metadata = ((quote as any)?.metadata || {}) as Record<string, any>;
	const saleNumber = quote.is_converted_to_sale ? getSaleNumber(quote) : null;
	const metadataSaleId = Number(
		metadata?.sale_id ||
			metadata?.saleId ||
			metadata?.sale?.id ||
			(quote as any)?.sale_id ||
			(quote as any)?.sale?.id ||
			0,
	);
	const saleDigitsFromNumber = saleNumber?.match(/\d+/)?.[0];
	const derivedSaleId =
		metadataSaleId > 0
			? metadataSaleId
			: saleDigitsFromNumber
				? Number(saleDigitsFromNumber)
				: null;
	const correlatedSaleNumber =
		derivedSaleId && derivedSaleId > 0 ? String(5000 + derivedSaleId) : saleNumber;
	const orderInfo = {
		orderNumber:
			metadata?.order_number || metadata?.n_orden || quote.quote_number || quote.id || '—',
		contactPhone: customer.phone || metadata?.contact_phone || '—',
		documentType: metadata?.document || '—',
		purchase_order: quote.purchase_order || null,
		saleNumber: correlatedSaleNumber,
	};

	const { netTotal, discount, tax, total } = getQuoteTotals(quote, items);
	const taxRate = getQuoteTaxRate(quote);
	const paymentMethodsLabel = getPaymentMethodsLabel(quote);
	const documentType = getDocumentType(quote);
	const documentCreationDate = quote.created_at || quote.quote_date;
	const emissionDate = new Date();
	const emissionDateLabel = formatDate(emissionDate);
	const emissionTimeLabel = new Intl.DateTimeFormat('es-CL', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
		timeZone: 'America/Santiago',
	}).format(emissionDate);
	const documentCreationLabel = documentCreationDate ? formatDate(documentCreationDate) : '—';

	return (
		<div className='flex flex-col gap-6'>
			{pagesItems.map((pageItems, pageIndex) => {
				const isLastPage = pageIndex === totalPages - 1;
				const rows = Array.from(
					{ length: Math.max(pageItems.length, ROWS_PER_PAGE) },
					(_, idx) => pageItems[idx] ?? null,
				);

				return (
					<div
						key={pageIndex}
						className='mx-auto min-h-[279mm] max-w-[216mm] bg-white p-9 font-sans text-[9px] leading-snug text-slate-900 shadow-lg print:shadow-none'>
						<div className='mb-4 flex w-full items-start justify-between gap-6 border-b border-slate-200 pb-4'>
							<div className='flex flex-1 items-start gap-4'>
								<div className='flex h-[90px] w-[90px] items-center justify-center border border-slate-200 p-2'>
									{company.logoUrl ? (
										<img
											src={company.logoUrl}
											alt='Logo'
											className='h-full w-full object-contain'
											onError={(e) => {
												e.currentTarget.style.display = 'none';
											}}
										/>
									) : (
										<span className='text-center text-xs font-bold uppercase'>
											{company.name}
										</span>
									)}
								</div>
								<div className='flex flex-col gap-0.5 text-[9px]'>
									{/* <p className='font-semibold uppercase'>{company.name}</p> */}
									<p>Giro: {company.activity || '—'}</p>
									<p>Dirección: {company.fullAddress || '—'}</p>
									<p>Email: {company.email || '—'}</p>
									{/* <p>Servicios Computacionales</p> */}
								</div>
							</div>
							<div className='flex w-[35%] flex-col items-center'>
								<div className='w-full border-2 border-rose-600 py-2 text-center'>
									<p className='text-xs font-bold text-rose-600'>
										R.U.T.: {company.rut}
									</p>
									<div className='my-1 w-full bg-rose-50 py-0.5'>
										<p className='text-xs font-bold uppercase text-rose-600'>
											COTIZACIÓN
										</p>
									</div>
									<p className='text-sm font-bold text-slate-900'>
										N° {quote.id}
									</p>
								</div>
								<p className='mt-2 text-[10px] font-bold text-slate-900'>
									Fecha: {formatDate(quote.quote_date)}
								</p>
							</div>
						</div>

					<div className='flex items-center justify-between bg-rose-50 px-3 py-2 text-[9px]  uppercase text-zinc-900'>
						<span className='flex flex-col gap-3 normal-case md:flex-row md:items-center md:gap-2 '>
							<span>
								Fecha creación doc:{' '}
								<span className='font-bold text-slate-900'>{documentCreationLabel}</span>
							</span>
							<span>
								Fecha de emisión:{' '}
								<span className='font-bold text-slate-900'>{emissionDateLabel}</span>
							</span>
							<span>
								Hora de emisión:{' '}
								<span className='font-bold text-slate-900'>{emissionTimeLabel}</span>
							</span>
						</span>
						<span>
							N° Orden C:{' '}
							<span className='font-bold text-slate-900'>
								{orderInfo.purchase_order || '—'}
							</span>
							</span>
						</div>
						<div className='mb-4 border-2 border-rose-600'>
							<div className='flex flex-col border-t border-rose-100 text-[8px] md:flex-row'>
								<div className='w-full border-b border-rose-100 px-4 py-3 md:w-3/4 md:border-b-0 md:border-r'>
									<div className='mb-1 flex gap-1'>
										<span className='font-semibold'>Nombre Empresa:</span>
										<span>{customer.name}</span>
									</div>
									<div className='mb-1 flex gap-1'>
										<span className='font-semibold'>RUT:</span>
										<span>{customer.rut}</span>
									</div>
									<div className='mb-1 flex gap-1'>
										<span className='font-semibold'>Giro:</span>
										<span>{customer.giro}</span>
									</div>
									<div className='mb-1 flex gap-1'>
										<span className='font-semibold'>Dirección de envío:</span>
										<span>{customer.shippingAddress}</span>
									</div>
									<div className='mb-1 flex gap-1'>
										<span className='font-semibold'>
											Dirección de facturación:
										</span>
										<span>
											{customer.billingAddress &&
											customer.billingAddress.trim() !== ''
												? customer.billingAddress
												: '—'}
										</span>
									</div>
									<div className='mb-1 flex gap-1'>
										<span className='font-semibold'>Contacto:</span>
										<span>{customer.contactName}</span>
									</div>
									<div className='flex gap-1'>
										<span className='font-semibold'>Correo:</span>
										<span>{customer.email || '—'}</span>
									</div>
								</div>
								<div className='w-full px-4 py-3 md:w-1/4'>
									<div className='mb-1 flex gap-1'>
										<span className='font-semibold'>Fecha:</span>
										<span>{formatDate(quote.quote_date)}</span>
									</div>
									<div className='mb-1 flex gap-1'>
										<span className='font-semibold'>Teléfono:</span>
										<span>{orderInfo.contactPhone}</span>
									</div>
									<div className='mb-1 flex gap-1'>
										<span className='font-semibold'>N° Venta:</span>
										<span>{orderInfo.saleNumber || '—'}</span>
									</div>
									<div className='mb-1 flex gap-1'>
										<span className='font-semibold'>Método de pago:</span>
										<span>{getFirstCapitalize(paymentMethodsLabel)}</span>
									</div>
									<div className='flex gap-1'>
										<span className='font-semibold'>Documento:</span>
										<span>{getFirstCapitalize(documentType)}</span>
									</div>
								</div>
							</div>
						</div>

						<div className='mb-4 border-2 border-slate-700'>
							<div className='flex border-b-2 border-slate-700 bg-slate-100 py-1.5 text-[9px] font-bold text-slate-900'>
								<div className='w-[8%] text-center'>Cant.</div>
								<div className='w-[17%] border-l border-slate-700 px-1 text-left'>
									Código
								</div>
								<div className='w-[45%] border-l border-slate-700 px-1 text-left'>
									Descripción
								</div>
								<div className='w-[15%] border-l border-slate-700 px-1 text-right'>
									Precio Neto
								</div>
								<div className='w-[15%] border-l border-slate-700 px-1 text-right'>
									Total Neto
								</div>
							</div>
							{rows.map((item, idx) => {
								if (!item) {
									return (
										<div
											key={`empty-${idx}`}
											className='flex border-b border-dashed border-slate-400 py-1.5 text-[9px]'>
											<div className='w-[8%]'>&nbsp;</div>
											<div className='w-[17%]'>&nbsp;</div>
											<div className='w-[45%]'>&nbsp;</div>
											<div className='w-[15%]'>&nbsp;</div>
											<div className='w-[15%]'>&nbsp;</div>
										</div>
									);
								}

								const sku = getProductSku(item);
								const name = getProductName(item);
								const detail = getProductDetail(item);
								const quantity = Number((item as any).quantity || 0);
								const unitPrice = resolveUnitPrice(item, taxRate);
								const lineTotal = resolveLineTotal(item, taxRate);
								const itemDiscount = Number(item.discount_amount || 0);

								return (
									<div
										key={idx}
										className='flex border-b border-dashed border-slate-400 py-1.5 text-[9px]'>
										<div className='w-[8%] text-center'>{quantity}</div>
										<div className='w-[17%] px-1'>{sku}</div>
										<div className='w-[45%] px-1'>
											<p className='font-bold'>{name}</p>
											{detail ? (
												<p className='text-[7px] text-slate-500'>
													{detail}
												</p>
											) : null}
											{itemDiscount > 0 && (
												<p className='text-[7px] font-semibold text-rose-600'>
													Descuento: - {priceFormat(itemDiscount)}
												</p>
											)}
										</div>
										<div className='w-[15%] px-1 text-right'>
											{priceFormatWhitDecimals(unitPrice)}
										</div>
										<div className='w-[15%] px-1 text-right font-bold'>
											{priceFormatWhitDecimals(lineTotal)}
										</div>
									</div>
								);
							})}
						</div>

						<div className='border-t border-slate-200 pt-3'>
							<div className='flex flex-col gap-4 md:flex-row'>
								<div className='flex-1 text-[8px] text-slate-600'>
									<h3 className='mb-1 text-[9px] font-bold uppercase text-slate-900 underline dark:text-slate-900'>
										Condiciones Comerciales
									</h3>
									<p className='mb-0.5'>
										• Validez Oferta:{' '}
										{company.quoteValidityText ||
											(company.quoteValidityDays
												? `${company.quoteValidityDays} días hábiles`
												: '7 días hábiles')}
									</p>
									<p className='mb-0.5'>• Forma de Pago: {paymentMethodsLabel}</p>
									<p className='mb-0.5'>
										• Entrega:{' '}
										{company.deliveryTerm || 'A convenir o retiro en tienda.'}
									</p>
									{company.commercialTerms ? (
										<p className='mb-0.5'>• {company.commercialTerms}</p>
									) : null}
									{quote.notes ? (
										<div className='mt-2 text-slate-600'>
											<h3 className='mb-1 text-[9px] font-bold uppercase text-slate-900 underline'>
												Observaciones
											</h3>
											<p>{quote.notes}</p>
										</div>
									) : null}
								</div>
								<div className='flex-1 text-[8px] text-slate-600'>
									{company.bankInfo.length > 0 ? (
										<div>
											<h3 className='mb-1 text-[9px] font-bold uppercase text-slate-900 underline dark:text-slate-900'>
												Datos Bancarios
											</h3>
											{company.bankInfo.map((info: string, idx: number) => (
												<p key={idx} className='mb-0.5'>
													{info}
												</p>
											))}
										</div>
									) : null}
								</div>
								<div className='flex flex-1 justify-end'>
									<div className='w-[200px] border-2 border-slate-500 text-[9px] text-slate-900 dark:text-slate-900'>
										<div className='flex justify-between border-b border-slate-300 px-2 py-1 font-bold uppercase'>
											<span>Neto</span>
											<span>{priceFormat(netTotal)}</span>
										</div>
										{discount > 0 ? (
											<div className='flex justify-between border-b border-slate-300 px-2 py-1 font-bold uppercase'>
												<span>Descuento</span>
												<span>- {priceFormat(discount)}</span>
											</div>
										) : null}
										<div className='flex justify-between border-b border-slate-300 px-2 py-1 font-bold uppercase'>
											<span>IVA</span>
											<span>{priceFormat(tax)}</span>
										</div>
										<div className='flex justify-between bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase'>
											<span>Total</span>
											<span>{priceFormat(total)}</span>
										</div>
									</div>
								</div>
							</div>
							<p className='mt-3 text-center text-[8px] text-slate-400'>
								Documento generado electrónicamente por {company.name}
							</p>
							{showPageNumber ? (
								<p className='mt-2 text-right text-[8px] text-slate-500'>
									{`Pagina de cotizacion N°${quote.id} - ${pageIndex + 1}/${totalPages}`}
								</p>
							) : null}
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default QuotePrintableView;
