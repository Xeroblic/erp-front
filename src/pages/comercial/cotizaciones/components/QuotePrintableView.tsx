import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { useAppDispatch } from '@/store';
import { fetchSubsidiariaDetail } from '@/store/slices/subempresa/subEmpresaSlice';
import type { IQuote, IQuoteItem } from '@/interface';
import {
	getCompanyInfo,
	getCustomerInfo,
	resolveUnitPrice,
	resolveLineTotal,
	getProductSku,
	getProductName,
	getProductDetail,
	formatDate,
	getPaymentMethodsLabel,
	formatCurrency,
	getDocumentType,
	getQuoteTotals,
} from './quote-data-mapper';

interface QuotePrintableViewProps {
	quote: IQuote;
}

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
	}, [
		quote.subsidiary_id,
		company.name,
		dispatch,
		subEmpresa.loading,
		subEmpresa.detalle?.id,
	]);

	const customer = getCustomerInfo((quote as any).customer);
	const items = Array.isArray(quote.items) ? quote.items : [];
	const minRows = 8;
	const rows = Array.from(
		{ length: Math.max(items.length, minRows) },
		(_, idx) => items[idx] ?? null,
	);
	const metadata = ((quote as any)?.metadata || {}) as Record<string, any>;
	const orderInfo = {
		orderNumber: metadata?.order_number || metadata?.n_orden || '—',
		contactPhone: customer.phone || metadata?.contact_phone || '—',
		associatedOt: metadata?.associated_ot || '—',
		documentType: metadata?.document_type || '—',
	};

	const { netTotal, discount, tax, total } = getQuoteTotals(quote, items);
	const paymentMethodsLabel = getPaymentMethodsLabel(quote);
	const documentType = getDocumentType(quote);

	return (
		<div
			className='mx-auto min-h-[229mm] max-w-[216mm] p-10 font-sans text-[9px] leading-snug shadow-lg print:shadow-none'
			style={{ backgroundColor: '#ffffff', color: '#111827' }}>
			{/* Header */}
			<div className='mb-3 flex items-start justify-between'>
				<div className='flex w-[60%] gap-3'>
					<div className='flex h-[70px] w-[70px] items-center justify-center border border-gray-200 p-1'>
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
							<span className='text-xs font-bold uppercase'>{company.name}</span>
						)}
					</div>
					<div className='text-[9px]' style={{ color: '#111827' }}>
						<p className='font-semibold uppercase'>{company.name}</p>
						<p>Dirección: {company.fullAddress || '—'}</p>
						<p>Email: {company.email || '—'}</p>
						<p>Giro: {company.activity || '—'}</p>
						<p>Servicios Computacionales</p>
					</div>
				</div>
				<div className='flex w-[36%] flex-col items-center'>
					<div
						className='w-full border-2 border-rose-600 py-2 text-center'
						style={{ borderColor: '#e11d48' }}>
						<h2
							className='text-xs font-bold text-rose-600'
							style={{ color: '#e11d48' }}>
							R.U.T.: {company.rut}
						</h2>
						<div
							className='my-1 w-full bg-rose-50 py-0.5'
							style={{ backgroundColor: '#fff1f2' }}>
							<h3
								className='text-xs font-bold uppercase text-rose-600'
								style={{ color: '#e11d48' }}>
								COTIZACIÓN
							</h3>
						</div>
						<h4
							className='text-sm font-bold text-gray-900'
							style={{ color: '#111827' }}>
							N° {quote.quote_number || quote.id}
						</h4>
					</div>
					<p
						className='mt-1.5 text-[10px] font-bold text-gray-900'
						style={{ color: '#111827' }}>
						Fecha: {formatDate(quote.quote_date)}
					</p>
				</div>
			</div>

			<div
				className='mb-4 grid grid-cols-1 rounded border-2 border-rose-500 text-[9px] text-gray-800 md:grid-cols-2'
				style={{ color: '#111827' }}>
				<div className='border-b-2 border-rose-500 bg-rose-50 px-3 py-1 font-semibold uppercase text-rose-800 md:col-span-2'>
					<div className='flex items-center justify-between'>
						<span>Empresa</span>
						<span>
							N° Orden C:{' '}
							<span className='font-bold'>{quote.purchase_order || '—'}</span>
						</span>
					</div>
				</div>
				<div className='space-y-1 px-3 py-2 text-[8px]'>
					<p>
						<span className='font-semibold'>Nombre Empresa:</span> {customer.name}
					</p>
					<p>
						<span className='font-semibold'>RUT:</span> {customer.rut}
					</p>
					<p>
						<span className='font-semibold'>Giro:</span> {customer.giro}
					</p>
					<p>
						<span className='font-semibold'>Dirección:</span> {customer.address}
					</p>
					<p>
						<span className='font-semibold'>Contacto:</span> {customer.contactName}
					</p>
					<p>
						<span className='font-semibold'>Correo:</span> {customer.email || '—'}
					</p>
				</div>
				<div className='space-y-1 border-t border-gray-200 px-3 py-2 text-[8px] md:border-l'>
					<p>
						<span className='font-semibold'>Fecha:</span> {formatDate(quote.quote_date)}
					</p>
					<p>
						<span className='font-semibold'>Teléfono:</span> {orderInfo.contactPhone}
					</p>
					<p>
						<span className='font-semibold'>Método de pago:</span> {paymentMethodsLabel}
					</p>
					<p>
						<span className='font-semibold'>Documento:</span> {documentType}
					</p>
				</div>
			</div>

			{/* Tabla */}
			<div
				className='mb-2.5 border-2 border-gray-700 text-gray-900'
				style={{ color: '#111827' }}>
				<div className='flex border-b-2 border-gray-700 bg-gray-100 py-1.5 text-[9px] font-bold text-gray-900'>
					<div className='w-[8%] border-gray-700 p-0 text-center'>Cant.</div>
					<div className='w-[17%] border-l-2 border-gray-700 p-0 px-0 pl-1'>Código</div>
					<div className='w-[45%] border-l-2 border-gray-700 p-0 pl-1'>Descripción</div>
					<div className='w-[15%] border-l-2 border-gray-700 p-0 pr-1 text-right'>
						Precio Neto
					</div>
					<div className='w-[15%] border-l-2 border-gray-700 p-0 pr-1 text-right'>
						Total Neto
					</div>
				</div>

				{rows.map((item, idx) => {
					if (!item) {
						return (
							<div
								key={`empty-${idx}`}
								className='flex border-b border-dashed border-gray-400 py-2 text-[9px] text-gray-900'
								style={{ color: '#111827', minHeight: '18px' }}>
								<div className='w-[8%] text-center'>&nbsp;</div>
								<div className='w-[17%] pl-1'>&nbsp;</div>
								<div className='w-[45%] pl-1'>&nbsp;</div>
								<div className='w-[15%] pr-1 text-right'>&nbsp;</div>
								<div className='w-[15%] pr-1 text-right'>&nbsp;</div>
							</div>
						);
					}

					const sku = getProductSku(item);
					const name = getProductName(item);
					const detail = getProductDetail(item);
					const quantity = Number((item as any).quantity || 0);
					const unitPrice = resolveUnitPrice(item);
					const lineTotal = resolveLineTotal(item);
					const itemDiscount = Number(item.discount_amount || 0);

					return (
						<div
							key={idx}
							className='flex items-center justify-center border-b border-dashed border-gray-400 py-1.5 text-[9px] text-gray-900'
							style={{ color: '#111827' }}>
							<div className='w-[8%] text-center'>{quantity}</div>
							<div className='w-[17%] pl-1'>{sku}</div>
							<div className='w-[45%] pl-1'>
								<p className='font-bold'>{name}</p>
								{detail && (
									<p
										className='mt-0.5 text-[7px] text-gray-500'
										style={{ color: '#6b7280' }}>
										{detail}
									</p>
								)}
								{itemDiscount > 0 && (
									<p className='mt-0.5 text-[7px] font-semibold text-rose-500'>
										Descuento: - {formatCurrency(itemDiscount)}
									</p>
								)}
							</div>
							<div className='w-[15%] pr-1 text-right'>
								{formatCurrency(unitPrice)}
							</div>
							<div className='w-[15%] pr-1 text-right font-bold'>
								{formatCurrency(lineTotal)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Footer */}
			<div
				className='border-t border-gray-200 pt-2.5 text-gray-900'
				style={{ borderColor: '#e5e7eb', color: '#111827' }}>
				<div className='mb-2.5 flex gap-5'>
					<div className='flex-1'>
						<h3 className='mb-1 text-[9px] font-bold uppercase underline'>
							Condiciones Comerciales
						</h3>
						<p className='mb-0.5 text-[8px] text-gray-600' style={{ color: '#4b5563' }}>
							• Validez Oferta:{' '}
							{company.quoteValidityText ||
								(company.quoteValidityDays
									? `${company.quoteValidityDays} días hábiles`
									: '7 días hábiles')}
						</p>
						<p className='mb-0.5 text-[8px] text-gray-600' style={{ color: '#4b5563' }}>
							• Forma de Pago: {paymentMethodsLabel}
						</p>
						<p className='mb-0.5 text-[8px] text-gray-600' style={{ color: '#4b5563' }}>
							• Entrega: {company.deliveryTerm || 'A convenir o retiro en tienda.'}
						</p>
						{company.commercialTerms && (
							<p
								className='mb-0.5 text-[8px] text-gray-600'
								style={{ color: '#4b5563' }}>
								• {company.commercialTerms}
							</p>
						)}

						{quote.notes && (
							<div className='mt-1.5'>
								<h3 className='mb-1 text-[9px] font-bold uppercase underline'>
									Observaciones
								</h3>
								<p
									className='text-[8px] text-gray-600'
									style={{ color: '#4b5563' }}>
									{quote.notes}
								</p>
							</div>
						)}
					</div>

					<div className='flex-1'>
						{company.bankInfo.length > 0 && (
							<div>
								<h3 className='mb-1 text-[9px] font-bold uppercase underline'>
									Datos Bancarios
								</h3>
								{company.bankInfo.map((info: string, idx: number) => (
									<p
										key={idx}
										className='mb-0.5 text-[8px] text-gray-600'
										style={{ color: '#4b5563' }}>
										{info}
									</p>
								))}
							</div>
						)}
					</div>
					{/* Totales */}
					<div
						className='mb-5 flex justify-end text-gray-900'
						style={{ color: '#111827' }}>
						<div className='w-[220px] border-2 border-gray-500'>
							<div className='flex justify-between border-b border-gray-400 px-2 py-1 text-[9px]'>
								<span className='font-bold uppercase'>Neto</span>
								<span>{formatCurrency(netTotal)}</span>
							</div>
							{discount > 0 && (
								<div className='flex justify-between border-b border-gray-300 px-2 py-1 text-[9px]'>
									<span className='font-bold uppercase'>Descuento</span>
									<span>- {formatCurrency(discount)}</span>
								</div>
							)}
							<div className='flex justify-between border-b border-gray-300 px-2 py-1 text-[9px]'>
								<span className='font-bold uppercase'>IVA</span>
								<span>{formatCurrency(tax)}</span>
							</div>
							<div className='flex justify-between bg-gray-100 px-2 py-1 text-[10px] font-bold'>
								<span className='uppercase'>Total</span>
								<span>{formatCurrency(total)}</span>
							</div>
						</div>
					</div>
				</div>

				<p
					className='mt-2.5 text-center text-[8px] text-gray-400'
					style={{ color: '#9ca3af' }}>
					Documento generado electrónicamente por {company.name}
				</p>
			</div>
		</div>
	);
};

export default QuotePrintableView;
